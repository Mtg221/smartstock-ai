'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import {
  LayoutDashboard, Package, Users, ShoppingCart, Truck,
  BarChart3, Brain, Bell, Settings, LogOut, Menu, X,
  ChevronRight, Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';

const NAV = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['admin', 'directeur', 'gestionnaire', 'employe'] },
  { href: '/dashboard/products', label: 'Produits', icon: Package, roles: ['admin', 'gestionnaire', 'employe'] },
  { href: '/dashboard/sales', label: 'Ventes', icon: ShoppingCart, roles: ['admin', 'gestionnaire', 'employe'] },
  { href: '/dashboard/purchases', label: 'Achats', icon: Truck, roles: ['admin', 'gestionnaire'] },
  { href: '/dashboard/suppliers', label: 'Fournisseurs', icon: Building2, roles: ['admin', 'gestionnaire'] },
  { href: '/dashboard/reports', label: 'Rapports', icon: BarChart3, roles: ['admin', 'directeur', 'gestionnaire'] },
  { href: '/dashboard/ai', label: 'Prévisions IA', icon: Brain, roles: ['admin', 'directeur', 'gestionnaire'] },
  { href: '/dashboard/users', label: 'Utilisateurs', icon: Users, roles: ['admin'] },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings, roles: ['admin'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

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
      'flex flex-col h-full bg-gray-950 text-white',
      mobile ? 'w-full' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
          <Brain size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold">SmartStock AI</p>
          <p className="text-xs text-gray-500">{user?.role ?? 'Utilisateur'}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition',
                active
                  ? 'bg-emerald-600/20 text-emerald-400 font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icon size={16} className="shrink-0" />
              {label}
              {href === '/dashboard/ai' && (
                <span className="ml-auto text-xs bg-indigo-600/30 text-indigo-400 px-1.5 py-0.5 rounded">IA</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-semibold shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-red-400 transition"
            title="Se déconnecter"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
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
        <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
            <span>SmartStock AI</span>
            <ChevronRight size={14} />
            <span className="text-gray-900 dark:text-white font-medium">
              {visibleNav.find(n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.label ?? 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Link
              href="/dashboard/notifications"
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
