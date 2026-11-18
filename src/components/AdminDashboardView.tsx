import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Download,
  Edit3,
  FolderKanban,
  Loader2,
  Package,
  Plus,
  Printer,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import {
  formatCOP,
  formatDateShortCO,
  ORDER_STATUS_META,
} from '../lib/format';
import { GALLERY_PRESET_IMAGES } from '../lib/imageRegistry';
import type {
  Category,
  DashboardKPIs,
  Order,
  OrderStatus,
  Product,
} from '../types';
import { ProductImage } from './ProductImage';

type AdminTab = 'kpis' | 'orders' | 'products' | 'categories';

interface AdminDashboardViewProps {
  onViewReceipt: (order: Order) => void;
  onCatalogMutated: () => void;
}

export function AdminDashboardView({
  onViewReceipt,
  onCatalogMutated,
}: AdminDashboardViewProps) {
  const [tab, setTab] = useState<AdminTab>('kpis');

  // KPIs state
  const now = new Date();
  const [desde, setDesde] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  );
  const [hasta, setHasta] = useState(
    new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10)
  );
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loadingKpis, setLoadingKpis] = useState(true);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('TODOS');
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [prodSearch, setProdSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Categories state
  const [categories, setCategories] = useState<
    Array<Category & { totalProductos: number }>
  >([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Shared feedback
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Product Form state
  const [pSku, setPSku] = useState('');
  const [pNombre, setPNombre] = useState('');
  const [pCategoriaId, setPCategoriaId] = useState<number>(1);
  const [pPrecio, setPPrecio] = useState('');
  const [pStock, setPStock] = useState('');
  const [pDescripcion, setPDescripcion] = useState('');
  const [pImagenUrl, setPImagenUrl] = useState(GALLERY_PRESET_IMAGES[0].url);
  const [pEstado, setPEstado] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [savingForm, setSavingForm] = useState(false);

  // Category Form state
  const [cNombre, setCNombre] = useState('');
  const [cDescripcion, setCDescripcion] = useState('');
  const [cEstado, setCEstado] = useState<'ACTIVA' | 'INACTIVA'>('ACTIVA');

  const loadKpis = async () => {
    setLoadingKpis(true);
    try {
      const data = await api.adminGetKPIs(desde, hasta);
      setKpis(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Error al cargar métricas.'
      );
    } finally {
      setLoadingKpis(false);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.adminGetOrders(orderFilter);
      setOrders(res.pedidos);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Error al cargar pedidos.'
      );
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadProductsAndCategories = async () => {
    setLoadingProducts(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.adminGetProducts(),
        api.adminGetCategories(),
      ]);
      setProducts(pRes.productos);
      setCategories(cRes.categorias);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Error al cargar inventario.'
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadKpis();
  }, [desde, hasta]);

  useEffect(() => {
    if (tab === 'orders') loadOrders();
    if (tab === 'products' || tab === 'categories') loadProductsAndCategories();
  }, [tab, orderFilter]);

  const handleStatusChange = async (orderId: number, nextStatus: OrderStatus) => {
    setError(null);
    setFeedback(null);
    try {
      const res = await api.adminUpdateOrderStatus(orderId, nextStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? res.pedido : o))
      );
      setFeedback(
        nextStatus === 'CANCELADO'
          ? `Pedido ${res.pedido.codigoOrden} cancelado. El inventario fue restituido automáticamente.`
          : `Estado de ${res.pedido.codigoOrden} actualizado a ${ORDER_STATUS_META[nextStatus].label}.`
      );
      loadKpis();
      onCatalogMutated();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo actualizar el estado del pedido.'
      );
    }
  };

  const openProductModal = (prod?: Product) => {
    setError(null);
    if (prod) {
      setEditingProduct(prod);
      setPSku(prod.sku);
      setPNombre(prod.nombre);
      setPCategoriaId(prod.categoriaId);
      setPPrecio(String(prod.precio));
      setPStock(String(prod.stock));
      setPDescripcion(prod.descripcion);
      setPImagenUrl(prod.imagenUrl);
      setPEstado(prod.estado);
    } else {
      setEditingProduct(null);
      setPSku('');
      setPNombre('');
      setPCategoriaId(categories[0]?.id ?? 1);
      setPPrecio('');
      setPStock('10');
      setPDescripcion('');
      setPImagenUrl(GALLERY_PRESET_IMAGES[0].url);
      setPEstado('ACTIVO');
    }
    setProductModalOpen(true);
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen supera el límite máximo de 2 MB.');
      return;
    }
    setUploadingImg(true);
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Lectura fallida'));
        reader.readAsDataURL(file);
      });
      const res = await api.adminUploadImage(file.name, dataUrl);
      setPImagenUrl(res.imagenUrl);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No se pudo subir la imagen.'
      );
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    setSavingForm(true);
    setError(null);
    try {
      const payload = {
        categoriaId: Number(pCategoriaId),
        sku: pSku.trim().toUpperCase(),
        nombre: pNombre.trim(),
        descripcion: pDescripcion.trim(),
        precio: Number(pPrecio),
        stock: Number(pStock),
        imagenUrl: pImagenUrl,
        estado: pEstado,
      };
      if (editingProduct) {
        await api.adminUpdateProduct(editingProduct.id, payload);
        setFeedback(`Producto ${payload.nombre} actualizado.`);
      } else {
        await api.adminCreateProduct(payload);
        setFeedback(`Producto ${payload.nombre} creado y publicado.`);
      }
      setProductModalOpen(false);
      await loadProductsAndCategories();
      loadKpis();
      onCatalogMutated();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Error al guardar el producto.'
      );
    } finally {
      setSavingForm(false);
    }
  };

  const openCategoryModal = (cat?: Category) => {
    setError(null);
    if (cat) {
      setEditingCategory(cat);
      setCNombre(cat.nombre);
      setCDescripcion(cat.descripcion);
      setCEstado(cat.estado);
    } else {
      setEditingCategory(null);
      setCNombre('');
      setCDescripcion('');
      setCEstado('ACTIVA');
    }
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();
    setSavingForm(true);
    setError(null);
    try {
      const payload = {
        nombre: cNombre.trim(),
        descripcion: cDescripcion.trim(),
        estado: cEstado,
      };
      if (editingCategory) {
        await api.adminUpdateCategory(editingCategory.id, payload);
        setFeedback(`Categoría ${payload.nombre} actualizada.`);
      } else {
        await api.adminCreateCategory(payload);
        setFeedback(`Categoría ${payload.nombre} creada.`);
      }
      setCategoryModalOpen(false);
      await loadProductsAndCategories();
      onCatalogMutated();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Error al guardar la categoría.'
      );
    } finally {
      setSavingForm(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    setError(null);
    setFeedback(null);
    try {
      await api.adminDeleteCategory(id);
      setFeedback('Categoría eliminada correctamente.');
      await loadProductsAndCategories();
      onCatalogMutated();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo eliminar la categoría.'
      );
    }
  };

  const handleExportCSV = () => {
    if (!kpis) return;
    const rows = [
      ['Periodo', `${kpis.desde} a ${kpis.hasta}`],
      ['Ingresos Totales COP', String(kpis.ingresosTotalesCOP)],
      ['Pedidos Validos', String(kpis.totalPedidosValidos)],
      ['Ticket Promedio COP', String(kpis.ticketPromedioCOP)],
      [],
      ['SKU', 'Producto', 'Categoria', 'Unidades Vendidas', 'Ingresos COP'],
      ...kpis.top5Productos.map((p) => [
        p.sku,
        `"${p.nombre}"`,
        `"${p.categoriaNombre}"`,
        String(p.unidadesVendidas),
        String(p.ingresosCOP),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-ventas-mercado-trust-${kpis.desde}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredProducts = products.filter((p) => {
    const q = prodSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.categoriaNombre ?? '').toLowerCase().includes(q)
    );
  });

  const navItems: Array<{ id: AdminTab; label: string; icon: typeof BarChart3 }> = [
    { id: 'kpis', label: 'Dashboard y KPIs', icon: BarChart3 },
    { id: 'orders', label: 'Gestión de Pedidos', icon: ClipboardList },
    { id: 'products', label: 'Productos e Inventario', icon: Package },
    { id: 'categories', label: 'Categorías', icon: FolderKanban },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 flex flex-col lg:flex-row gap-8">
      {/* Sidebar persistente 260px en escritorio */}
      <aside className="no-print lg:w-[260px] shrink-0">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 space-y-1 lg:sticky lg:top-24">
          <div className="px-3 py-2 mb-1">
            <span className="text-xs font-semibold text-[#64748B]">
              Backoffice Administrativo
            </span>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setError(null);
                  setFeedback(null);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0F172A] text-white'
                    : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Área principal */}
      <main className="flex-1 min-w-0 space-y-6">
        {feedback && (
          <div className="no-print px-4 py-3 rounded-lg bg-[#D1FAE5] border border-[#A7F3D0] text-[#065F46] text-sm font-medium">
            {feedback}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="no-print px-4 py-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] text-sm font-medium"
          >
            {error}
          </div>
        )}

        {/* TAB 1: DASHBOARD KPIs */}
        {tab === 'kpis' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                  Resumen comercial y métricas
                </h1>
                <p className="text-sm text-[#64748B] mt-1">
                  Los ingresos excluyen órdenes canceladas para reflejar ventas reales.
                </p>
              </div>

              <div className="no-print flex flex-wrap items-center gap-2.5">
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  aria-label="Fecha inicial"
                  className="h-10 px-3 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#0F172A]"
                />
                <span className="text-xs text-[#64748B]">a</span>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  aria-label="Fecha final"
                  className="h-10 px-3 rounded-lg border border-[#CBD5E1] bg-white text-xs font-medium text-[#0F172A]"
                />
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="h-11 px-4 rounded-xl border border-[#ebebeb] bg-white hover:bg-[#f2f4f5] text-sm font-bold text-[#332f2d] inline-flex items-center gap-2 cursor-pointer shadow-xs transition-all"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-11 px-4 rounded-xl bg-[#5433eb] hover:bg-[#4524db] text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir reporte
                </button>
              </div>
            </div>

            {loadingKpis || !kpis ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 bg-white border border-[#E2E8F0] rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <>
                {/* 4 Tarjetas KPI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                    <span className="block text-xs font-semibold text-[#64748B]">
                      Ingresos Netos (COP)
                    </span>
                    <span className="block text-2xl font-extrabold text-[#0F172A] tabular-nums mt-2">
                      {formatCOP(kpis.ingresosTotalesCOP, false)}
                    </span>
                    <span className="block text-xs font-medium text-[#059669] mt-2">
                      Sin pedidos cancelados
                    </span>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                    <span className="block text-xs font-semibold text-[#64748B]">
                      Órdenes Válidas
                    </span>
                    <span className="block text-2xl font-extrabold text-[#0F172A] tabular-nums mt-2">
                      {kpis.totalPedidosValidos}
                    </span>
                    <span className="block text-xs font-medium text-[#64748B] mt-2">
                      Canceladas: {kpis.pedidosPorEstado.CANCELADO}
                    </span>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                    <span className="block text-xs font-semibold text-[#64748B]">
                      Ticket Promedio
                    </span>
                    <span className="block text-2xl font-extrabold text-[#0F172A] tabular-nums mt-2">
                      {formatCOP(kpis.ticketPromedioCOP, false)}
                    </span>
                    <span className="block text-xs font-medium text-[#64748B] mt-2">
                      Promedio por compra
                    </span>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                    <span className="block text-xs font-semibold text-[#64748B]">
                      Alertas Stock (≤ 5 uds)
                    </span>
                    <span
                      className={`block text-2xl font-extrabold tabular-nums mt-2 ${
                        kpis.totalProductosBajoStock > 0
                          ? 'text-[#D97706]'
                          : 'text-[#059669]'
                      }`}
                    >
                      {kpis.totalProductosBajoStock}
                    </span>
                    <span className="block text-xs font-medium text-[#64748B] mt-2">
                      Requieren reposición
                    </span>
                  </div>
                </div>

                {/* Desglose por Estado */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                  <h2 className="text-sm font-bold text-[#0F172A] mb-4">
                    Distribución de pedidos por estado
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {(Object.keys(ORDER_STATUS_META) as OrderStatus[]).map(
                      (st) => {
                        const meta = ORDER_STATUS_META[st];
                        return (
                          <div
                            key={st}
                            className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
                          >
                            <span
                              className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}
                            >
                              {meta.label}
                            </span>
                            <span className="block text-xl font-extrabold text-[#0F172A] tabular-nums mt-2">
                              {kpis.pedidosPorEstado[st]}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Top 5 Productos más vendidos */}
                  <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#E2E8F0]">
                      <h2 className="text-sm font-bold text-[#0F172A]">
                        Top 5 productos más vendidos
                      </h2>
                    </div>
                    {kpis.top5Productos.length === 0 ? (
                      <p className="p-6 text-sm text-[#64748B]">
                        No se registran ventas confirmadas en el rango seleccionado.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#475569]">
                              <th className="py-3 px-4">Producto</th>
                              <th className="py-3 px-4 text-right">Uds</th>
                              <th className="py-3 px-4 text-right">Ingresos</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E2E8F0] text-sm">
                            {kpis.top5Productos.map((p) => (
                              <tr key={p.productoId} className="hover:bg-[#F8FAFC]">
                                <td className="py-3 px-4">
                                  <span className="block font-semibold text-[#0F172A]">
                                    {p.nombre}
                                  </span>
                                  <span className="text-xs text-[#64748B] font-mono">
                                    {p.sku} · {p.categoriaNombre}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-bold tabular-nums">
                                  {p.unidadesVendidas}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold tabular-nums text-[#0F172A]">
                                  {formatCOP(p.ingresosCOP)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Alertas de Inventario Crítico */}
                  <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                      <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                        Alertas de stock (≤ 5 uds)
                      </h2>
                      <button
                        type="button"
                        onClick={() => setTab('products')}
                        className="no-print text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                      >
                        Gestionar
                      </button>
                    </div>
                    {kpis.productosBajoStock.length === 0 ? (
                      <p className="p-6 text-sm text-[#065F46]">
                        Todo el inventario supera el umbral mínimo de 5 unidades.
                      </p>
                    ) : (
                      <div className="divide-y divide-[#E2E8F0]">
                        {kpis.productosBajoStock.map((item) => (
                          <div
                            key={item.id}
                            className={`px-5 py-3.5 flex items-center justify-between gap-3 ${
                              item.stock === 0 ? 'bg-[#FEF2F2]' : 'bg-[#FFFBEB]'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#0F172A] truncate">
                                {item.nombre}
                              </p>
                              <p className="text-xs font-mono text-[#64748B]">
                                {item.sku}
                              </p>
                            </div>
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 tabular-nums border ${
                                item.stock === 0
                                  ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]'
                                  : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                              }`}
                            >
                              {item.stock === 0 ? 'Agotado (0)' : `${item.stock} uds`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {/* TAB 2: GESTIÓN DE PEDIDOS */}
        {tab === 'orders' && (
          <section className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                  Gestión de pedidos
                </h1>
                <p className="text-sm text-[#64748B] mt-1">
                  Actualiza estados de despacho. Cancelar una orden restituye el stock automáticamente.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] rounded-lg overflow-x-auto">
              {['TODOS', 'PENDIENTE', 'PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'].map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderFilter(st)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer ${
                      orderFilter === st
                        ? 'bg-white text-[#0F172A] shadow-sm'
                        : 'text-[#475569] hover:text-[#0F172A]'
                    }`}
                  >
                    {st === 'TODOS'
                      ? 'Todos'
                      : ORDER_STATUS_META[st as OrderStatus].label}
                  </button>
                )
              )}
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#475569]">
                      <th className="py-3.5 px-4">Orden</th>
                      <th className="py-3.5 px-4">Cliente</th>
                      <th className="py-3.5 px-4">Fecha</th>
                      <th className="py-3.5 px-4 text-right">Total COP</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-sm">
                    {loadingOrders ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-[#64748B]">
                          Cargando pedidos...
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-[#64748B]">
                          No hay órdenes en este estado.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => {
                        const closed =
                          order.estado === 'ENTREGADO' ||
                          order.estado === 'CANCELADO';
                        const meta = ORDER_STATUS_META[order.estado];
                        return (
                          <tr key={order.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#0F172A]">
                              {order.codigoOrden}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="block font-semibold text-[#0F172A]">
                                {order.clienteNombre}
                              </span>
                              <span className="block text-xs text-[#64748B]">
                                {order.telefonoContacto}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-[#475569] whitespace-nowrap">
                              {formatDateShortCO(order.fechaPedido)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold tabular-nums text-[#0F172A]">
                              {formatCOP(order.total)}
                            </td>
                            <td className="py-3.5 px-4">
                              {closed ? (
                                <span
                                  className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}
                                >
                                  {meta.label}
                                </span>
                              ) : (
                                <select
                                  value={order.estado}
                                  onChange={(e) =>
                                    handleStatusChange(
                                      order.id,
                                      e.target.value as OrderStatus
                                    )
                                  }
                                  aria-label={`Estado de ${order.codigoOrden}`}
                                  className="h-9 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold text-[#0F172A] cursor-pointer"
                                >
                                  <option value="PENDIENTE" disabled={order.estado !== 'PENDIENTE'}>
                                    Pendiente
                                  </option>
                                  <option value="PAGADO">Pagado</option>
                                  <option value="ENVIADO">Enviado</option>
                                  <option value="ENTREGADO">Entregado</option>
                                  <option value="CANCELADO">Cancelado</option>
                                </select>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => onViewReceipt(order)}
                                className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                              >
                                Ver comprobante
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: PRODUCTOS E INVENTARIO */}
        {tab === 'products' && (
          <section className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                  Productos e inventario
                </h1>
                <p className="text-sm text-[#64748B] mt-1">
                  Los productos con existencias ≤ 5 unidades se resaltan automáticamente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openProductModal()}
                className="h-11 px-5 rounded-xl bg-[#5433eb] hover:bg-[#4524db] text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer shrink-0 shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" />
                Nuevo producto
              </button>
            </div>

            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
                placeholder="Buscar por nombre, SKU o categoría..."
                className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-[#CBD5E1] bg-white text-sm"
              />
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#475569]">
                      <th className="py-3.5 px-4">Producto</th>
                      <th className="py-3.5 px-4">SKU</th>
                      <th className="py-3.5 px-4">Categoría</th>
                      <th className="py-3.5 px-4 text-right">Precio COP</th>
                      <th className="py-3.5 px-4 text-right">Stock</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4 text-right">Editar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-sm">
                    {loadingProducts ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-[#64748B]">
                          Cargando productos...
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((prod) => {
                        const isOut = prod.stock === 0;
                        const isLow = prod.stock > 0 && prod.stock <= 5;
                        return (
                          <tr
                            key={prod.id}
                            className={
                              isOut
                                ? 'bg-[#FEF2F2]/70'
                                : isLow
                                ? 'bg-[#FFFBEB]/70'
                                : 'hover:bg-[#F8FAFC]'
                            }
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] overflow-hidden border border-[#E2E8F0] shrink-0">
                                  <ProductImage
                                    src={prod.imagenUrl}
                                    alt={prod.nombre}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span className="font-semibold text-[#0F172A]">
                                  {prod.nombre}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-[#475569]">
                              {prod.sku}
                            </td>
                            <td className="py-3 px-4 text-xs text-[#475569]">
                              {prod.categoriaNombre}
                            </td>
                            <td className="py-3 px-4 text-right font-bold tabular-nums text-[#0F172A]">
                              {formatCOP(prod.precio)}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums">
                              <span
                                className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                  isOut
                                    ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]'
                                    : isLow
                                    ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                                    : 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]'
                                }`}
                              >
                                {prod.stock} uds
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs font-semibold text-[#475569]">
                              {prod.estado}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => openProductModal(prod)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Editar
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: CATEGORÍAS */}
        {tab === 'categories' && (
          <section className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                  Gestión de categorías
                </h1>
                <p className="text-sm text-[#64748B] mt-1">
                  Organiza la vitrina. Solo las categorías activas se muestran a los compradores.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openCategoryModal()}
                className="h-11 px-5 rounded-xl bg-[#5433eb] hover:bg-[#4524db] text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer shrink-0 shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" />
                Nueva categoría
              </button>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#475569]">
                      <th className="py-3.5 px-4">Nombre</th>
                      <th className="py-3.5 px-4">Descripción</th>
                      <th className="py-3.5 px-4 text-right">Productos</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-sm">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                          {cat.nombre}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#475569] max-w-md">
                          {cat.descripcion}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold tabular-nums">
                          {cat.totalProductos}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                              cat.estado === 'ACTIVA'
                                ? 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]'
                                : 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]'
                            }`}
                          >
                            {cat.estado}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openCategoryModal(cat)}
                            className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#BA1A1A] hover:underline cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Modal Producto CRUD */}
      {productModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0F172A]/45 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0F172A]">
                {editingProduct ? 'Editar producto' : 'Crear nuevo producto'}
              </h2>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Código SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={pSku}
                    onChange={(e) => setPSku(e.target.value)}
                    placeholder="CAF-HUI-009"
                    className="w-full h-11 px-3 rounded-lg border border-[#CBD5E1] text-sm font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Categoría *
                  </label>
                  <select
                    value={pCategoriaId}
                    onChange={(e) => setPCategoriaId(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-lg border border-[#CBD5E1] text-sm bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Nombre del producto *
                </label>
                <input
                  type="text"
                  required
                  value={pNombre}
                  onChange={(e) => setPNombre(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[#CBD5E1] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Precio (COP) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={pPrecio}
                    onChange={(e) => setPPrecio(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-[#CBD5E1] text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Stock disponible *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={pStock}
                    onChange={(e) => setPStock(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-[#CBD5E1] text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Estado
                  </label>
                  <select
                    value={pEstado}
                    onChange={(e) =>
                      setPEstado(e.target.value as 'ACTIVO' | 'INACTIVO')
                    }
                    className="w-full h-11 px-3 rounded-lg border border-[#CBD5E1] text-sm bg-white"
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={pDescripcion}
                  onChange={(e) => setPDescripcion(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[#CBD5E1] text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#0F172A]">
                  Fotografía del producto (Subida local ≤ 2 MB o galería)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-16 h-16 rounded-lg border border-[#E2E8F0] overflow-hidden bg-[#F1F5F9] shrink-0">
                    <ProductImage
                      src={pImagenUrl}
                      alt={pNombre || 'Vista previa'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-xs font-semibold text-[#0F172A] cursor-pointer">
                    {uploadingImg ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Subir imagen</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <select
                    value={pImagenUrl}
                    onChange={(e) => setPImagenUrl(e.target.value)}
                    className="h-9 px-2.5 rounded-lg border border-[#CBD5E1] text-xs bg-white"
                  >
                    {GALLERY_PRESET_IMAGES.map((img) => (
                      <option key={img.url} value={img.url}>
                        Galería: {img.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#ebebeb]">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="h-12 px-5 rounded-xl border border-[#ebebeb] text-sm sm:text-base font-bold text-[#332f2d] hover:bg-[#f2f4f5] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingForm}
                  className="h-12 px-6 rounded-xl bg-[#5433eb] hover:bg-[#4524db] text-white text-base font-bold inline-flex items-center gap-2.5 shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer"
                >
                  {savingForm && <Loader2 className="w-5 h-5 animate-spin" />}
                  <span>Guardar producto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Categoría CRUD */}
      {categoryModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0F172A]/45 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0F172A]">
                {editingCategory ? 'Editar categoría' : 'Nueva categoría'}
              </h2>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Nombre de categoría *
                </label>
                <input
                  type="text"
                  required
                  value={cNombre}
                  onChange={(e) => setCNombre(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[#CBD5E1] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={cDescripcion}
                  onChange={(e) => setCDescripcion(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[#CBD5E1] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Estado
                </label>
                <select
                  value={cEstado}
                  onChange={(e) =>
                    setCEstado(e.target.value as 'ACTIVA' | 'INACTIVA')
                  }
                  className="w-full h-11 px-3 rounded-lg border border-[#CBD5E1] text-sm bg-white"
                >
                  <option value="ACTIVA">Activa (Visible en vitrina)</option>
                  <option value="INACTIVA">Inactiva (Oculta)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#ebebeb]">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="h-12 px-5 rounded-xl border border-[#ebebeb] text-sm sm:text-base font-bold text-[#332f2d] hover:bg-[#f2f4f5] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingForm}
                  className="h-12 px-6 rounded-xl bg-[#5433eb] hover:bg-[#4524db] text-white text-base font-bold inline-flex items-center gap-2.5 shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer"
                >
                  {savingForm && <Loader2 className="w-5 h-5 animate-spin" />}
                  <span>Guardar categoría</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
