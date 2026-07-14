'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Building2, Star, Plus, Pencil, Trash2 } from 'lucide-react';

const supplierSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type SupplierForm = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === 'admin' || role === 'gestionnaire';
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/api/suppliers').then(r => r.data),
    staleTime: 30_000,
  });

  const suppliers = data?.data ?? data ?? [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
  });

  const createMutation = useMutation({
    mutationFn: (body: SupplierForm) => api.post('/api/suppliers', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); toast.success('Fournisseur créé'); setShowModal(false); reset(); },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Erreur'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: SupplierForm }) => api.put(`/api/suppliers/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); toast.success('Fournisseur mis à jour'); setShowModal(false); setEditing(null); reset(); },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/suppliers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); toast.success('Fournisseur supprimé'); },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Erreur'),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', email: '', phone: '', address: '' });
    setShowModal(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    reset({ name: s.name, email: s.email ?? '', phone: s.phone ?? '', address: s.address ?? '' });
    setShowModal(true);
  };

  const onSubmit = (body: SupplierForm) => {
    if (editing) updateMutation.mutate({ id: editing.id, body });
    else createMutation.mutate(body);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Fournisseurs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{suppliers.length} fournisseur{suppliers.length > 1 ? 's' : ''}</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition">
            <Plus size={16} />
            Ajouter un fournisseur
          </button>
        )}
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
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-yellow-500">
                  <Star size={12} fill="currentColor" />
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{Number(s.rating).toFixed(1)}</span>
                </div>
                {canManage && (
                  <>
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition" title="Modifier">
                      <Pencil size={14} />
                    </button>
                    {role === 'admin' && (
                      <button
                        onClick={() => { if (confirm(`Supprimer le fournisseur « ${s.name} » ?`)) deleteMutation.mutate(s.id); }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{s.name}</h3>
            {s.email && <p className="text-sm text-gray-500 mt-0.5">{s.email}</p>}
            {s.phone && <p className="text-sm text-gray-500">{s.phone}</p>}
            {s.address && <p className="text-sm text-gray-500">{s.address}</p>}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
              {editing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom *</label>
                <input {...register('name')} className="form-input w-full" placeholder="SODEFITEX SA" />
                {errors.name && <p className="mt-0.5 text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                  <input {...register('email')} type="email" className="form-input w-full" placeholder="contact@fournisseur.sn" />
                  {errors.email && <p className="mt-0.5 text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Téléphone</label>
                  <input {...register('phone')} className="form-input w-full" placeholder="+221 77 123 45 67" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Adresse</label>
                <input {...register('address')} className="form-input w-full" placeholder="Dakar, Sénégal" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition disabled:opacity-60">
                  {editing ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
