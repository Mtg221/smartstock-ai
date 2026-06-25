'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { BarChart3, Download, TrendingUp, Package } from 'lucide-react';

const FCFA = (n: number) =>
  new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: revenueData, isLoading: revLoading } = useQuery({
    queryKey: ['revenue', year],
    queryFn: () => api.get(`/api/reports/revenue?year=${year}`).then(r => r.data),
    staleTime: 300_000,
  });

  const { data: topProducts, isLoading: topLoading } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => api.get('/api/reports/top-products?limit=10').then(r => r.data),
    staleTime: 300_000,
  });

  // Enrichir avec les noms de mois
  const revenueChartData = MONTHS.map((name, idx) => {
    const found = (revenueData ?? []).find((d: any) => Number(d.month) === idx + 1);
    return {
      month: name,
      revenue: found ? Number(found.revenue) : 0,
      sales_count: found ? Number(found.sales_count) : 0,
    };
  });

  const totalRevenue = revenueChartData.reduce((s, d) => s + d.revenue, 0);
  const totalSales = revenueChartData.reduce((s, d) => s + d.sales_count, 0);
  const bestMonth = [...revenueChartData].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <BarChart3 size={22} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Rapports</h1>
            <p className="text-sm text-gray-500">Analyse des performances commerciales</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {[currentYear - 1, currentYear].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <Download size={14} /> Exporter
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: `Revenu total ${year}`, value: FCFA(totalRevenue), icon: <TrendingUp size={18} />, color: 'emerald' },
          { label: 'Nombre de ventes', value: totalSales.toLocaleString('fr'), icon: <BarChart3 size={18} />, color: 'blue' },
          { label: 'Meilleur mois', value: bestMonth?.month ?? '—', icon: <TrendingUp size={18} />, color: 'purple' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${
              color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
              : color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
            }`}>
              {icon}
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue bar chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h2 className="text-base font-medium text-gray-800 dark:text-gray-100 mb-5">Chiffre d'affaires mensuel {year}</h2>
        {revLoading ? (
          <div className="h-60 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueChartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: any) => FCFA(v)}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenu" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top products */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center gap-2 mb-5">
          <Package size={16} className="text-gray-500" />
          <h2 className="text-base font-medium text-gray-800 dark:text-gray-100">Top produits — Ventes</h2>
        </div>
        {topLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {(topProducts ?? []).map((p: any, idx: number) => {
              const maxSold = topProducts?.[0]?.total_sold ?? 1;
              const pct = (Number(p.total_sold) / Number(maxSold)) * 100;
              return (
                <div key={p.id} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-400 w-5 shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</span>
                      <span className="text-sm text-gray-500 shrink-0 ml-3">{Number(p.total_sold).toLocaleString('fr')} vendus</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-28 text-right shrink-0">
                    {FCFA(Number(p.revenue))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
