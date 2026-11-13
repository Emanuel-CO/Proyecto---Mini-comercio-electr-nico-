import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import {
  hashPassword,
  requireAuth,
  requireRole,
  signJwt,
  verifyPassword,
  type AuthenticatedRequest,
} from './server/auth.ts';
import {
  FREE_SHIPPING_THRESHOLD_COP,
  SHIPPING_FEE_COP,
  getDb,
  withTransaction,
  type DbOrder,
  type DbUser,
  type StoreDatabase,
} from './server/db.ts';
import type {
  CartCalculation,
  CartCalculatedItem,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
} from './src/types.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const EMAIL_REGEX = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function sanitizeUser(u: DbUser) {
  return {
    id: u.id,
    rol: u.rol,
    nombresCompletos: u.nombresCompletos,
    correo: u.correo,
    telefono: u.telefono,
    direccionEnvio: u.direccionEnvio,
    aceptaPoliticaDatos: u.aceptaPoliticaDatos,
    estado: u.estado,
    fechaRegistro: u.fechaRegistro,
  };
}

function hydrateOrder(db: StoreDatabase, order: DbOrder): Order {
  const customer = db.usuarios.find((u) => u.id === order.usuarioId);
  const items = db.detallePedidos.filter((d) => d.pedidoId === order.id);
  return {
    ...order,
    clienteNombre: customer?.nombresCompletos ?? 'Cliente',
    clienteCorreo: customer?.correo ?? '',
    items,
  };
}

function calculateCartFromDb(
  db: StoreDatabase,
  rawItems: Array<{ productoId: number; cantidad: number }>
): CartCalculation {
  const merged = new Map<number, number>();
  for (const row of rawItems) {
    const pid = Number(row.productoId);
    const qty = Math.floor(Number(row.cantidad));
    if (!Number.isFinite(pid) || !Number.isFinite(qty) || qty <= 0) continue;
    merged.set(pid, (merged.get(pid) ?? 0) + qty);
  }

  const items: CartCalculatedItem[] = [];
  let subtotal = 0;
  let tieneProblemasStock = false;

  for (const [productoId, cantidadSolicitada] of merged.entries()) {
    const prod = db.productos.find((p) => p.id === productoId);
    if (!prod) {
      tieneProblemasStock = true;
      continue;
    }
    const cat = db.categorias.find((c) => c.id === prod.categoriaId);
    const active = prod.estado === 'ACTIVO' && cat?.estado === 'ACTIVA';
    const stockDisponible = active ? prod.stock : 0;
    const disponible = active && stockDisponible >= cantidadSolicitada;
    if (!disponible) {
      tieneProblemasStock = true;
    }
    const cantidadAplicada = Math.min(cantidadSolicitada, stockDisponible);
    const subtotalLinea = prod.precio * cantidadSolicitada;
    subtotal += subtotalLinea;

    let advertencia: string | undefined;
    if (!active) {
      advertencia = 'Este producto ya no se encuentra disponible.';
    } else if (stockDisponible === 0) {
      advertencia = 'Producto agotado en bodega.';
    } else if (cantidadSolicitada > stockDisponible) {
      advertencia = `Solo quedan ${stockDisponible} unidades disponibles.`;
    }

    items.push({
      productoId: prod.id,
      sku: prod.sku,
      nombre: prod.nombre,
      imagenUrl: prod.imagenUrl,
      precioUnitario: prod.precio,
      cantidadSolicitada,
      cantidadAplicada,
      stockDisponible,
      subtotalLinea,
      disponible,
      advertencia,
    });
  }

  const impuestos = 0;
  const costoEnvio =
    items.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD_COP
      ? 0
      : SHIPPING_FEE_COP;
  const total = subtotal + impuestos + costoEnvio;

  return {
    items,
    subtotal,
    impuestos,
    costoEnvio,
    umbralEnvioGratis: FREE_SHIPPING_THRESHOLD_COP,
    total,
    tieneProblemasStock,
  };
}

async function startServer() {
  getDb(); // Ensure store.json is initialized on startup

  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // Performance response-time header (TRD RNF-01)
  app.use((req, res, next) => {
    const start = performance.now();
    const originalEnd = res.end.bind(res);
    res.end = ((...args: Parameters<typeof res.end>) => {
      const elapsed = Math.round(performance.now() - start);
      if (!res.headersSent) {
        res.setHeader('X-Response-Time-Ms', String(elapsed));
      }
      return originalEnd(...args);
    }) as typeof res.end;
    next();
  });

  // Static serving for uploaded product images
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Healthcheck
  app.get('/api/v1/health', (_req, res) => {
    res.json({ status: 'UP', timestamp: new Date().toISOString() });
  });

  // ---------------------------------------------------------------------------
  // 1. AUTHENTICATION & USER PROFILE
  // ---------------------------------------------------------------------------
  app.post('/api/v1/auth/register', async (req, res, next) => {
    try {
      const {
        nombresCompletos,
        correo,
        password,
        telefono,
        direccionEnvio,
        aceptaPoliticaDatos,
      } = req.body ?? {};

      if (!nombresCompletos?.trim() || !telefono?.trim() || !direccionEnvio?.trim()) {
        throw new HttpError(
          400,
          'Por favor completa tu nombre, teléfono y dirección de entrega.'
        );
      }
      if (!correo || !EMAIL_REGEX.test(String(correo).trim())) {
        throw new HttpError(400, 'Ingresa un correo electrónico válido.');
      }
      if (!password || String(password).length < 8) {
        throw new HttpError(
          400,
          'La contraseña debe tener mínimo 8 caracteres.'
        );
      }
      if (aceptaPoliticaDatos !== true) {
        throw new HttpError(
          400,
          'Debes aceptar la política de tratamiento de datos personales (Ley 1581 de 2012) para registrarte.'
        );
      }

      const normalizedEmail = String(correo).trim().toLowerCase();

      const result = await withTransaction((db) => {
        const exists = db.usuarios.some(
          (u) => u.correo.toLowerCase() === normalizedEmail
        );
        if (exists) {
          throw new HttpError(
            409,
            'El correo ingresado ya se encuentra asociado a una cuenta'
          );
        }
        const id = ++db.sequences.usuarios;
        const user: DbUser = {
          id,
          rol: 'CLIENTE',
          nombresCompletos: String(nombresCompletos).trim(),
          correo: normalizedEmail,
          passwordHash: hashPassword(String(password)),
          telefono: String(telefono).trim(),
          direccionEnvio: String(direccionEnvio).trim(),
          aceptaPoliticaDatos: true,
          estado: 'ACTIVO',
          fechaRegistro: new Date().toISOString(),
        };
        db.usuarios.push(user);
        const token = signJwt({
          id: user.id,
          rol: user.rol,
          correo: user.correo,
          nombresCompletos: user.nombresCompletos,
        });
        return { token, usuario: sanitizeUser(user) };
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/v1/auth/login', (req, res, next) => {
    try {
      const { correo, password } = req.body ?? {};
      const normalizedEmail = String(correo ?? '').trim().toLowerCase();
      const db = getDb();
      const user = db.usuarios.find(
        (u) => u.correo.toLowerCase() === normalizedEmail
      );
      if (!user || !verifyPassword(String(password ?? ''), user.passwordHash)) {
        throw new HttpError(401, 'Correo o contraseña incorrectos');
      }
      if (user.estado !== 'ACTIVO') {
        throw new HttpError(403, 'Cuenta suspendida por el administrador');
      }
      const token = signJwt({
        id: user.id,
        rol: user.rol,
        correo: user.correo,
        nombresCompletos: user.nombresCompletos,
      });
      res.json({ token, usuario: sanitizeUser(user) });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/v1/auth/me', requireAuth, (req: AuthenticatedRequest, res, next) => {
    try {
      const db = getDb();
      const user = db.usuarios.find((u) => u.id === req.user?.id);
      if (!user) {
        throw new HttpError(404, 'Usuario no encontrado.');
      }
      res.json({ usuario: sanitizeUser(user) });
    } catch (err) {
      next(err);
    }
  });

  app.put(
    '/api/v1/usuarios/perfil',
    requireAuth,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const {
          nombresCompletos,
          telefono,
          direccionEnvio,
          passwordActual,
          passwordNueva,
        } = req.body ?? {};

        if (
          !nombresCompletos?.trim() ||
          !telefono?.trim() ||
          !direccionEnvio?.trim()
        ) {
          throw new HttpError(
            400,
            'Nombres completos, teléfono y dirección de envío son obligatorios.'
          );
        }

        const updated = await withTransaction((db) => {
          const user = db.usuarios.find((u) => u.id === req.user?.id);
          if (!user) {
            throw new HttpError(404, 'Usuario no encontrado.');
          }
          if (passwordNueva && String(passwordNueva).trim().length > 0) {
            if (!passwordActual || !verifyPassword(String(passwordActual), user.passwordHash)) {
              throw new HttpError(
                400,
                'La contraseña actual ingresada no es correcta.'
              );
            }
            if (String(passwordNueva).length < 8) {
              throw new HttpError(
                400,
                'La nueva contraseña debe tener al menos 8 caracteres.'
              );
            }
            user.passwordHash = hashPassword(String(passwordNueva));
          }
          user.nombresCompletos = String(nombresCompletos).trim();
          user.telefono = String(telefono).trim();
          user.direccionEnvio = String(direccionEnvio).trim();
          return sanitizeUser(user);
        });

        res.json({ usuario: updated });
      } catch (err) {
        next(err);
      }
    }
  );

  // ---------------------------------------------------------------------------
  // 2. PUBLIC CATALOG (STOREFRONT)
  // ---------------------------------------------------------------------------
  app.get('/api/v1/catalogo/categorias', (_req, res) => {
    const db = getDb();
    const categorias = db.categorias.filter((c) => c.estado === 'ACTIVA');
    res.json({ categorias });
  });

  app.get('/api/v1/catalogo/productos', (req, res) => {
    const db = getDb();
    const q = String(req.query.q ?? '').trim().toLowerCase();
    const categoriaId = req.query.categoriaId
      ? Number(req.query.categoriaId)
      : null;
    const sort = String(req.query.sort ?? 'relevancia');

    const activeCatMap = new Map(
      db.categorias
        .filter((c) => c.estado === 'ACTIVA')
        .map((c) => [c.id, c.nombre])
    );

    let list: Product[] = db.productos
      .filter((p) => p.estado === 'ACTIVO' && activeCatMap.has(p.categoriaId))
      .map((p) => ({
        ...p,
        categoriaNombre: activeCatMap.get(p.categoriaId) ?? '',
      }));

    if (categoriaId) {
      list = list.filter((p) => p.categoriaId === categoriaId);
    }
    if (q) {
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.descripcion.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.categoriaNombre ?? '').toLowerCase().includes(q)
      );
    }

    if (sort === 'precio_asc') {
      list.sort((a, b) => a.precio - b.precio);
    } else if (sort === 'precio_desc') {
      list.sort((a, b) => b.precio - a.precio);
    } else if (sort === 'nombre') {
      list.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    }

    res.json({ productos: list });
  });

  app.get('/api/v1/catalogo/productos/:id', (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const db = getDb();
      const prod = db.productos.find((p) => p.id === id && p.estado === 'ACTIVO');
      if (!prod) {
        throw new HttpError(404, 'Producto no encontrado.');
      }
      const cat = db.categorias.find(
        (c) => c.id === prod.categoriaId && c.estado === 'ACTIVA'
      );
      if (!cat) {
        throw new HttpError(404, 'El producto no está disponible en el catálogo.');
      }
      res.json({
        producto: { ...prod, categoriaNombre: cat.nombre },
      });
    } catch (err) {
      next(err);
    }
  });

  // ---------------------------------------------------------------------------
  // 3. CART SERVER CALCULATION (REGLA DEL CLIENTE LIMPIO)
  // ---------------------------------------------------------------------------
  app.post('/api/v1/carrito/calcular', (req, res, next) => {
    try {
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      const db = getDb();
      const calculo = calculateCartFromDb(db, items);
      res.json(calculo);
    } catch (err) {
      next(err);
    }
  });

  // ---------------------------------------------------------------------------
  // 4. CHECKOUT ACID & CUSTOMER ORDERS
  // ---------------------------------------------------------------------------
  app.post(
    '/api/v1/pedidos/checkout',
    requireAuth,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { items, direccionEntrega, telefonoContacto, metodoPago } =
          req.body ?? {};
        if (!Array.isArray(items) || items.length === 0) {
          throw new HttpError(400, 'El carrito de compras está vacío.');
        }
        if (!direccionEntrega?.trim() || !telefonoContacto?.trim()) {
          throw new HttpError(
            400,
            'La dirección de entrega y teléfono de contacto son obligatorios.'
          );
        }
        const validMethods: PaymentMethod[] = [
          'CONTRAENTREGA',
          'TRANSFERENCIA_NEQUI_PSE',
          'TARJETA_DEMO',
        ];
        if (!validMethods.includes(metodoPago)) {
          throw new HttpError(400, 'Selecciona un método de pago válido.');
        }

        const createdOrder = await withTransaction((db) => {
          const user = db.usuarios.find((u) => u.id === req.user?.id);
          if (!user || user.estado !== 'ACTIVO') {
            throw new HttpError(403, 'Cuenta no habilitada para realizar compras.');
          }

          // Consolidation & authoritative recalculation inside ACID transaction
          const calc = calculateCartFromDb(db, items);
          if (calc.items.length === 0) {
            throw new HttpError(400, 'No hay productos válidos en el carrito.');
          }
          if (calc.tieneProblemasStock) {
            const problematico = calc.items.find((i) => !i.disponible);
            throw new HttpError(
              409,
              problematico?.advertencia
                ? `Stock insuficiente para completar la compra (${problematico.nombre}: ${problematico.advertencia})`
                : 'Stock insuficiente para completar la compra'
            );
          }

          // Deduct stock atomically
          for (const line of calc.items) {
            const prod = db.productos.find((p) => p.id === line.productoId);
            if (!prod || prod.stock < line.cantidadSolicitada) {
              throw new HttpError(409, 'Stock insuficiente para completar la compra');
            }
            prod.stock -= line.cantidadSolicitada;
          }

          const orderId = ++db.sequences.pedidos;
          const codigoOrden = `MT-2026-${String(orderId).padStart(4, '0')}`;
          const initialStatus: OrderStatus =
            metodoPago === 'TARJETA_DEMO' ? 'PAGADO' : 'PENDIENTE';

          const newOrder: DbOrder = {
            id: orderId,
            codigoOrden,
            usuarioId: user.id,
            fechaPedido: new Date().toISOString(),
            direccionEntrega: String(direccionEntrega).trim(),
            telefonoContacto: String(telefonoContacto).trim(),
            metodoPago,
            subtotal: calc.subtotal,
            impuestos: calc.impuestos,
            costoEnvio: calc.costoEnvio,
            total: calc.total,
            estado: initialStatus,
          };
          db.pedidos.push(newOrder);

          for (const line of calc.items) {
            const detId = ++db.sequences.detallePedidos;
            db.detallePedidos.push({
              id: detId,
              pedidoId: orderId,
              productoId: line.productoId,
              productoNombre: line.nombre,
              productoSku: line.sku,
              productoImagenUrl: line.imagenUrl,
              cantidad: line.cantidadSolicitada,
              precioUnitarioHistorico: line.precioUnitario,
              subtotalLinea: line.subtotalLinea,
            });
          }

          return hydrateOrder(db, newOrder);
        });

        res.status(201).json({ pedido: createdOrder });
      } catch (err) {
        next(err);
      }
    }
  );

  app.get(
    '/api/v1/pedidos/mis-pedidos',
    requireAuth,
    (req: AuthenticatedRequest, res) => {
      const db = getDb();
      const orders = db.pedidos
        .filter((o) => o.usuarioId === req.user?.id)
        .sort(
          (a, b) =>
            new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime()
        )
        .map((o) => hydrateOrder(db, o));
      res.json({ pedidos: orders });
    }
  );

  app.get(
    '/api/v1/pedidos/:id/comprobante',
    requireAuth,
    (req: AuthenticatedRequest, res, next) => {
      try {
        const id = Number(req.params.id);
        const db = getDb();
        const order = db.pedidos.find((o) => o.id === id);
        if (!order) {
          throw new HttpError(404, 'Comprobante de pedido no encontrado.');
        }
        if (order.usuarioId !== req.user?.id && req.user?.rol !== 'ADMIN') {
          throw new HttpError(
            403,
            'Acceso no autorizado. Este comprobante pertenece a otro cliente.'
          );
        }
        res.json({ pedido: hydrateOrder(db, order) });
      } catch (err) {
        next(err);
      }
    }
  );

  app.patch(
    '/api/v1/pedidos/:id/cancelar',
    requireAuth,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const id = Number(req.params.id);
        const cancelled = await withTransaction((db) => {
          const order = db.pedidos.find((o) => o.id === id);
          if (!order) {
            throw new HttpError(404, 'Pedido no encontrado.');
          }
          if (order.usuarioId !== req.user?.id) {
            throw new HttpError(403, 'No tienes permiso para cancelar este pedido.');
          }
          if (order.estado !== 'PENDIENTE') {
            throw new HttpError(
              409,
              'El pedido ya está en ruta, pagado o fue entregado y no puede cancelarse.'
            );
          }

          // Restitución atómica de inventario
          const items = db.detallePedidos.filter((d) => d.pedidoId === order.id);
          for (const item of items) {
            const prod = db.productos.find((p) => p.id === item.productoId);
            if (prod) {
              prod.stock += item.cantidad;
            }
          }
          order.estado = 'CANCELADO';
          return hydrateOrder(db, order);
        });
        res.json({ pedido: cancelled });
      } catch (err) {
        next(err);
      }
    }
  );

  // ---------------------------------------------------------------------------
  // 5. ADMIN BACKOFFICE (STRICT RBAC: ADMIN ONLY)
  // ---------------------------------------------------------------------------
  app.post(
    '/api/v1/admin/upload',
    requireAuth,
    requireRole(['ADMIN']),
    (req, res, next) => {
      try {
        const { filename, dataUrl } = req.body ?? {};
        if (!dataUrl || typeof dataUrl !== 'string') {
          throw new HttpError(400, 'Archivo de imagen inválido.');
        }
        const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i);
        if (!match) {
          throw new HttpError(
            400,
            'Formato de imagen no soportado. Usa PNG, JPG o WEBP.'
          );
        }
        const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
        const buffer = Buffer.from(match[2], 'base64');
        if (buffer.byteLength > 2 * 1024 * 1024) {
          throw new HttpError(
            400,
            'La imagen supera el límite máximo permitido de 2 MB.'
          );
        }
        const safeBase = String(filename ?? 'producto')
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .slice(0, 32);
        const outName = `${safeBase}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
        fs.writeFileSync(path.join(UPLOADS_DIR, outName), buffer);
        res.status(201).json({ imagenUrl: `/uploads/${outName}` });
      } catch (err) {
        next(err);
      }
    }
  );

  // Categories CRUD
  app.get(
    '/api/v1/admin/categorias',
    requireAuth,
    requireRole(['ADMIN']),
    (_req, res) => {
      const db = getDb();
      const categorias = db.categorias.map((c) => ({
        ...c,
        totalProductos: db.productos.filter((p) => p.categoriaId === c.id).length,
      }));
      res.json({ categorias });
    }
  );

  app.post(
    '/api/v1/admin/categorias',
    requireAuth,
    requireRole(['ADMIN']),
    async (req, res, next) => {
      try {
        const { nombre, descripcion, estado } = req.body ?? {};
        if (!nombre?.trim()) {
          throw new HttpError(400, 'El nombre de la categoría es obligatorio.');
        }
        const created = await withTransaction((db) => {
          const dup = db.categorias.some(
            (c) => c.nombre.toLowerCase() === String(nombre).trim().toLowerCase()
          );
          if (dup) {
            throw new HttpError(409, 'Ya existe una categoría con ese nombre.');
          }
          const cat = {
            id: ++db.sequences.categorias,
            nombre: String(nombre).trim(),
            descripcion: String(descripcion ?? '').trim(),
            estado: (estado === 'INACTIVA' ? 'INACTIVA' : 'ACTIVA') as 'ACTIVA' | 'INACTIVA',
          };
          db.categorias.push(cat);
          return { ...cat, totalProductos: 0 };
        });
        res.status(201).json({ categoria: created });
      } catch (err) {
        next(err);
      }
    }
  );

  app.put(
    '/api/v1/admin/categorias/:id',
    requireAuth,
    requireRole(['ADMIN']),
    async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const { nombre, descripcion, estado } = req.body ?? {};
        if (!nombre?.trim()) {
          throw new HttpError(400, 'El nombre de la categoría es obligatorio.');
        }
        const updated = await withTransaction((db) => {
          const cat = db.categorias.find((c) => c.id === id);
          if (!cat) throw new HttpError(404, 'Categoría no encontrada.');
          const dup = db.categorias.some(
            (c) =>
              c.id !== id &&
              c.nombre.toLowerCase() === String(nombre).trim().toLowerCase()
          );
          if (dup) {
            throw new HttpError(409, 'Ya existe otra categoría con ese nombre.');
          }
          cat.nombre = String(nombre).trim();
          cat.descripcion = String(descripcion ?? '').trim();
          cat.estado = estado === 'INACTIVA' ? 'INACTIVA' : 'ACTIVA';
          return {
            ...cat,
            totalProductos: db.productos.filter((p) => p.categoriaId === cat.id).length,
          };
        });
        res.json({ categoria: updated });
      } catch (err) {
        next(err);
      }
    }
  );

  app.delete(
    '/api/v1/admin/categorias/:id',
    requireAuth,
    requireRole(['ADMIN']),
    async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        await withTransaction((db) => {
          const idx = db.categorias.findIndex((c) => c.id === id);
          if (idx === -1) throw new HttpError(404, 'Categoría no encontrada.');
          const hasProducts = db.productos.some((p) => p.categoriaId === id);
          if (hasProducts) {
            throw new HttpError(
              409,
              'No es posible eliminar la categoría porque tiene productos asociados. Cambia su estado a Inactiva.'
            );
          }
          db.categorias.splice(idx, 1);
        });
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    }
  );

  // Products CRUD
  app.get(
    '/api/v1/admin/productos',
    requireAuth,
    requireRole(['ADMIN']),
    (_req, res) => {
      const db = getDb();
      const catMap = new Map(db.categorias.map((c) => [c.id, c.nombre]));
      const productos = db.productos.map((p) => ({
        ...p,
        categoriaNombre: catMap.get(p.categoriaId) ?? 'Sin categoría',
      }));
      res.json({ productos });
    }
  );

  app.post(
    '/api/v1/admin/productos',
    requireAuth,
    requireRole(['ADMIN']),
    async (req, res, next) => {
      try {
        const {
          categoriaId,
          sku,
          nombre,
          descripcion,
          precio,
          stock,
          imagenUrl,
          estado,
        } = req.body ?? {};
        const numPrecio = Number(precio);
        const numStock = Math.floor(Number(stock));
        const numCatId = Number(categoriaId);

        if (!sku?.trim() || !nombre?.trim()) {
          throw new HttpError(400, 'El SKU y nombre del producto son obligatorios.');
        }
        if (!Number.isFinite(numPrecio) || numPrecio <= 0) {
          throw new HttpError(400, 'El precio en COP debe ser mayor a 0.');
        }
        if (!Number.isFinite(numStock) || numStock < 0) {
          throw new HttpError(400, 'El stock inicial no puede ser negativo.');
        }

        const created = await withTransaction((db) => {
          const cat = db.categorias.find((c) => c.id === numCatId);
          if (!cat) throw new HttpError(400, 'La categoría seleccionada no existe.');
          const dupSku = db.productos.some(
            (p) => p.sku.toLowerCase() === String(sku).trim().toLowerCase()
          );
          if (dupSku) {
            throw new HttpError(409, 'El código SKU ingresado ya está en uso.');
          }
          const prod = {
            id: ++db.sequences.productos,
            categoriaId: numCatId,
            sku: String(sku).trim().toUpperCase(),
            nombre: String(nombre).trim(),
            descripcion: String(descripcion ?? '').trim(),
            precio: Math.round(numPrecio),
            stock: numStock,
            imagenUrl:
              String(imagenUrl ?? '').trim() ||
              '/src/assets/images/product_cafe_huila_1794578223184.jpg',
            estado: (estado === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO') as 'ACTIVO' | 'INACTIVO',
          };
          db.productos.push(prod);
          return { ...prod, categoriaNombre: cat.nombre };
        });

        res.status(201).json({ producto: created });
      } catch (err) {
        next(err);
      }
    }
  );

  app.put(
    '/api/v1/admin/productos/:id',
    requireAuth,
    requireRole(['ADMIN']),
    async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const {
          categoriaId,
          sku,
          nombre,
          descripcion,
          precio,
          stock,
          imagenUrl,
          estado,
        } = req.body ?? {};
        const numPrecio = Number(precio);
        const numStock = Math.floor(Number(stock));
        const numCatId = Number(categoriaId);

        if (!sku?.trim() || !nombre?.trim()) {
          throw new HttpError(400, 'El SKU y nombre del producto son obligatorios.');
        }
        if (!Number.isFinite(numPrecio) || numPrecio <= 0) {
          throw new HttpError(400, 'El precio en COP debe ser mayor a 0.');
        }
        if (!Number.isFinite(numStock) || numStock < 0) {
          throw new HttpError(400, 'El stock no puede ser negativo.');
        }

        const updated = await withTransaction((db) => {
          const prod = db.productos.find((p) => p.id === id);
          if (!prod) throw new HttpError(404, 'Producto no encontrado.');
          const cat = db.categorias.find((c) => c.id === numCatId);
          if (!cat) throw new HttpError(400, 'La categoría seleccionada no existe.');
          const dupSku = db.productos.some(
            (p) =>
              p.id !== id &&
              p.sku.toLowerCase() === String(sku).trim().toLowerCase()
          );
          if (dupSku) {
            throw new HttpError(409, 'El código SKU ya pertenece a otro producto.');
          }
          prod.categoriaId = numCatId;
          prod.sku = String(sku).trim().toUpperCase();
          prod.nombre = String(nombre).trim();
          prod.descripcion = String(descripcion ?? '').trim();
          prod.precio = Math.round(numPrecio);
          prod.stock = numStock;
          if (imagenUrl?.trim()) prod.imagenUrl = String(imagenUrl).trim();
          prod.estado = estado === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO';
          return { ...prod, categoriaNombre: cat.nombre };
        });

        res.json({ producto: updated });
      } catch (err) {
        next(err);
      }
    }
  );

  // Admin Orders Management
  app.get(
    '/api/v1/admin/pedidos',
    requireAuth,
    requireRole(['ADMIN']),
    (req, res) => {
      const db = getDb();
      const estadoFilter = req.query.estado ? String(req.query.estado) : null;
      let list = db.pedidos.map((o) => hydrateOrder(db, o));
      if (estadoFilter && estadoFilter !== 'TODOS') {
        list = list.filter((o) => o.estado === estadoFilter);
      }
      list.sort(
        (a, b) =>
          new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime()
      );
      res.json({ pedidos: list });
    }
  );

  app.patch(
    '/api/v1/admin/pedidos/:id/estado',
    requireAuth,
    requireRole(['ADMIN']),
    async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const nuevoEstado = String(req.body?.estado ?? '') as OrderStatus;
        const allowedStates: OrderStatus[] = [
          'PENDIENTE',
          'PAGADO',
          'ENVIADO',
          'ENTREGADO',
          'CANCELADO',
        ];
        if (!allowedStates.includes(nuevoEstado)) {
          throw new HttpError(400, 'Estado de pedido inválido.');
        }

        const updated = await withTransaction((db) => {
          const order = db.pedidos.find((o) => o.id === id);
          if (!order) throw new HttpError(404, 'Pedido no encontrado.');
          if (order.estado === nuevoEstado) {
            return hydrateOrder(db, order);
          }

          // Prohibir reversión de órdenes cerradas
          if (order.estado === 'ENTREGADO' || order.estado === 'CANCELADO') {
            throw new HttpError(
              409,
              `Un pedido en estado ${order.estado} está cerrado y no puede modificarse.`
            );
          }
          if (nuevoEstado === 'PENDIENTE') {
            throw new HttpError(
              409,
              'No es permitido revertir un pedido avanzado nuevamente a Pendiente.'
            );
          }

          // Restitución atómica al cancelar
          if (nuevoEstado === 'CANCELADO') {
            const items = db.detallePedidos.filter((d) => d.pedidoId === order.id);
            for (const item of items) {
              const prod = db.productos.find((p) => p.id === item.productoId);
              if (prod) {
                prod.stock += item.cantidad;
              }
            }
          }

          order.estado = nuevoEstado;
          return hydrateOrder(db, order);
        });

        res.json({ pedido: updated });
      } catch (err) {
        next(err);
      }
    }
  );

  // Admin Dashboard KPIs
  app.get(
    '/api/v1/admin/dashboard/kpis',
    requireAuth,
    requireRole(['ADMIN']),
    (req, res) => {
      const db = getDb();
      const now = new Date();
      const defaultDesde = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const defaultHasta = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);

      const desde = String(req.query.desde || defaultDesde);
      const hasta = String(req.query.hasta || defaultHasta);
      const desdeMs = new Date(`${desde}T00:00:00.000Z`).getTime();
      const hastaMs = new Date(`${hasta}T23:59:59.999Z`).getTime();

      const ordersInRange = db.pedidos.filter((o) => {
        const t = new Date(o.fechaPedido).getTime();
        return t >= desdeMs && t <= hastaMs;
      });

      const pedidosPorEstado: Record<OrderStatus, number> = {
        PENDIENTE: 0,
        PAGADO: 0,
        ENVIADO: 0,
        ENTREGADO: 0,
        CANCELADO: 0,
      };
      for (const o of ordersInRange) {
        pedidosPorEstado[o.estado] = (pedidosPorEstado[o.estado] ?? 0) + 1;
      }

      const validOrders = ordersInRange.filter((o) => o.estado !== 'CANCELADO');
      const ingresosTotalesCOP = validOrders.reduce((acc, o) => acc + o.total, 0);
      const totalPedidosValidos = validOrders.length;
      const ticketPromedioCOP =
        totalPedidosValidos > 0
          ? Math.round(ingresosTotalesCOP / totalPedidosValidos)
          : 0;

      // Top 5 productos más vendidos en pedidos no cancelados
      const validOrderIds = new Set(validOrders.map((o) => o.id));
      const catMap = new Map(db.categorias.map((c) => [c.id, c.nombre]));
      const prodStats = new Map<
        number,
        {
          productoId: number;
          sku: string;
          nombre: string;
          categoriaNombre: string;
          unidadesVendidas: number;
          ingresosCOP: number;
        }
      >();

      for (const det of db.detallePedidos) {
        if (!validOrderIds.has(det.pedidoId)) continue;
        const prod = db.productos.find((p) => p.id === det.productoId);
        const existing = prodStats.get(det.productoId) ?? {
          productoId: det.productoId,
          sku: det.productoSku,
          nombre: det.productoNombre,
          categoriaNombre: prod
            ? catMap.get(prod.categoriaId) ?? 'General'
            : 'General',
          unidadesVendidas: 0,
          ingresosCOP: 0,
        };
        existing.unidadesVendidas += det.cantidad;
        existing.ingresosCOP += det.subtotalLinea;
        prodStats.set(det.productoId, existing);
      }

      const top5Productos = Array.from(prodStats.values())
        .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas)
        .slice(0, 5);

      const productosBajoStock = db.productos
        .filter((p) => p.stock <= 5)
        .sort((a, b) => a.stock - b.stock)
        .map((p) => ({
          id: p.id,
          sku: p.sku,
          nombre: p.nombre,
          categoriaNombre: catMap.get(p.categoriaId) ?? 'General',
          stock: p.stock,
          precio: p.precio,
          estado: p.estado,
        }));

      const dailyMap = new Map<string, { ingresosCOP: number; pedidos: number }>();
      for (const o of validOrders) {
        const day = o.fechaPedido.slice(0, 10);
        const cur = dailyMap.get(day) ?? { ingresosCOP: 0, pedidos: 0 };
        cur.ingresosCOP += o.total;
        cur.pedidos += 1;
        dailyMap.set(day, cur);
      }
      const ventasRecientes = Array.from(dailyMap.entries())
        .map(([fecha, stats]) => ({ fecha, ...stats }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));

      res.json({
        desde,
        hasta,
        ingresosTotalesCOP,
        totalPedidosValidos,
        ticketPromedioCOP,
        totalProductosBajoStock: productosBajoStock.length,
        pedidosPorEstado,
        top5Productos,
        productosBajoStock,
        ventasRecientes,
      });
    }
  );

  // Global error handler (@RestControllerAdvice equivalent)
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message, details: err.details });
        return;
      }
      console.error('Unhandled API error:', err);
      res.status(500).json({
        error: 'Ocurrió un error interno en el servidor. Intenta nuevamente.',
      });
    }
  );

  // Vite integration in dev vs static dist in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mercado Trust server running at http://localhost:${PORT}`);
  });
}

startServer();
