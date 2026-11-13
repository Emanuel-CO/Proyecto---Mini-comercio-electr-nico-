import type {
  CartCalculation,
  CartItem,
  Category,
  DashboardKPIs,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  User,
} from '../types';

const TOKEN_KEY = 'mt_jwt_token';

export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers });
  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }

  if (!res.ok) {
    const msg =
      (data as { error?: string })?.error ||
      `Error de solicitud (${res.status})`;
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

export const api = {
  // Auth
  login: (correo: string, password: string) =>
    request<{ token: string; usuario: User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password }),
    }),

  register: (payload: {
    nombresCompletos: string;
    correo: string;
    password: string;
    telefono: string;
    direccionEnvio: string;
    aceptaPoliticaDatos: boolean;
  }) =>
    request<{ token: string; usuario: User }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => request<{ usuario: User }>('/api/v1/auth/me'),

  updateProfile: (payload: {
    nombresCompletos: string;
    telefono: string;
    direccionEnvio: string;
    passwordActual?: string;
    passwordNueva?: string;
  }) =>
    request<{ usuario: User }>('/api/v1/usuarios/perfil', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Catalog
  getPublicCategories: () =>
    request<{ categorias: Category[] }>('/api/v1/catalogo/categorias'),

  getPublicProducts: (params?: {
    q?: string;
    categoriaId?: number | null;
    sort?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set('q', params.q);
    if (params?.categoriaId) sp.set('categoriaId', String(params.categoriaId));
    if (params?.sort) sp.set('sort', params.sort);
    const qs = sp.toString();
    return request<{ productos: Product[] }>(
      `/api/v1/catalogo/productos${qs ? `?${qs}` : ''}`
    );
  },

  getPublicProduct: (id: number) =>
    request<{ producto: Product }>(`/api/v1/catalogo/productos/${id}`),

  // Cart & Checkout
  calculateCart: (items: CartItem[]) =>
    request<CartCalculation>('/api/v1/carrito/calcular', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  checkout: (payload: {
    items: CartItem[];
    direccionEntrega: string;
    telefonoContacto: string;
    metodoPago: PaymentMethod;
  }) =>
    request<{ pedido: Order }>('/api/v1/pedidos/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyOrders: () => request<{ pedidos: Order[] }>('/api/v1/pedidos/mis-pedidos'),

  getReceipt: (orderId: number) =>
    request<{ pedido: Order }>(`/api/v1/pedidos/${orderId}/comprobante`),

  cancelMyOrder: (orderId: number) =>
    request<{ pedido: Order }>(`/api/v1/pedidos/${orderId}/cancelar`, {
      method: 'PATCH',
    }),

  // Admin
  adminGetKPIs: (desde?: string, hasta?: string) => {
    const sp = new URLSearchParams();
    if (desde) sp.set('desde', desde);
    if (hasta) sp.set('hasta', hasta);
    const qs = sp.toString();
    return request<DashboardKPIs>(
      `/api/v1/admin/dashboard/kpis${qs ? `?${qs}` : ''}`
    );
  },

  adminGetOrders: (estado?: string) =>
    request<{ pedidos: Order[] }>(
      `/api/v1/admin/pedidos${estado && estado !== 'TODOS' ? `?estado=${estado}` : ''}`
    ),

  adminUpdateOrderStatus: (orderId: number, estado: OrderStatus) =>
    request<{ pedido: Order }>(`/api/v1/admin/pedidos/${orderId}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),

  adminGetProducts: () =>
    request<{ productos: Product[] }>('/api/v1/admin/productos'),

  adminCreateProduct: (payload: Omit<Product, 'id' | 'categoriaNombre'>) =>
    request<{ producto: Product }>('/api/v1/admin/productos', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adminUpdateProduct: (
    id: number,
    payload: Omit<Product, 'id' | 'categoriaNombre'>
  ) =>
    request<{ producto: Product }>(`/api/v1/admin/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  adminUploadImage: (filename: string, dataUrl: string) =>
    request<{ imagenUrl: string }>('/api/v1/admin/upload', {
      method: 'POST',
      body: JSON.stringify({ filename, dataUrl }),
    }),

  adminGetCategories: () =>
    request<{ categorias: Array<Category & { totalProductos: number }> }>(
      '/api/v1/admin/categorias'
    ),

  adminCreateCategory: (payload: Omit<Category, 'id'>) =>
    request<{ categoria: Category & { totalProductos: number } }>(
      '/api/v1/admin/categorias',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  adminUpdateCategory: (id: number, payload: Omit<Category, 'id'>) =>
    request<{ categoria: Category & { totalProductos: number } }>(
      `/api/v1/admin/categorias/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    ),

  adminDeleteCategory: (id: number) =>
    request<{ ok: boolean }>(`/api/v1/admin/categorias/${id}`, {
      method: 'DELETE',
    }),
};
