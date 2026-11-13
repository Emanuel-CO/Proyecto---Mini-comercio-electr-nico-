import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  Loader2,
  Lock,
  Minus,
  Plus,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { formatCOP, PAYMENT_METHOD_LABELS } from '../lib/format';
import type {
  CartCalculation,
  CartItem,
  Order,
  PaymentMethod,
  User,
} from '../types';
import { AuthPanel } from './AuthModal';
import { ProductImage } from './ProductImage';

interface CheckoutViewProps {
  user: User | null;
  cart: CartItem[];
  calculation: CartCalculation | null;
  onUpdateQty: (productoId: number, nextQty: number) => void;
  onRemoveItem: (productoId: number) => void;
  onAuthenticated: (user: User) => void;
  onOrderCompleted: (order: Order) => void;
  onBackToCatalog: () => void;
}

const STEPS = [
  { num: 1, label: 'Carrito' },
  { num: 2, label: 'Datos y Envío' },
  { num: 3, label: 'Pago' },
  { num: 4, label: 'Confirmación' },
];

export function CheckoutView({
  user,
  cart,
  calculation,
  onUpdateQty,
  onRemoveItem,
  onAuthenticated,
  onOrderCompleted,
  onBackToCatalog,
}: CheckoutViewProps) {
  const [step, setStep] = useState<number>(1);
  const [direccionEntrega, setDireccionEntrega] = useState(
    user?.direccionEnvio ?? ''
  );
  const [telefonoContacto, setTelefonoContacto] = useState(
    user?.telefono ?? ''
  );
  const [metodoPago, setMetodoPago] =
    useState<PaymentMethod>('CONTRAENTREGA');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Precargar datos del perfil cuando el usuario inicia sesión o actualiza perfil
  useEffect(() => {
    if (user) {
      if (!direccionEntrega) setDireccionEntrega(user.direccionEnvio);
      if (!telefonoContacto) setTelefonoContacto(user.telefono);
    }
  }, [user]);

  if (!calculation || calculation.items.length === 0) {
    return (
      <main className="max-w-[900px] mx-auto px-4 sm:px-8 py-14 text-center">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10">
          <h1 className="text-xl font-bold text-[#0F172A]">
            No hay productos en tu carrito
          </h1>
          <p className="text-sm text-[#64748B] mt-2 mb-6">
            Para acceder al flujo de Checkout en 4 pasos primero agrega al menos un artículo disponible.
          </p>
          <button
            type="button"
            onClick={onBackToCatalog}
            className="px-5 py-2.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold cursor-pointer"
          >
            Ir al catálogo
          </button>
        </div>
      </main>
    );
  }

  const handleConfirmOrder = async () => {
    setError(null);
    if (!user) {
      setStep(2);
      setError('Inicia sesión o regístrate para confirmar tu compra.');
      return;
    }
    if (!direccionEntrega.trim() || !telefonoContacto.trim()) {
      setStep(2);
      setError('Completa la dirección de entrega y teléfono de contacto.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.checkout({
        items: cart,
        direccionEntrega: direccionEntrega.trim(),
        telefonoContacto: telefonoContacto.trim(),
        metodoPago,
      });
      onOrderCompleted(res.pedido);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error al procesar la transacción. Intenta nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#475569] hover:text-[#0F172A] mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Seguir comprando
          </button>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Finalizar compra segura
          </h1>
        </div>
      </div>

      {/* Stepper de 4 Pasos (Mercado Trust Design System) */}
      <nav
        aria-label="Progreso del checkout"
        className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5"
      >
        <ol className="grid grid-cols-4 gap-2 sm:gap-4 items-center">
          {STEPS.map((s, index) => {
            const completed = step > s.num;
            const active = step === s.num;
            return (
              <li key={s.num} className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  disabled={s.num > step}
                  onClick={() => s.num < step && setStep(s.num)}
                  className={`flex items-center gap-2.5 text-left w-full ${
                    s.num <= step ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      completed
                        ? 'bg-[#D1FAE5] text-[#059669]'
                        : active
                        ? 'bg-[#059669] text-white'
                        : 'bg-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    {completed ? <Check className="w-4 h-4" strokeWidth={2.5} /> : s.num}
                  </span>
                  <span
                    className={`text-xs sm:text-sm truncate ${
                      active
                        ? 'font-bold text-[#0F172A]'
                        : completed
                        ? 'font-semibold text-[#065F46]'
                        : 'font-medium text-[#64748B]'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`hidden sm:block flex-1 h-[2px] ${
                      step > s.num ? 'bg-[#059669]' : 'bg-[#E2E8F0]'
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] text-sm font-medium"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna izquierda: Contenido del paso activo */}
        <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8">
          {/* PASO 1: REVISIÓN DE CARRITO */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">
                  1. Revisa los productos de tu pedido
                </h2>
                <p className="text-sm text-[#64748B] mt-1">
                  Verifica cantidades antes de confirmar tu dirección de entrega.
                </p>
              </div>

              <div className="divide-y divide-[#E2E8F0]">
                {calculation.items.map((item) => (
                  <div
                    key={item.productoId}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-[#F1F5F9] overflow-hidden border border-[#E2E8F0] shrink-0">
                        <ProductImage
                          src={item.imagenUrl}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#0F172A]">
                          {item.nombre}
                        </h3>
                        <p className="text-xs text-[#64748B] tabular-nums mt-0.5">
                          {formatCOP(item.precioUnitario)} c/u · Disponibles:{' '}
                          {item.stockDisponible}
                        </p>
                        {item.advertencia && (
                          <p className="text-xs font-medium text-[#92400E] mt-1">
                            {item.advertencia}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="inline-flex items-center border border-[#CBD5E1] rounded-lg">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQty(item.productoId, item.cantidadSolicitada - 1)
                          }
                          className="w-9 h-9 flex items-center justify-center hover:bg-[#F1F5F9] rounded-l-lg cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-9 text-center text-xs font-bold tabular-nums">
                          {item.cantidadSolicitada}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQty(item.productoId, item.cantidadSolicitada + 1)
                          }
                          className="w-9 h-9 flex items-center justify-center hover:bg-[#F1F5F9] rounded-r-lg cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-bold text-[#0F172A] tabular-nums min-w-[100px] text-right">
                        {formatCOP(item.subtotalLinea)}
                      </span>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.productoId)}
                        className="p-2 text-[#94A3B8] hover:text-[#BA1A1A] cursor-pointer"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={calculation.tieneProblemasStock}
                  onClick={() => {
                    setError(null);
                    setStep(2);
                  }}
                  className="h-11 px-6 rounded-lg bg-[#059669] hover:bg-[#047857] disabled:bg-[#CBD5E1] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Continuar a Datos y Envío</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: DATOS Y ENVÍO (O INTERCEPCIÓN DE LOGIN) */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">
                  2. Datos de contacto y entrega
                </h2>
                <p className="text-sm text-[#64748B] mt-1">
                  {user
                    ? 'Tus datos predeterminados se han precargado automáticamente.'
                    : 'Inicia sesión o crea tu cuenta para continuar con el envío.'}
                </p>
              </div>

              {!user ? (
                <div className="pt-2">
                  <AuthPanel
                    embedded
                    initialMode="login"
                    onSuccess={(loggedUser) => {
                      onAuthenticated(loggedUser);
                      setDireccionEntrega(loggedUser.direccionEnvio);
                      setTelefonoContacto(loggedUser.telefono);
                      setError(null);
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-[#64748B] block">
                        Comprador autenticado
                      </span>
                      <span className="text-sm font-bold text-[#0F172A]">
                        {user.nombresCompletos} · {user.correo}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[#065F46] bg-[#D1FAE5] px-2.5 py-1 rounded-full">
                      Sesión verificada
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                      Dirección completa de entrega *
                    </label>
                    <input
                      type="text"
                      required
                      value={direccionEntrega}
                      onChange={(e) => setDireccionEntrega(e.target.value)}
                      placeholder="Ej. Calle 18 # 32-14 Barrio Altico, Neiva"
                      className="w-full h-11 px-3.5 rounded-lg border border-[#CBD5E1] text-sm text-[#0F172A] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/15"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                      Teléfono de contacto para el domiciliario *
                    </label>
                    <input
                      type="tel"
                      required
                      value={telefonoContacto}
                      onChange={(e) => setTelefonoContacto(e.target.value)}
                      placeholder="Ej. 315 742 3319"
                      className="w-full h-11 px-3.5 rounded-lg border border-[#CBD5E1] text-sm text-[#0F172A] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/15"
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="h-11 px-4 rounded-lg border border-[#E2E8F0] text-sm font-semibold text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!direccionEntrega.trim() || !telefonoContacto.trim()) {
                          setError(
                            'Por favor completa la dirección de entrega y el teléfono.'
                          );
                          return;
                        }
                        setError(null);
                        setStep(3);
                      }}
                      className="h-11 px-6 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continuar al Pago</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: MÉTODO DE PAGO DECLARATIVO */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">
                  3. Selecciona el método de pago
                </h2>
                <p className="text-sm text-[#64748B] mt-1">
                  Elige cómo deseas pagar tu pedido al confirmar la orden.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'CONTRAENTREGA' as PaymentMethod,
                    title: 'Pago Contraentrega (Efectivo o Datáfono)',
                    desc: 'Pagas al recibir el pedido en tu dirección. Sin recargos adicionales.',
                    icon: Banknote,
                  },
                  {
                    id: 'TRANSFERENCIA_NEQUI_PSE' as PaymentMethod,
                    title: 'Transferencia Nequi / PSE',
                    desc: 'Reserva inmediata de inventario; realiza la transferencia con el código de orden.',
                    icon: Smartphone,
                  },
                  {
                    id: 'TARJETA_DEMO' as PaymentMethod,
                    title: 'Tarjeta Crédito o Débito (Simulación Demo)',
                    desc: 'Aprobación instantánea en estado Pagado para demostración transaccional.',
                    icon: CreditCard,
                  },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const selected = metodoPago === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                        selected
                          ? 'border-[#059669] bg-[#F5FFF7]'
                          : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="metodoPago"
                        checked={selected}
                        onChange={() => setMetodoPago(opt.id)}
                        className="mt-1 w-4 h-4 text-[#059669] focus:ring-[#059669]"
                      />
                      <Icon
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          selected ? 'text-[#059669]' : 'text-[#64748B]'
                        }`}
                      />
                      <div>
                        <span className="block text-sm font-bold text-[#0F172A]">
                          {opt.title}
                        </span>
                        <span className="block text-xs text-[#475569] mt-0.5">
                          {opt.desc}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="h-11 px-4 rounded-lg border border-[#E2E8F0] text-sm font-semibold text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="h-11 px-6 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Revisar confirmación</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 4: CONFIRMACIÓN TRANSACCIONAL ACID */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">
                  4. Confirmar pedido
                </h2>
                <p className="text-sm text-[#64748B] mt-1">
                  Al confirmar, el servidor verificará el stock real, descontará las unidades bajo transacción atómica y generará tu comprobante PDF.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Entrega a domicilio
                  </span>
                  <p className="text-sm font-bold text-[#0F172A] mt-1">
                    {user?.nombresCompletos}
                  </p>
                  <p className="text-sm text-[#475569] mt-0.5">
                    {direccionEntrega}
                  </p>
                  <p className="text-xs text-[#64748B] mt-1">
                    Tel: {telefonoContacto}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Método de pago elegido
                  </span>
                  <p className="text-sm font-bold text-[#0F172A] mt-1">
                    {PAYMENT_METHOD_LABELS[metodoPago]}
                  </p>
                  <p className="text-xs text-[#065F46] mt-1 font-medium">
                    Precio verificado en base de datos en COP
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setStep(3)}
                  className="h-11 px-4 rounded-lg border border-[#E2E8F0] text-sm font-semibold text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
                >
                  Cambiar pago
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmOrder}
                  className="h-11 px-7 rounded-lg bg-[#059669] hover:bg-[#047857] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span>
                    {submitting
                      ? 'Procesando transacción...'
                      : `Confirmar pedido · ${formatCOP(calculation.total)}`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: Resumen financiero */}
        <aside className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 lg:sticky lg:top-24">
          <h2 className="text-base font-bold text-[#0F172A]">
            Resumen de la orden
          </h2>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {calculation.items.map((item) => (
              <div
                key={item.productoId}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[#0F172A] truncate">
                    {item.nombre}
                  </p>
                  <p className="text-xs text-[#64748B] tabular-nums">
                    {item.cantidadSolicitada} × {formatCOP(item.precioUnitario, false)}
                  </p>
                </div>
                <span className="font-semibold text-[#0F172A] tabular-nums shrink-0">
                  {formatCOP(item.subtotalLinea, false)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] space-y-2 text-sm">
            <div className="flex justify-between text-[#475569]">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium text-[#0F172A]">
                {formatCOP(calculation.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#475569]">
              <span>Envío</span>
              <span className="tabular-nums font-medium text-[#0F172A]">
                {calculation.costoEnvio === 0
                  ? 'Gratis'
                  : formatCOP(calculation.costoEnvio)}
              </span>
            </div>
            <div className="pt-3 border-t border-[#E2E8F0] flex justify-between items-baseline">
              <span className="font-bold text-[#0F172A]">Total a pagar</span>
              <span className="text-xl font-extrabold text-[#0F172A] tabular-nums">
                {formatCOP(calculation.total)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
