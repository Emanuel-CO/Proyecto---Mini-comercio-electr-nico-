import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatCOP } from '../lib/format';
import type { CartCalculation } from '../types';
import { ProductImage } from './ProductImage';

interface CartDrawerProps {
  open: boolean;
  calculation: CartCalculation | null;
  loading: boolean;
  onClose: () => void;
  onUpdateQty: (productoId: number, nextQty: number) => void;
  onRemoveItem: (productoId: number) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  open,
  calculation,
  loading,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
}: CartDrawerProps) {
  if (!open) return null;

  const items = calculation?.items ?? [];
  const isEmpty = items.length === 0;
  const remainingForFreeShipping = calculation
    ? Math.max(0, calculation.umbralEnvioGratis - calculation.subtotal)
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0F172A]/45 backdrop-blur-[2px] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Carrito de compras"
    >
      <div className="bg-white w-full max-w-md h-full flex flex-col border-l border-[#E2E8F0] shadow-2xl">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">
              Tu carrito de compras
            </h2>
            <p className="text-xs text-[#64748B]">
              {isEmpty
                ? 'Sin artículos seleccionados'
                : `${items.reduce((acc, i) => acc + i.cantidadSolicitada, 0)} unidades · Cálculo validado en servidor`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de envío gratis */}
        {!isEmpty && calculation && (
          <div className="px-6 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
            {remainingForFreeShipping === 0 ? (
              <p className="text-xs font-semibold text-[#065F46]">
                ¡Genial! Tu pedido incluye envío local gratis.
              </p>
            ) : (
              <p className="text-xs text-[#475569]">
                Te faltan{' '}
                <strong className="text-[#0F172A] tabular-nums">
                  {formatCOP(remainingForFreeShipping)}
                </strong>{' '}
                para obtener envío gratis.
              </p>
            )}
          </div>
        )}

        {/* Lista de ítems */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isEmpty ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-11 h-11 text-[#94A3B8] mb-3" strokeWidth={1.5} />
              <h3 className="text-base font-bold text-[#0F172A]">
                Tu carrito está vacío
              </h3>
              <p className="text-sm text-[#64748B] mt-1 mb-6 max-w-xs">
                Agrega productos desde el catálogo para calcular el total y confirmar tu pedido.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="h-12 px-6 rounded-xl bg-[#5433eb] hover:bg-[#4524db] text-white text-base font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Volver al catálogo
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productoId}
                className="flex gap-4 pb-4 border-b border-[#E2E8F0] last:border-b-0"
              >
                <div className="w-20 h-20 rounded-lg bg-[#F1F5F9] overflow-hidden shrink-0 border border-[#E2E8F0]">
                  <ProductImage
                    src={item.imagenUrl}
                    alt={item.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-[#0F172A] line-clamp-1">
                      {item.nombre}
                    </h4>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.productoId)}
                      aria-label={`Quitar ${item.nombre}`}
                      className="text-[#787574] hover:text-[#BA1A1A] hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-[#787574] tabular-nums mt-0.5">
                    {formatCOP(item.precioUnitario)} c/u · Disp: {item.stockDisponible}
                  </p>

                  {item.advertencia && (
                    <p className="text-xs font-semibold text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-1 rounded-lg mt-1.5">
                      {item.advertencia}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center border border-[#ebebeb] rounded-xl bg-white shadow-xs">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQty(item.productoId, item.cantidadSolicitada - 1)
                        }
                        aria-label="Restar unidad"
                        className="w-10 h-10 flex items-center justify-center text-[#332f2d] hover:bg-[#f2f4f5] rounded-l-xl cursor-pointer text-sm font-bold transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-extrabold tabular-nums">
                        {item.cantidadSolicitada}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQty(item.productoId, item.cantidadSolicitada + 1)
                        }
                        aria-label="Sumar unidad"
                        className="w-10 h-10 flex items-center justify-center text-[#332f2d] hover:bg-[#f2f4f5] rounded-r-xl cursor-pointer text-sm font-bold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-base font-extrabold text-[#332f2d] tabular-nums">
                      {formatCOP(item.subtotalLinea)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer de totales */}
        {!isEmpty && calculation && (
          <div className="p-6 border-t border-[#ebebeb] bg-[#f2f4f5] space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[#787574]">
                <span>Subtotal</span>
                <span className="tabular-nums font-bold text-[#332f2d]">
                  {formatCOP(calculation.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-[#787574]">
                <span>Envío local</span>
                <span className="tabular-nums font-bold text-[#332f2d]">
                  {calculation.costoEnvio === 0
                    ? 'Gratis'
                    : formatCOP(calculation.costoEnvio)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#ebebeb] flex justify-between items-baseline">
                <span className="font-bold text-[#332f2d] text-base">Total estimado</span>
                <span className="text-2xl font-black text-[#5433eb] tabular-nums">
                  {loading ? 'Calculando...' : formatCOP(calculation.total)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                disabled={calculation.tieneProblemasStock || loading}
                onClick={onProceedToCheckout}
                className="w-full h-14 rounded-xl bg-[#5433eb] hover:bg-[#4524db] disabled:bg-[#ebebeb] disabled:text-[#acb0aa] disabled:cursor-not-allowed text-white text-base font-bold inline-flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
              >
                <span>Proceder al Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onClearCart}
                className="w-full py-2.5 text-sm font-bold text-[#787574] hover:text-[#BA1A1A] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
