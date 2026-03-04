'use client';

import { useState, useEffect, useCallback } from 'react';

const PRESENTATION_PASSWORD = '123' + '';

export default function Presentation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    // Slide 1: Titre
    {
      type: 'title',
      content: (
        <>
          <div className="logo">🚇</div>
          <h1>SmartMoov</h1>
          <p className="subtitle">Assistant intelligent pour les transports en Occitanie</p>
          <div className="tags">
            <span className="tag">Next.js 16</span>
            <span className="tag">React 19</span>
            <span className="tag">OpenAI</span>
            <span className="tag">Supabase</span>
          </div>
        </>
      )
    },

    // ============================================
    // PARTIE 1 : STRUCTURE DU SITE - CHOIX TECHNOS
    // ============================================

    // Slide 2: Pourquoi Next.js
    {
      content: (
        <>
          <h2>Pourquoi Next.js 16 ?</h2>
          <div className="grid">
            <div className="card">
              <h3>🔗 API Routes intégrées</h3>
              <p>Pas besoin d&apos;un backend séparé. Les routes <code>/api/*</code> sont dans le même projet.</p>
            </div>
            <div className="card">
              <h3>⚡ App Router</h3>
              <p>Routing moderne, layouts imbriqués, loading states natifs.</p>
            </div>
            <div className="card">
              <h3>🚀 React 19 + Compiler</h3>
              <p>Optimisations automatiques, pas besoin de <code>useMemo</code> partout.</p>
            </div>
            <div className="card">
              <h3>🌐 Déploiement Vercel</h3>
              <p>Push sur Git → en ligne en 30 secondes. Gratuit.</p>
            </div>
          </div>
        </>
      )
    },

    // Slide 3: Pourquoi Supabase
    {
      content: (
        <>
          <h2>Pourquoi Supabase ?</h2>
          <div className="grid">
            <div className="card">
              <h3>🐘 PostgreSQL</h3>
              <p>Vraie base SQL, pas du NoSQL. Requêtes complexes, jointures, etc.</p>
            </div>
            <div className="card">
              <h3>🔍 Extension pg_trgm</h3>
              <p>Recherche fuzzy native. &quot;capitol&quot; → &quot;Capitole&quot; sans code custom.</p>
            </div>
            <div className="card">
              <h3>🆓 Gratuit</h3>
              <p>500 MB de stockage, API auto-générée, dashboard inclus.</p>
            </div>
            <div className="card">
              <h3>📡 API REST auto</h3>
              <p>Pas besoin d&apos;écrire les endpoints, Supabase génère tout.</p>
            </div>
          </div>
        </>
      )
    },

    // Slide 4: Pourquoi OpenAI + GPT-4o-mini
    {
      content: (
        <>
          <h2>Pourquoi OpenAI GPT-4o-mini ?</h2>
          <div className="comparison">
            <div className="card bad">
              <h3>❌ GPT-4</h3>
              <p>$30 / 1M tokens</p>
              <p>Trop cher pour un projet étudiant</p>
            </div>
            <div className="card good">
              <h3>✅ GPT-4o-mini</h3>
              <p>$0.15 / 1M tokens</p>
              <p><strong>200x moins cher</strong></p>
              <p>Assez intelligent pour du function calling</p>
            </div>
          </div>
          <div className="highlight-box">
            <strong>Function calling</strong> : le LLM décide quelle fonction appeler, on exécute, il formate la réponse.
          </div>
        </>
      )
    },

    // Slide 5: Pourquoi Google Directions + API SNCF
    {
      content: (
        <>
          <h2>APIs externes</h2>
          <div className="grid">
            <div className="card">
              <h3>🗺️ Google Directions API</h3>
              <ul className="small">
                <li>Mode <code>transit</code> = transports en commun</li>
                <li>Intègre les données Tisséo automatiquement</li>
                <li>Calcul d&apos;itinéraires fiable</li>
              </ul>
            </div>
            <div className="card">
              <h3>🚄 API SNCF</h3>
              <ul className="small">
                <li>Seule source officielle pour les trains</li>
                <li>Horaires temps réel</li>
                <li>TER, TGV, Intercités</li>
              </ul>
            </div>
          </div>
        </>
      )
    },

    // Slide 6: Architecture globale
    {
      content: (
        <>
          <h2>Architecture globale</h2>
          <div className="diagram">
{`┌─────────────────┐                         ┌──────────────────┐
│     Client      │   POST /api/chat        │    API Route     │
│   (React 19)    │ ───────────────────────▶│   (Next.js)      │
└─────────────────┘                         └────────┬─────────┘
        ▲                                            │
        │                                            ▼
        │                                   ┌──────────────────┐
        │                                   │     OpenAI       │
        │                                   │   GPT-4o-mini    │
        │                                   └────────┬─────────┘
        │                                            │ function calls
        │                              ┌─────────────┴─────────────┐
        │                              ▼                           ▼
        │                     ┌─────────────────┐        ┌─────────────────┐
        └─────────────────────│    Supabase     │        │  Google / SNCF  │
                              │   (données)     │        │  (temps réel)   │
                              └─────────────────┘        └─────────────────┘`}
          </div>
        </>
      )
    },

    // ============================================
    // PARTIE 2 : FONCTIONS - QUI APPELLE QUOI
    // ============================================

    // Slide 7: Titre partie 2
    {
      type: 'title',
      content: (
        <>
          <div className="logo">⚙️</div>
          <h1>Les 11 fonctions</h1>
          <p className="subtitle">Qui appelle quoi ?</p>
        </>
      )
    },

    // Slide 8: Fonctions Tisséo (Supabase)
    {
      content: (
        <>
          <h2>Fonctions Tisséo → Supabase</h2>
          <table>
            <tbody>
              <tr><th>Fonction</th><th>Table / RPC</th><th>Retourne</th></tr>
              <tr><td><code>rechercherArret(nom)</code></td><td>arrets_physiques + fuzzy</td><td>Liste d&apos;arrêts</td></tr>
              <tr><td><code>rechercherLigne(ligne)</code></td><td>lignes</td><td>Info ligne (couleur, mode)</td></tr>
              <tr><td><code>getArretsLigne(id)</code></td><td>arrets_itineraire</td><td>Arrêts ordonnés</td></tr>
              <tr><td><code>getLignesArret(nom)</code></td><td>jointure</td><td>Lignes passant par l&apos;arrêt</td></tr>
              <tr><td><code>getArretsCommune(commune)</code></td><td>arrets_physiques</td><td>Arrêts d&apos;une ville</td></tr>
            </tbody>
          </table>
        </>
      )
    },

    // Slide 9: Fonction itinéraire → Google
    {
      content: (
        <>
          <h2>Itinéraire Tisséo → Google Directions</h2>
          <div className="grid">
            <div className="card">
              <h3>📥 Entrée</h3>
              <p><code>getItineraire(départ, arrivée)</code></p>
              <p>Accepte une adresse ou des coordonnées GPS</p>
            </div>
            <div className="card">
              <h3>📤 Sortie</h3>
              <p>Étapes du trajet : lignes, arrêts, durées, correspondances</p>
            </div>
            <div className="card">
              <h3>🚇 Mode transit</h3>
              <p>Google calcule uniquement en transports en commun (pas voiture)</p>
            </div>
            <div className="card">
              <h3>📊 Données GTFS</h3>
              <p>Google intègre les horaires Tisséo automatiquement</p>
            </div>
          </div>
        </>
      )
    },

    // Slide 10: Fonctions SNCF
    {
      content: (
        <>
          <h2>Fonctions SNCF → API SNCF</h2>
          <table>
            <tbody>
              <tr><th>Fonction</th><th>Endpoint API SNCF</th><th>Retourne</th></tr>
              <tr><td><code>rechercherGare(nom)</code></td><td>Supabase (gares_sncf)</td><td>Gare + id_sncf</td></tr>
              <tr><td><code>getGareLaPlusProche(lat, lon)</code></td><td>Supabase (calcul distance)</td><td>Gare la plus proche</td></tr>
              <tr><td><code>getItineraireSNCF(dep, arr)</code></td><td>/journeys</td><td>Trajet train</td></tr>
              <tr><td><code>getLignesGare(id)</code></td><td>/lines</td><td>Lignes de la gare</td></tr>
              <tr><td><code>getProchainsDepartsSNCF(id)</code></td><td>/departures</td><td>Horaires temps réel</td></tr>
            </tbody>
          </table>
        </>
      )
    },

    // ============================================
    // PARTIE 3 : SPÉCIFICITÉS TECHNIQUES
    // ============================================

    // Slide 11: Titre partie 3
    {
      type: 'title',
      content: (
        <>
          <div className="logo">🧠</div>
          <h1>Spécificités techniques</h1>
          <p className="subtitle">Ce qui rend le projet intelligent</p>
        </>
      )
    },

    // Slide 12: Function calling
    {
      content: (
        <>
          <h2>Function Calling (pas RAG)</h2>
          <div className="grid">
            <div className="card bad">
              <h3>❌ RAG classique</h3>
              <p>Cherche dans des <strong>documents</strong> (PDF, texte)</p>
              <p>Approximatif (embeddings, similarité)</p>
            </div>
            <div className="card good">
              <h3>✅ Function Calling</h3>
              <p>Interroge des <strong>données structurées</strong> (SQL)</p>
              <p>Requêtes exactes, pas d&apos;approximation</p>
            </div>
          </div>
          <div className="highlight-box">
            Le LLM <strong>orchestre</strong>, les fonctions <strong>exécutent</strong>. Zéro hallucination sur les données.
          </div>
        </>
      )
    },

    // Slide 13: Recherche fuzzy
    {
      content: (
        <>
          <h2>Recherche fuzzy (pg_trgm)</h2>
          <p className="subtitle">L&apos;utilisateur écrit &quot;capitol&quot; → on trouve &quot;Capitole&quot;</p>
          <div className="grid">
            <div className="card">
              <h3>✂️ Trigrammes</h3>
              <p>Découpe les mots en groupes de 3 lettres</p>
              <p className="muted">&quot;capitole&quot; → cap, api, pit, ito, tol, ole</p>
            </div>
            <div className="card">
              <h3>📊 Score de similarité</h3>
              <p>Compare les trigrammes en commun</p>
              <p className="muted">Plus y&apos;en a, plus ça match</p>
            </div>
            <div className="card">
              <h3>🐘 PostgreSQL natif</h3>
              <p>Extension pg_trgm intégrée à Supabase</p>
              <p className="muted">Pas besoin d&apos;IA pour ça</p>
            </div>
            <div className="card">
              <h3>⚡ Rapide</h3>
              <p>Recherche indexée, résultats instantanés</p>
              <p className="muted">Même avec des milliers d&apos;arrêts</p>
            </div>
          </div>
        </>
      )
    },

    // Slide 14: Géolocalisation
    {
      content: (
        <>
          <h2>Géolocalisation</h2>
          <p className="subtitle">&quot;Comment aller de chez moi à Matabiau ?&quot;</p>
          <div className="flow">
            <div className="flow-step">
              <span className="num">1</span>
              <div>
                <strong>Demande de permission</strong>
                <p className="muted">Le navigateur demande l&apos;accès à la position GPS</p>
              </div>
            </div>
            <div className="flow-step">
              <span className="num">2</span>
              <div>
                <strong>Coordonnées récupérées</strong>
                <p className="muted">Latitude + longitude envoyées avec chaque message</p>
              </div>
            </div>
            <div className="flow-step">
              <span className="num">3</span>
              <div>
                <strong>Le LLM comprend &quot;chez moi&quot;</strong>
                <p className="muted">Il utilise les coordonnées comme point de départ</p>
              </div>
            </div>
          </div>
        </>
      )
    },

    // Slide 15: tool_choice required
    {
      content: (
        <>
          <h2>Forcer l&apos;utilisation des données</h2>
          <div className="comparison">
            <div className="card bad">
              <h3>❌ Sans contrainte</h3>
              <p>&quot;Le métro A passe toutes les 5 min&quot;</p>
              <p className="muted">→ Le LLM invente (hallucination)</p>
            </div>
            <div className="card good">
              <h3>✅ Avec tool_choice: required</h3>
              <p>Obligé d&apos;appeler une fonction</p>
              <p className="muted">→ Données réelles de la BDD</p>
            </div>
          </div>
          <div className="highlight-box">
            <strong>Exception :</strong> &quot;Merci&quot;, &quot;Bonjour&quot;, &quot;Ok&quot; → pas besoin de données, le LLM répond directement.
          </div>
        </>
      )
    },

    // ============================================
    // PARTIE 4 : DIFFICULTÉS
    // ============================================

    // Slide 16: Titre partie 4
    {
      type: 'title',
      content: (
        <>
          <div className="logo">😰</div>
          <h1>Difficultés rencontrées</h1>
          <p className="subtitle">Où on a galéré</p>
        </>
      )
    },

    // Slide 17: Difficultés (à compléter)
    {
      content: (
        <>
          <h2>Problèmes et solutions</h2>
          <div className="grid">
            <div className="card">
              <h3>🎭 Hallucinations</h3>
              <p className="problem">Le LLM invente des horaires</p>
              <p className="solution">→ tool_choice: required</p>
            </div>
            <div className="card">
              <h3>⏱️ Latence</h3>
              <p className="problem">Trop d&apos;appels API séquentiels</p>
              <p className="solution">→ Promise.all() parallèle</p>
            </div>
            <div className="card">
              <h3>✏️ Fautes de frappe</h3>
              <p className="problem">&quot;matabio&quot; non reconnu</p>
              <p className="solution">→ pg_trgm fuzzy search</p>
            </div>
            <div className="card">
              <h3>🔄 Boucles infinies</h3>
              <p className="problem">Le LLM appelle en boucle</p>
              <p className="solution">→ Limite 8 itérations max</p>
            </div>
            <div className="card">
              <h3>📍 Géoloc vs départ explicite</h3>
              <p className="problem">&quot;De A à B&quot; → prenait ma position comme départ</p>
              <p className="solution">→ Priorité au départ explicite dans le prompt</p>
            </div>
          </div>
        </>
      )
    },

    // ============================================
    // PARTIE 5 : OPTIMISATIONS
    // ============================================

    // Slide 18: Titre optimisations
    {
      type: 'title',
      content: (
        <>
          <div className="logo">⚡</div>
          <h1>Optimisations</h1>
          <p className="subtitle">Réduire les coûts et la latence</p>
        </>
      )
    },

    // Slide 19: Optimisations détaillées
    {
      content: (
        <>
          <h2>Ce qu&apos;on a optimisé</h2>
          <div className="grid">
            <div className="card">
              <h3>🇬🇧 Prompt en anglais</h3>
              <p>L&apos;anglais utilise moins de tokens que le français</p>
              <p className="muted">~20% d&apos;économie sur chaque requête</p>
            </div>
            <div className="card">
              <h3>📦 JSON allégé</h3>
              <p>Google renvoie 50+ champs, on en garde 7</p>
              <p className="muted">Durée, ligne, direction, arrêts... c&apos;est tout</p>
            </div>
            <div className="card">
              <h3>⚡ Appels parallèles</h3>
              <p>Promise.all() au lieu de séquentiel</p>
              <p className="muted">3 fonctions en même temps = 3x plus rapide</p>
            </div>
            <div className="card">
              <h3>🎯 Temperature 0.1</h3>
              <p>Réponses plus prévisibles et cohérentes</p>
              <p className="muted">Moins de créativité = moins d&apos;erreurs</p>
            </div>
          </div>
        </>
      )
    },

    // ============================================
    // CONCLUSION
    // ============================================

    // Slide 20: Ce qu'on retient
    {
      content: (
        <>
          <h2>Ce qu&apos;on retient</h2>
          <ul>
            <li><strong>Function calling &gt; RAG</strong> pour des données structurées</li>
            <li><strong>pg_trgm</strong> pour la tolérance aux fautes (pas besoin d&apos;IA)</li>
            <li><strong>Multi-sources</strong> : Supabase + Google + SNCF combinés</li>
            <li><strong>GPT-4o-mini</strong> : suffisant et 200x moins cher</li>
          </ul>
          <div className="highlight-box">
            Le LLM est un <strong>chef d&apos;orchestre</strong>, pas une source de vérité.
          </div>
        </>
      )
    },

    // Slide 20: Questions
    {
      type: 'title',
      content: (
        <>
          <div className="logo">❓</div>
          <h1>Questions ?</h1>
          <p className="subtitle">Testez le site : smartmoov.vercel.app</p>
          <div className="tags">
            <span className="tag">Next.js 16</span>
            <span className="tag">Supabase</span>
            <span className="tag">OpenAI</span>
            <span className="tag">Google Directions</span>
            <span className="tag">API SNCF</span>
          </div>
        </>
      )
    },
  ];

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide, totalSlides]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isAuthenticated) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        setIsAuthenticated(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, nextSlide, prevSlide]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === PRESENTATION_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Mot de passe incorrect');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <style jsx global>{styles}</style>
        <div className="login-box">
          <div className="login-logo">🚇</div>
          <h1>Présentation SmartMoov</h1>
          <p>Accès réservé</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="error">{error}</p>}
            <button type="submit">Accéder</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="presentation">
      <style jsx global>{styles}</style>

      <div className="progress" style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }} />
      <div className="slide-counter">{currentSlide + 1} / {totalSlides}</div>
      <div className="keyboard-hint"><kbd>←</kbd> <kbd>→</kbd> ou <kbd>Espace</kbd></div>

      <div className="slides">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`slide ${slide.type === 'title' ? 'slide-title' : ''} ${
              index === currentSlide ? 'active' : index < currentSlide ? 'prev' : ''
            }`}
          >
            {slide.content}
          </div>
        ))}
      </div>

      <div className="nav">
        <button onClick={prevSlide} disabled={currentSlide === 0}>←</button>
        <button onClick={nextSlide} disabled={currentSlide === totalSlides - 1}>→</button>
      </div>
    </div>
  );
}

const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --pink: #e5056e;
    --purple: #2d1d67;
    --dark: #1a1a2e;
  }

  body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: var(--dark);
    color: white;
    overflow: hidden;
  }

  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--dark), #16213e);
  }

  .login-box {
    background: rgba(255,255,255,0.05);
    padding: 50px;
    border-radius: 20px;
    text-align: center;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .login-logo {
    font-size: 4rem;
    margin-bottom: 20px;
  }

  .login-box h1 {
    font-size: 1.8rem;
    background: linear-gradient(135deg, var(--pink), var(--purple));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 10px;
  }

  .login-box > p {
    opacity: 0.6;
    margin-bottom: 30px;
  }

  .login-box input {
    width: 100%;
    padding: 15px 20px;
    border: 2px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    background: rgba(0,0,0,0.3);
    color: white;
    font-size: 1rem;
    margin-bottom: 15px;
    outline: none;
    transition: border-color 0.3s;
  }

  .login-box input:focus {
    border-color: var(--pink);
  }

  .login-box button {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, var(--pink), var(--purple));
    border: none;
    border-radius: 10px;
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, opacity 0.2s;
  }

  .login-box button:hover {
    transform: scale(1.02);
    opacity: 0.9;
  }

  .error {
    color: #ff6b6b;
    margin-bottom: 15px;
    font-size: 0.9rem;
  }

  .presentation {
    height: 100vh;
    overflow: hidden;
  }

  .nav {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 15px;
    z-index: 100;
  }

  .nav button {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 2px solid var(--pink);
    background: rgba(229, 5, 110, 0.2);
    color: white;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .nav button:hover:not(:disabled) {
    background: var(--pink);
    transform: scale(1.1);
  }

  .nav button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .progress {
    position: fixed;
    top: 0;
    left: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--pink), var(--purple));
    transition: width 0.3s ease;
    z-index: 100;
  }

  .slide-counter {
    position: fixed;
    bottom: 35px;
    right: 40px;
    font-size: 14px;
    opacity: 0.6;
  }

  .keyboard-hint {
    position: fixed;
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.85rem;
    opacity: 0.4;
  }

  kbd {
    background: rgba(255,255,255,0.1);
    padding: 4px 10px;
    border-radius: 6px;
    margin: 0 3px;
  }

  .slides {
    position: relative;
    height: 100vh;
    width: 100vw;
  }

  .slide {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 60px 100px;
    opacity: 0;
    transform: translateX(100px);
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
  }

  .slide.active {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }

  .slide.prev {
    transform: translateX(-100px);
  }

  .slide-title {
    background: linear-gradient(135deg, var(--dark), #16213e);
  }

  h1 {
    font-size: 3.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--pink), var(--purple));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 20px;
    text-align: center;
  }

  h2 {
    font-size: 2.2rem;
    color: var(--pink);
    margin-bottom: 40px;
    text-align: center;
  }

  h3 {
    font-size: 1.2rem;
    color: var(--pink);
    margin-bottom: 12px;
  }

  p, li {
    font-size: 1.15rem;
    line-height: 1.7;
    color: rgba(255,255,255,0.9);
  }

  .subtitle {
    font-size: 1.4rem;
    opacity: 0.8;
    margin-bottom: 30px;
    text-align: center;
  }

  .muted {
    opacity: 0.5;
    font-size: 0.9rem !important;
  }

  pre {
    background: rgba(0,0,0,0.4);
    border-radius: 12px;
    padding: 20px 25px;
    overflow-x: auto;
    font-size: 0.85rem;
    border-left: 4px solid var(--pink);
    width: 100%;
    max-width: 800px;
    margin-top: 15px;
  }

  code {
    font-family: 'Fira Code', 'Consolas', monospace;
    color: #a5d6ff;
    white-space: pre-wrap;
  }

  ul {
    list-style: none;
    text-align: left;
    max-width: 800px;
  }

  ul.small li {
    font-size: 1rem;
    padding: 6px 0 6px 25px;
  }

  li {
    padding: 10px 0;
    padding-left: 25px;
    position: relative;
  }

  li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: var(--pink);
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 25px;
    width: 100%;
    max-width: 950px;
  }

  .comparison {
    display: flex;
    gap: 40px;
    margin-bottom: 30px;
  }

  .card {
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 25px;
    border: 1px solid rgba(255,255,255,0.1);
    transition: transform 0.3s ease, border-color 0.3s ease;
  }

  .card:hover {
    transform: translateY(-3px);
    border-color: var(--pink);
  }

  .card p {
    font-size: 1rem;
  }

  .card.good {
    border-color: #4ade80;
    background: rgba(74, 222, 128, 0.1);
  }

  .card.bad {
    border-color: #f87171;
    background: rgba(248, 113, 113, 0.1);
  }

  .problem {
    color: #f87171 !important;
    font-size: 0.95rem !important;
  }

  .solution {
    color: #4ade80 !important;
    font-weight: 600;
    font-size: 0.95rem !important;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    max-width: 900px;
    font-size: 1rem;
  }

  th, td {
    padding: 12px 18px;
    text-align: left;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }

  th {
    color: var(--pink);
    font-weight: 600;
  }

  td code {
    font-size: 0.85rem;
    background: rgba(0,0,0,0.3);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .diagram {
    background: rgba(0,0,0,0.3);
    border-radius: 16px;
    padding: 25px;
    font-family: 'Fira Code', monospace;
    font-size: 0.8rem;
    line-height: 1.4;
    white-space: pre;
    color: rgba(255,255,255,0.8);
    overflow-x: auto;
  }

  .highlight-box {
    background: linear-gradient(135deg, rgba(229, 5, 110, 0.2), rgba(45, 29, 103, 0.2));
    border: 1px solid var(--pink);
    border-radius: 12px;
    padding: 18px 28px;
    margin-top: 25px;
    max-width: 700px;
    font-size: 1.05rem;
    text-align: center;
  }

  .tags {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 20px;
    justify-content: center;
  }

  .tag {
    padding: 8px 16px;
    background: rgba(229, 5, 110, 0.2);
    border: 1px solid var(--pink);
    border-radius: 50px;
    font-size: 0.9rem;
  }

  .logo {
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, var(--pink), var(--purple));
    border-radius: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    margin-bottom: 25px;
  }

  .flow {
    display: flex;
    flex-direction: column;
    gap: 15px;
    max-width: 600px;
    width: 100%;
  }

  .flow-step {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px 25px;
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
    border-left: 4px solid var(--pink);
  }

  .flow-step .num {
    width: 35px;
    height: 35px;
    background: var(--pink);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0;
  }

  .flow-step div {
    flex: 1;
  }

  .flow-step strong {
    display: block;
    margin-bottom: 5px;
  }
`;
