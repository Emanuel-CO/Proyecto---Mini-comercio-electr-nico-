import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileText,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import { formatCOP } from '../lib/format';
import { HERO_IMAGE } from '../lib/imageRegistry';
import type { CartItem, Category, Product } from '../types';
import { ProductImage } from './ProductImage';

interface StorefrontViewProps {
  products: Product[];
  categories: Category[];
  loading: boolean;
  searchQuery: string;
  selectedCategoryId: number | null;
  sortBy: string;
  cart: CartItem[];
  onSearchChange: (q: string) => void;
  onCategoryChange: (id: number | null) => void;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
  onAddToCart: (product: Product, qty?: number) => void;
  onGoToOrders: () => void;
}

export function StorefrontView({
  products,
  categories,
  loading,
  searchQuery,
  selectedCategoryId,
  sortBy,
  cart,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onClearFilters,
  onAddToCart,
  onGoToOrders,
}: StorefrontViewProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(1);

  const getCartQty = (productId: number) =>
    cart.find((c) => c.productoId === productId)?.cantidad ?? 0;

  const openDetail = (product: Product) => {
    setSelectedProduct(product);
    setModalQty(1);
  };

  const renderStockStatus = (stock: number) => {
    if (stock <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#991B1B] bg-[#FEE2E2] border border-[#FECACA] px-2.5 py-0.5 rounded-full">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          Agotado
        </span>
      );
    }
    if (stock <= 5) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-0.5 rounded-full">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Últimas {stock} uds
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#065F46] bg-[#D1FAE5] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        En stock ({stock})
      </span>
    );
  };

  return (
    <main className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-10">
      {/* Sección 1: Hero comercial en split equilibrado */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
            <p className="text-xs font-semibold tracking-wide text-[#059669] mb-3">
              Comercio local verificado · Neiva y envíos nacionales
            </p>
            <h1 className="text-[clamp(1.85rem,3.4vw,2.75rem)] font-extrabold text-[#0F172A] leading-[1.14] tracking-[-0.02em] text-balance mb-4">
              Compra directa con inventario real y precios claros en pesos
            </h1>
            <p className="text-[15px] sm:text-base text-[#475569] leading-relaxed max-w-xl mb-7">
              Explora productos seleccionados de origen huilense, tecnología y diseño cotidiano. Verifica disponibilidad al instante y finaliza tu pedido en 4 pasos con comprobante digital inmediato.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#catalogo-vitrina"
                className="inline-flex items-center gap-2.5 h-12 px-6 rounded-xl bg-[#5433eb] hover:bg-[#4524db] text-white text-base font-bold whitespace-nowrap transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                <span>Explorar catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={onGoToOrders}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl border border-[#ebebeb] bg-white hover:bg-[#f2f4f5] text-[#332f2d] text-base font-bold whitespace-nowrap transition-all shadow-xs hover:shadow-sm cursor-pointer"
              >
                <span>Consultar mis pedidos</span>
              </button>
            </div>
          </div>
          <div className="lg:col-span-6 min-h-[260px] lg:min-h-[390px] bg-[#F1F5F9]">
            <img
              src={HERO_IMAGE}
              alt="Selección de café especial del Huila, audífonos inalámbricos y marroquinería artesanal en Mercado Trust"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Franja de confianza en 4 columnas (debajo del Hero) */}
      <section
        aria-label="Garantías de compra"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Stock validado en caja
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
              Reserva atómica de inventario sin sobreventa ni sorpresas.
            </p>
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Pago flexible en COP
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
              Contraentrega, transferencia Nequi / PSE o tarjeta demo.
            </p>
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex items-start gap-3">
          <Truck className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Envío gratis desde $ 150.000
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
              Tarifa fija local de $ 8.000 COP en pedidos menores.
            </p>
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex items-start gap-3">
          <FileText className="w-5 h-5 text-[#0F172A] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Comprobante digital PDF
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
              Soporte imprimible inmediato con precios históricos fijos.
            </p>
          </div>
        </div>
      </section>

      {/* Sección 2: Vitrina comercial y filtros */}
      <section id="catalogo-vitrina" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              Catálogo disponible
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              Precios finales transparentes en pesos colombianos (COP).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-[#787574] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por nombre, SKU o categoría..."
                aria-label="Buscar productos"
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#ebebeb] bg-white text-base text-[#332f2d] focus:outline-none focus:border-[#5433eb] focus:ring-3 focus:ring-[#5433eb]/15 transition-all"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Ordenar productos"
              className="h-12 px-4 rounded-xl border border-[#ebebeb] bg-white text-sm sm:text-base font-semibold text-[#332f2d] focus:outline-none focus:border-[#5433eb] focus:ring-3 focus:ring-[#5433eb]/15 cursor-pointer transition-all"
            >
              <option value="relevancia">Orden: Destacados</option>
              <option value="precio_asc">Precio: Menor a mayor</option>
              <option value="precio_desc">Precio: Mayor a menor</option>
              <option value="nombre">Nombre: A – Z</option>
            </select>
          </div>
        </div>

        {/* Barra segmentada de categorías */}
        <div
          role="tablist"
          aria-label="Filtrar por categoría"
          className="flex items-center gap-2 p-1.5 bg-[#f2f4f5] rounded-xl overflow-x-auto border border-[#ebebeb]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategoryId === null}
            onClick={() => onCategoryChange(null)}
            className={`h-11 px-5 rounded-lg text-sm sm:text-[15px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              selectedCategoryId === null
                ? 'bg-white text-[#5433eb] shadow-sm border border-[#ebebeb]'
                : 'text-[#787574] hover:text-[#000000] hover:bg-white/50'
            }`}
          >
            Todas las categorías
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={selectedCategoryId === cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`h-11 px-5 rounded-lg text-sm sm:text-[15px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                selectedCategoryId === cat.id
                  ? 'bg-white text-[#5433eb] shadow-sm border border-[#ebebeb]'
                  : 'text-[#787574] hover:text-[#000000] hover:bg-white/50'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* Estado de carga / vacío / cuadrícula */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-[#E2E8F0]" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-28 bg-[#E2E8F0] rounded" />
                  <div className="h-5 w-3/4 bg-[#E2E8F0] rounded" />
                  <div className="h-4 w-full bg-[#F1F5F9] rounded" />
                  <div className="h-10 w-full bg-[#E2E8F0] rounded-lg mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl py-14 px-6 text-center">
            <ShoppingBag className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" strokeWidth={1.5} />
            <h3 className="text-base font-bold text-[#0F172A]">
              No se encontraron productos que coincidan con tu búsqueda
            </h3>
            <p className="text-sm text-[#64748B] mt-1 mb-5">
              Intenta con otro término o restablece los filtros activos.
            </p>
            <button
              type="button"
              onClick={onClearFilters}
              className="px-4 py-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const inCart = getCartQty(product.id);
              const outOfStock = product.stock <= 0;
              return (
                <article
                  key={product.id}
                  className="group bg-white border border-[#E2E8F0] rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_-2px_rgba(15,23,42,0.06)]"
                >
                  <button
                    type="button"
                    onClick={() => openDetail(product)}
                    className="aspect-[4/3] w-full bg-[#F1F5F9] overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#059669]"
                  >
                    <ProductImage
                      src={product.imagenUrl}
                      alt={product.nombre}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </button>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-medium text-[#64748B] truncate">
                        {product.categoriaNombre} · <span className="font-mono">{product.sku}</span>
                      </span>
                      {renderStockStatus(product.stock)}
                    </div>

                    <button
                      type="button"
                      onClick={() => openDetail(product)}
                      className="text-left text-base font-bold text-[#0F172A] hover:text-[#059669] transition-colors line-clamp-1 cursor-pointer"
                    >
                      {product.nombre}
                    </button>

                    <p className="text-sm text-[#475569] mt-1.5 line-clamp-2 flex-1 leading-relaxed">
                      {product.descripcion}
                    </p>

                    <div className="mt-5 pt-4 border-t border-[#ebebeb] flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-xs font-semibold text-[#787574]">Precio</span>
                        <span className="text-xl font-extrabold text-[#332f2d] tabular-nums tracking-tight">
                          {formatCOP(product.precio, false)}
                        </span>
                        <span className="text-xs font-bold text-[#787574] ml-1">
                          COP
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={outOfStock}
                        onClick={() => onAddToCart(product, 1)}
                        className={`h-12 px-5 rounded-xl text-sm sm:text-[15px] font-bold whitespace-nowrap shrink-0 transition-all shadow-sm hover:shadow-md active:scale-[0.98] ${
                          outOfStock
                            ? 'bg-[#f2f4f5] text-[#acb0aa] border border-[#ebebeb] cursor-not-allowed shadow-none'
                            : 'bg-[#5433eb] hover:bg-[#4524db] text-white cursor-pointer'
                        }`}
                      >
                        {outOfStock
                          ? 'Agotado'
                          : inCart > 0
                          ? `Agregar (${inCart})`
                          : 'Agregar al carrito'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal de Detalle de Producto (PDP) */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-[#0F172A]/45 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="aspect-[4/3] md:aspect-auto bg-[#F1F5F9]">
                <ProductImage
                  src={selectedProduct.imagenUrl}
                  alt={selectedProduct.nombre}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-7 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-xs font-medium text-[#64748B]">
                    {selectedProduct.categoriaNombre} ·{' '}
                    <span className="font-mono">{selectedProduct.sku}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    aria-label="Cerrar detalle"
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-xl font-bold text-[#0F172A] mt-2">
                  {selectedProduct.nombre}
                </h3>

                <div className="mt-3 flex items-center gap-3">
                  <span className="text-2xl font-extrabold text-[#0F172A] tabular-nums">
                    {formatCOP(selectedProduct.precio)}
                  </span>
                  {renderStockStatus(selectedProduct.stock)}
                </div>

                <p className="text-sm text-[#475569] leading-relaxed mt-4 flex-1">
                  {selectedProduct.descripcion}
                </p>

                <div className="mt-6 pt-5 border-t border-[#ebebeb] space-y-4">
                  {selectedProduct.stock > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#332f2d]">
                        Cantidad
                      </span>
                      <div className="inline-flex items-center border border-[#ebebeb] rounded-xl bg-white shadow-xs">
                        <button
                          type="button"
                          onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                          className="w-12 h-12 flex items-center justify-center text-[#332f2d] hover:bg-[#f2f4f5] rounded-l-xl cursor-pointer text-base font-bold transition-colors"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center text-base font-extrabold tabular-nums">
                          {modalQty}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setModalQty((q) =>
                              Math.min(selectedProduct.stock, q + 1)
                            )
                          }
                          className="w-12 h-12 flex items-center justify-center text-[#332f2d] hover:bg-[#f2f4f5] rounded-r-xl cursor-pointer text-base font-bold transition-colors"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={selectedProduct.stock <= 0}
                    onClick={() => {
                      onAddToCart(selectedProduct, modalQty);
                      setSelectedProduct(null);
                    }}
                    className={`w-full h-14 rounded-xl text-base sm:text-lg font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 ${
                      selectedProduct.stock <= 0
                        ? 'bg-[#f2f4f5] text-[#acb0aa] border border-[#ebebeb] cursor-not-allowed shadow-none'
                        : 'bg-[#5433eb] hover:bg-[#4524db] text-white cursor-pointer'
                    }`}
                  >
                    {selectedProduct.stock <= 0
                      ? 'Producto agotado'
                      : `Agregar al carrito · ${formatCOP(selectedProduct.precio * modalQty)}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
