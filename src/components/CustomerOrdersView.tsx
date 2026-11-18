import { useEffect, useState } from 'react';
import {
  FileText,
  Loader2,
  PackageOpen,
  RotateCcw,
  ShoppingBag,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import {
  formatCOP,
  formatDateTimeCO,
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABELS,
} from '../lib/format';
import type { Order } from '../types';

interface CustomerOrdersViewProps {
  onViewReceipt: (order: Order) => void;
  onGoToCatalog: () => void;
  onOrderCancelled: () => void;
}

export function CustomerOrdersView({
  onViewReceipt,
  onGoToCatalog,
  onOrderCancelled,
}: CustomerOrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMyOrders();
      setOrders(res.pedidos);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No se pudo cargar tu historial.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancelOrder = async (orderId: number) => {
    setCancellingId(orderId);
    setError(null);
    setFeedback(null);
    try {
      const res = await api.cancelMyOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? res.pedido : o))
      );
      setConfirmCancelId(null);
      setFeedback(
        `El pedido ${res.pedido.codigoOrden} fue cancelado y sus unidades regresaron al inventario disponible.`
      );
      onOrderCancelled();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No fue posible cancelar el pedido.'
      );
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <main className="max-w-[1040px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Mis pedidos
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Consulta el estado de despacho y descarga tus comprobantes digitales.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToCatalog}
          className="h-11 px-5 rounded-xl border border-[#ebebeb] bg-white hover:bg-[#f2f4f5] text-sm font-bold text-[#332f2d] shadow-xs cursor-pointer transition-all"
        >
          Explorar catálogo
        </button>
      </div>

      {feedback && (
        <div className="px-4 py-3 rounded-lg bg-[#D1FAE5] border border-[#A7F3D0] text-[#065F46] text-sm font-medium">
          {feedback}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] text-sm font-medium"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E2E8F0] rounded-xl p-6 animate-pulse space-y-3"
            >
              <div className="h-5 w-48 bg-[#E2E8F0] rounded" />
              <div className="h-4 w-72 bg-[#F1F5F9] rounded" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl py-16 px-6 text-center">
          <PackageOpen className="w-11 h-11 text-[#94A3B8] mx-auto mb-3" strokeWidth={1.5} />
          <h2 className="text-lg font-bold text-[#0F172A]">
            Aún no has realizado ningún pedido
          </h2>
          <p className="text-sm text-[#64748B] mt-1 mb-6 max-w-md mx-auto">
            Cuando confirmes tu primera compra, aquí verás el seguimiento y comprobante digital.
          </p>
          <button
            type="button"
            onClick={onGoToCatalog}
            className="inline-flex items-center gap-2.5 h-12 px-6 rounded-xl bg-[#5433eb] hover:bg-[#4524db] text-white text-base font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            Ir al catálogo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const meta = ORDER_STATUS_META[order.estado];
            const canCancel = order.estado === 'PENDIENTE';
            return (
              <article
                key={order.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-[#0F172A]">
                        {order.codigoOrden}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      {formatDateTimeCO(order.fechaPedido)} ·{' '}
                      {PAYMENT_METHOD_LABELS[order.metodoPago]}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="block text-xs text-[#64748B]">Total</span>
                    <span className="text-lg font-extrabold text-[#0F172A] tabular-nums">
                      {formatCOP(order.total)}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-[#475569] space-y-1">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="truncate">
                        {item.cantidad} × {item.productoNombre}
                      </span>
                      <span className="tabular-nums font-medium text-[#0F172A] shrink-0">
                        {formatCOP(item.subtotalLinea)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-[#64748B]">
                    Entrega: {order.direccionEntrega}
                  </span>

                  <div className="flex flex-wrap items-center gap-3">
                    {canCancel && confirmCancelId !== order.id && (
                      <button
                        type="button"
                        onClick={() => setConfirmCancelId(order.id)}
                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-sm font-bold text-[#991B1B] cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Cancelar pedido
                      </button>
                    )}

                    {canCancel && confirmCancelId === order.id && (
                      <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-2 rounded-xl">
                        <span className="text-sm font-bold text-[#991B1B]">
                          ¿Confirmar cancelación?
                        </span>
                        <button
                          type="button"
                          disabled={cancellingId === order.id}
                          onClick={() => handleCancelOrder(order.id)}
                          className="h-8 px-3 rounded-lg bg-[#BA1A1A] hover:bg-[#991B1B] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {cancellingId === order.id && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                          Sí, cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmCancelId(null)}
                          className="h-8 px-3 rounded-lg text-xs font-bold text-[#787574] hover:bg-white cursor-pointer transition-colors"
                        >
                          No
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => onViewReceipt(order)}
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#332f2d] hover:bg-[#000000] text-white text-sm font-bold shadow-xs cursor-pointer transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Ver comprobante
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
