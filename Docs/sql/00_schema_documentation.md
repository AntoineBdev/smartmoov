# Schéma Base de Données SmartMoov

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TISSÉO (Toulouse)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────┐         ┌──────────────────┐                        │
│   │  arrets_physiques │         │      lignes      │                        │
│   │  (arrêts bus/     │         │  (A, B, L1, T1)  │                        │
│   │   métro/tram)     │         │                  │                        │
│   └────────┬─────────┘         └────────┬─────────┘                        │
│            │                            │                                   │
│            │    ┌───────────────────────┘                                   │
│            │    │                                                           │
│            ▼    ▼                                                           │
│   ┌──────────────────┐                                                      │
│   │ arrets_itineraire │  ← Fait le lien ligne ↔ arrêt (avec ordre)         │
│   └──────────────────┘                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            SNCF (Occitanie)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────┐                                                      │
│   │    gares_sncf    │  ← 362 gares TER/TGV/Intercités                     │
│   │                  │                                                      │
│   │  Données locales │  → Recherche fuzzy rapide                           │
│   └────────┬─────────┘                                                      │
│            │                                                                │
│            │  id_sncf                                                       │
│            ▼                                                                │
│   ┌──────────────────┐                                                      │
│   │    API SNCF      │  ← Temps réel (lignes, horaires, itinéraires)       │
│   │   (externe)      │                                                      │
│   └──────────────────┘                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tables Tisséo

### `arrets_physiques`
Tous les arrêts de bus, métro et tram du réseau Tisséo.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | BIGSERIAL | Clé primaire |
| `id_hastus` | TEXT | Identifiant unique Tisséo (clé pour jointures) |
| `nom_arret` | TEXT | Nom de l'arrêt (ex: "Jean Jaurès") |
| `adresse` | TEXT | Adresse postale |
| `commune` | TEXT | Commune (ex: "Toulouse") |
| `code_insee` | TEXT | Code INSEE de la commune |
| `x_phys`, `y_phys` | NUMERIC | Coordonnées GPS |
| `geo_point_2d` | JSONB | Point géographique |

**Utilisée par** : `rechercherArret()`, `getArretsCommune()`

---

### `lignes`
Toutes les lignes de transport Tisséo.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | BIGSERIAL | Clé primaire |
| `id_ligne` | TEXT | Identifiant unique (clé pour jointures) |
| `ligne` | TEXT | Code court (ex: "A", "B", "L1", "T1", "14") |
| `nom_ligne` | TEXT | Nom complet (ex: "Métro Ligne A") |
| `mode` | TEXT | Type : `metro`, `bus`, `tram` |
| `couleur` | TEXT | Code couleur hex (ex: "#E5056E") |

**Utilisée par** : `rechercherLigne()`

---

### `arrets_itineraire`
Table de liaison entre les lignes et leurs arrêts, **dans l'ordre du parcours**.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | BIGSERIAL | Clé primaire |
| `id_ligne` | TEXT | → `lignes.id_ligne` |
| `ligne` | TEXT | Code court de la ligne |
| `nom_ligne` | TEXT | Nom de la ligne |
| `id_hastus` | TEXT | → `arrets_physiques.id_hastus` |
| `nom_arret` | TEXT | Nom de l'arrêt |
| `ordre` | INTEGER | Position sur la ligne (1, 2, 3...) |
| `sens` | INTEGER | Direction (1 ou 2) |
| `mode` | TEXT | Type de transport |

**Utilisée par** : `getArretsLigne()`, `getLignesArret()`

**Relations** :
- `id_ligne` → `lignes.id_ligne`
- `id_hastus` → `arrets_physiques.id_hastus`

---

## Tables SNCF

### `gares_sncf`
Toutes les gares SNCF desservies en Occitanie (TER liO, TGV, Intercités).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | BIGSERIAL | Clé primaire |
| `id_sncf` | TEXT | Identifiant API SNCF (ex: "stop_area:SNCF:87611004") |
| `nom_gare` | TEXT | Nom de la gare (ex: "Toulouse Matabiau") |
| `commune` | TEXT | Commune |
| `code_postal` | TEXT | Code postal |
| `code_insee` | TEXT | Code INSEE |
| `lat`, `lon` | NUMERIC | Coordonnées GPS |

**Utilisée par** : `rechercherGare()`

**Note** : Les lignes et horaires ne sont PAS stockés, ils sont récupérés en temps réel via l'API SNCF.

---

## Tables supplémentaires (non utilisées actuellement)

Ces tables existent dans la BDD mais ne sont pas utilisées par le chatbot :

| Table | Description |
|-------|-------------|
| `arrets_logiques` | Regroupement logique d'arrêts physiques |
| `itineraires` | Itinéraires types Tisséo |
| `tia` | Tronçons inter-arrêts |
| `tia_itineraire` | Liaison tronçons-itinéraires |
| `tad_zones` | Zones de Transport à la Demande |

---

## Fonctions RPC

### `recherche_arret_fuzzy(search_term TEXT)`
Recherche un arrêt Tisséo avec tolérance aux fautes de frappe.

```sql
SELECT * FROM recherche_arret_fuzzy('capitole');
-- Retourne : nom_arret, commune, adresse, similarity
```

### `recherche_gare_fuzzy(search_term TEXT)`
Recherche une gare SNCF avec tolérance aux fautes de frappe.

```sql
SELECT * FROM recherche_gare_fuzzy('matabiau');
-- Retourne : nom_gare, commune, lat, lon, similarity
```

---

## Flux de données

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Utilisateur │ ──► │   Chatbot    │ ──► │    Supabase     │
│  "Capitole"  │     │   (OpenAI)   │     │ arrets_physiques│
└─────────────┘     └──────────────┘     └─────────────────┘
                                                  │
                           Recherche fuzzy ◄──────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Google Directions API  │
                    │    (calcul itinéraire)  │
                    └─────────────────────────┘

┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Utilisateur │ ──► │   Chatbot    │ ──► │    Supabase     │
│  "Matabiau"  │     │   (OpenAI)   │     │   gares_sncf    │
└─────────────┘     └──────────────┘     └─────────────────┘
                                                  │
                           Récupère id_sncf ◄─────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │       API SNCF          │
                    │  (horaires temps réel)  │
                    └─────────────────────────┘
```

---

## Comment ajouter une nouvelle table

1. Créer le fichier SQL dans `Docs/sql/`
2. Exécuter dans Supabase SQL Editor
3. Ajouter la fonction de recherche dans `src/lib/recherche.js`
4. Déclarer le tool dans `src/app/api/chat/route.js`
5. Mettre à jour cette documentation