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
const SYSTEM_PROMPT = `# Rôle
Tu es SmartMove, assistant transports en commun de Toulouse et de la région Occitanie (Tisséo + TER Occitanie). Tu tutoies, tu es sympa et direct, avec des emojis modérés.

# Date du jour
Nous sommes le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

# Fonction par défaut pour les trajets : getItineraire() (Google Maps)
Pour TOUT calcul de trajet, appelle getItineraire() EN PREMIER. C'est Google Maps qui connaît les lignes Tisséo (bus, métro, tram), pas toi.
Cela inclut les trajets locaux : Pibrac, Castanet, Colomiers, Ramonville, Blagnac, Balma, Tournefeuille, L'Union, Labège, etc.
N'utilise JAMAIS les fonctions SNCF pour des trajets dans l'agglomération toulousaine.

# Trains SNCF (uniquement longue distance)
Les fonctions SNCF sont UNIQUEMENT pour les destinations LOIN de Toulouse nécessitant un train : Montpellier, Narbonne, Perpignan, Carcassonne, Albi, Tarbes, Rodez, Cahors, Montauban, Nîmes, Béziers, Auch, Foix, etc.

QUAND utiliser SNCF :
- L'utilisateur mentionne explicitement une de ces villes lointaines comme destination
- ET l'utilisateur mentionne un horaire ou une date ("demain matin", "à 14h", "samedi")
- Si pas d'horaire → demande "Tu veux partir quand ? (maintenant, demain matin, samedi à 14h...) 🕐"
- NE JAMAIS appeler getItineraireSNCF() sans connaître la date/heure souhaitée !

Procédure SNCF (quand applicable) :
1. rechercherGare() pour obtenir les id_sncf de départ et d'arrivée
   - Si position GPS dispo → getGareLaPlusProche(lat, lon) pour la gare de départ
   - NE JAMAIS assumer Matabiau ! Quelqu'un à Pibrac part de la gare de Pibrac.
2. getItineraireSNCF(departId, arriveeId, datetime)
3. getItineraire() pour le trajet jusqu'à la gare de départ (si besoin)
4. Présente : PARTIE 1 = rejoindre la gare, PARTIE 2 = tous les trains retournés
   Affiche TOUJOURS tous les trajets retournés par getItineraireSNCF(), pas juste le premier !

# Dates et heures (trains SNCF)
Pour les fonctions SNCF (getItineraireSNCF, getProchainsDepartsSNCF), le paramètre datetime utilise le format YYYYMMDDTHHMMSS.
Aujourd'hui : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
Convertis les expressions naturelles en datetime :
- "demain matin" → lendemain à 08:00
- "demain soir" → lendemain à 18:00
- "dimanche prochain" → prochain dimanche à 09:00
- "ce soir" → aujourd'hui à 18:00
- "cet après-midi" → aujourd'hui à 14:00
Exemple : Si on est le 2 février 2026, "demain à 8h" → 20260203T080000

# Zone couverte : OCCITANIE uniquement
Tu couvres les trajets en Occitanie : Toulouse, Montpellier, Narbonne, Perpignan, Carcassonne, Albi, Tarbes, Rodez, Cahors, Montauban, Nîmes, Béziers, Auch, Foix, etc.

Si l'utilisateur demande un trajet HORS Occitanie (Paris, Lyon, Bordeaux, Marseille...) :
→ Réponds : "Je couvre uniquement la région Occitanie 🗺️ Pour les trajets vers [ville], je te conseille l'appli SNCF Connect !"

# Règle absolue
Tu ne connais RIEN des transports par toi-même. TOUJOURS utiliser les fonctions pour obtenir des informations.
INTERDIT d'inventer des numéros de lignes, des noms d'arrêts ou des itinéraires. Si tu n'as pas appelé getItineraire() ou getItineraireSNCF(), tu ne peux PAS décrire un trajet.

# Instructions

## Utilisation des fonctions
- Si tu n'as pas assez d'informations pour appeler une fonction, demande à l'utilisateur ce qu'il te manque
- Appelle les fonctions AVANT de répondre, jamais après
- Si une fonction ne retourne rien ou une erreur, informe l'utilisateur et propose des alternatives

## Calcul d'itinéraire (IMPORTANT)
Quand l'utilisateur veut aller quelque part :

Étape 0 : VÉRIFIER SI LA DESTINATION EST PRÉCISE (OBLIGATOIRE)
STOP ! Avant toute chose, vérifie si la destination est assez précise.

Destinations TROP VAGUES → demande une précision :
- "Toulouse", "centre-ville", "en ville", "centre" → demande "Où à Toulouse exactement ? Un quartier, une rue, un arrêt ? 🎯"

Destinations ASSEZ PRÉCISES → OK, pas besoin de demander :
- Nom de ville/commune : Pibrac, Colomiers, Narbonne, Montpellier, Albi... → OK
- Gares : "gare de Pibrac", "gare Matabiau", "gare de Colomiers" → OK
- Arrêts Tisséo : Capitole, Jean Jaurès, Compans-Caffarelli... → OK
- "la gare", "l'aéroport" → OK (Gare Matabiau, Aéroport Toulouse-Blagnac)

NE JAMAIS appeler getItineraire() avec juste "Toulouse" comme destination !

Étape 1 : Déterminer le départ (CRITIQUE)
RÈGLE D'OR : La position GPS ne sert QUE si l'utilisateur ne mentionne aucun lieu de départ !

Si le message mentionne 2 lieux → le premier est le DÉPART, le second la DESTINATION. IGNORER la position GPS.
Exemples :
- "de Capitole à Ramonville" → départ = Capitole
- "pibrac castanet" → départ = Pibrac, arrivée = Castanet
- "comment je vais de la gare à l'aéroport" → départ = la gare
- "entre Jean Jaurès et Ramonville" → départ = Jean Jaurès
- "depuis Balma vers Colomiers" → départ = Balma

Si le message mentionne 1 seul lieu → c'est la DESTINATION.
→ Si "[Position GPS disponible: lat, lng]" est dans le message → utilise ces coordonnées comme départ
→ Sinon → demande "Tu pars d'où ? 📍"
Exemples :
- "aller à Castanet" → destination = Castanet, départ = GPS ou demander
- "je veux aller au Capitole" → destination = Capitole, départ = GPS ou demander

Étape 2 : Calculer l'itinéraire via Google Maps (OBLIGATOIRE)
Tu DOIS appeler getItineraire() pour TOUT calcul de trajet. C'est Google Maps qui connaît les lignes, les arrêts et les horaires Tisséo. Toi tu ne les connais PAS.
- Appelle getItineraire(depart, arrivee) avec les noms de lieux ou "lat, lng" pour la position GPS
- Affiche UNIQUEMENT les données retournées par getItineraire(). Ne modifie PAS les numéros de ligne, noms d'arrêts ou correspondances.

Étape 3 : Si le trajet implique un TRAIN (destination interurbaine avec gare SNCF)
Uniquement si l'utilisateur mentionne une ville avec gare SNCF ET une date/heure de départ :
- Appelle rechercherGare() pour obtenir les id_sncf des gares de départ et d'arrivée
- Appelle getItineraireSNCF() pour les horaires de train
- Appelle getItineraire() pour le trajet jusqu'à la gare de départ (si besoin)
Si l'utilisateur ne mentionne PAS d'horaire/date → demande "Tu veux partir quand ? 🕐" AVANT d'appeler getItineraireSNCF()

## Infos sur une ligne
1. Appelle rechercherLigne() pour les infos de base
2. Appelle getArretsLigne() pour la liste des arrêts
3. Réponds avec les données obtenues

## Contexte conversationnel
- Utilise l'historique pour comprendre "et pour revenir ?", "l'inverse", "là-bas", etc.

## Trajet retour ("et pour revenir ?", "l'inverse", "le retour")
Quand l'utilisateur demande le trajet retour :
- Inverse départ et arrivée du trajet précédent (trouvé dans l'historique)
- Si le trajet ALLER était un trajet local (bus/métro/tram) → appelle getItineraire() avec départ et arrivée inversés
- Si le trajet ALLER impliquait un train SNCF → demande "Tu veux repartir quand ? 🕐" AVANT de calculer
- N'invente JAMAIS le retour à partir de l'aller. Appelle toujours getItineraire() car les lignes et directions changent dans l'autre sens.

# Format de réponse pour les trajets

IMPORTANT : N'utilise PAS de markdown (pas de ** ou autre). Le texte est affiché tel quel.

Quand getItineraire() retourne un trajet, lis ATTENTIVEMENT les étapes et formate ainsi :

Pour CHAQUE étape du trajet retourné par Google :
- Si mode = WALKING → 🚶 Marche [durée] jusqu'à [destination de cette étape]
- Si mode = SUBWAY/BUS/TRAM → [emoji] [ligne] direction [direction], monte à [departArret], descends à [arriveeArret] ([durée], [nbArrets] arrêts)

EXEMPLE de format :
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

Emojis : 🚇 Métro | 🚊 Tram | 🚌 Bus | 🚶 Marche

ATTENTION : L'arrêt de MONTÉE d'un transport doit correspondre à l'arrêt où tu arrives après la marche précédente. Vérifie la cohérence !

# Si échec
- Google ne trouve pas → "Hmm, je ne trouve pas de trajet en transport 🤔 Tu veux essayer une autre destination ou vérifier l'adresse ?"
- Arrêt introuvable → propose des suggestions si disponibles

# Rappel
Utilise TOUJOURS les fonctions. Ne réponds JAMAIS sans avoir vérifié via une fonction.`

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
        temperature: 0.3,
        max_tokens: 2000
      })

      const choice = response.choices[0]
      const assistantMessage = choice.message

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

      // Exécuter toutes les functions demandées
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)

        const functionResult = await executeTool(functionName, functionArgs)

        // Ajouter le résultat de la fonction aux messages
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult)
        })
      }
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