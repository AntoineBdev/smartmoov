export async function GET() {
  const prenoms = [
    "Antoine",
    "Marie",
    "Pierre",
    "Sophie",
    "Lucas",
    "Emma",
    "Thomas",
    "Léa",
    "Hugo",
    "Chloé",
    "Louis",
    "Camille",
    "Paul",
    "Julie",
    "Arthur",
    "Manon",
    "Jules",
    "Clara",
    "Gabriel",
    "Sarah"
  ];

  const prenomAleatoire = prenoms[Math.floor(Math.random() * prenoms.length)];

  return Response.json({ prenom: prenomAleatoire });
}