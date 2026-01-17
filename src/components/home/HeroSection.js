import Link from "next/link";

/**
 * HeroSection - Section principale de la page d'accueil
 * C'est la première chose que les utilisateurs voient quand ils arrivent sur le site
 */
export default function HeroSection() {
  return (
    <section className="container mx-auto px-4 py-20 md:px-8">
      <div className="mx-auto max-w-4xl text-center">
        {/* Badge - petit élément décoratif en haut */}
        <div className="mb-6 inline-block rounded-full bg-gradient-to-r from-[#e5056e] to-[#2d1d67] px-4 py-1.5">
          <span className="text-sm font-medium text-white">
            Assistant Mobilité Intelligente
          </span>
        </div>

        {/* Titre principal */}
        <h1 className="mb-6 text-5xl font-bold leading-tight text-gray-900 md:text-6xl">
          Découvrez{" "}
          <span className="bg-gradient-to-r from-[#e5056e] to-[#2d1d67] bg-clip-text text-transparent">
            SmartMove
          </span>
        </h1>

        {/* Sous-titre / Description */}
        <p className="mb-10 text-xl leading-relaxed text-gray-600 md:text-2xl">
          Votre assistant conversationnel intelligent pour planifier vos trajets
          et découvrir les solutions de mobilité durable à Toulouse.
        </p>

        {/* Bouton principal (CTA = Call To Action) */}
        <div className="flex items-center justify-center">
          <Link
            href="/chat"
            className="group flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e5056e] to-[#2d1d67] px-8 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl sm:w-auto"
          >
            <span>Commencer une conversation</span>
            {/* Icône flèche qui se déplace au survol */}
            <svg
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}