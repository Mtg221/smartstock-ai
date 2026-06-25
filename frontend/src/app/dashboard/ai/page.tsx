'use client';

import { useQuery } from '@tanstack/react-query';
import { aiApi, productsApi } from '@/lib/api';
import { Brain, TrendingDown, ShoppingBag, Zap, RefreshCw } from 'lucide-react';

const RISK_CONFIG = {
  critical: { label: 'Critique', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', bar: 'bg-red-500' },
  high: { label: 'Élevé', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', bar: 'bg-orange-500' },
  medium: { label: 'Moyen', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', bar: 'bg-yellow-500' },
  low: { label: 'Faible', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-500' },
};

const FCFA = (n: number) => new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);

export default function ForecastsPage() {
  const { data: forecasts, isLoading: fLoading, refetch: refetchF } = useQuery({
    queryKey: ['forecasts'],
    queryFn: aiApi.getForecasts,
    staleTime: 300_000,
  });

  const { data: recommendations, isLoading: rLoading, refetch: refetchR } = useQuery({
    queryKey: ['recommendations'],
    queryFn: aiApi.getRecommendations,
    staleTime: 300_000,
  });

  const { data: trends } = useQuery({
    queryKey: ['trends'],
    queryFn: aiApi.getTrends,
    staleTime: 300_000,
  });

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <Brain size={22} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Intelligence artificielle</h1>
            <p className="text-sm text-gray-500">Prévisions et recommandations générées par l'IA</p>
          </div>
        </div>
        <button
          onClick={() => { refetchF(); refetchR(); }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Insights des tendances */}
      {trends?.insights?.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-indigo-600" />
            <h2 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Insights IA · Tendances du mois</h2>
          </div>
          <div className="space-y-3">
            {trends.insights.map((insight: any, i: number) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
                <p className="text-sm text-gray-800 dark:text-gray-200">{insight.message}</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                  → {insight.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prévisions de rupture */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown size={18} className="text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Prévisions de rupture de stock</h2>
          <span className="ml-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
            {forecasts?.length ?? 0}
          </span>
        </div>

        {fLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(forecasts ?? []).map((f: any) => {
              const config = RISK_CONFIG[f.riskLevel as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.low;
              const stockPercent = Math.min(100, (f.currentStock / (f.alertThreshold * 3)) * 100);
              return (
                <div key={f.productId} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-medium text-gray-900 dark:text-white text-sm leading-tight">{f.productName}</p>
                    <span className={`ml-2 shrink-0 px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Stock actuel</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{f.currentStock} unités</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${config.bar} transition-all`} style={{ width: `${stockPercent}%` }} />
                    </div>
                    <div className="flex justify-between">
                      <span>Rupture estimée</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {f.daysUntilStockout <= 0 ? 'Maintenant' : `${f.daysUntilStockout} jours`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ventes moy./jour</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{f.avgDailySales} unités</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confiance IA</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{(f.confidenceScore * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommandations d'achat */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag size={18} className="text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recommandations d'achat</h2>
        </div>

        {rLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {(recommendations ?? []).length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingBag size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Aucune recommandation pour le moment</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Produit</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Stock actuel</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Demande 30j</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Qté recommandée</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Coût estimé</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Urgence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(recommendations ?? []).map((r: any) => {
                    const config = RISK_CONFIG[r.urgency as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.low;
                    return (
                      <tr key={r.productId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">{r.productName}</p>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{r.reasoning}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{r.currentStock}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{r.predictedDemand30d}</td>
                        <td className="px-4 py-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">{r.quantity}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{FCFA(r.estimatedCost)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
                            {config.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
