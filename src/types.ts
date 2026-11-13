export type UserRole = 'ADMIN' | 'CLIENTE';
export type AccountStatus = 'ACTIVO' | 'INACTIVO';
export type CategoryStatus = 'ACTIVA' | 'INACTIVA';
export type ProductStatus = 'ACTIVO' | 'INACTIVO';

export type OrderStatus =
  | 'PENDIENTE'
  | 'PAGADO'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type PaymentMethod =
  | 'CONTRAENTREGA'
  | 'TRANSFERENCIA_NEQUI_PSE'
  | 'TARJETA_DEMO';

export interface User {
  id: number;
  rol: UserRole;
  nombresCompletos: string;
  correo: string;
  telefono: string;
  direccionEnvio: string;
  aceptaPoliticaDatos: boolean;
  estado: AccountStatus;
  fechaRegistro: string;
}

export interface Category {
  id: number;
  nombre: string;
  descripcion: string;
  estado: CategoryStatus;
}

export interface Product {
  id: number;
  categoriaId: number;
  categoriaNombre?: string;
  sku: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagenUrl: string;
  estado: ProductStatus;
}

export interface OrderItem {
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

export interface Order {
  id: number;
  codigoOrden: string;
  usuarioId: number;
  clienteNombre?: string;
  clienteCorreo?: string;
  fechaPedido: string;
  direccionEntrega: string;
  telefonoContacto: string;
  metodoPago: PaymentMethod;
  subtotal: number;
  impuestos: number;
  costoEnvio: number;
  total: number;
  estado: OrderStatus;
  items: OrderItem[];
}

export interface CartItem {
  productoId: number;
  cantidad: number;
}

export interface CartCalculatedItem {
  productoId: number;
  sku: string;
  nombre: string;
  imagenUrl: string;
  precioUnitario: number;
  cantidadSolicitada: number;
  cantidadAplicada: number;
  stockDisponible: number;
  subtotalLinea: number;
  disponible: boolean;
  advertencia?: string;
}

export interface CartCalculation {
  items: CartCalculatedItem[];
  subtotal: number;
  impuestos: number;
  costoEnvio: number;
  umbralEnvioGratis: number;
  total: number;
  tieneProblemasStock: boolean;
}

export interface DashboardKPIs {
  desde: string;
  hasta: string;
  ingresosTotalesCOP: number;
  totalPedidosValidos: number;
  ticketPromedioCOP: number;
  totalProductosBajoStock: number;
  pedidosPorEstado: Record<OrderStatus, number>;
  top5Productos: Array<{
    productoId: number;
    sku: string;
    nombre: string;
    categoriaNombre: string;
    unidadesVendidas: number;
    ingresosCOP: number;
  }>;
  productosBajoStock: Array<{
    id: number;
    sku: string;
    nombre: string;
    categoriaNombre: string;
    stock: number;
    precio: number;
    estado: ProductStatus;
  }>;
  ventasRecientes: Array<{
    fecha: string;
    ingresosCOP: number;
    pedidos: number;
  }>;
}
