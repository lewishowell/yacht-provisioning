import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  UtensilsCrossed,
  CalendarDays,
  LogOut,
  Menu,
  X,
  HelpCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { GettingStartedModal } from '../GettingStartedModal';
import { Logo } from '../Logo';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/provisioning', icon: ClipboardList, label: 'Provisioning' },
  { to: '/meals', icon: UtensilsCrossed, label: 'Meals' },
  { to: '/meal-plans', icon: CalendarDays, label: 'Meal Plans' },
];

export function AppLayout() {
  const { user, logout, markOnboardingSeen } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (user && !user.hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    if (user && !user.hasSeenOnboarding) {
      markOnboardingSeen();
    }
  };

  const handleOpenOnboarding = () => {
    setShowOnboarding(true);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between bg-navy text-white p-4 no-print">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="font-bold text-lg">Stock Up & Go!</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenOnboarding}
            className="text-gray-300 hover:text-white transition-colors"
            title="Getting Started"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`no-print bg-navy text-white w-64 flex-shrink-0 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:sticky top-0 h-screen z-40`}
      >
        <Link to="/" className="hidden md:flex items-center gap-3 p-6 border-b border-navy-light">
          <Logo className="h-9 w-9" />
          <span className="font-bold text-xl">Stock Up & Go!</span>
        </Link>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-ocean text-white'
                    : 'text-gray-300 hover:bg-navy-light hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}

          <button
            onClick={handleOpenOnboarding}
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-navy-light hover:text-white w-full text-left mt-2"
          >
            <HelpCircle className="h-5 w-5" />
            Getting Started
          </button>
        </nav>

        <div className="p-4 border-t border-navy-light">
          <div className="flex items-center gap-3 mb-3">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-ocean flex items-center justify-center text-sm font-bold">
                {user?.name?.[0] ?? '?'}
              </div>
            )}
            <div className="truncate">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 p-4 pb-20 md:p-8 md:pb-8 overflow-auto">
        <Outlet />
      </main>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-sand-dark flex no-print z-20 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center py-2 text-xs ${
                isActive ? 'text-ocean' : 'text-gray-500'
              }`}
            >
              <item.icon className="h-5 w-5 mb-1" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Getting Started Modal */}
      <GettingStartedModal open={showOnboarding} onClose={handleCloseOnboarding} />
    </div>
  );
}
