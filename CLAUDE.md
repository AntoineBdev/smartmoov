# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commandes

```bash
npm run dev      # Serveur de développement (http://localhost:3000)
npm run build    # Build production
npm run lint     # ESLint
npm run start    # Démarrer en production (après build)
```

## Stack technique

- **Framework** : Next.js 16 (App Router, React 19, React Compiler)
- **Style** : Tailwind CSS 4
- **BDD** : Supabase (PostgreSQL avec pg_trgm pour recherche fuzzy)
- **IA** : OpenAI GPT-4o-mini (avec function calling / tools)
- **Itinéraires** : Google Directions API (mode transit)
- **Langue** : Français (code et commentaires en français, parler français avec l'utilisateur)
- **Dépendances supplémentaires** : `@google/generative-ai`, `groq-sdk` (présentes dans package.json)

## Architecture

### Flux principal du chatbot

```
┌─────────────────┐     POST /api/chat      ┌──────────────────┐
│  chat/page.js   │ ──────────────────────► │ api/chat/route.js│
│  (Client React) │  message + historique   │   (API Route)    │
└─────────────────┘                         └────────┬─────────┘
        ▲                                            │
        │                                            ▼
        │                                   ┌──────────────────┐
        │                                   │     OpenAI       │
        │                                   │  (GPT-4o-mini)   │
        │                                   └────────┬─────────┘
        │                                            │ tool_calls
        │                                            ▼
        │                                   ┌──────────────────┐
        │                                   │ lib/recherche.js │
        │                                   │  (11 fonctions)  │
        │                                   └────────┬─────────┘
        │                                            │
        │                              ┌─────────────┼─────────────┐
        │                              ▼                           ▼
        │                     ┌─────────────────┐        ┌─────────────────┐
        │                     │    Supabase     │        │ Google Directions│
        │                     │ (données Tisséo)│        │  (itinéraires)  │
        │                     └─────────────────┘        └─────────────────┘
        │                                            │
        └────────────────────────────────────────────┘
                         réponse formatée
```

### Boucle de function calling

L'API `/api/chat/route.js` utilise une boucle (max 5 itérations) :
1. Envoie le message à OpenAI avec les tools disponibles
2. Si OpenAI demande un tool_call → exécute la fonction correspondante
3. Ajoute le résultat aux messages et renvoie à OpenAI
4. Répète jusqu'à une réponse finale (sans tool_call)

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/app/api/chat/route.js` | API principale : system prompt, définition des tools OpenAI, boucle de function calling |
| `src/lib/recherche.js` | 11 fonctions de recherche (Tisséo + SNCF) |
| `src/lib/supabase.js` | Client Supabase singleton |
| `src/app/chat/page.js` | Interface chat avec géolocalisation automatique (navigator.geolocation) |
| `src/app/page.js` | Landing page (HeroSection, FeaturesSection, CTASection) |
| `src/app/login/page.js` | Page de login (protection par mot de passe) |
| `src/middleware.js` | Protection par mot de passe + mode maintenance |
| `src/components/Header.js` | Navigation + toggle dark mode (localStorage) |

### Fonctions tools pour OpenAI

Définies dans `lib/recherche.js`, déclarées dans `api/chat/route.js` :

**Tisséo (transports urbains)**
| Fonction | Usage |
|----------|-------|
| `rechercherArret(nom)` | Recherche arrêts (exacte puis fuzzy via pg_trgm) |
| `rechercherLigne(ligne)` | Info sur une ligne (A, B, L6, T1...) |
| `getArretsLigne(idLigne)` | Liste ordonnée des arrêts d'une ligne |
| `getLignesArret(nomArret)` | Lignes passant par un arrêt |
| `getArretsCommune(commune)` | Arrêts dans une commune |
| `getItineraire(depart, arrivee)` | Calcul via Google Directions (accepte coordonnées GPS ou adresse) |

**SNCF (trains TER/TGV/Intercités)**
| Fonction | Usage |
|----------|-------|
| `rechercherGare(nom)` | Recherche gare SNCF (retourne id_sncf pour les autres fonctions) |
| `getGareLaPlusProche(lat, lon)` | Trouve la gare SNCF la plus proche d'une position GPS |
| `getItineraireSNCF(departId, arriveeId)` | Calcul itinéraire train entre 2 gares |
| `getLignesGare(gareId)` | Lignes de train passant par une gare |
| `getProchainsDepartsSNCF(gareId)` | Prochains départs temps réel d'une gare |

## Base de données Supabase

Tables :
- `arrets_physiques` : nom_arret, commune, adresse + coordonnées
- `lignes` : ligne, nom_ligne, mode (metro/bus/tram), couleur
- `arrets_itineraire` : liaison ligne↔arrêt avec ordre
- `gares_sncf` : id_sncf, nom_gare, commune, lat, lon

Fonctions RPC :
- `recherche_arret_fuzzy(search_term)` : recherche arrêts avec tolérance aux fautes
- `recherche_gare_fuzzy(search_term)` : recherche gares SNCF avec tolérance aux fautes

Scripts de création : `Docs/schema.sql`, `Docs/gares_sncf.sql`
Documentation complète du schéma : `Docs/sql/00_schema_documentation.md`

## Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
GOOGLE_MAPS_API_KEY
API_KEY_SNCF           # API SNCF pour les horaires trains temps réel
SITE_PASSWORD          # Optionnel : active la protection par mdp si défini
MAINTENANCE_MODE       # Optionnel : "true" → 503 sur tout le site
```

## Middleware (src/middleware.js)

1. **Mode maintenance** : Si `MAINTENANCE_MODE=true` → retourne 503 pour toutes les requêtes
2. **Protection par mot de passe** : Si `SITE_PASSWORD` défini → redirige vers `/login` si pas authentifié (cookie `auth=true`)
3. Exclusions : `/_next/*`, `/favicon*`, `/login`, `/api/login`

## Zone couverte

- **Zone** : Occitanie uniquement (Toulouse, Montpellier, Narbonne, Perpignan, Carcassonne, Albi, etc.)
- **Transports urbains** : Tisséo (Toulouse) via Supabase + Google Directions
- **Trains** : TER Occitanie, TGV, Intercités via API SNCF (temps réel)

## Couleurs

- Rose Tisséo : `#e5056e`
- Dégradé principal : `from-[#e5056e] to-[#2d1d67]`

## Ajouter un nouveau tool OpenAI

1. Créer le fichier SQL dans `Docs/sql/` et exécuter dans Supabase SQL Editor
2. Ajouter la fonction de recherche dans `src/lib/recherche.js`
3. Déclarer le tool (schema JSON) dans `src/app/api/chat/route.js` (tableau `tools`)
4. Ajouter le `case` dans la fonction `executeTool()` de `route.js`
5. Mettre à jour le system prompt si nécessaire

## Path alias

`@/*` → `./src/*` (configuré dans jsconfig.json)