import { supabase } from './supabase'

/**
 * Fonction 1 : Rechercher un arrêt par son nom
 *
 * @param {string} nom - Le nom de l'arrêt à chercher (ex: "Capitole")
 * @returns {Object} - { resultats: [...], suggestions: [...], exactMatch: true/false }
 *
 * Exemple d'utilisation :
 *   const { resultats, suggestions, exactMatch } = await rechercherArret("Capitole")
 */
export async function rechercherArret(nom) {
  // ÉTAPE 1 : Recherche exacte (contient le mot)
  const { data: exactData, error: exactError } = await supabase
    .from('arrets_physiques')
    .select('nom_arret, commune, adresse')
    .ilike('nom_arret', `%${nom}%`)
    .limit(5)

  if (exactError) {
    console.error('Erreur rechercherArret:', exactError)
    return { resultats: [], suggestions: [], exactMatch: false }
  }

  // Si on trouve des résultats exacts, on les retourne
  if (exactData && exactData.length > 0) {
    return {
      resultats: exactData,      // les arrêts trouvés
      suggestions: [],           // pas besoin de suggestions
      exactMatch: true           // on a trouvé exactement ce qu'il cherchait
    }
  }

  // ÉTAPE 2 : Si rien trouvé, recherche fuzzy (mots similaires)
  // On utilise pg_trgm pour trouver des noms SIMILAIRES même avec fautes d'orthographe
  const { data: fuzzyData, error: fuzzyError } = await supabase
    .rpc('recherche_arret_fuzzy', { search_term: nom })

  if (fuzzyError) {
    console.error('Erreur fuzzy search:', fuzzyError)
    return { resultats: [], suggestions: [], exactMatch: false }
  }

  // On retourne les suggestions (l'IA demandera confirmation)
  return {
    resultats: [],               // pas de résultat exact
    suggestions: fuzzyData || [],// suggestions basées sur similarité
    exactMatch: false            // on n'a PAS trouvé exactement
  }
}


/**
 * Fonction 2 : Rechercher une ligne par son nom/numéro
 *
 * @param {string} ligne - Le nom ou numéro de la ligne (ex: "A", "14", "T1")
 * @returns {Array} - Liste des lignes trouvées
 *
 * Exemple d'utilisation :
 *   const lignes = await rechercherLigne("A")
 *   // → [{ ligne: "A", nom_ligne: "Métro A", mode: "metro", couleur: "#E5056E" }]
 */
export async function rechercherLigne(ligne) {
  // On cherche dans la table "lignes"
  // Recherche exacte insensible à la casse
  const { data, error } = await supabase
    .from('lignes')
    .select('ligne, nom_ligne, mode, couleur')
    .ilike('ligne', ligne)
    .limit(5)

  if (error) {
    console.error('Erreur rechercherLigne:', error)
    return []
  }

  return data
}


/**
 * Fonction 3 : Obtenir tous les arrêts d'une ligne (dans l'ordre)
 *
 * @param {string} idLigne - L'identifiant de la ligne (ex: "A", "14")
 * @returns {Array} - Liste des arrêts dans l'ordre du trajet
 *
 * Exemple :
 *   getArretsLigne("A") → ["Basso Cambo", "Bellefontaine", ..., "Balma-Gramont"]
 */
export async function getArretsLigne(idLigne) {
  const { data, error } = await supabase
    .from('arrets_itineraire')        // table qui lie arrêts et lignes
    .select('nom_arret')              // on veut juste le nom
    .ilike('ligne', idLigne)          // recherche exacte sur la ligne
    .order('ordre', { ascending: true }) // trié par ordre croissant
    .limit(50)                        // limiter pour éviter trop de tokens

  if (error) {
    console.error('Erreur getArretsLigne:', error)
    return []
  }

  // Retourner juste les noms d'arrêts uniques (dédupliqués)
  const arretsUniques = [...new Set(data.map(d => d.nom_arret))]
  return arretsUniques
}


/**
 * Fonction 4 : Obtenir les lignes qui passent à un arrêt
 *
 * @param {string} nomArret - Le nom de l'arrêt (ex: "Jean Jaurès")
 * @returns {Array} - Liste des lignes passant par cet arrêt
 *
 * Exemple :
 *   getLignesArret("Jean Jaurès") → ["A", "B", "14", "38"]
 */
export async function getLignesArret(nomArret) {
  const { data, error } = await supabase
    .from('arrets_itineraire')
    .select('ligne, nom_ligne, mode')   // on veut la ligne, son nom et le mode
    .ilike('nom_arret', `%${nomArret}%`)
    .limit(20)

  if (error) {
    console.error('Erreur getLignesArret:', error)
    return []
  }

  // Enlever les doublons (une ligne peut apparaître plusieurs fois)
  const lignesUniques = [...new Map(data.map(item => [item.ligne, item])).values()]

  return lignesUniques
}


/**
 * Fonction 5 : Obtenir les arrêts dans une commune
 *
 * @param {string} commune - Le nom de la commune (ex: "Castanet-Tolosan")
 * @returns {Array} - Liste des arrêts dans cette commune
 *
 * Exemple :
 *   getArretsCommune("Castanet") → ["Castanet Centre", "Castanet Mairie", ...]
 */
export async function getArretsCommune(commune) {
  const { data, error } = await supabase
    .from('arrets_physiques')
    .select('nom_arret, adresse, commune')
    .ilike('commune', `%${commune}%`)
    .limit(20)

  if (error) {
    console.error('Erreur getArretsCommune:', error)
    return []
  }

  return data
}


/**
 * Fonction 6 : Calculer un itinéraire en transport en commun (Google Directions)
 *
 * @param {string} depart - Adresse ou lieu de départ (ex: "15 rue des fleurs Pechabou" ou "Aéroport Toulouse")
 * @param {string} arrivee - Adresse ou lieu d'arrivée (ex: "Capitole Toulouse" ou "Place du Capitole")
 * @returns {Object} - { trajets: [...], error: null } ou { trajets: [], error: "message" }
 *
 * Exemple :
 *   getItineraire("Pechabou", "Capitole Toulouse")
 *   → { trajets: [{ duree: "45 min", etapes: [...] }] }
 */
export async function getItineraire(depart, arrivee) {
  // Clé API Google depuis .env.local
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return { trajets: [], error: "Clé API Google non configurée" }
  }

  // Fonction pour détecter si c'est des coordonnées GPS (ex: "43.607, 1.430")
  const isCoordinates = (str) => {
    // Regex pour détecter "latitude, longitude" (avec ou sans espaces)
    const coordRegex = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/
    return coordRegex.test(str.trim())
  }

  // On ajoute "France" pour aider Google à localiser (pas de restriction à la Haute-Garonne)
  const departFormate = isCoordinates(depart) ? depart : `${depart}, France`
  const arriveeFormate = isCoordinates(arrivee) ? arrivee : `${arrivee}, France`

  // URL de l'API Google Directions
  const url = `https://maps.googleapis.com/maps/api/directions/json?` +
    `origin=${encodeURIComponent(departFormate)}` +
    `&destination=${encodeURIComponent(arriveeFormate)}` +
    `&mode=transit` +                    // transport en commun
    `&alternatives=true` +               // plusieurs trajets possibles
    `&language=fr` +                     // résultats en français
    `&region=fr` +                       // région France
    `&key=${apiKey}`

  try {
    // Appel à l'API Google
    const response = await fetch(url)
    const data = await response.json()

    // Si Google retourne une erreur
    if (data.status !== 'OK') {
      return {
        trajets: [],
        error: `Google Directions: ${data.status} - ${data.error_message || 'Aucun trajet trouvé'}`
      }
    }

    // On formate les résultats pour les rendre plus lisibles
    const trajets = data.routes.map((route, index) => {
      const leg = route.legs[0]  // Premier segment du trajet

      return {
        numero: index + 1,
        duree: leg.duration.text,           // "45 min"
        distance: leg.distance.text,        // "12 km"
        depart: leg.start_address,          // Adresse de départ corrigée
        arrivee: leg.end_address,           // Adresse d'arrivée corrigée
        heureDepart: leg.departure_time?.text || null,   // "14:30"
        heureArrivee: leg.arrival_time?.text || null,    // "15:15"
        etapes: leg.steps.map(step => {
          // Si c'est de la marche à pied
          if (step.travel_mode === 'WALKING') {
            return {
              mode: 'WALKING',
              instruction: step.html_instructions?.replace(/<[^>]*>/g, '') || 'Marcher', // Enlever les balises HTML
              duree: step.duration?.text || '',
              distance: step.distance?.text || ''
            }
          }
          // Si c'est du transport en commun
          return {
            mode: step.transit_details?.line?.vehicle?.type || 'TRANSIT',
            ligne: step.transit_details?.line?.short_name || '',
            nomLigne: step.transit_details?.line?.name || '',
            direction: step.transit_details?.headsign || '',
            departArret: step.transit_details?.departure_stop?.name || '',
            arriveeArret: step.transit_details?.arrival_stop?.name || '',
            duree: step.duration?.text || '',
            nbArrets: step.transit_details?.num_stops || 0
          }
        })
      }
    })

    return { trajets, error: null }

  } catch (err) {
    return { trajets: [], error: `Erreur réseau: ${err.message}` }
  }
}


// ============================================
// FONCTIONS SNCF (API temps réel)
// ============================================

const SNCF_API_KEY = process.env.API_KEY_SNCF

/**
 * Fonction 7 : Rechercher une gare SNCF par son nom
 */
export async function rechercherGare(nom) {
  // Recherche exacte
  const { data: exactData, error: exactError } = await supabase
    .from('gares_sncf')
    .select('id_sncf, nom_gare, commune, lat, lon')
    .ilike('nom_gare', `%${nom}%`)
    .limit(5)

  if (exactError) {
    console.error('Erreur rechercherGare:', exactError)
    return { resultats: [], suggestions: [], exactMatch: false }
  }

  if (exactData && exactData.length > 0) {
    return { resultats: exactData, suggestions: [], exactMatch: true }
  }

  // Recherche fuzzy
  const { data: fuzzyData, error: fuzzyError } = await supabase
    .rpc('recherche_gare_fuzzy', { search_term: nom })

  if (fuzzyError) {
    console.error('Erreur fuzzy gare:', fuzzyError)
    return { resultats: [], suggestions: [], exactMatch: false }
  }

  return { resultats: [], suggestions: fuzzyData || [], exactMatch: false }
}


/**
 * Fonction 8 : Calcul d'itinéraire SNCF (trains)
 *
 * @param {string} departId - ID SNCF de la gare de départ (ex: "stop_area:SNCF:87611004")
 * @param {string} arriveeId - ID SNCF de la gare d'arrivée
 * @param {string} datetime - Date/heure au format YYYYMMDDTHHMMSS (optionnel)
 */
export async function getItineraireSNCF(departId, arriveeId, datetime = null) {
  if (!SNCF_API_KEY) {
    return { trajets: [], error: "Clé API SNCF non configurée" }
  }

  // Date par défaut = maintenant
  const dt = datetime || new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)

  const url = `https://api.sncf.com/v1/coverage/sncf/journeys?` +
    `from=${encodeURIComponent(departId)}` +
    `&to=${encodeURIComponent(arriveeId)}` +
    `&datetime=${dt}` +
    `&count=3`

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Basic ${Buffer.from(SNCF_API_KEY + ':').toString('base64')}` }
    })
    const data = await response.json()

    if (data.error) {
      return { trajets: [], error: data.error.message || 'Erreur API SNCF' }
    }

    if (!data.journeys || data.journeys.length === 0) {
      return { trajets: [], error: 'Aucun trajet trouvé' }
    }

    const trajets = data.journeys.map((journey, index) => ({
      numero: index + 1,
      duree: formatDuration(journey.duration),
      heureDepart: formatSNCFTime(journey.departure_date_time),
      heureArrivee: formatSNCFTime(journey.arrival_date_time),
      nbCorrespondances: journey.nb_transfers,
      etapes: journey.sections
        .filter(s => s.type === 'public_transport')
        .map(section => ({
          mode: section.display_informations?.commercial_mode || 'TRAIN',
          ligne: section.display_informations?.code || '',
          direction: section.display_informations?.direction || '',
          departGare: section.from?.name || '',
          arriveeGare: section.to?.name || '',
          heureDepart: formatSNCFTime(section.departure_date_time),
          heureArrivee: formatSNCFTime(section.arrival_date_time)
        }))
    }))

    return { trajets, error: null }

  } catch (err) {
    return { trajets: [], error: `Erreur réseau SNCF: ${err.message}` }
  }
}


/**
 * Fonction 9 : Lignes passant par une gare SNCF
 *
 * @param {string} gareId - ID SNCF de la gare (ex: "stop_area:SNCF:87611004")
 */
export async function getLignesGare(gareId) {
  if (!SNCF_API_KEY) {
    return { lignes: [], error: "Clé API SNCF non configurée" }
  }

  const url = `https://api.sncf.com/v1/coverage/sncf/stop_areas/${encodeURIComponent(gareId)}/lines`

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Basic ${Buffer.from(SNCF_API_KEY + ':').toString('base64')}` }
    })
    const data = await response.json()

    if (data.error) {
      return { lignes: [], error: data.error.message || 'Erreur API SNCF' }
    }

    const lignes = (data.lines || []).map(line => ({
      code: line.code || '',
      nom: line.name || '',
      mode: line.commercial_mode?.name || 'TRAIN'
    }))

    return { lignes, error: null }

  } catch (err) {
    return { lignes: [], error: `Erreur réseau SNCF: ${err.message}` }
  }
}


/**
 * Fonction 10 : Prochains départs d'une gare SNCF
 *
 * @param {string} gareId - ID SNCF de la gare (ex: "stop_area:SNCF:87611004")
 * @param {number} count - Nombre de départs à retourner (défaut: 5)
 */
export async function getProchainsDepartsSNCF(gareId, count = 5) {
  if (!SNCF_API_KEY) {
    return { departs: [], error: "Clé API SNCF non configurée" }
  }

  const now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)

  const url = `https://api.sncf.com/v1/coverage/sncf/stop_areas/${encodeURIComponent(gareId)}/departures?` +
    `datetime=${now}&count=${count}`

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Basic ${Buffer.from(SNCF_API_KEY + ':').toString('base64')}` }
    })
    const data = await response.json()

    if (data.error) {
      return { departs: [], error: data.error.message || 'Erreur API SNCF' }
    }

    if (!data.departures || data.departures.length === 0) {
      return { departs: [], error: 'Aucun départ trouvé' }
    }

    const departs = data.departures.map(dep => ({
      heure: formatSNCFTime(dep.stop_date_time?.departure_date_time),
      ligne: dep.display_informations?.code || '',
      type: dep.display_informations?.commercial_mode || 'TRAIN',
      direction: dep.display_informations?.direction || '',
      voie: dep.stop_date_time?.platform || null
    }))

    return { departs, error: null }

  } catch (err) {
    return { departs: [], error: `Erreur réseau SNCF: ${err.message}` }
  }
}


// Helpers pour formater les données SNCF
function formatSNCFTime(datetime) {
  if (!datetime) return null
  // Format: 20260130T143000 → 14:30
  const time = datetime.slice(9, 13)
  return `${time.slice(0, 2)}:${time.slice(2, 4)}`
}

function formatDuration(seconds) {
  if (!seconds) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`
  return `${m} min`
}