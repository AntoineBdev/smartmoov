import Link from "next/link";

/**
 * CTASection - Call To Action Section (Section d'appel à l'action)
 *
 * C'est la dernière section de la page, avec un fond coloré
 * pour inciter l'utilisateur à essayer le chatbot.
 * CTA = "Call To Action" = un élément qui pousse l'utilisateur à agir
 */
export default function CTASection() {
  return (
    <section className="container mx-auto px-4 py-20 md:px-8">
      {/* Grande card avec fond dégradé */}
      <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-r from-[#e5056e] to-[#2d1d67] p-12 text-center shadow-2xl">
        {/* Titre de l'appel à l'action */}
        <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
          Prêt à optimiser vos déplacements ?
        </h2>

        {/* Texte de description */}
        <p className="mb-8 text-lg text-white/90">
          Commencez dès maintenant à planifier vos trajets avec SmartMove.
        </p>

        {/* Bouton pour aller vers le chat */}
        <Link
          href="/chat"
          className="inline-flex h-14 items-center justify-center rounded-xl bg-white px-8 text-base font-semibold text-[#e5056e] shadow-lg transition-all hover:scale-105"
        >
          Lancer le chatbot
        </Link>
      </div>
    </section>
  );
}