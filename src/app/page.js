// Imports des composants créés dans le dossier components/home/
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import CTASection from "@/components/home/CTASection";

/**
 * Home - La page d'accueil principale
 *
 * Cette page est maintenant beaucoup plus simple car on a décomposé
 * le contenu en 3 composants séparés :
 * - HeroSection : La section en haut avec le titre et le bouton principal
 * - FeaturesSection : La section qui montre les fonctionnalités (2 cards)
 * - CTASection : La section finale qui incite à essayer le chatbot
 *
 * Avantages de cette structure :
 * 1. Plus facile à lire et comprendre
 * 2. Plus facile à modifier (chaque composant est dans son propre fichier)
 * 3. Réutilisable (on peut utiliser ces composants ailleurs si besoin)
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Section Hero - partie principale en haut */}
      <HeroSection />

      {/* Section Features - les fonctionnalités */}
      <FeaturesSection />

      {/* Section CTA - appel à l'action final */}
      <CTASection />
    </div>
  );
}