'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productsApi } from '@/lib/api';
import { Plus, Search, Filter, Edit2, Trash2, AlertTriangle, Package } from 'lucide-react';
import { toast } from 'sonner';

const FCFA = (n: number) => new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);

const productSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  sku: z.string().min(1, 'SKU requis'),
  purchasePrice: z.coerce.number().positive('Prix d\'achat invalide'),
  salePrice: z.coerce.number().positive('Prix de vente invalide'),
  quantity: z.coerce.number().int().min(0),
  alertThreshold: z.coerce.number().int().min(0),
  description: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productsApi.getAll({ search, limit: 50 }),
    staleTime: 30_000,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: editing,
  });

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Produit créé'); setShowModal(false); reset(); },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Erreur'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => productsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Produit mis à jour'); setShowModal(false); setEditing(null); },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Produit supprimé'); },
  });

  const onSubmit = (data: ProductForm) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const openEdit = (product: any) => {
    setEditing(product);
    reset(product);
    setShowModal(true);
  };

  const openCreate = () => {
    setEditing(null);
    reset({ quantity: 0, alertThreshold: 10 });
    setShowModal(true);
  };

  const products = data?.data ?? [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Produits</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.meta?.total ?? 0} produits au total</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition">
          <Plus size={16} /> Nouveau produit
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Produit</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">SKU</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Prix vente</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Stock</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Chargement…</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center">
                  <Package size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm">Aucun produit trouvé</p>
                </td></tr>
              ) : products.map((p: any) => {
                const isLow = p.quantity <= p.alertThreshold;
                return (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isLow && <AlertTriangle size={14} className="text-orange-500 shrink-0" />}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                          {p.category && <p className="text-xs text-gray-400">{p.category.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{FCFA(p.salePrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        isLow ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {p.quantity} unités
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => { if (confirm('Supprimer ce produit ?')) deleteMutation.mutate(p.id); }}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
              {editing ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom *</label>
                  <input {...register('name')} className="form-input w-full" placeholder="Riz importé 25kg" />
                  {errors.name && <p className="mt-0.5 text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">SKU *</label>
                  <input {...register('sku')} className="form-input w-full" placeholder="RIZ-25KG-001" />
                  {errors.sku && <p className="mt-0.5 text-xs text-red-500">{errors.sku.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantité</label>
                  <input {...register('quantity')} type="number" className="form-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prix d'achat (FCFA) *</label>
                  <input {...register('purchasePrice')} type="number" className="form-input w-full" />
                  {errors.purchasePrice && <p className="mt-0.5 text-xs text-red-500">{errors.purchasePrice.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prix de vente (FCFA) *</label>
                  <input {...register('salePrice')} type="number" className="form-input w-full" />
                  {errors.salePrice && <p className="mt-0.5 text-xs text-red-500">{errors.salePrice.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Seuil d'alerte</label>
                  <input {...register('alertThreshold')} type="number" className="form-input w-full" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                <textarea {...register('description')} rows={2} className="form-input w-full resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
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
