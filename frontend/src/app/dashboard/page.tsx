'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { productsApi, salesApi, aiApi, notificationsApi } from '@/lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Package, TrendingUp, AlertTriangle, ShoppingCart,
  Brain, Bell, ArrowRight, PlusCircle, CheckCircle2,
  Calendar, RefreshCw,
} from 'lucide-react';

const FCFA = (n: number) =>
  new Intl.NumberFormat('fr-SN', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(n);

const RISK_CONFIG: Record<string, { label: string; badge: string; border: string }> = {
  critical: {
    label: 'Critique',
    badge: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-800',
    border: 'border-l-4 border-l-red-500',
  },
  high: {
    label: 'Élevé',
    badge: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    border: 'border-l-4 border-l-orange-500',
  },
  medium: {
    label: 'Moyen',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    border: 'border-l-4 border-l-amber-500',
  },
  low: {
    label: 'Faible',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    border: 'border-l-4 border-l-emerald-500',
  },
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard'],
    queryFn: productsApi.getDashboard,
    staleTime: 60_000,
  });

  const { data: salesStats, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-stats'],
    queryFn: () => salesApi.getStats(30),
    staleTime: 60_000,
  });

  const { data: forecasts, isLoading: forecastsLoading } = useQuery({
    queryKey: ['forecasts'],
    queryFn: aiApi.getForecasts,
    staleTime: 300_000,
  });

  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
  });

  const unreadCount = notifs?.filter((n: any) => !n.isRead).length ?? 0;
  const criticalAlerts = forecasts?.filter((f: any) => f.riskLevel === 'critical' || f.riskLevel === 'high') ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Page Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pilotage des flux d'inventaire, prévisions IA et rentabilité en temps réel
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/sales"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <PlusCircle className="w-4 h-4" />
            Nouvelle vente
          </Link>
          <Link
            href="/dashboard/products"
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Package className="w-4 h-4" />
            + Produit
          </Link>
        </div>
      </div>

      {/* Critical stockouts banner if any */}
      {criticalAlerts.length > 0 && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/40 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-600 text-white shrink-0 mt-0.5 md:mt-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-red-900 dark:text-red-200">
                {criticalAlerts.length} alerte{criticalAlerts.length > 1 ? 's' : ''} de rupture imminente détectée{criticalAlerts.length > 1 ? 's' : ''}
              </h2>
              <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mt-0.5">
                Certains produits phares atteindront un stock nul sous 5 jours selon la cadence de vente actuelle.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/purchases"
            className="inline-flex items-center gap-1.5 shrink-0 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            Passer commande fournisseur
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Chiffre d'affaires (30j)"
          value={statsLoading ? null : FCFA(stats?.monthlyRevenue ?? 0)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
          badge="+14.2%"
          badgeTone="positive"
        />
        <StatCard
          label="Ventes du mois"
          value={statsLoading ? null : (stats?.monthlySalesCount ?? 0)}
          icon={<ShoppingCart className="w-5 h-5" />}
          color="blue"
          badge="En progression"
          badgeTone="neutral"
        />
        <StatCard
          label="Références actives"
          value={statsLoading ? null : (stats?.totalProducts ?? 0)}
          icon={<Package className="w-5 h-5" />}
          color="purple"
          badge="Inventaire"
          badgeTone="neutral"
        />
        <StatCard
          label="Alertes stock faible"
          value={statsLoading ? null : (stats?.lowStockCount ?? 0)}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="amber"
          badge={stats?.lowStockCount > 0 ? 'Action requise' : 'Nominal'}
          badgeTone={stats?.lowStockCount > 0 ? 'negative' : 'positive'}
        />
      </div>

      {/* Charts & AI Modules Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Trend Chart (Span 2) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Évolution des recettes (30 jours)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Montant cumulé des ventes en FCFA</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
              <Calendar className="w-3.5 h-3.5" />
              Mois en cours
            </div>
          </div>

          <div className="h-[250px] w-full">
            {salesLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/40 rounded-xl animate-pulse text-xs text-slate-400">
                Chargement de la courbe des ventes...
              </div>
            ) : salesStats && salesStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesStats}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                  <XAxis
                    dataKey="saleDate"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('fr-SN', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    formatter={(v: any) => [FCFA(Number(v)), 'Recettes']}
                  />
                  <Area
                    type="monotone"
                    dataKey="_sum.totalAmount"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#salesGrad)"
                    name="Recettes"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <ShoppingCart className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-600 mb-2" />
                Aucune transaction enregistrée sur cette période
              </div>
            )}
          </div>
        </div>

        {/* AI Forecast Summary Card (Span 1) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Brain className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Prévisions de rupture</h2>
            </div>
            <Link
              href="/dashboard/ai"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Voir tout
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {forecastsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : forecasts && forecasts.length > 0 ? (
              forecasts.slice(0, 4).map((f: any) => {
                const config = RISK_CONFIG[f.riskLevel] || RISK_CONFIG.medium;
                return (
                  <div
                    key={f.productId}
                    className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 ${config.border}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                        {f.productName}
                      </p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.badge}`}>
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                      <span>Stock: <strong>{f.currentStock}</strong></span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {f.daysUntilStockout <= 0 ? 'Rupture' : `${f.daysUntilStockout}j restants`}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                Tous les stocks sont à des niveaux sécurisés
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              href="/dashboard/ai"
              className="text-xs text-slate-500 hover:text-emerald-600 transition"
            >
              Calculé par le moteur IA · Modèle Wilson EOQ
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  badge,
  badgeTone = 'neutral',
}: {
  label: string;
  value: any;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'purple' | 'amber';
  badge: string;
  badgeTone?: 'positive' | 'negative' | 'neutral';
}) {
  const iconColorStyles = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-100 dark:border-blue-900',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-100 dark:border-purple-900',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-100 dark:border-amber-900',
  };

  const badgeStyles = {
    positive: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    negative: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
    neutral: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`p-2 rounded-xl border ${iconColorStyles[color]}`}>{icon}</div>
      </div>

      <div className="mt-1 flex items-baseline justify-between">
        {value === null ? (
          <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
        )}
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyles[badgeTone]}`}>
          {badge}
        </span>
      </div>
    </div>
  );
}
