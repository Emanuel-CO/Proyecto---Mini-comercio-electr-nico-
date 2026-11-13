import { ShoppingBag } from 'lucide-react';
import type { User } from '../types';

export type ActiveRoute =
  | 'storefront'
  | 'checkout'
  | 'orders'
  | 'profile'
  | 'receipt'
  | 'admin';

interface NavbarProps {
  route: ActiveRoute;
  user: User | null;
  cartCount: number;
  onNavigate: (route: ActiveRoute) => void;
  onOpenCart: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
}

export function Navbar({
  route,
  user,
  cartCount,
  onNavigate,
  onOpenCart,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  const linkClass = (active: boolean) =>
    `text-sm font-medium whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
      active
        ? 'text-[#059669] border-[#059669]'
        : 'text-[#475569] border-transparent hover:text-[#0F172A]'
    }`;

  return (
    <header className="no-print sticky top-0 z-30 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zona 1: Wordmark de marca */}
        <button
          type="button"
          onClick={() => onNavigate('storefront')}
          className="text-lg font-extrabold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] rounded"
        >
          Mercado Trust
        </button>

        {/* Zona 2: Enlaces de navegación concisos */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Navegación principal">
          <button
            type="button"
            onClick={() => onNavigate('storefront')}
            className={`${linkClass(route === 'storefront')} cursor-pointer`}
          >
            Catálogo
          </button>

          {user?.rol === 'ADMIN' ? (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className={`${linkClass(route === 'admin')} cursor-pointer`}
            >
              Panel Admin
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                user ? onNavigate('orders') : onOpenAuth('login')
              }
              className={`${linkClass(route === 'orders' || route === 'receipt')} cursor-pointer`}
            >
              Mis pedidos
            </button>
          )}

          {user ? (
            <>
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className={`${linkClass(route === 'profile')} cursor-pointer`}
              >
                Mi perfil
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="text-sm font-medium text-[#475569] hover:text-[#BA1A1A] whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="text-sm font-medium text-[#475569] hover:text-[#0F172A] whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer"
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="text-sm font-medium text-[#475569] hover:text-[#0F172A] whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer"
              >
                Crear cuenta
              </button>
            </>
          )}
        </nav>

        {/* Zona 3: Acción principal */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={2} />
            <span>Carrito</span>
            <span className="tabular-nums font-bold">({cartCount})</span>
          </button>
        </div>
      </div>

      {/* Navegación móvil compacta */}
      <div className="md:hidden border-t border-[#E2E8F0] px-4 py-2 flex items-center justify-between gap-4 overflow-x-auto bg-[#F8FAFC]">
        <button
          type="button"
          onClick={() => onNavigate('storefront')}
          className={`text-xs font-semibold whitespace-nowrap shrink-0 py-1 ${
            route === 'storefront' ? 'text-[#059669]' : 'text-[#475569]'
          }`}
        >
          Catálogo
        </button>
        {user?.rol === 'ADMIN' ? (
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className={`text-xs font-semibold whitespace-nowrap shrink-0 py-1 ${
              route === 'admin' ? 'text-[#059669]' : 'text-[#475569]'
            }`}
          >
            Panel Admin
          </button>
        ) : (
          <button
            type="button"
            onClick={() => (user ? onNavigate('orders') : onOpenAuth('login'))}
            className={`text-xs font-semibold whitespace-nowrap shrink-0 py-1 ${
              route === 'orders' ? 'text-[#059669]' : 'text-[#475569]'
            }`}
          >
            Mis pedidos
          </button>
        )}
        {user ? (
          <>
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className={`text-xs font-semibold whitespace-nowrap shrink-0 py-1 ${
                route === 'profile' ? 'text-[#059669]' : 'text-[#475569]'
              }`}
            >
              Mi perfil
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-semibold text-[#BA1A1A] whitespace-nowrap shrink-0 py-1"
            >
              Salir
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onOpenAuth('login')}
            className="text-xs font-semibold text-[#0F172A] whitespace-nowrap shrink-0 py-1"
          >
            Ingresar
          </button>
        )}
      </div>
    </header>
  );
}
