import FeatureCard from "./FeatureCard";

/**
 * FeaturesSection - Section qui affiche les fonctionnalités principales
 *
 * Cette section utilise le composant FeatureCard pour afficher chaque fonctionnalité.
 * On définit les données (icônes, titres, descriptions) dans un tableau,
 * puis on utilise .map() pour créer une FeatureCard pour chaque élément.
 */
export default function FeaturesSection() {
  // Tableau des fonctionnalités à afficher
  const features = [
    {
      id: 1,
      title: "Chatbot Intelligent",
      description:
        "Posez vos questions en langage naturel et obtenez des itinéraires personnalisés instantanément.",
      // L'icône est un élément SVG (chemin vectoriel)
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      ),
    },
    {
      id: 2,
      title: "Planification de trajets",
      description:
        "Découvrez les meilleurs itinéraires entre villes, campus et lieux d'intérêt avec Tisséo et SNCF.",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      ),
    },
  ];

  return (
    <section className="container mx-auto px-4 py-16 md:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Titre de la section */}
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
          Fonctionnalités principales
        </h2>

        {/* Grille de cards
            .map() parcourt le tableau features et crée une FeatureCard pour chaque élément
            key={feature.id} est obligatoire en React pour identifier chaque élément
        */}
        <div className="grid gap-8 md:grid-cols-2">
          {features.map((feature) => (
            <FeatureCard
              key={feature.id}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}