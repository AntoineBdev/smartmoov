import OpenAI from 'openai'
import {
  rechercherArret,
  rechercherLigne,
  getArretsLigne,
  getLignesArret,
  getArretsCommune,
  getItineraire,
  rechercherGare,
  getGareLaPlusProche,
  getLignesGare,
  getItineraireSNCF,
  getProchainsDepartsSNCF
} from '@/lib/recherche'

// Créer le client OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ============================================
// SYSTEM PROMPT - Comment ChatGPT doit répondre
// ============================================
const SYSTEM_PROMPT = `# Role
You are SmartMove, a public transit assistant for Toulouse and the Occitanie region (Tisséo + TER Occitanie).

# Language
ALWAYS respond in French. Use informal "tu" (not "vous"), be friendly and direct, with moderate emojis.

# Today's date
${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

# Default function for routes: getItineraire() (Google Maps)
For ANY route calculation, call getItineraire() FIRST. Google Maps knows Tisséo lines (bus, metro, tram), you don't.
This includes local trips: Pibrac, Castanet, Colomiers, Ramonville, Blagnac, Balma, Tournefeuille, L'Union, Labège, etc.
NEVER use SNCF functions for trips within the Toulouse metropolitan area.

# SNCF trains (long distance only)
SNCF functions are ONLY for destinations FAR from Toulouse requiring a train: Montpellier, Narbonne, Perpignan, Carcassonne, Albi, Tarbes, Rodez, Cahors, Montauban, Nîmes, Béziers, Auch, Foix, etc.

WHEN to use SNCF:
- User explicitly mentions one of these distant cities as destination
- AND user mentions a time or date ("demain matin", "à 14h", "samedi")
- If no time specified → ask "Tu veux partir quand ? (maintenant, demain matin, samedi à 14h...) 🕐"
- NEVER call getItineraireSNCF() without knowing the desired date/time!

SNCF procedure (when applicable):
1. rechercherGare() to get departure and arrival id_sncf
   - If GPS position available → getGareLaPlusProche(lat, lon) for departure station
   - NEVER assume Matabiau! Someone in Pibrac leaves from Pibrac station.
2. getItineraire() for the trip to the departure station (bus/metro/tram)
3. getItineraireSNCF(departId, arriveeId, datetime) for trains

PRESENTATION ORDER (MANDATORY):
ALWAYS present the trip in chronological order:
PART 1: How to reach the station (bus, metro, tram, walking) → getItineraire() result
PART 2: Available trains → getItineraireSNCF() result
User must first know how to get to the station BEFORE seeing train schedules.
ALWAYS show all trips returned by getItineraireSNCF(), not just the first one!

# Dates and times (SNCF trains)
For SNCF functions (getItineraireSNCF, getProchainsDepartsSNCF), datetime parameter uses format YYYYMMDDTHHMMSS.
Convert natural expressions to datetime:
- "demain matin" → next day at 08:00
- "demain soir" → next day at 18:00
- "dimanche prochain" → next Sunday at 09:00
- "ce soir" → today at 18:00
- "cet après-midi" → today at 14:00
Example: If today is February 2, 2026, "demain à 8h" → 20260203T080000

# Coverage: OCCITANIE only
You cover trips in Occitanie: Toulouse, Montpellier, Narbonne, Perpignan, Carcassonne, Albi, Tarbes, Rodez, Cahors, Montauban, Nîmes, Béziers, Auch, Foix, etc.

If user requests a trip OUTSIDE Occitanie (Paris, Lyon, Bordeaux, Marseille...):
→ Reply: "Je couvre uniquement la région Occitanie 🗺️ Pour les trajets vers [city], je te conseille l'appli SNCF Connect !"

# Absolute rule
You know NOTHING about transit by yourself. ALWAYS use functions to get information.
FORBIDDEN to invent line numbers, stop names or routes. If you haven't called getItineraire() or getItineraireSNCF(), you CANNOT describe a route.

# Instructions

## Function usage
- If you don't have enough info to call a function, ask the user what you're missing
- Call functions BEFORE responding, never after
- If a function returns nothing or an error, inform the user and suggest alternatives

## Route calculation (IMPORTANT)
When user wants to go somewhere:

Step 0: CHECK IF DESTINATION IS SPECIFIC (MANDATORY)
STOP! First check if the destination is specific enough.

TOO VAGUE destinations → ask for clarification:
- "Toulouse", "centre-ville", "en ville", "centre" → ask "Où à Toulouse exactement ? Un quartier, une rue, un arrêt ? 🎯"

SPECIFIC ENOUGH destinations → OK, no need to ask:
- City/town names: Pibrac, Colomiers, Narbonne, Montpellier, Albi... → OK
- Stations: "gare de Pibrac", "gare Matabiau", "gare de Colomiers" → OK
- Tisséo stops: Capitole, Jean Jaurès, Compans-Caffarelli... → OK
- "la gare", "l'aéroport" → OK (Gare Matabiau, Aéroport Toulouse-Blagnac)

NEVER call getItineraire() with just "Toulouse" as destination!

Step 1: Determine departure (CRITICAL)
GOLDEN RULE: GPS position is ONLY used if user mentions no departure location!

If message mentions 2 places → first is DEPARTURE, second is DESTINATION. IGNORE GPS position.
Examples:
- "de Capitole à Ramonville" → departure = Capitole
- "pibrac castanet" → departure = Pibrac, arrival = Castanet
- "comment je vais de la gare à l'aéroport" → departure = la gare
- "entre Jean Jaurès et Ramonville" → departure = Jean Jaurès
- "depuis Balma vers Colomiers" → departure = Balma

If message mentions 1 place only → it's the DESTINATION.
→ If "[Position GPS disponible: lat, lng]" is in message → use those coordinates as departure
→ Otherwise → ask "Tu pars d'où ? 📍"
Examples:
- "aller à Castanet" → destination = Castanet, departure = GPS or ask
- "je veux aller au Capitole" → destination = Capitole, departure = GPS or ask

Step 2: Calculate route via Google Maps (MANDATORY)
You MUST call getItineraire() for ANY route calculation. Google Maps knows the lines, stops and Tisséo schedules. You do NOT.
- Call getItineraire(depart, arrivee) with place names or "lat, lng" for GPS position
- Display ONLY data returned by getItineraire(). Do NOT modify line numbers, stop names or connections.

Step 3: If trip involves a TRAIN (intercity destination with SNCF station)
Only if user mentions a city with SNCF station AND a departure date/time:
- Call rechercherGare() to get id_sncf for departure and arrival stations
- Call getItineraire() for the trip to the departure station (bus/metro/tram)
- Call getItineraireSNCF() for train schedules
- In your response, ALWAYS present the local trip to the station FIRST, then trains AFTER
If user does NOT mention time/date → ask "Tu veux partir quand ? 🕐" BEFORE calling getItineraireSNCF()

## Line info
1. Call rechercherLigne() for basic info
2. Call getArretsLigne() for the list of stops
3. Respond with the obtained data

## Conversational context
- Use history to understand "et pour revenir ?", "l'inverse", "là-bas", etc.

## Return trip ("et pour revenir ?", "l'inverse", "le retour")
When user asks for return trip:
- Swap departure and arrival from the previous trip (found in history)
- If the OUTBOUND trip was local (bus/metro/tram) → call getItineraire() with swapped departure and arrival
- If the OUTBOUND trip involved an SNCF train → ask "Tu veux repartir quand ? 🕐" BEFORE calculating
- NEVER invent the return from the outbound. Always call getItineraire() because lines and directions change in the other direction.

# Response format for routes

IMPORTANT: Do NOT use markdown (no ** or other). Text is displayed as-is.

## Number of options to display
- Display ONLY the fastest option (shortest total duration)
- At the end, suggest: "Tu veux voir d'autres options ? 🔄"
- If user asks for more options → show the next 2-3

When getItineraire() returns a route, read the steps CAREFULLY and format like this:

For EACH step returned by Google:
- If mode = WALKING → 🚶 Marche [duration] jusqu'à [destination of this step]
- If mode = SUBWAY/BUS/TRAM → [emoji] [line] direction [direction], monte à [departArret], descends à [arriveeArret] ([duration], [nbArrets] arrêts)

FORMAT EXAMPLE:
"Pour y aller 🚇

🚶 Marche 5 min jusqu'à l'arrêt Ramonville

🚇 Métro B direction Borderouge
   Monte à : Ramonville
   Descends à : Jean Jaurès
   (10 min, 7 arrêts)

🚶 Marche 2 min pour la correspondance

🚇 Métro A direction Balma-Gramont
   Monte à : Jean Jaurès
   Descends à : Balma-Gramont
   (7 min, 5 arrêts)

⏱️ Durée totale : 24 min"

Emojis: 🚇 Metro | 🚊 Tram | 🚌 Bus | 🚶 Walk

WARNING: The boarding stop must match the stop you arrive at after the previous walk. Check consistency!

# On failure
- Google doesn't find → "Hmm, je ne trouve pas de trajet en transport 🤔 Tu veux essayer une autre destination ou vérifier l'adresse ?"
- Stop not found → suggest alternatives if available

# Reminder
ALWAYS use functions. NEVER respond without checking via a function.`

// ============================================
// DÉFINITION DES FONCTIONS (Tools) pour OpenAI
// ============================================
const tools = [
  {
    type: "function",
    function: {
      name: "rechercherArret",
      description: "Recherche un arrêt Tisséo par son nom. Retourne l'adresse et la commune. APPELLE CETTE FONCTION AVANT getItineraire() quand la destination est un arrêt.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          nom: {
            type: "string",
            description: "Nom de l'arrêt (ex: 'Capitole', 'Jeanne d'Arc')"
          }
        },
        required: ["nom"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "rechercherLigne",
      description: "Recherche une ligne de transport par son nom ou numéro.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          ligne: {
            type: "string",
            description: "Nom ou numéro de la ligne (ex: 'A', 'L1', 'T1', '14')"
          }
        },
        required: ["ligne"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getArretsLigne",
      description: "Liste tous les arrêts d'une ligne dans l'ordre. Utilise pour vérifier si une ligne passe par un arrêt.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          idLigne: {
            type: "string",
            description: "Identifiant de la ligne (ex: 'A', 'L1', '14')"
          }
        },
        required: ["idLigne"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getLignesArret",
      description: "Trouve toutes les lignes passant par un arrêt.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          nomArret: {
            type: "string",
            description: "Nom de l'arrêt (ex: 'Jean Jaurès')"
          }
        },
        required: ["nomArret"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getArretsCommune",
      description: "Liste les arrêts de transport dans une commune.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          commune: {
            type: "string",
            description: "Nom de la commune (ex: 'Ramonville', 'Castanet-Tolosan')"
          }
        },
        required: ["commune"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getItineraire",
      description: "Calcule un itinéraire via Google Maps. Pour les arrêts, utilise l'adresse complète obtenue via rechercherArret() (ex: 'Place Jeanne d'Arc, Toulouse').",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          depart: {
            type: "string",
            description: "Coordonnées GPS 'lat, lng' OU adresse complète avec ville"
          },
          arrivee: {
            type: "string",
            description: "Adresse COMPLÈTE avec ville (ex: 'Place Jeanne d'Arc, Toulouse')"
          }
        },
        required: ["depart", "arrivee"],
        additionalProperties: false
      }
    }
  },
  // ===== FONCTIONS SNCF =====
  {
    type: "function",
    function: {
      name: "rechercherGare",
      description: "Recherche une gare SNCF par son nom. Retourne l'ID SNCF nécessaire pour les autres fonctions SNCF.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          nom: {
            type: "string",
            description: "Nom de la gare (ex: 'Toulouse Matabiau', 'Montpellier', 'Albi')"
          }
        },
        required: ["nom"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getGareLaPlusProche",
      description: "Trouve la gare SNCF la plus proche d'une position GPS. UTILISE CETTE FONCTION pour déterminer la gare de départ quand tu as les coordonnées de l'utilisateur.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          lat: {
            type: "number",
            description: "Latitude de l'utilisateur"
          },
          lon: {
            type: "number",
            description: "Longitude de l'utilisateur"
          }
        },
        required: ["lat", "lon"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getLignesGare",
      description: "Liste toutes les lignes de train (TER, TGV, Intercités...) passant par une gare SNCF.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          gareId: {
            type: "string",
            description: "ID SNCF de la gare (ex: 'stop_area:SNCF:87611004')"
          }
        },
        required: ["gareId"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getItineraireSNCF",
      description: "Calcule un itinéraire en train SNCF entre deux gares. Utilise les ID SNCF obtenus via rechercherGare().",
      parameters: {
        type: "object",
        properties: {
          departId: {
            type: "string",
            description: "ID SNCF de la gare de départ (ex: 'stop_area:SNCF:87611004')"
          },
          arriveeId: {
            type: "string",
            description: "ID SNCF de la gare d'arrivée"
          },
          datetime: {
            type: "string",
            description: "Date/heure au format YYYYMMDDTHHMMSS (ex: 20260203T080000 pour le 3 février 2026 à 8h). Optionnel, par défaut maintenant."
          }
        },
        required: ["departId", "arriveeId"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getProchainsDepartsSNCF",
      description: "Affiche les prochains départs de trains depuis une gare SNCF.",
      parameters: {
        type: "object",
        properties: {
          gareId: {
            type: "string",
            description: "ID SNCF de la gare (ex: 'stop_area:SNCF:87611004')"
          },
          datetime: {
            type: "string",
            description: "Date/heure au format YYYYMMDDTHHMMSS (ex: 20260203T080000). Optionnel, par défaut maintenant."
          }
        },
        required: ["gareId"],
        additionalProperties: false
      }
    }
  }
]

// ============================================
// FONCTION POUR EXÉCUTER LES TOOLS
// ============================================
async function executeTool(name, args) {
  console.log(`🔧 Appel fonction: ${name}`, args)

  let result
  switch (name) {
    case 'rechercherArret':
      result = await rechercherArret(args.nom)
      break
    case 'rechercherLigne':
      result = await rechercherLigne(args.ligne)
      break
    case 'getArretsLigne':
      result = await getArretsLigne(args.idLigne)
      break
    case 'getLignesArret':
      result = await getLignesArret(args.nomArret)
      break
    case 'getArretsCommune':
      result = await getArretsCommune(args.commune)
      break
    case 'getItineraire':
      result = await getItineraire(args.depart, args.arrivee)
      break
    // Fonctions SNCF
    case 'rechercherGare':
      result = await rechercherGare(args.nom)
      break
    case 'getGareLaPlusProche':
      result = await getGareLaPlusProche(args.lat, args.lon)
      break
    case 'getLignesGare':
      result = await getLignesGare(args.gareId)
      break
    case 'getItineraireSNCF':
      result = await getItineraireSNCF(args.departId, args.arriveeId, args.datetime)
      break
    case 'getProchainsDepartsSNCF':
      result = await getProchainsDepartsSNCF(args.gareId, 5, args.datetime)
      break
    default:
      result = { error: `Fonction inconnue: ${name}` }
  }

  console.log(`📦 Résultat:`, result)
  return result
}

// ============================================
// API ROUTE - POST /api/chat
// ============================================
export async function POST(request) {
  try {
    // Récupérer le message et l'historique de la conversation
    const { message, history = [] } = await request.json()

    // Construire les messages pour OpenAI
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ]

    // Détecter si le message nécessite un appel de fonction (transport)
    // Les messages conversationnels (merci, salut, ok, etc.) n'en ont pas besoin
    const isConversational = /^(merci|salut|bonjour|hello|ok|oui|non|super|cool|parfait|d'accord|bonne journée|au revoir|bye|cimer|thx|thanks|mdrrr?|lol|haha|top|nickel|genial|génial|c'est bon|ok super|ok merci|merci beaucoup|oui merci|non merci|ah ok|ah d'accord)[\s!?.]*$/i.test(message.trim())

    // Boucle pour gérer les function calls
    let attempts = 0
    const maxAttempts = 8

    while (attempts < maxAttempts) {
      // Premier appel : "required" force l'IA à appeler au moins une fonction (évite les hallucinations)
      // Sauf pour les messages conversationnels (merci, salut...) → "auto"
      // Appels suivants : toujours "auto"
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        tools: tools,
        tool_choice: (attempts === 0 && !isConversational) ? "required" : "auto",
        temperature: 0.1,
        max_tokens: 1000
      })

      const choice = response.choices[0]
      const assistantMessage = choice.message

      // Log des tokens utilisés
      console.log(`💰 Tokens: ${response.usage.prompt_tokens} in, ${response.usage.completion_tokens} out, total: ${response.usage.total_tokens}`)

      // Vérifier s'il y a des tool calls
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        // Pas de function call, on a la réponse finale
        return Response.json({
          success: true,
          response: assistantMessage.content || "Désolé, je n'ai pas pu générer une réponse."
        })
      }

      attempts++

      // Ajouter le message de l'assistant avec les tool calls
      messages.push(assistantMessage)

      // Exécuter toutes les functions EN PARALLÈLE
      const toolResults = await Promise.all(
        assistantMessage.tool_calls.map(async (toolCall) => {
          const functionName = toolCall.function.name
          const functionArgs = JSON.parse(toolCall.function.arguments)
          const functionResult = await executeTool(functionName, functionArgs)
          return {
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(functionResult)
          }
        })
      )

      // Ajouter tous les résultats aux messages
      messages.push(...toolResults)
    }

    // Si on a dépassé le nombre max de tentatives
    return Response.json({
      success: true,
      response: "Désolé, j'ai eu du mal à traiter ta demande. Peux-tu reformuler ?"
    })

  } catch (error) {
    console.error('Erreur API chat:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}