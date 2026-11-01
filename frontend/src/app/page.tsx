'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Brain,
  Package,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  ShieldCheck,
  CheckCircle2,
  Zap,
  BarChart3,
  ArrowRight,
  Sparkles,
  Truck,
  Building2,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white font-sans">

      {/* Sticky Header */}
      <header className="fixed top-0 w-full z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Brain className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              SmartStock <span className="text-emerald-600 dark:text-emerald-400">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#fonctionnalites" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Fonctionnalités</a>
            <a href="#apercu" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Aperçu direct</a>
            <a href="#temoignages" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Témoignages</a>
            <a href="#faq" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-emerald-500/25 focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Essai Gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-sm mb-6">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Moteur prédictif conçu pour les PME d'Afrique de l'Ouest et Centrale</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-6">
            Zéro rupture de stock.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400">
              Anticipation assistée par IA.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            SmartStock AI prédit la rupture de vos produits clés jusqu’à 30 jours à l’avance, calibre vos réapprovisionnements (EOQ) et maximise votre trésorerie en FCFA.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-all shadow-lg shadow-emerald-600/25 focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Démarrer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#apercu"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-7 py-3.5 rounded-xl font-semibold text-base transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Voir la démo interactive
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Sans engagement de carte bancaire
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Devise XOF (FCFA) par défaut
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Double authentification 2FA & Audit Log
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Mockup Preview Banner */}
      <section id="apercu" className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4 sm:p-6 lg:p-8 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-mono text-slate-400 hidden sm:inline">dashboard.smartstock-ai.com</span>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Moteur IA Actif
              </div>
            </div>

            {/* Dashboard Mockup Body */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Chiffre d'affaires mensuel</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">14 850 000 FCFA</p>
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold mt-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +18.4% vs mois précédent
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Taux de service / Disponibilité</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">98.7%</p>
                <p className="text-xs text-slate-500 mt-2">420 références sous surveillance</p>
              </div>

              <div className="p-4 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">Alerte IA Rupture Imminente</p>
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1">Huile Végétale 5L (Carton 4)</p>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">
                  Épuisement prévu dans <strong>3 jours</strong> · Commande EOQ: <strong>48 cartons</strong>
                </p>
              </div>
            </div>

            {/* Action Preview */}
            <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-600/30 text-emerald-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Génération automatique du bon de commande fournisseur</p>
                  <p className="text-xs text-slate-400">Calcul du volume optimal selon le délai d'acheminement et les coûts de stockage</p>
                </div>
              </div>
              <Link
                href="/login"
                className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
              >
                Tester l'assistant IA
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-14 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">-35%</div>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">de capital immobilisé</p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">99.2%</div>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">de prédictions fiables</p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">4 Rôles</div>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">Gestion fine des accès (RBAC)</p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">24/7</div>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">Assistant conversationnel IA</p>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="fonctionnalites" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Une plateforme tout-en-un pour la gestion commerciale & logistique
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg mt-4">
              Conçue pour remplacer les fichiers Excel dispersés par une interface collaborative, rapide et intelligente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Package,
                title: 'Catalogue Produits & Barcodes',
                desc: 'Suivi des stocks en temps réel avec références SKU, codes-barres, seuils d\'alerte paramétrables et valorisation PMP/FIFO.',
              },
              {
                icon: Brain,
                title: 'Prévisions IA des Ruptures',
                desc: 'Algorithmes combinant séries temporelles et tendances pour estimer les jours d\'autonomie avant rupture.',
              },
              {
                icon: ShoppingCart,
                title: 'Point de Vente & Facturation',
                desc: 'Enregistrement ultra-rapide des ventes au comptoir, déduction de stock immédiate et historique des paiements par caisse.',
              },
              {
                icon: Truck,
                title: 'Approvisionnements & EOQ',
                desc: 'Calcul de la Quantité Économique de Commande pour minimiser à la fois les frais de commande et de conservation.',
              },
              {
                icon: BarChart3,
                title: 'Rapports & KPIs Financiers',
                desc: 'Chiffre d\'affaires journalier/mensuel, marge brute, top 10 des produits les plus rentables et détection d\'anomalies.',
              },
              {
                icon: ShieldCheck,
                title: 'Sécurité & Traçabilité Complète',
                desc: 'Protection par double facteur TOTP (2FA), journal d\'audit complet de chaque modification et sessions chiffrées JWT.',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section id="temoignages" className="py-20 bg-slate-100/70 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Ce qu'en disent les gestionnaires</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Plusieurs dizaines de commerçants et grossistes utilisent SmartStock au quotidien.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed italic mb-4">
                "Avant SmartStock AI, nous constations régulièrement des ruptures sur le lait concentré et le riz sans comprendre nos cycles de réapprovisionnement. Les alertes nous ont fait gagner 2 semaines de visibilité."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  MD
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Mamadou Diop</p>
                  <p className="text-xs text-slate-500">Grossiste Alimentaire, Dakar</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed italic mb-4">
                "La simplicité de l'interface et la gestion par rôles m'ont permis de former mes caissiers en moins d'une demi-journée. Le contrôle des stocks à distance depuis mon téléphone est un vrai atout."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-sm">
                  AK
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Amina Koné</p>
                  <p className="text-xs text-slate-500">Distribution Cosmétique & Pharmacie, Abidjan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Questions fréquentes</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Tout ce que vous devez savoir pour démarrer</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Mes données d\'inventaire sont-elles confidentielles et protégées ?',
                a: 'Oui. Chaque entreprise dispose d\'une isolation stricte de ses données (isolation multi-tenant). Les mots de passe sont hachés avec Argon2id, les connexions sont sécurisées par JWT et nous supportons le 2FA obligatoire pour les administrateurs.',
              },
              {
                q: 'Comment l\'IA calcule-t-elle les prévisions de stock ?',
                a: 'Le moteur analyse vos séries temporelles de vente, calcule la vélocité quotidienne et applique la formule de Wilson (EOQ) pour suggérer la quantité exacte à commander selon le délai moyen de livraison de vos fournisseurs.',
              },
              {
                q: 'Puis-je utiliser l\'application sans connexion Internet continue ?',
                a: 'SmartStock AI est une Progressive Web App optimisée pour les débits mobiles avec cache local TanStack Query. Les données sont automatiquement synchronisées dès la reconnexion.',
              },
              {
                q: 'Quels sont les rôles utilisateurs disponibles ?',
                a: 'L\'application propose 4 niveaux d\'accès : Superadmin (gestion multi-entreprises), Admin (paramètres et finances), Gestionnaire (achats, stocks et fournisseurs) et Employé/Caissier (ventes et consultation).',
              },
            ].map((faq, i) => (
              <div
                key={faq.q}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full p-5 text-left flex items-center justify-between text-slate-900 dark:text-white font-semibold text-sm sm:text-base focus:outline-none"
                  aria-expanded={openFaq === i}
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* High-Converting CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Prenez le contrôle de votre stock dès aujourd'hui
          </h2>
          <p className="text-emerald-100 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Rejoignez les gestionnaires qui anticipent leurs ruptures de stock au lieu de les subir. Déploiement en 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-white text-emerald-800 hover:bg-slate-100 px-8 py-4 rounded-xl font-bold text-base transition-all shadow-xl focus-visible:ring-2 focus-visible:ring-white"
            >
              Accéder à l'application
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <Brain className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">SmartStock AI</span>
          </div>

          <p>© {new Date().getFullYear()} SmartStock AI · SaaS de gestion de stock pour PME africaines. Tous droits réservés.</p>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-emerald-600 transition-colors">Connexion</Link>
            <a href="#fonctionnalites" className="hover:text-emerald-600 transition-colors">Fonctionnalités</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
