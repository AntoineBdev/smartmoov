# SmartMoov

Assistant intelligent pour les transports en commun en Occitanie (Tisséo + TER).

## Fonctionnalités

- **Chatbot conversationnel** : Pose tes questions en français, SmartMoov te répond
- **Calcul d'itinéraires** : Trajets en métro, bus, tram via Google Directions API
- **Recherche d'arrêts** : Recherche fuzzy tolérante aux fautes de frappe
- **Géolocalisation** : Détection automatique de ta position comme point de départ
- **Dark mode** : Interface claire ou sombre selon tes préférences

## Stack technique

- **Framework** : Next.js 16 (App Router, React 19)
- **Style** : Tailwind CSS 4
- **BDD** : Supabase (PostgreSQL + pg_trgm)
- **IA** : OpenAI GPT-4o-mini (function calling)
- **Itinéraires** : Google Directions API

## Installation

```bash
# Cloner le repo
git clone https://github.com/ton-username/smartmoov.git
cd smartmoov

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Puis remplir les valeurs dans .env.local

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans ton navigateur.

## Variables d'environnement

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
OPENAI_API_KEY=sk-xxx
GOOGLE_MAPS_API_KEY=xxx

# Optionnel
SITE_PASSWORD=           # Active la protection par mot de passe si défini
MAINTENANCE_MODE=false   # "true" pour activer le mode maintenance
```

## Scripts

```bash
npm run dev      # Serveur de développement
npm run build    # Build production
npm run start    # Démarrer en production
npm run lint     # Linter ESLint
```

## Zone couverte

SmartMoov couvre la région **Occitanie** : Toulouse, Montpellier, Narbonne, Perpignan, Carcassonne, Albi, Tarbes, Rodez, Cahors, Montauban, Nîmes, Béziers, Auch, Foix...

## Licence

MIT