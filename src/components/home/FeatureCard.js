/**
 * FeatureCard - Une card qui présente une fonctionnalité
 *
 * Props (paramètres qu'on peut passer au composant) :
 * - icon: Le code SVG de l'icône à afficher
 * - title: Le titre de la fonctionnalité
 * - description: La description de la fonctionnalité
 */
export default function FeatureCard({ icon, title, description }) {
  return (
    <div className="group rounded-2xl bg-white p-8 shadow-md transition-all hover:shadow-xl">
      {/* Icône avec fond dégradé */}
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#e5056e] to-[#2d1d67]">
        <svg
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {icon}
        </svg>
      </div>

      {/* Titre de la feature */}
      <h3 className="mb-3 text-xl font-semibold text-gray-900">{title}</h3>

      {/* Description */}
      <p className="leading-relaxed text-gray-600">{description}</p>
    </div>
  );
}