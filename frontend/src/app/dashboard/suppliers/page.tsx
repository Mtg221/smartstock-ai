'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Building2, Star } from 'lucide-react';

export default function SuppliersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/api/suppliers').then(r => r.data),
    staleTime: 30_000,
  });

  const suppliers = data?.data ?? data ?? [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Fournisseurs</h1>
        <p className="text-sm text-gray-500 mt-0.5">{suppliers.length} fournisseur{suppliers.length > 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="text-gray-400 col-span-3 text-center py-12">Chargement…</p>
        ) : suppliers.length === 0 ? (
          <div className="col-span-3 py-12 text-center">
            <Building2 size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">Aucun fournisseur enregistré</p>
          </div>
        ) : suppliers.map((s: any) => (
          <div key={s.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <Building2 size={18} className="text-emerald-600" />
              </div>
              <div className="flex items-center gap-1 text-xs text-yellow-500">
                <Star size={12} fill="currentColor" />
                <span className="text-gray-600 dark:text-gray-400 font-medium">{Number(s.rating).toFixed(1)}</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{s.name}</h3>
            {s.email && <p className="text-sm text-gray-500 mt-0.5">{s.email}</p>}
            {s.phone && <p className="text-sm text-gray-500">{s.phone}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
