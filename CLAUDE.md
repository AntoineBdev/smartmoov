# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commandes

```bash
npm run dev      # Serveur de développement
npm run build    # Build production
npm run lint     # ESLint
```

## Stack technique

- **Framework** : Next.js 16 (App Router)
- **Style** : Tailwind CSS 4
- **BDD** : Supabase (PostgreSQL)
- **IA** : OpenAI GPT-4o-mini (avec function calling)
- **Itinéraires** : Google Directions API
- **Langue** : Français (parler français avec l'utilisateur)

## Architecture

### Structure principale
```
src/
├── app/                    # Routes Next.js App Router
│   ├── page.js            # Accueil (/)
│   ├── chat/page.js       # Chatbot (/chat)
│   ├── login/page.js      # Page de login
│   └── api/
│       ├── chat/route.js  # API chatbot avec function calling
│       └── login/route.js # API authentification
├── components/            # Composants React
├── lib/
│   ├── supabase.js       # Client Supabase
│   └── recherche.js      # Fonctions de recherche transport
└── middleware.js         # Protection par mot de passe (optionnelle)
```

### Flux du chatbot

1. **Frontend** (`chat/page.js`) → envoie message + historique à `/api/chat`
2. **API** (`api/chat/route.js`) → appelle OpenAI avec tools (function calling)
3. **OpenAI** → peut appeler les fonctions définies dans `lib/recherche.js`
4. **Recherche** → interroge Supabase (données Tisséo) ou Google Directions
5. **Réponse** → OpenAI formule la réponse finale

### Fonctions disponibles pour l'IA (tools)

Définies dans `lib/recherche.js` :
- `rechercherArret(nom)` - Recherche d'arrêts par nom
- `rechercherLigne(ligne)` - Recherche de lignes (A, B, L6...)
- `getArretsLigne(idLigne)` - Liste des arrêts d'une ligne
- `getLignesArret(nomArret)` - Lignes passant par un arrêt
- `getArretsCommune(commune)` - Arrêts dans une commune
- `getItineraire(depart, arrivee)` - Calcul d'itinéraire via Google Directions

## Base de données Tisséo

Tables Supabase :
| Table | Usage |
|-------|-------|
| `arrets_physiques` | Arrêts avec coordonnées, adresse, commune |
| `lignes` | Lignes de transport (métro, bus, tram) |
| `arrets_itineraire` | Arrêts sur un itinéraire avec ordre |

## Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
GOOGLE_MAPS_API_KEY
SITE_PASSWORD          # Optionnel : si défini, active la protection par mdp
```

## Couleur Tisséo

Rose Tisséo : `#e5056e` (utilisé pour les boutons et accents)