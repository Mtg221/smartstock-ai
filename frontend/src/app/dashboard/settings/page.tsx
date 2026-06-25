'use client';

import { useAuthStore } from '@/stores/auth.store';
import { Settings, User, Shield, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez votre compte et vos préférences</p>
      </div>

      <div className="space-y-4">
        {/* Profil */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <User size={18} className="text-emerald-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Profil</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-xl font-bold text-white shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Rôle */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={18} className="text-emerald-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Rôle & Permissions</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-sm font-medium capitalize">
              {user?.role ?? 'Utilisateur'}
            </span>
            <span className="text-sm text-gray-500">Attribué par l'administrateur</span>
          </div>
        </div>

        {/* Sécurité */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={18} className="text-emerald-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Sécurité</h2>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Double authentification (2FA)</p>
              <p className="text-xs text-gray-500 mt-0.5">Sécurisez votre compte avec une application TOTP</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              user?.twoFaEnabled
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {user?.twoFaEnabled ? 'Activé' : 'Désactivé'}
            </span>
          </div>
        </div>

        {/* App info */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
          <p className="text-xs text-gray-400">SmartStock AI — Version 1.0.0</p>
          <p className="text-xs text-gray-400 mt-0.5">Gestion de stock intelligente pour PME africaines</p>
        </div>
      </div>
    </div>
  );
}
