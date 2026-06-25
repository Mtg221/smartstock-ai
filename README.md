# SmartStock AI

> Application SaaS de gestion de stock intelligente pour PME africaines

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | Next.js 15 · React 19 · TypeScript · TailwindCSS · TanStack Query · Zustand |
| Backend | Node.js · Express · TypeScript · Prisma ORM · PostgreSQL · Redis |
| IA | Python 3.11 · FastAPI · Pandas · NumPy · Prophet · XGBoost · Scikit-Learn |
| Infra | Docker · Docker Compose · Nginx · GitHub Actions |

## Architecture des modules IA

| Module | Algorithme | Description |
|--------|-----------|-------------|
| Prévision rupture | Moyenne pondérée + tendance linéaire | Estimation des jours avant rupture de stock |
| Recommandations d'achat | EOQ (Economic Order Quantity) | Quantité optimale à commander |
| Analyse des tendances | Agrégation Pandas + heuristiques | Insights sur les ventes par catégorie/période |
| Détection d'anomalies | Z-score + IQR | Détection de mouvements de stock anormaux |

## Démarrage rapide

### Prérequis
- Docker & Docker Compose
- Node.js 20+ (développement local)
- Python 3.11+ (développement local)

### Installation

```bash
# 1. Cloner et configurer
git clone <repo>
cd smartstock-ai
cp .env.example .env
# Éditer .env avec vos valeurs

# 2. Lancer avec Docker Compose
docker compose up -d

# 3. Initialiser la base de données
docker compose exec backend npm run db:push
docker compose exec backend npm run db:seed

# 4. Accéder à l'application
# Frontend : http://localhost (port 80 via Nginx)
# API : http://localhost/api
# Swagger : http://localhost/api/docs
```

### Développement local (sans Docker)

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev  # port 4000

# Frontend (nouveau terminal)
cd frontend
npm install
npm run dev  # port 3000

# Service IA (nouveau terminal)
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Comptes de démo (après seed)

Les identifiants de démo sont définis dans `backend/prisma/seed.ts`.
Lancez `npm run db:seed` pour les créer.

## Structure du projet

```
smartstock-ai/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Schéma PostgreSQL (17 tables)
│   │   └── seed.ts                # Données de démo
│   └── src/
│       ├── controllers/           # Auth, Products, Sales, AI
│       ├── middlewares/           # JWT, RBAC, Audit
│       ├── routes/                # REST API routes
│       ├── config/                # Prisma, Redis, Swagger
│       └── utils/                 # Logger (Winston)
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── login/             # Page de connexion + 2FA
│       │   └── dashboard/
│       │       ├── layout.tsx     # Sidebar + navigation
│       │       ├── page.tsx       # Tableau de bord + KPIs
│       │       ├── products/      # CRUD produits
│       │       ├── sales/         # Enregistrement ventes
│       │       ├── reports/       # Rapports graphiques
│       │       └── ai/            # Prévisions IA
│       ├── stores/                # Zustand (auth)
│       └── lib/                   # Axios client + API helpers
│
├── ai-service/
│   └── main.py                    # FastAPI : 4 modules IA
│
├── docker/
│   └── nginx.conf                 # Reverse proxy
├── .github/workflows/ci-cd.yml    # Pipeline CI/CD
└── docker-compose.yml
```

## API REST — Endpoints principaux

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
GET    /api/auth/2fa/setup
POST   /api/auth/2fa/verify

GET    /api/products               (pagination, search, filtre)
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id
GET    /api/products/alerts/low-stock
GET    /api/products/stats/dashboard

GET    /api/sales
POST   /api/sales                  (transaction atomique)
PATCH  /api/sales/:id/cancel

GET    /api/reports/revenue
GET    /api/reports/top-products

GET    /api/ai/forecasts           (prévisions rupture)
GET    /api/ai/recommendations     (recommandations achat)
GET    /api/ai/trends              (tendances ventes)
GET    /api/ai/anomalies           (détection fraudes)
```

## Sécurité implémentée

- JWT access (15min) + refresh token (7j) avec rotation
- Double authentification TOTP (otplib + QR code)
- Bcrypt (salt rounds: 12)
- RBAC (4 rôles : admin, directeur, gestionnaire, employé)
- Rate limiting (200 req/15min)
- Helmet (headers de sécurité)
- CORS strict (domaines autorisés uniquement)
- Audit logs automatiques sur toutes les mutations
- Blacklist des tokens révoqués dans Redis

## CI/CD

Le pipeline GitHub Actions :
1. Lance les tests backend (PostgreSQL + Redis en service)
2. Lance les tests du service IA
3. Build et push les images Docker vers GitHub Container Registry
4. Déploie en production via SSH sur le serveur

## Déploiement production

```bash
# Sur le serveur de production
git clone <repo> /opt/smartstock-ai
cd /opt/smartstock-ai
cp .env.example .env
# Configurer .env avec les vraies valeurs

docker compose -f docker-compose.yml up -d
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run db:seed
```

## Personnalisation Sénégal / Afrique de l'Ouest

- Devise par défaut : **FCFA (XOF)**
- Paramètre pays : `SN` (Sénégal)
- Format numérique : `fr-SN` (Intl.NumberFormat)
- Prêt pour intégration **Orange Money / Wave** (ajout d'un service de paiement)
- Architecture multi-entreprise (SaaS) — une instance, plusieurs PME
