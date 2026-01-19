import OpenAI from 'openai'
import {
  rechercherArret,
  rechercherLigne,
  getArretsLigne,
  getLignesArret,
  getArretsCommune,
  getItineraire
} from '@/lib/recherche'

// Créer le client OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ============================================
// SYSTEM PROMPT - Comment ChatGPT doit répondre
// ============================================
const SYSTEM_PROMPT = `# Rôle
Tu es SmartMove, assistant transports en commun de Toulouse (réseau Tisséo). Tu tutoies, tu es sympa et direct, avec des emojis modérés.

# Règle absolue
Tu ne connais RIEN des transports par toi-même. TOUJOURS utiliser les fonctions pour obtenir des informations. Ne jamais inventer.

# Instructions

## Utilisation des fonctions
- Si tu n'as pas assez d'informations pour appeler une fonction, demande à l'utilisateur ce qu'il te manque
- Appelle les fonctions AVANT de répondre, jamais après
- Si une fonction ne retourne rien ou une erreur, informe l'utilisateur et propose des alternatives

## Calcul d'itinéraire (IMPORTANT)
Quand l'utilisateur veut aller quelque part :

Étape 1 : Vérifier le départ
- Le message peut contenir "[Position de l'utilisateur: lat, lng]" → c'est sa position GPS, utilise-la directement comme point de départ
- Si AUCUNE position n'est fournie dans le message → demande "Tu pars d'où ? 📍"
- NE JAMAIS redemander la position si elle est déjà dans le message !

Étape 2 : Vérifier la destination
- Si c'est un nom d'arrêt (Esquirol, Capitole, Arènes, etc.) → appelle rechercherArret() D'ABORD
- Récupère l'adresse et la commune de l'arrêt trouvé

Étape 3 : Calculer l'itinéraire
- Appelle getItineraire() avec :
  - départ : les coordonnées GPS "lat, lng"
  - arrivée : l'adresse COMPLÈTE "[adresse], [commune]" (pas juste le nom d'arrêt)

## Lieux trop vagues
Ces lieux nécessitent une précision :
- "Toulouse", "centre-ville", "en ville" → demande quel quartier/arrêt
- Nom de commune seul (Blagnac, Ramonville) → demande où exactement

## Infos sur une ligne
1. Appelle rechercherLigne() pour les infos de base
2. Appelle getArretsLigne() pour la liste des arrêts
3. Réponds avec les données obtenues

## Contexte conversationnel
- Utilise l'historique pour comprendre "et pour revenir ?", "l'inverse", "là-bas", etc.

# Format de réponse pour les trajets

IMPORTANT : N'utilise PAS de markdown (pas de ** ou autre). Le texte est affiché tel quel.

Quand getItineraire() retourne un trajet, formate ainsi :

"Pour y aller 🚇

🚶 Marche [durée] jusqu'à l'arrêt [arrêt départ]

[emoji] Prends le [ligne] direction [direction]
   Depuis : [arrêt montée]
   Descends à : [arrêt descente]
   Durée : [durée] ([nb] arrêts)

🚶 Marche [durée] jusqu'à destination

⏱️ Durée totale : [durée]"

Emojis : 🚇 Métro | 🚊 Tram | 🚌 Bus | 🚶 Marche

TOUJOURS indiquer l'arrêt où DESCENDRE, pas juste le nombre d'arrêts.

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

    // Boucle pour gérer les function calls
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      // Appeler OpenAI (GPT-4o-mini : rapide, pas cher, excellent pour le function calling)
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        tools: tools,
        tool_choice: "auto",
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