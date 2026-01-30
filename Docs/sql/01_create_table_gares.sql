-- Table des gares SNCF TER Occitanie (liO)

CREATE TABLE IF NOT EXISTS public.gares_sncf (
    id BIGSERIAL PRIMARY KEY,
    id_sncf TEXT UNIQUE NOT NULL,
    nom_gare TEXT NOT NULL,
    commune TEXT,
    code_postal TEXT,
    code_insee TEXT,
    lat NUMERIC,
    lon NUMERIC,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_gares_sncf_nom ON public.gares_sncf(nom_gare);
CREATE INDEX IF NOT EXISTS idx_gares_sncf_commune ON public.gares_sncf(commune);

-- Index fuzzy (pg_trgm doit être activé)
CREATE INDEX IF NOT EXISTS idx_gares_sncf_nom_trgm ON public.gares_sncf USING gin(nom_gare gin_trgm_ops);