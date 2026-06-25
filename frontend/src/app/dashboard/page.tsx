'use client';

import { useQuery } from '@tanstack/react-query';
import { productsApi, salesApi, aiApi, notificationsApi } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  Package, TrendingUp, AlertTriangle, ShoppingCart,
  Brain, Bell, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

const FCFA = (n: number) => new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);

const RISK_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e' };
const RISK_LABELS: Record<string, string> = { critical: 'Critique', high: 'Élevé', medium: 'Moyen', low: 'Faible' };

export default function DashboardPage() {
  const { data: stats } = useQuery({ queryKey: ['dashboard'], queryFn: productsApi.getDashboard, staleTime: 60_000 });
  const { data: salesStats } = useQuery({ queryKey: ['sales-stats'], queryFn: () => salesApi.getStats(30), staleTime: 60_000 });
  const { data: forecasts } = useQuery({ queryKey: ['forecasts'], queryFn: aiApi.getForecasts, staleTime: 300_000 });
  const { data: notifs } = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.getAll });

  const unreadCount = notifs?.filter((n: any) => !n.isRead).length ?? 0;
  const criticalAlerts = forecasts?.filter((f: any) => f.riskLevel === 'critical') ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de votre activité</p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-medium">
            <Bell size={16} />
            {unreadCount} alerte{unreadCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Chiffre d'affaires (mois)"
          value={FCFA(stats?.monthlyRevenue ?? 0)}
          icon={<TrendingUp size={20} />}
          color="emerald"
        />
        <StatCard
          label="Ventes ce mois"
          value={stats?.monthlySalesCount ?? 0}
          icon={<ShoppingCart size={20} />}
          color="blue"
        />
        <StatCard
          label="Produits en stock"
          value={stats?.totalProducts ?? 0}
          icon={<Package size={20} />}
          color="purple"
        />
        <StatCard
          label="Alertes stock faible"
          value={stats?.lowStockCount ?? 0}
          icon={<AlertTriangle size={20} />}
          color="orange"
          alert={stats?.lowStockCount > 0}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-base font-medium text-gray-800 dark:text-gray-100 mb-4">Ventes (30 derniers jours)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesStats ?? []}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="saleDate" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('fr', { day: '2-digit', month: '2-digit' })} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => FCFA(v)} />
              <Area type="monotone" dataKey="_sum.totalAmount" stroke="#10b981" fill="url(#salesGrad)" strokeWidth={2} name="Recettes" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Forecasts */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} className="text-indigo-500" />
            <h2 className="text-base font-medium text-gray-800 dark:text-gray-100">Prévisions IA — Risques de rupture</h2>
          </div>
          {forecasts?.length ? (
            <div className="space-y-3">
              {forecasts.slice(0, 5).map((f: any) => (
                <div key={f.productId} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{f.productName}</p>
                    <p className="text-xs text-gray-500">{f.currentStock} unités · {f.daysUntilStockout} jours estimés</p>
                  </div>
                  <span
                    className="ml-3 px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      background: RISK_COLORS[f.riskLevel as keyof typeof RISK_COLORS] + '20',
                      color: RISK_COLORS[f.riskLevel as keyof typeof RISK_COLORS],
                    }}
                  >
                    {RISK_LABELS[f.riskLevel]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucune prévision disponible</p>
          )}
        </div>
      </div>

      {/* Critical alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-red-600" />
            <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">Ruptures critiques imminentes</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {criticalAlerts.map((f: any) => (
              <div key={f.productId} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-red-100 dark:border-red-800">
                <p className="font-medium text-sm text-gray-900 dark:text-white">{f.productName}</p>
                <p className="text-xs text-red-600 mt-1">
                  Rupture dans <strong>{f.daysUntilStockout}</strong> jour{f.daysUntilStockout > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500">Stock: {f.currentStock} · Demande: {f.avgDailySales?.toFixed(1)}/j</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, alert = false }: {
  label: string; value: any; icon: React.ReactNode; color: string; alert?: boolean;
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border p-5 ${alert ? 'border-orange-300 dark:border-orange-700' : 'border-gray-200 dark:border-gray-800'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
