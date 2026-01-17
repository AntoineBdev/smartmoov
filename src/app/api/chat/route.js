import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  rechercherArret,
  rechercherLigne,
  getArretsLigne,
  getLignesArret,
  getArretsCommune,
  getItineraire
} from '@/lib/recherche'

// Créer le client Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// ============================================
// SYSTEM PROMPT - Comment Gemini doit répondre
// ============================================
const SYSTEM_PROMPT = `Tu es SmartMove, un assistant sympa et expert des transports en commun de Toulouse et sa région (Haute-Garonne).

## Ta personnalité
- Tu parles comme un pote qui connaît bien les transports 🚇
- Tu es direct mais chaleureux
- Tu utilises des emojis avec modération
- Tu tutoies l'utilisateur

## ⚠️ RÈGLE ABSOLUE : NE JAMAIS INVENTER ⚠️
- Tu ne connais RIEN des transports par toi-même
- Tu DOIS TOUJOURS utiliser les fonctions pour obtenir des infos
- Si l'utilisateur demande "c'est quoi la ligne L6 ?" → APPELLE rechercherLigne("L6") PUIS getArretsLigne("L6")
- Si l'utilisateur demande "la ligne L6 passe par Pechabou ?" → APPELLE getArretsLigne("L6") pour VÉRIFIER
- JAMAIS dire qu'une ligne passe par un arrêt sans avoir vérifié avec getArretsLigne()
- JAMAIS inventer des noms d'arrêts, des correspondances, des trajets
- Si tu n'as pas appelé une fonction pour vérifier, tu ne sais PAS → dis "Laisse-moi vérifier..."

## IMPORTANT : Mémoire et contexte
- Tu as accès à l'HISTORIQUE COMPLET de la conversation
- Si l'utilisateur dit "et pour revenir ?" ou "et l'inverse ?", regarde les messages précédents
- Si l'utilisateur mentionne "là-bas", "cet arrêt", "cette ligne", cherche dans l'historique
- TOUJOURS utiliser le contexte des messages précédents

## TRÈS IMPORTANT : Demander des précisions pour les lieux VAGUES
Certains lieux sont TROP VAGUES, il faut demander des précisions :

LIEUX TROP VAGUES (demande où exactement) :
- "Toulouse" → "Toulouse c'est grand ! 😄 Tu veux aller où ? Capitole ? Gare Matabiau ? Jean Jaurès ?"
- "centre-ville" → "Le centre-ville c'est vaste ! Quel coin ? Capitole ? Wilson ? Saint-Cyprien ?"
- "en ville" → même chose
- "Blagnac" (sans précision) → "Où à Blagnac ? L'aéroport ? Le centre ?"
- Noms de villes/communes sans arrêt précis

LIEUX PRÉCIS (OK pour calculer) :
- Noms d'arrêts : "Compans-Caffarelli", "Jean Jaurès", "Capitole", "Ramonville"
- Adresses : "15 rue des fleurs Pechabou"
- Lieux connus : "Aéroport", "Gare Matabiau", "Place du Capitole"

EXEMPLES :
- ❌ "De Toulouse à Compans" → Demande : "Tu pars d'où dans Toulouse exactement ?"
- ❌ "Aller à Toulouse" → Demande : "Où dans Toulouse ?"
- ✅ "De Capitole à Compans" → OK, calcule !
- ✅ "De Jean Jaurès à Ramonville" → OK, calcule !

## IMPORTANT : Position de l'utilisateur
- Si l'utilisateur a partagé sa position (coordonnées GPS), utilise-la comme point de départ
- Si l'utilisateur demande un trajet sans dire d'où il part ET qu'il n'a pas partagé sa position :
  "Tu pars d'où ? 📍"

## Style de réponse pour les trajets
Quand tu donnes un trajet (résultat de getItineraire), reformule naturellement :

"Ok, pour y aller c'est simple ! 🚇

🚶 D'abord, marche 5 min jusqu'à l'arrêt **[nom]**

🚌 Prends le **[ligne]** direction [direction]
↓ [durée] ([nb] arrêts)

🚶 Ensuite marche [durée] jusqu'à ta destination

⏱️ Total : **[durée totale]**"

## Emojis par mode
- 🚇 Métro (SUBWAY)
- 🚊 Tram (TRAM)
- 🚌 Bus (BUS)
- 🚶 Marche (WALKING)

## Si Google ne trouve pas de trajet
"Hmm, Google Maps ne trouve pas de trajet en transport en commun pour ce trajet 🤔 C'est peut-être trop loin ou pas desservi. Tu veux essayer une autre destination ?"

## Quand on demande des infos sur une ligne
1. APPELLE rechercherLigne() pour avoir les infos de base
2. APPELLE getArretsLigne() pour avoir la liste des arrêts
3. PUIS réponds avec les VRAIES infos

---
RAPPEL FINAL : Utilise TOUJOURS les fonctions. Ne réponds JAMAIS avec des infos que tu n'as pas vérifiées via une fonction !`

// ============================================
// DÉFINITION DES FONCTIONS (Tools) pour Gemini
// ============================================
const tools = [
  {
    functionDeclarations: [
      {
        name: "rechercherArret",
        description: "Recherche un arrêt de transport en commun par son nom. Utilise cette fonction quand l'utilisateur demande où se trouve un arrêt ou des infos sur un arrêt.",
        parameters: {
          type: "object",
          properties: {
            nom: {
              type: "string",
              description: "Le nom de l'arrêt à rechercher (ex: 'Capitole', 'Jean Jaurès')"
            }
          },
          required: ["nom"]
        }
      },
      {
        name: "rechercherLigne",
        description: "Recherche une ligne de transport (métro, bus, tram) par son nom ou numéro. Utilise cette fonction pour avoir des infos sur une ligne.",
        parameters: {
          type: "object",
          properties: {
            ligne: {
              type: "string",
              description: "Le nom ou numéro de la ligne (ex: 'A', 'B', '14', 'T1', 'L6')"
            }
          },
          required: ["ligne"]
        }
      },
      {
        name: "getArretsLigne",
        description: "Obtient la liste de tous les arrêts d'une ligne dans l'ordre du trajet. UTILISE CETTE FONCTION pour vérifier si une ligne passe par un arrêt.",
        parameters: {
          type: "object",
          properties: {
            idLigne: {
              type: "string",
              description: "L'identifiant de la ligne (ex: 'A', '14', 'L6')"
            }
          },
          required: ["idLigne"]
        }
      },
      {
        name: "getLignesArret",
        description: "Trouve toutes les lignes qui passent par un arrêt donné.",
        parameters: {
          type: "object",
          properties: {
            nomArret: {
              type: "string",
              description: "Le nom de l'arrêt (ex: 'Jean Jaurès')"
            }
          },
          required: ["nomArret"]
        }
      },
      {
        name: "getArretsCommune",
        description: "Liste tous les arrêts de transport dans une commune donnée.",
        parameters: {
          type: "object",
          properties: {
            commune: {
              type: "string",
              description: "Le nom de la commune (ex: 'Castanet-Tolosan', 'Ramonville', 'Pechabou')"
            }
          },
          required: ["commune"]
        }
      },
      {
        name: "getItineraire",
        description: "Calcule un itinéraire en transport en commun entre deux lieux. Utilise cette fonction quand l'utilisateur veut aller d'un point A à un point B.",
        parameters: {
          type: "object",
          properties: {
            depart: {
              type: "string",
              description: "L'adresse ou lieu de départ. Si c'est des coordonnées GPS, utilise le format 'latitude, longitude'"
            },
            arrivee: {
              type: "string",
              description: "L'adresse ou lieu d'arrivée (ex: 'Capitole', 'Place du Capitole Toulouse')"
            }
          },
          required: ["depart", "arrivee"]
        }
      }
    ]
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

    // Créer le modèle Gemini avec les tools
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",  // Modèle expérimental gratuit
      tools: tools,
      systemInstruction: SYSTEM_PROMPT
    })

    // Convertir l'historique au format Gemini
    const geminiHistory = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    // Créer le chat avec l'historique
    const chat = model.startChat({
      history: geminiHistory,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000
      }
    })

    // Envoyer le message
    let result = await chat.sendMessage(message)
    let response = result.response

    // Boucle pour gérer les function calls
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      const candidate = response.candidates?.[0]
      const parts = candidate?.content?.parts || []

      // Chercher les function calls
      const functionCalls = parts.filter(part => part.functionCall)

      if (functionCalls.length === 0) {
        // Pas de function call, on a la réponse finale
        break
      }

      attempts++

      // Exécuter toutes les functions demandées
      const functionResponses = []
      for (const part of functionCalls) {
        const { name, args } = part.functionCall
        const functionResult = await executeTool(name, args)
        functionResponses.push({
          functionResponse: {
            name: name,
            response: functionResult
          }
        })
      }

      // Envoyer les résultats des functions à Gemini
      result = await chat.sendMessage(functionResponses)
      response = result.response
    }

    // Extraire le texte de la réponse finale
    const textParts = response.candidates?.[0]?.content?.parts?.filter(p => p.text) || []
    const finalText = textParts.map(p => p.text).join('\n') || "Désolé, je n'ai pas pu générer une réponse."

    // Retourner la réponse finale
    return Response.json({
      success: true,
      response: finalText
    })

  } catch (error) {
    console.error('Erreur API chat:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}