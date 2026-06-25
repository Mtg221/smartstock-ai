'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Users, Shield } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  directeur: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  gestionnaire: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  employe: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export default function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/api/users').then(r => r.data),
    staleTime: 30_000,
  });

  const users = data?.data ?? data ?? [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Utilisateurs</h1>
        <p className="text-sm text-gray-500 mt-0.5">{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Utilisateur</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Rôle</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={4} className="py-8 text-center text-gray-400">Chargement…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center">
                  <Users size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm">Aucun utilisateur</p>
                </td></tr>
              ) : users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{u.firstName} {u.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[u.role?.name] ?? ROLE_COLORS.employe}`}>
                      {u.role?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      u.isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {u.isActive ? 'Actif' : 'Inactif'}
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
