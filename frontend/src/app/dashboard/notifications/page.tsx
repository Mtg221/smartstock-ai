'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
    staleTime: 30_000,
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('Toutes les notifications lues'); },
  });

  const notifications = data ?? [];
  const unread = notifications.filter((n: any) => !n.isRead).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">{unread} non lue{unread > 1 ? 's' : ''}</p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <CheckCheck size={16} /> Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-center text-gray-400 py-12">Chargement…</p>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">Aucune notification</p>
          </div>
        ) : notifications.map((n: any) => (
          <div
            key={n.id}
            className={`flex items-start gap-4 p-4 rounded-xl border transition ${
              n.isRead
                ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900'
            }`}
          >
            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.isRead ? 'bg-gray-300' : 'bg-emerald-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 dark:text-gray-200">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(n.sentAt).toLocaleString('fr-SN')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
