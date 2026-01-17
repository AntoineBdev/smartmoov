# SmartMove - Contexte Projet

## Stack technique
- **Framework** : Next.js 14+ (App Router)
- **Style** : Tailwind CSS
- **BDD** : Supabase (PostgreSQL)
- **IA** : Groq (LLaMA)

---

## Tailwind CSS - Classes utiles

### Layout
- `flex` : display flex
- `grid` : display grid
- `flex-col` : direction colonne
- `items-center` : align-items center
- `justify-center` : justify-content center
- `justify-between` : space-between
- `gap-4` : gap de 1rem (4 x 0.25rem)

### Tailles
- `w-full` : width 100%
- `h-screen` : height 100vh
- `max-w-md` : max-width 28rem
- `p-4` : padding 1rem
- `m-4` : margin 1rem
- `px-4` : padding horizontal
- `py-2` : padding vertical

### Couleurs
- `bg-white` : fond blanc
- `bg-gray-100` : fond gris clair
- `text-gray-900` : texte noir
- `text-white` : texte blanc
- `bg-[#e5056e]` : couleur custom (rose Tisséo)

### Texte
- `text-sm` : petit texte
- `text-lg` : grand texte
- `text-xl` : très grand
- `font-bold` : gras
- `font-medium` : semi-gras

### Bordures
- `rounded` : coins arrondis
- `rounded-lg` : plus arrondis
- `rounded-full` : cercle
- `border` : bordure 1px
- `border-gray-200` : bordure grise

### Responsive (préfixes)
- `md:` : écrans >= 768px
- `lg:` : écrans >= 1024px
- Exemple : `md:flex-row` (flex-row sur tablette+)

---

## Next.js App Router - Structure

```
src/
├── app/
│   ├── layout.js      # Layout global (header, etc.)
│   ├── page.js        # Page d'accueil (/)
│   ├── chat/
│   │   └── page.js    # Page chat (/chat)
│   └── api/
│       └── chat/
│           └── route.js  # API endpoint (/api/chat)
├── components/        # Composants réutilisables
└── lib/              # Utilitaires (supabase, etc.)
```

### Pages
- `page.js` dans un dossier = une route
- `app/chat/page.js` = `/chat`

### API Routes
- `route.js` dans `app/api/` = un endpoint API
- `app/api/chat/route.js` = `POST /api/chat`

### Composants
- `"use client"` : composant côté client (useState, onClick, etc.)
- Sans directive : composant serveur (par défaut)

---

## Supabase - Fonctions principales

```javascript
import { supabase } from '@/lib/supabase'

// SELECT * FROM table
const { data } = await supabase.from('table').select('*')

// SELECT avec colonnes spécifiques
const { data } = await supabase.from('table').select('col1, col2')

// WHERE col = valeur
.eq('colonne', 'valeur')

// WHERE col LIKE '%valeur%' (insensible casse)
.ilike('colonne', '%valeur%')

// LIMIT
.limit(10)

// ORDER BY
.order('colonne', { ascending: true })
```

---

## Groq - Appel IA

```javascript
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const response = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [
    { role: "system", content: "Instructions pour l'IA" },
    { role: "user", content: "Message utilisateur" }
  ]
})

const reponse = response.choices[0].message.content
```

---

## BDD Tisséo - Tables principales

| Table | Usage |
|-------|-------|
| `arrets_physiques` | Arrêts avec coordonnées, adresse, commune |
| `arrets_logiques` | Regroupements d'arrêts |
| `lignes` | Lignes de transport (métro, bus, tram) |
| `arrets_itineraire` | Arrêts sur un itinéraire |
| `itineraires` | Parcours complets |

### Colonnes utiles
- `nom_arret` : nom de l'arrêt
- `commune` : ville
- `id_ligne` : identifiant ligne
- `ligne` : numéro/lettre de ligne (A, B, L1...)
- `nom_ligne` : nom complet
- `mode` : metro, bus, tram, tad