import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AuthPanel } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutView } from './components/CheckoutView';
import { CustomerOrdersView } from './components/CustomerOrdersView';
import { Navbar, type ActiveRoute } from './components/Navbar';
import { ProfileView } from './components/ProfileView';
import { ReceiptView } from './components/ReceiptView';
import { StorefrontView } from './components/StorefrontView';
import { api, getStoredToken, setStoredToken } from './lib/api';
import type {
  CartCalculation,
  CartItem,
  Category,
  Order,
  Product,
  User,
} from './types';

const CART_STORAGE_KEY = 'mt_cart_items';

function loadStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [route, setRoute] = useState<ActiveRoute>('storefront');
  const [user, setUser] = useState<User | null>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);

  // Catalog state
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('relevancia');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(loadStoredCart);
  const [cartCalc, setCartCalc] = useState<CartCalculation | null>(null);
  const [loadingCart, setLoadingCart] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Active receipt order
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{
    type: 'success' | 'warning';
    message: string;
  } | null>(null);

  const showToast = useCallback(
    (type: 'success' | 'warning', message: string) => {
      setToast({ type, message });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Restore session if JWT exists
  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api
      .me()
      .then((res) => setUser(res.usuario))
      .catch(() => {
        setStoredToken(null);
        setUser(null);
      });
  }, []);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const res = await api.getPublicCategories();
      setCategories(res.categorias);
    } catch {
      // ignore
    }
  }, []);

  // Load products
  const loadProducts = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const res = await api.getPublicProducts({
        q: searchQuery,
        categoriaId: selectedCategoryId,
        sort: sortBy,
      });
      setProducts(res.productos);
    } catch {
      // ignore
    } finally {
      setLoadingCatalog(false);
    }
  }, [searchQuery, selectedCategoryId, sortBy]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Sync cart with localStorage & recalculate on server
  const refreshCartCalculation = useCallback(async (items: CartItem[]) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
    if (items.length === 0) {
      setCartCalc({
        items: [],
        subtotal: 0,
        impuestos: 0,
        costoEnvio: 0,
        umbralEnvioGratis: 150000,
        total: 0,
        tieneProblemasStock: false,
      });
      return;
    }
    setLoadingCart(true);
    try {
      const calc = await api.calculateCart(items);
      setCartCalc(calc);
    } catch {
      // ignore
    } finally {
      setLoadingCart(false);
    }
  }, []);

  useEffect(() => {
    refreshCartCalculation(cart);
  }, [cart, refreshCartCalculation]);

  const handleAddToCart = (product: Product, qty = 1) => {
    if (product.stock <= 0) {
      showToast('warning', 'Este producto está agotado.');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productoId === product.id);
      const currentQty = existing?.cantidad ?? 0;
      const desired = currentQty + qty;
      if (desired > product.stock) {
        showToast(
          'warning',
          `Solo quedan ${product.stock} unidades disponibles de ${product.nombre}.`
        );
        if (currentQty >= product.stock) return prev;
        return existing
          ? prev.map((i) =>
              i.productoId === product.id
                ? { ...i, cantidad: product.stock }
                : i
            )
          : [...prev, { productoId: product.id, cantidad: product.stock }];
      }
      showToast('success', `${product.nombre} agregado al carrito.`);
      if (existing) {
        return prev.map((i) =>
          i.productoId === product.id ? { ...i, cantidad: desired } : i
        );
      }
      return [...prev, { productoId: product.id, cantidad: desired }];
    });
  };

  const handleUpdateQty = (productoId: number, nextQty: number) => {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((i) => i.productoId !== productoId));
      return;
    }
    const lineInfo = cartCalc?.items.find((i) => i.productoId === productoId);
    if (lineInfo && nextQty > lineInfo.stockDisponible) {
      showToast(
        'warning',
        `Solo quedan ${lineInfo.stockDisponible} unidades disponibles.`
      );
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productoId === productoId ? { ...i, cantidad: nextQty } : i
      )
    );
  };

  const handleRemoveItem = (productoId: number) => {
    setCart((prev) => prev.filter((i) => i.productoId !== productoId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleNavigate = (target: ActiveRoute) => {
    if (target === 'admin') {
      if (!user || user.rol !== 'ADMIN') {
        showToast('warning', 'Acceso no autorizado.');
        setRoute('storefront');
        return;
      }
    }
    if ((target === 'orders' || target === 'profile') && !user) {
      setAuthModalMode('login');
      return;
    }
    setRoute(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (loggedUser: User) => {
    setUser(loggedUser);
    setAuthModalMode(null);
    if (loggedUser.rol === 'ADMIN' && route !== 'checkout') {
      setRoute('admin');
    }
    showToast('success', `Bienvenido, ${loggedUser.nombresCompletos}.`);
  };

  const handleLogout = () => {
    setStoredToken(null);
    setUser(null);
    setActiveOrder(null);
    setRoute('storefront');
    showToast('success', 'Sesión cerrada de forma segura.');
  };

  const handleOrderCompleted = (order: Order) => {
    setCart([]);
    setActiveOrder(order);
    setRoute('receipt');
    loadProducts();
    showToast('success', `Pedido ${order.codigoOrden} confirmado.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewReceipt = async (order: Order) => {
    try {
      const res = await api.getReceipt(order.id);
      setActiveOrder(res.pedido);
      setRoute('receipt');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      showToast('warning', 'No fue posible abrir el comprobante.');
    }
  };

  const totalCartUnits = cart.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f4f5] text-[#332f2d]">
      <Navbar
        route={route}
        user={user}
        cartCount={totalCartUnits}
        onNavigate={handleNavigate}
        onOpenCart={() => setCartOpen(true)}
        onOpenAuth={(mode) => setAuthModalMode(mode)}
        onLogout={handleLogout}
      />

      {/* Toast flotante */}
      {toast && (
        <div
          role="status"
          className={`no-print fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-xl border shadow-lg flex items-center gap-2.5 text-sm font-semibold ${
            toast.type === 'success'
              ? 'bg-[#0F172A] text-white border-[#1E293B]'
              : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#68DBA9] shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Cerrar aviso"
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1">
        {route === 'storefront' && (
          <StorefrontView
            products={products}
            categories={categories}
            loading={loadingCatalog}
            searchQuery={searchQuery}
            selectedCategoryId={selectedCategoryId}
            sortBy={sortBy}
            cart={cart}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategoryId}
            onSortChange={setSortBy}
            onClearFilters={() => {
              setSearchQuery('');
              setSelectedCategoryId(null);
              setSortBy('relevancia');
            }}
            onAddToCart={handleAddToCart}
            onGoToOrders={() => handleNavigate('orders')}
          />
        )}

        {route === 'checkout' && (
          <CheckoutView
            user={user}
            cart={cart}
            calculation={cartCalc}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            onAuthenticated={(u) => setUser(u)}
            onOrderCompleted={handleOrderCompleted}
            onBackToCatalog={() => setRoute('storefront')}
          />
        )}

        {route === 'receipt' && activeOrder && (
          <ReceiptView
            order={activeOrder}
            isAdmin={user?.rol === 'ADMIN'}
            onBackToCatalog={() => setRoute('storefront')}
            onGoToOrders={() => handleNavigate('orders')}
          />
        )}

        {route === 'orders' && user && (
          <CustomerOrdersView
            onViewReceipt={handleViewReceipt}
            onGoToCatalog={() => setRoute('storefront')}
            onOrderCancelled={() => loadProducts()}
          />
        )}

        {route === 'profile' && user && (
          <ProfileView
            user={user}
            onUpdated={(updated) => setUser(updated)}
          />
        )}

        {route === 'admin' && user?.rol === 'ADMIN' && (
          <AdminDashboardView
            onViewReceipt={handleViewReceipt}
            onCatalogMutated={() => {
              loadCategories();
              loadProducts();
            }}
          />
        )}
      </div>

      <footer className="no-print border-t border-[#ebebeb] bg-white mt-14">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#787574]">
          <span>
            © {new Date().getFullYear()} Mercado Trust · Comercio Local Transaccional en Colombia
          </span>
          <span>
            Precios en Pesos Colombianos (COP) · Tratamiento de datos Ley 1581 de 2012
          </span>
        </div>
      </footer>

      <CartDrawer
        open={cartOpen}
        calculation={cartCalc}
        loading={loadingCart}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={() => {
          setCartOpen(false);
          setRoute('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {authModalMode && (
        <AuthPanel
          initialMode={authModalMode}
          onSuccess={handleAuthSuccess}
          onClose={() => setAuthModalMode(null)}
        />
      )}
    </div>
  );
}
