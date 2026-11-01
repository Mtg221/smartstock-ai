'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import {
  LayoutDashboard, Package, Users, ShoppingCart, Truck,
  BarChart3, Brain, Bell, Settings, LogOut, Menu, X,
  ChevronRight, Building2, MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';

const NAV = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['admin', 'directeur', 'gestionnaire', 'employe', 'superadmin'] },
  { href: '/dashboard/products', label: 'Produits', icon: Package, roles: ['admin', 'gestionnaire', 'employe'] },
  { href: '/dashboard/sales', label: 'Ventes', icon: ShoppingCart, roles: ['admin', 'gestionnaire', 'employe'] },
  { href: '/dashboard/purchases', label: 'Achats', icon: Truck, roles: ['admin', 'gestionnaire'] },
  { href: '/dashboard/suppliers', label: 'Fournisseurs', icon: Building2, roles: ['admin', 'gestionnaire'] },
  { href: '/dashboard/reports', label: 'Rapports', icon: BarChart3, roles: ['admin', 'directeur', 'gestionnaire'] },
  { href: '/dashboard/ai', label: 'Prévisions IA', icon: Brain, roles: ['admin', 'directeur', 'gestionnaire'] },
  { href: '/dashboard/chat', label: 'Assistant IA', icon: MessageSquare, roles: ['admin', 'directeur', 'gestionnaire', 'employe', 'superadmin'] },
  { href: '/dashboard/users', label: 'Utilisateurs', icon: Users, roles: ['admin'] },
  { href: '/dashboard/companies', label: 'Entreprises', icon: Building2, roles: ['superadmin'] },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings, roles: ['admin'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, accessToken, refreshToken, refreshTokens } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (accessToken) { setReady(true); return; }
    if (refreshToken) {
      refreshTokens().catch(() => router.push('/login')).finally(() => setReady(true));
    } else {
      router.push('/login');
    }
  }, [accessToken]);

  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const unreadCount = notifs?.filter((n: any) => !n.isRead).length ?? 0;

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnecté');
    router.push('/login');
  };

  const visibleNav = NAV.filter(n => !user?.role || n.roles.includes(user.role));

  const Sidebar = ({ mobile = false }) => (
    <div className={clsx(
      'flex flex-col h-full bg-slate-950 text-white',
      mobile ? 'w-full' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/80">
        <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
          <Brain size={18} className="text-white" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-white">SmartStock AI</p>
          <p className="text-[11px] font-medium text-emerald-400 capitalize">{user?.role ?? 'Utilisateur'}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Navigation principale" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850/80 hover:bg-slate-900'
              )}
            >
              <Icon size={17} className={clsx('shrink-0', active ? 'text-emerald-400' : 'text-slate-400')} aria-hidden="true" />
              <span>{label}</span>
              {href === '/dashboard/ai' && (
                <span className="ml-auto text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.5 rounded">
                  IA
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition"
            title="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  if (!ready) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex shrink-0 w-64 border-r border-gray-200 dark:border-gray-800">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 h-full">
            <Sidebar mobile />
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Ouvrir le menu de navigation"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <nav aria-label="Fil d'Ariane" className="hidden lg:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>SmartStock AI</span>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-slate-900 dark:text-white font-semibold">
              {visibleNav.find(n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.label ?? 'Dashboard'}
            </span>
          </nav>

          <div className="flex items-center gap-3 ml-auto">
            <Link
              href="/dashboard/notifications"
              className="relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label={unreadCount > 0 ? `${unreadCount} notifications non lues` : 'Notifications'}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
