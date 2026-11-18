import { useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, Save } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { User } from '../types';

interface ProfileViewProps {
  user: User;
  onUpdated: (user: User) => void;
}

export function ProfileView({ user, onUpdated }: ProfileViewProps) {
  const [nombresCompletos, setNombresCompletos] = useState(
    user.nombresCompletos
  );
  const [telefono, setTelefono] = useState(user.telefono);
  const [direccionEnvio, setDireccionEnvio] = useState(user.direccionEnvio);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const res = await api.updateProfile({
        nombresCompletos,
        telefono,
        direccionEnvio,
        passwordActual: passwordNueva ? passwordActual : undefined,
        passwordNueva: passwordNueva || undefined,
      });
      onUpdated(res.usuario);
      setPasswordActual('');
      setPasswordNueva('');
      setSuccess(
        'Perfil actualizado correctamente. Tus datos se precargarán en tu próximo checkout.'
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No fue posible actualizar tu perfil.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-[760px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
          Mi perfil y dirección de entrega
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Mantén actualizados tus datos de envío para agilizar tus compras en 4 pasos.
        </p>
      </div>

      {success && (
        <div className="px-4 py-3 rounded-lg bg-[#D1FAE5] border border-[#A7F3D0] text-[#065F46] text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
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

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-[#E2E8F0]">
          <div>
            <span className="block text-xs font-semibold text-[#64748B]">
              Correo registrado
            </span>
            <span className="text-sm font-semibold text-[#0F172A]">
              {user.correo}
            </span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-[#64748B]">
              Rol en la plataforma
            </span>
            <span className="text-sm font-semibold text-[#0F172A]">
              {user.rol === 'ADMIN' ? 'Administrador' : 'Cliente'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
              Nombres y apellidos
            </label>
            <input
              type="text"
              required
              value={nombresCompletos}
              onChange={(e) => setNombresCompletos(e.target.value)}
              className="w-full h-11 px-3.5 rounded-lg border border-[#CBD5E1] text-sm text-[#0F172A] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/15"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Teléfono de contacto
              </label>
              <input
                type="tel"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-[#CBD5E1] text-sm text-[#0F172A] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/15"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Dirección predeterminada
              </label>
              <input
                type="text"
                required
                value={direccionEnvio}
                onChange={(e) => setDireccionEnvio(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-[#CBD5E1] text-sm text-[#0F172A] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/15"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E2E8F0] space-y-4">
          <h2 className="text-sm font-bold text-[#0F172A]">
            Cambiar contraseña (opcional)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Contraseña actual
              </label>
              <input
                type="password"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                placeholder="Requerida solo si cambias clave"
                className="w-full h-11 px-3.5 rounded-lg border border-[#CBD5E1] text-sm text-[#0F172A] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/15"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Nueva contraseña
              </label>
              <input
                type="password"
                minLength={8}
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full h-11 px-3.5 rounded-lg border border-[#CBD5E1] text-sm text-[#0F172A] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/15"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="h-13 px-8 rounded-xl bg-[#5433eb] hover:bg-[#4524db] disabled:opacity-60 text-white text-base font-bold inline-flex items-center gap-2.5 shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>Guardar cambios</span>
          </button>
        </div>
      </form>
    </main>
  );
}
