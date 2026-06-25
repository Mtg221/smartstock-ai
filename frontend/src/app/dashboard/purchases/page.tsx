'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ShoppingBag } from 'lucide-react';

const FCFA = (n: number) => new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);

export default function PurchasesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => api.get('/api/purchases').then(r => r.data),
    staleTime: 30_000,
  });

  const purchases = data?.data ?? data ?? [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Achats</h1>
        <p className="text-sm text-gray-500 mt-0.5">Historique des commandes fournisseurs</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Fournisseur</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={4} className="py-8 text-center text-gray-400">Chargement…</td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center">
                  <ShoppingBag size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm">Aucun achat enregistré</p>
                </td></tr>
              ) : purchases.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.supplier?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.orderDate).toLocaleDateString('fr-SN')}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{FCFA(p.totalAmount)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      p.status === 'received'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {p.status === 'received' ? 'Reçu' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
