import { ArrowLeft, CheckCircle2, ClipboardList, Printer } from 'lucide-react';
import {
  formatCOP,
  formatDateTimeCO,
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABELS,
} from '../lib/format';
import type { Order } from '../types';

interface ReceiptViewProps {
  order: Order;
  onBackToCatalog: () => void;
  onGoToOrders: () => void;
  isAdmin?: boolean;
}

export function ReceiptView({
  order,
  onBackToCatalog,
  onGoToOrders,
  isAdmin = false,
}: ReceiptViewProps) {
  const statusMeta = ORDER_STATUS_META[order.estado];

  return (
    <main className="max-w-[860px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#475569] hover:text-[#0F172A] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo
        </button>

        <div className="flex items-center gap-3">
          {!isAdmin && (
            <button
              type="button"
              onClick={onGoToOrders}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-sm font-semibold text-[#0F172A] cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              Mis pedidos
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Exportar PDF
          </button>
        </div>
      </div>

      {/* Documento imprimible */}
      <article className="print-only-clean bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
          <div>
            <div className="inline-flex items-center gap-2 text-[#059669] text-sm font-semibold mb-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Comprobante digital de compra</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Mercado Trust
            </h1>
            <p className="text-xs text-[#64748B] mt-1">
              Comercio Local · Neiva, Huila, Colombia
            </p>
          </div>

          <div className="sm:text-right space-y-1.5">
            <div className="text-xs font-semibold text-[#64748B]">
              Código de orden
            </div>
            <div className="text-lg font-bold font-mono text-[#0F172A] tabular-nums">
              {order.codigoOrden}
            </div>
            <span
              className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
            >
              {statusMeta.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="block text-xs font-semibold text-[#64748B] mb-1">
              Fecha de emisión
            </span>
            <span className="font-medium text-[#0F172A]">
              {formatDateTimeCO(order.fechaPedido)}
            </span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-[#64748B] mb-1">
              Cliente y entrega
            </span>
            <p className="font-semibold text-[#0F172A]">
              {order.clienteNombre}
            </p>
            <p className="text-[#475569]">{order.direccionEntrega}</p>
            <p className="text-xs text-[#64748B]">Tel: {order.telefonoContacto}</p>
          </div>
          <div>
            <span className="block text-xs font-semibold text-[#64748B] mb-1">
              Método de pago
            </span>
            <span className="font-medium text-[#0F172A]">
              {PAYMENT_METHOD_LABELS[order.metodoPago]}
            </span>
          </div>
        </div>

        {/* Tabla inmutable de ítems */}
        <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#475569]">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4 text-right">Cant.</th>
                <th className="py-3 px-4 text-right">Precio Unit.</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3.5 px-4 font-mono text-xs text-[#64748B]">
                    {item.productoSku}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#0F172A]">
                    {item.productoNombre}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums">
                    {item.cantidad}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-[#475569]">
                    {formatCOP(item.precioUnitarioHistorico)}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-[#0F172A]">
                    {formatCOP(item.subtotalLinea)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full sm:w-72 space-y-2 text-sm">
            <div className="flex justify-between text-[#475569]">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium text-[#0F172A]">
                {formatCOP(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#475569]">
              <span>Envío local</span>
              <span className="tabular-nums font-medium text-[#0F172A]">
                {order.costoEnvio === 0 ? 'Gratis' : formatCOP(order.costoEnvio)}
              </span>
            </div>
            <div className="pt-3 border-t border-[#E2E8F0] flex justify-between items-baseline">
              <span className="font-bold text-[#0F172A]">Total pagado</span>
              <span className="text-xl font-extrabold text-[#0F172A] tabular-nums">
                {formatCOP(order.total)}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#64748B] pt-4 border-t border-[#E2E8F0]">
          Documento de soporte comercial generado con precios históricos inmutables al momento de la transacción.
        </p>
      </article>
    </main>
  );
}
