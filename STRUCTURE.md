# Structure du projet SmartMove

## 📁 Organisation des fichiers

```
smartmoov/
├── src/
│   ├── app/                    # Pages Next.js (Router App)
│   │   ├── page.js            # Page d'accueil (/)
│   │   ├── chat/
│   │   │   └── page.js        # Page du chatbot (/chat)
│   │   ├── layout.js          # Layout global (Header commun à toutes les pages)
│   │   └── globals.css        # Styles CSS globaux
│   │
│   └── components/            # Composants réutilisables
│       ├── Header.js          # Header de navigation (Accueil / Chat)
│       └── home/              # Composants de la page d'accueil
│           ├── HeroSection.js      # Section principale avec titre + CTA
│           ├── FeaturesSection.js  # Section des fonctionnalités
│           ├── FeatureCard.js      # Card individuelle de feature
│           └── CTASection.js       # Section finale d'appel à l'action
```

## 🧩 Comment ça fonctionne ?

### 1. **Page d'accueil (page.js)**

C'est le fichier principal mais maintenant il est super simple :

```javascript
export default function Home() {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}
```

Il importe 3 composants et les affiche dans l'ordre. C'est tout !

### 2. **Les composants**

Chaque composant est dans son propre fichier :

#### HeroSection.js
- Affiche le titre "Découvrez SmartMove"
- Le badge en haut
- Le bouton principal "Commencer une conversation"

#### FeaturesSection.js
- Affiche les 2 fonctionnalités (Chatbot + Planification)
- Utilise un tableau `features` avec les données
- Utilise `.map()` pour créer une `FeatureCard` pour chaque feature

#### FeatureCard.js
- Un composant réutilisable pour afficher une feature
- Prend des **props** (paramètres) :
  - `icon` : l'icône SVG
  - `title` : le titre
  - `description` : la description

#### CTASection.js
- La section finale avec fond coloré
- Bouton "Lancer le chatbot"

## 🎯 Avantages de cette structure

1. **Lisibilité** : page.js fait maintenant 10 lignes au lieu de 160
2. **Maintenabilité** : Si tu veux changer le Hero, tu vas juste dans HeroSection.js
3. **Réutilisabilité** : FeatureCard peut être réutilisée partout
4. **Séparation des responsabilités** : Chaque composant a une seule tâche

## 📝 Concepts React/Next.js utilisés

### Props (Propriétés)
Les props permettent de passer des données à un composant :

```javascript
// Utilisation
<FeatureCard
  title="Mon titre"
  description="Ma description"
/>

// Dans le composant
export default function FeatureCard({ title, description }) {
  return <h3>{title}</h3>
}
```

### .map()
Permet de transformer un tableau en composants :

```javascript
const features = [
  { id: 1, title: "Feature 1" },
  { id: 2, title: "Feature 2" }
];

{features.map((feature) => (
  <FeatureCard key={feature.id} title={feature.title} />
))}
```

### Import / Export
- `export default` : Exporte le composant
- `import` : Importe un composant pour l'utiliser

## 🚀 Prochaines étapes

Maintenant que le front-end est bien organisé, on peut :
1. Intégrer les APIs backend
2. Ajouter la base de données
3. Connecter le chatbot à un LLM