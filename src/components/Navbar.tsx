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
    `text-[15px] font-semibold whitespace-nowrap shrink-0 transition-all px-3.5 py-2 rounded-xl ${
      active
        ? 'text-[#5433eb] bg-[#5433eb]/10 font-bold'
        : 'text-[#787574] hover:text-[#000000] hover:bg-slate-100'
    }`;

  return (
    <header className="no-print sticky top-0 z-30 bg-white border-b border-[#ebebeb] shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-6">
        {/* Zona 1: Wordmark de marca */}
        <button
          type="button"
          onClick={() => onNavigate('storefront')}
          className="text-xl sm:text-2xl font-black tracking-tight text-[#000000] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5433eb] rounded-lg py-1 px-1.5 hover:opacity-90 transition-opacity"
        >
          Mercado Trust
        </button>

        {/* Zona 2: Enlaces de navegación */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-3" aria-label="Navegación principal">
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
                className="text-[15px] font-semibold text-[#BA1A1A] hover:bg-red-50 whitespace-nowrap shrink-0 transition-colors px-3.5 py-2 rounded-xl cursor-pointer"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="h-11 px-4 text-[15px] font-bold text-[#5433eb] hover:bg-[#5433eb]/10 whitespace-nowrap shrink-0 transition-colors rounded-xl cursor-pointer"
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="h-11 px-5 text-[15px] font-bold text-white bg-[#5433eb] hover:bg-[#4524db] whitespace-nowrap shrink-0 transition-all rounded-xl shadow-xs hover:shadow-md cursor-pointer"
              >
                Crear cuenta
              </button>
            </div>
          )}
        </nav>

        {/* Zona 3: Acción principal (Carrito destacado y ergonómico) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Ver carrito de compras con ${cartCount} productos`}
            className="inline-flex items-center gap-2.5 h-12 px-5 sm:px-6 rounded-xl bg-[#5433eb] hover:bg-[#4524db] text-white text-[15px] sm:text-base font-bold whitespace-nowrap shrink-0 transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5433eb] focus-visible:ring-offset-2"
          >
            <ShoppingBag className="w-5 h-5 shrink-0" strokeWidth={2.2} />
            <span>Carrito</span>
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-white text-[#5433eb] font-extrabold text-xs shadow-sm tabular-nums">
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Navegación móvil con botones táctiles cómodos */}
      <div className="md:hidden border-t border-[#ebebeb] px-4 py-2.5 flex items-center justify-between gap-2 overflow-x-auto bg-[#f2f4f5]">
        <button
          type="button"
          onClick={() => onNavigate('storefront')}
          className={`h-10 px-3.5 rounded-lg text-sm font-bold whitespace-nowrap shrink-0 transition-colors ${
            route === 'storefront' ? 'bg-[#5433eb] text-white' : 'text-[#787574] hover:text-[#000000]'
          }`}
        >
          Catálogo
        </button>
        {user?.rol === 'ADMIN' ? (
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className={`h-10 px-3.5 rounded-lg text-sm font-bold whitespace-nowrap shrink-0 transition-colors ${
              route === 'admin' ? 'bg-[#5433eb] text-white' : 'text-[#787574] hover:text-[#000000]'
            }`}
          >
            Panel Admin
          </button>
        ) : (
          <button
            type="button"
            onClick={() => (user ? onNavigate('orders') : onOpenAuth('login'))}
            className={`h-10 px-3.5 rounded-lg text-sm font-bold whitespace-nowrap shrink-0 transition-colors ${
              route === 'orders' || route === 'receipt' ? 'bg-[#5433eb] text-white' : 'text-[#787574] hover:text-[#000000]'
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
              className={`h-10 px-3.5 rounded-lg text-sm font-bold whitespace-nowrap shrink-0 transition-colors ${
                route === 'profile' ? 'bg-[#5433eb] text-white' : 'text-[#787574] hover:text-[#000000]'
              }`}
            >
              Mi perfil
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="h-10 px-3.5 rounded-lg text-sm font-bold text-[#BA1A1A] hover:bg-red-50 whitespace-nowrap shrink-0 transition-colors"
            >
              Salir
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="h-10 px-3.5 rounded-lg text-sm font-bold text-[#5433eb] bg-white border border-[#ebebeb] whitespace-nowrap shrink-0"
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="h-10 px-3.5 rounded-lg text-sm font-bold text-white bg-[#5433eb] whitespace-nowrap shrink-0 shadow-xs"
            >
              Registrarse
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
