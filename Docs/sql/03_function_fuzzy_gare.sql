-- Fonction de recherche fuzzy pour les gares SNCF

CREATE OR REPLACE FUNCTION recherche_gare_fuzzy(search_term TEXT)
RETURNS TABLE(nom_gare TEXT, commune TEXT, lat NUMERIC, lon NUMERIC, similarity REAL) AS $$
BEGIN
    RETURN QUERY
    SELECT g.nom_gare, g.commune, g.lat, g.lon,
           similarity(g.nom_gare, search_term) AS similarity
    FROM public.gares_sncf g
    WHERE g.nom_gare % search_term
    ORDER BY similarity DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;