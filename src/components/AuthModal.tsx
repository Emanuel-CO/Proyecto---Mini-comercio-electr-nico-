import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Loader2, ShieldCheck, X } from 'lucide-react';
import { api, ApiError, setStoredToken } from '../lib/api';
import type { User } from '../types';

interface AuthPanelProps {
  initialMode?: 'login' | 'register';
  onSuccess: (user: User) => void;
  onClose?: () => void;
  embedded?: boolean;
}

export function AuthPanel({
  initialMode = 'login',
  onSuccess,
  onClose,
  embedded = false,
}: AuthPanelProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  // Login fields
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');

  // Register extra fields
  const [nombresCompletos, setNombresCompletos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccionEnvio, setDireccionEnvio] = useState('');
  const [aceptaPoliticaDatos, setAceptaPoliticaDatos] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.login(correo, password);
        setStoredToken(res.token);
        onSuccess(res.usuario);
      } else {
        if (!aceptaPoliticaDatos) {
          setError(
            'Debes aceptar el tratamiento de datos personales conforme a la Ley 1581 de 2012.'
          );
          setLoading(false);
          return;
        }
        const res = await api.register({
          nombresCompletos,
          correo,
          password,
          telefono,
          direccionEnvio,
          aceptaPoliticaDatos,
        });
        setStoredToken(res.token);
        onSuccess(res.usuario);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('No fue posible conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'CLIENTE' | 'ADMIN') => {
    setMode('login');
    setError(null);
    if (role === 'ADMIN') {
      setCorreo('admin@mercadotrust.co');
      setPassword('Admin1234!');
    } else {
      setCorreo('camila.rojas@correo.co');
      setPassword('Cliente1234!');
    }
  };

  const content = (
    <div className={embedded ? '' : 'bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-md overflow-hidden shadow-xl'}>
      {!embedded && (
        <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta de cliente'}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Acceso protegido con cifrado y control de roles
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      <div className={embedded ? '' : 'p-6'}>
        {/* Segmented mode switch */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#F1F5F9] rounded-lg mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-[#0F172A] shadow-sm'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-[#0F172A] shadow-sm'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            Registrarme
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 px-3.5 py-2.5 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] text-xs font-medium"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Nombres y apellidos
              </label>
              <input
                type="text"
                required
                value={nombresCompletos}
                onChange={(e) => setNombresCompletos(e.target.value)}
                placeholder="Ej. Camila Rojas Trujillo"
                className="w-full h-11 px-3.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/15"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="nombre@correo.co"
              className="w-full h-11 px-3.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/15"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={mode === 'register' ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === 'register' ? 'Mínimo 8 caracteres' : '••••••••'
                }
                className="w-full h-11 pl-3.5 pr-11 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/15"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                {showPass ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Teléfono celular
                  </label>
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="315 000 0000"
                    className="w-full h-11 px-3.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Dirección de envío
                  </label>
                  <input
                    type="text"
                    required
                    value={direccionEnvio}
                    onChange={(e) => setDireccionEnvio(e.target.value)}
                    placeholder="Calle, barrio, ciudad"
                    className="w-full h-11 px-3.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/15"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={aceptaPoliticaDatos}
                  onChange={(e) => setAceptaPoliticaDatos(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#CBD5E1] text-[#059669] focus:ring-[#059669]"
                />
                <span className="text-xs text-[#475569] leading-relaxed">
                  Autorizo el tratamiento de mis datos personales conforme a la{' '}
                  <strong className="text-[#0F172A]">Ley 1581 de 2012</strong> de
                  protección de datos en Colombia.
                </span>
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-[#059669] hover:bg-[#047857] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>
              {mode === 'login' ? 'Ingresar a mi cuenta' : 'Crear cuenta y continuar'}
            </span>
          </button>
        </form>

        {/* Acceso rápido de prueba para sustentación */}
        <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] mb-2.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>Cuentas de demostración rápida</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('CLIENTE')}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-left transition-colors cursor-pointer"
            >
              <span className="block text-xs font-semibold text-[#0F172A]">
                Cliente Demo
              </span>
              <span className="block text-[11px] text-[#64748B] truncate">
                camila.rojas@correo.co
              </span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('ADMIN')}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-left transition-colors cursor-pointer"
            >
              <span className="block text-xs font-semibold text-[#0F172A]">
                Administrador
              </span>
              <span className="block text-[11px] text-[#64748B] truncate">
                admin@mercadotrust.co
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0F172A]/45 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {content}
    </div>
  );
}
