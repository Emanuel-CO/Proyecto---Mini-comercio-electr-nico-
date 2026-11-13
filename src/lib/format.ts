import type { OrderStatus, PaymentMethod } from '../types';

export function formatCOP(amount: number, includeSuffix = true): string {
  const rounded = Math.round(Number.isFinite(amount) ? amount : 0);
  const formatted = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);
  return includeSuffix ? `$\u00A0${formatted}\u00A0COP` : `$\u00A0${formatted}`;
}

export function formatDateTimeCO(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDateShortCO(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  PENDIENTE: {
    label: 'Pendiente',
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#92400E]',
    border: 'border-[#FDE68A]',
  },
  PAGADO: {
    label: 'Pagado',
    bg: 'bg-[#DBEAFE]',
    text: 'text-[#1E40AF]',
    border: 'border-[#BFDBFE]',
  },
  ENVIADO: {
    label: 'Enviado',
    bg: 'bg-[#E0E7FF]',
    text: 'text-[#3730A3]',
    border: 'border-[#C7D2FE]',
  },
  ENTREGADO: {
    label: 'Entregado',
    bg: 'bg-[#D1FAE5]',
    text: 'text-[#065F46]',
    border: 'border-[#A7F3D0]',
  },
  CANCELADO: {
    label: 'Cancelado',
    bg: 'bg-[#FEE2E2]',
    text: 'text-[#991B1B]',
    border: 'border-[#FECACA]',
  },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CONTRAENTREGA: 'Pago Contraentrega (Efectivo / Datáfono)',
  TRANSFERENCIA_NEQUI_PSE: 'Transferencia Nequi / PSE',
  TARJETA_DEMO: 'Tarjeta Crédito o Débito (Demo)',
};
