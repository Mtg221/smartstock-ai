import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-lg">SmartStock <span className="text-emerald-500">AI</span></span>
          </div>
          <Link
            href="/login"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
          >
            Se connecter
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-emerald-100 dark:border-emerald-900">
            Gestion de stock intelligente pour PME africaines
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Gérez votre stock<br />
            <span className="text-emerald-500">avec l'intelligence artificielle</span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            SmartStock AI prédit les ruptures de stock, recommande vos achats et détecte les anomalies — pour que vous ne manquiez jamais de rien.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition shadow-lg shadow-emerald-200 dark:shadow-none"
            >
              Commencer gratuitement
            </Link>
            <a
              href="#fonctionnalites"
              className="border border-gray-200 dark:border-gray-700 hover:border-emerald-400 text-gray-700 dark:text-gray-300 px-8 py-3.5 rounded-xl font-semibold text-lg transition"
            >
              Voir les fonctionnalités
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '99.9%', label: 'Disponibilité' },
            { value: '< 1s', label: 'Temps de réponse' },
            { value: '4 rôles', label: 'Gestion des accès' },
            { value: '2FA', label: 'Sécurité renforcée' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-extrabold text-emerald-500">{stat.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Une suite complète pour piloter votre stock sans effort</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '📦',
                title: 'Gestion des produits',
                desc: 'Catalogue complet avec codes-barres, alertes de seuil, prix d\'achat et de vente, et suivi en temps réel.',
              },
              {
                icon: '🤖',
                title: 'Prévisions IA',
                desc: 'Notre algorithme analyse vos historiques de vente et prédit les ruptures avant qu\'elles n\'arrivent.',
              },
              {
                icon: '💡',
                title: 'Recommandations d\'achat',
                desc: 'Quantités optimales à commander calculées automatiquement selon la méthode EOQ.',
              },
              {
                icon: '📊',
                title: 'Rapports & tendances',
                desc: 'Tableaux de bord visuels, chiffre d\'affaires, top produits et analyse des tendances par période.',
              },
              {
                icon: '🔐',
                title: 'Sécurité avancée',
                desc: 'JWT, double authentification (2FA), RBAC à 4 niveaux et audit log sur toutes les actions.',
              },
              {
                icon: '🌍',
                title: 'Adapté à l\'Afrique',
                desc: 'Devise FCFA par défaut, format sénégalais, et prêt pour l\'intégration Orange Money / Wave.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-24 px-6 bg-emerald-500">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Prêt à optimiser votre stock ?</h2>
          <p className="text-emerald-100 text-lg mb-10">
            Rejoignez les PME qui font confiance à SmartStock AI pour piloter leur inventaire.
          </p>
          <Link
            href="/login"
            className="bg-white text-emerald-600 hover:bg-emerald-50 px-10 py-4 rounded-xl font-bold text-lg transition shadow-xl"
          >
            Accéder à l'application
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span>SmartStock AI</span>
          </div>
          <span>© {new Date().getFullYear()} SmartStock AI — Tous droits réservés</span>
          <Link href="/login" className="text-emerald-500 hover:underline">Se connecter</Link>
        </div>
      </footer>

    </div>
  );
}
