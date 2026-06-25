'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi, productsApi } from '@/lib/api';
import { Plus, Minus, ShoppingCart, X, Search, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const FCFA = (n: number) =>
  new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

export default function SalesPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const qc = useQueryClient();

  const { data: productsData } = useQuery({
    queryKey: ['products', productSearch],
    queryFn: () => productsApi.getAll({ search: productSearch, limit: 20 }),
    staleTime: 30_000,
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesApi.getAll({ limit: 30 }),
    enabled: tab === 'history',
    staleTime: 30_000,
  });

  const saleMutation = useMutation({
    mutationFn: salesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Vente enregistrée avec succès');
      setCart([]);
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Erreur lors de la vente'),
  });

  const cancelMutation = useMutation({
    mutationFn: salesApi.cancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Vente annulée');
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Erreur'),
  });

  const addToCart = (product: any) => {
    setCart(prev => {
      const exists = prev.find(i => i.productId === product.id);
      if (exists) {
        if (exists.quantity >= product.quantity) {
          toast.error(`Stock maximum atteint (${product.quantity})`);
          return prev;
        }
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (product.quantity === 0) {
        toast.error('Produit en rupture de stock');
        return prev;
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        unitPrice: parseFloat(product.salePrice),
        quantity: 1,
        maxStock: product.quantity,
      }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return i;
      if (newQty > i.maxStock) { toast.error(`Stock max: ${i.maxStock}`); return i; }
      return { ...i, quantity: newQty };
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const cartTotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const submitSale = () => {
    if (cart.length === 0) return toast.error('Panier vide');
    saleMutation.mutate({
      items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
    });
  };

  const products = productsData?.data ?? [];
  const sales = salesData?.data ?? [];

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {[{ key: 'new', label: 'Nouvelle vente' }, { key: 'history', label: 'Historique' }].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === key
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'new' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Product selector */}
          <div className="lg:col-span-3 space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Rechercher un produit à ajouter..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
              {products.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.quantity === 0}
                  className={`text-left p-4 rounded-xl border transition ${
                    p.quantity === 0
                      ? 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-emerald-400 hover:shadow-sm cursor-pointer'
                  }`}
                >
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.sku}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-semibold text-emerald-600">{FCFA(p.salePrice)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      p.quantity <= p.alertThreshold
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {p.quantity} en stock
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden sticky top-6">
              <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
                <ShoppingCart size={16} className="text-emerald-500" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Panier</h2>
                <span className="ml-auto text-xs text-gray-500">{cart.length} article{cart.length > 1 ? 's' : ''}</span>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">Ajoutez des produits</p>
                ) : cart.map(item => (
                  <div key={item.productId} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{FCFA(item.unitPrice)} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.productId, -1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, 1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="text-right min-w-[70px]">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{FCFA(item.quantity * item.unitPrice)}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.productId)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sous-total</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{FCFA(cartTotal)}</span>
                  </div>
                  <button
                    onClick={submitSale}
                    disabled={saleMutation.isPending}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
                  >
                    {saleMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Valider la vente · {FCFA(cartTotal)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* History */
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Vendeur</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Articles</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {salesLoading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-400">Chargement…</td></tr>
                ) : sales.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {new Date(s.saleDate).toLocaleString('fr-SN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                      {s.user?.firstName} {s.user?.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {s.saleItems?.length ?? 0} article{(s.saleItems?.length ?? 0) > 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                      {FCFA(s.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        s.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {s.status === 'completed' ? 'Complétée' : 'Annulée'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status === 'completed' && (
                        <button
                          onClick={() => { if (confirm('Annuler cette vente ?')) cancelMutation.mutate(s.id); }}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline"
                        >
                          Annuler
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
