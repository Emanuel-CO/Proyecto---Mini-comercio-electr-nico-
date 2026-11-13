import fs from 'node:fs';
import path from 'node:path';
import { hashPassword } from './auth.ts';
import type {
  AccountStatus,
  CategoryStatus,
  OrderStatus,
  PaymentMethod,
  ProductStatus,
  UserRole,
} from '../src/types.ts';

export interface DbUser {
  id: number;
  rol: UserRole;
  nombresCompletos: string;
  correo: string;
  passwordHash: string;
  telefono: string;
  direccionEnvio: string;
  aceptaPoliticaDatos: boolean;
  estado: AccountStatus;
  fechaRegistro: string;
}

export interface DbCategory {
  id: number;
  nombre: string;
  descripcion: string;
  estado: CategoryStatus;
}

export interface DbProduct {
  id: number;
  categoriaId: number;
  sku: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagenUrl: string;
  estado: ProductStatus;
}

export interface DbOrder {
  id: number;
  codigoOrden: string;
  usuarioId: number;
  fechaPedido: string;
  direccionEntrega: string;
  telefonoContacto: string;
  metodoPago: PaymentMethod;
  subtotal: number;
  impuestos: number;
  costoEnvio: number;
  total: number;
  estado: OrderStatus;
}

export interface DbOrderItem {
  id: number;
  pedidoId: number;
  productoId: number;
  productoNombre: string;
  productoSku: string;
  productoImagenUrl: string;
  cantidad: number;
  precioUnitarioHistorico: number;
  subtotalLinea: number;
}

export interface StoreDatabase {
  sequences: {
    usuarios: number;
    categorias: number;
    productos: number;
    pedidos: number;
    detallePedidos: number;
  };
  usuarios: DbUser[];
  categorias: DbCategory[];
  productos: DbProduct[];
  pedidos: DbOrder[];
  detallePedidos: DbOrderItem[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

export const SHIPPING_FEE_COP = 8000;
export const FREE_SHIPPING_THRESHOLD_COP = 150000;

function buildSeedDatabase(): StoreDatabase {
  const now = new Date('2026-11-12T10:30:00.000Z');
  const daysAgo = (days: number, hour = 14) => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - days);
    d.setUTCHours(hour, 15, 0, 0);
    return d.toISOString();
  };

  const usuarios: DbUser[] = [
    {
      id: 1,
      rol: 'ADMIN',
      nombresCompletos: 'Emanuel Conde Ocampo',
      correo: 'admin@mercadotrust.co',
      passwordHash: hashPassword('Admin1234!'),
      telefono: '310 482 9104',
      direccionEnvio: 'Cra. 5 # 10-48 Centro, Neiva, Huila',
      aceptaPoliticaDatos: true,
      estado: 'ACTIVO',
      fechaRegistro: daysAgo(30, 9),
    },
    {
      id: 2,
      rol: 'CLIENTE',
      nombresCompletos: 'Camila Rojas Trujillo',
      correo: 'camila.rojas@correo.co',
      passwordHash: hashPassword('Cliente1234!'),
      telefono: '315 742 3319',
      direccionEnvio: 'Calle 18 # 32-14 Altico, Neiva, Huila',
      aceptaPoliticaDatos: true,
      estado: 'ACTIVO',
      fechaRegistro: daysAgo(21, 11),
    },
    {
      id: 3,
      rol: 'CLIENTE',
      nombresCompletos: 'Mateo García Perdomo',
      correo: 'mateo.garcia@correo.co',
      passwordHash: hashPassword('Cliente1234!'),
      telefono: '320 618 4402',
      direccionEnvio: 'Av. Tenerife # 14-50 Piso 3, Neiva, Huila',
      aceptaPoliticaDatos: true,
      estado: 'ACTIVO',
      fechaRegistro: daysAgo(15, 16),
    },
  ];

  const categorias: DbCategory[] = [
    {
      id: 1,
      nombre: 'Café y Despensa',
      descripcion: 'Café de origen especial del Huila y productos artesanales seleccionados.',
      estado: 'ACTIVA',
    },
    {
      id: 2,
      nombre: 'Tecnología',
      descripcion: 'Audio inalámbrico, iluminación de escritorio y accesorios funcionales.',
      estado: 'ACTIVA',
    },
    {
      id: 3,
      nombre: 'Marroquinería',
      descripcion: 'Piezas en cuero legítimo colombiano y mochilas tejidas a mano.',
      estado: 'ACTIVA',
    },
    {
      id: 4,
      nombre: 'Hogar y Diseño',
      descripcion: 'Termos térmicos, lámparas arquitectónicas y artículos cotidianos.',
      estado: 'ACTIVA',
    },
    {
      id: 5,
      nombre: 'Cuidado Personal',
      descripcion: 'Fórmulas botánicas y bienestar diario sin parabenos.',
      estado: 'ACTIVA',
    },
  ];

  const productos: DbProduct[] = [
    {
      id: 1,
      categoriaId: 1,
      sku: 'CAF-HUI-250',
      nombre: 'Café Especial Origen Huila 250g',
      descripcion:
        'Grano Arábica lavado cultivado a 1.750 msnm en Pitalito, Huila. Notas a panela, chocolate oscuro y cítricos balanceados.',
      precio: 38000,
      stock: 24,
      imagenUrl: '/src/assets/images/product_cafe_huila_1794578223184.jpg',
      estado: 'ACTIVO',
    },
    {
      id: 2,
      categoriaId: 2,
      sku: 'TEC-AUD-001',
      nombre: 'Audífonos Studio ANC Slate',
      descripcion:
        'Cancelación activa de ruido híbrida, 40 horas de batería continua, carga rápida USB-C y almohadillas en cuero sintético suave.',
      precio: 289000,
      stock: 4, // Bajo stock <= 5
      imagenUrl: '/src/assets/images/product_audifonos_pro_1794578223194.jpg',
      estado: 'ACTIVO',
    },
    {
      id: 3,
      categoriaId: 3,
      sku: 'MAR-BIL-012',
      nombre: 'Billetera Cuero Legítimo Coñac',
      descripcion:
        'Cosida a mano en cuero plena flor colombiano con protección RFID integrada, 6 ranuras para tarjetas y compartimento doble para billetes.',
      precio: 115000,
      stock: 14,
      imagenUrl: '/src/assets/images/product_billetera_cuero_1794578224008.jpg',
      estado: 'ACTIVO',
    },
    {
      id: 4,
      categoriaId: 4,
      sku: 'HOG-TER-750',
      nombre: 'Termo Acero Térmico Esmeralda 750ml',
      descripcion:
        'Doble pared en acero inoxidable 18/8 libre de BPA. Mantiene bebidas frías por 24 horas y calientes por 12 horas sin condensación.',
      precio: 68000,
      stock: 19,
      imagenUrl: '/src/assets/images/product_termo_acero_1794578224139.jpg',
      estado: 'ACTIVO',
    },
    {
      id: 5,
      categoriaId: 4,
      sku: 'HOG-LAM-004',
      nombre: 'Lámpara Arquitectónica Roble & Aluminio',
      descripcion:
        'Brazo articulado en aluminio cepillado con base sólida en roble natural. Tres temperaturas de color regulables con control táctil.',
      precio: 195000,
      stock: 3, // Bajo stock <= 5
      imagenUrl: '/src/assets/images/product_lampara_escritorio_1794578225014.jpg',
      estado: 'ACTIVO',
    },
    {
      id: 6,
      categoriaId: 5,
      sku: 'CUI-KIT-002',
      nombre: 'Kit Hidratación Botánica Facial',
      descripcion:
        'Sérum concentrado con vitamina C y ácido hialurónico en frasco ámbar de 30ml acompañado de crema hidratante de caléndula 50ml.',
      precio: 124000,
      stock: 11,
      imagenUrl: '/src/assets/images/product_kit_skincare_1794578226274.jpg',
      estado: 'ACTIVO',
    },
    {
      id: 7,
      categoriaId: 3,
      sku: 'MAR-MOC-008',
      nombre: 'Mochila Tote Tejido Artesanal',
      descripcion:
        'Tejido geométrico de alta resistencia en algodón natural y fibras teñidas con asas en cuero curtido vegetal y bolsillo interno con cierre.',
      precio: 158000,
      stock: 0, // Agotado para validar UI de stock == 0
      imagenUrl: '/src/assets/images/product_mochila_wayuu_1794578226512.jpg',
      estado: 'ACTIVO',
    },
    {
      id: 8,
      categoriaId: 1,
      sku: 'CAF-RES-500',
      nombre: 'Café Reserva Geisha Tostión Media 500g',
      descripcion:
        'Edición de micro-lote de altura con perfil floral a jazmín, miel de abejas y durazno. Empaque hermético con válvula unidireccional.',
      precio: 74000,
      stock: 5, // Bajo stock <= 5
      imagenUrl: '/src/assets/images/product_cafe_huila_1794578223184.jpg',
      estado: 'ACTIVO',
    },
  ];

  const pedidos: DbOrder[] = [
    {
      id: 1,
      codigoOrden: 'MT-2026-0001',
      usuarioId: 2,
      fechaPedido: daysAgo(12, 15),
      direccionEntrega: 'Calle 18 # 32-14 Altico, Neiva, Huila',
      telefonoContacto: '315 742 3319',
      metodoPago: 'TRANSFERENCIA_NEQUI_PSE',
      subtotal: 191000,
      impuestos: 0,
      costoEnvio: 0,
      total: 191000,
      estado: 'ENTREGADO',
    },
    {
      id: 2,
      codigoOrden: 'MT-2026-0002',
      usuarioId: 3,
      fechaPedido: daysAgo(8, 11),
      direccionEntrega: 'Av. Tenerife # 14-50 Piso 3, Neiva, Huila',
      telefonoContacto: '320 618 4402',
      metodoPago: 'TARJETA_DEMO',
      subtotal: 289000,
      impuestos: 0,
      costoEnvio: 0,
      total: 289000,
      estado: 'ENTREGADO',
    },
    {
      id: 3,
      codigoOrden: 'MT-2026-0003',
      usuarioId: 2,
      fechaPedido: daysAgo(5, 17),
      direccionEntrega: 'Calle 18 # 32-14 Altico, Neiva, Huila',
      telefonoContacto: '315 742 3319',
      metodoPago: 'CONTRAENTREGA',
      subtotal: 106000,
      impuestos: 0,
      costoEnvio: 8000,
      total: 114000,
      estado: 'ENVIADO',
    },
    {
      id: 4,
      codigoOrden: 'MT-2026-0004',
      usuarioId: 3,
      fechaPedido: daysAgo(3, 10),
      direccionEntrega: 'Av. Tenerife # 14-50 Piso 3, Neiva, Huila',
      telefonoContacto: '320 618 4402',
      metodoPago: 'TRANSFERENCIA_NEQUI_PSE',
      subtotal: 195000,
      impuestos: 0,
      costoEnvio: 0,
      total: 195000,
      estado: 'PAGADO',
    },
    {
      id: 5,
      codigoOrden: 'MT-2026-0005',
      usuarioId: 2,
      fechaPedido: daysAgo(1, 14),
      direccionEntrega: 'Calle 18 # 32-14 Altico, Neiva, Huila',
      telefonoContacto: '315 742 3319',
      metodoPago: 'CONTRAENTREGA',
      subtotal: 124000,
      impuestos: 0,
      costoEnvio: 8000,
      total: 132000,
      estado: 'PENDIENTE',
    },
    {
      id: 6,
      codigoOrden: 'MT-2026-0006',
      usuarioId: 3,
      fechaPedido: daysAgo(2, 9),
      direccionEntrega: 'Av. Tenerife # 14-50 Piso 3, Neiva, Huila',
      telefonoContacto: '320 618 4402',
      metodoPago: 'CONTRAENTREGA',
      subtotal: 68000,
      impuestos: 0,
      costoEnvio: 8000,
      total: 76000,
      estado: 'CANCELADO',
    },
  ];

  const detallePedidos: DbOrderItem[] = [
    {
      id: 1,
      pedidoId: 1,
      productoId: 1,
      productoNombre: 'Café Especial Origen Huila 250g',
      productoSku: 'CAF-HUI-250',
      productoImagenUrl: '/src/assets/images/product_cafe_huila_1794578223184.jpg',
      cantidad: 2,
      precioUnitarioHistorico: 38000,
      subtotalLinea: 76000,
    },
    {
      id: 2,
      pedidoId: 1,
      productoId: 3,
      productoNombre: 'Billetera Cuero Legítimo Coñac',
      productoSku: 'MAR-BIL-012',
      productoImagenUrl: '/src/assets/images/product_billetera_cuero_1794578224008.jpg',
      cantidad: 1,
      precioUnitarioHistorico: 115000,
      subtotalLinea: 115000,
    },
    {
      id: 3,
      pedidoId: 2,
      productoId: 2,
      productoNombre: 'Audífonos Studio ANC Slate',
      productoSku: 'TEC-AUD-001',
      productoImagenUrl: '/src/assets/images/product_audifonos_pro_1794578223194.jpg',
      cantidad: 1,
      precioUnitarioHistorico: 289000,
      subtotalLinea: 289000,
    },
    {
      id: 4,
      pedidoId: 3,
      productoId: 1,
      productoNombre: 'Café Especial Origen Huila 250g',
      productoSku: 'CAF-HUI-250',
      productoImagenUrl: '/src/assets/images/product_cafe_huila_1794578223184.jpg',
      cantidad: 1,
      precioUnitarioHistorico: 38000,
      subtotalLinea: 38000,
    },
    {
      id: 5,
      pedidoId: 3,
      productoId: 4,
      productoNombre: 'Termo Acero Térmico Esmeralda 750ml',
      productoSku: 'HOG-TER-750',
      productoImagenUrl: '/src/assets/images/product_termo_acero_1794578224139.jpg',
      cantidad: 1,
      precioUnitarioHistorico: 68000,
      subtotalLinea: 68000,
    },
    {
      id: 6,
      pedidoId: 4,
      productoId: 5,
      productoNombre: 'Lámpara Arquitectónica Roble & Aluminio',
      productoSku: 'HOG-LAM-004',
      productoImagenUrl: '/src/assets/images/product_lampara_escritorio_1794578225014.jpg',
      cantidad: 1,
      precioUnitarioHistorico: 195000,
      subtotalLinea: 195000,
    },
    {
      id: 7,
      pedidoId: 5,
      productoId: 6,
      productoNombre: 'Kit Hidratación Botánica Facial',
      productoSku: 'CUI-KIT-002',
      productoImagenUrl: '/src/assets/images/product_kit_skincare_1794578226274.jpg',
      cantidad: 1,
      precioUnitarioHistorico: 124000,
      subtotalLinea: 124000,
    },
    {
      id: 8,
      pedidoId: 6,
      productoId: 4,
      productoNombre: 'Termo Acero Térmico Esmeralda 750ml',
      productoSku: 'HOG-TER-750',
      productoImagenUrl: '/src/assets/images/product_termo_acero_1794578224139.jpg',
      cantidad: 1,
      precioUnitarioHistorico: 68000,
      subtotalLinea: 68000,
    },
  ];

  return {
    sequences: {
      usuarios: 3,
      categorias: 5,
      productos: 8,
      pedidos: 6,
      detallePedidos: 8,
    },
    usuarios,
    categorias,
    productos,
    pedidos,
    detallePedidos,
  };
}

let dbCache: StoreDatabase | null = null;
let txQueue: Promise<unknown> = Promise.resolve();

export function getDb(): StoreDatabase {
  if (dbCache) return dbCache;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      dbCache = JSON.parse(raw) as StoreDatabase;
      return dbCache;
    } catch {
      // Fallback to fresh seed if store.json is corrupted
    }
  }
  dbCache = buildSeedDatabase();
  persistDb(dbCache);
  return dbCache;
}

function persistDb(db: StoreDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

/**
 * Ejecuta una operación bajo semántica ACID (Aislamiento en cola + Snapshot + Rollback).
 */
export function withTransaction<T>(fn: (db: StoreDatabase) => T): Promise<T> {
  const run = async (): Promise<T> => {
    const db = getDb();
    const snapshot = JSON.stringify(db);
    try {
      const result = fn(db);
      persistDb(db);
      return result;
    } catch (error) {
      // ROLLBACK automático al estado previo
      dbCache = JSON.parse(snapshot) as StoreDatabase;
      throw error;
    }
  };
  const next = txQueue.then(run, run);
  txQueue = next.catch(() => undefined);
  return next;
}
