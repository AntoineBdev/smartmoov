"use client";

import { useState, useEffect, useRef } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Salut ! 👋 Je suis SmartMove, ton assistant transports pour Toulouse et sa région.\n\nPour t'aider au mieux, tu peux partager ta position en cliquant sur 📍 en bas. Comme ça je saurai d'où tu pars !\n\nSinon, dis-moi simplement où tu veux aller 🚇",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle, loading, success, error
  const messagesEndRef = useRef(null);

  // Auto-scroll vers le bas quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Demander la géolocalisation
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }

    setLocationStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);
        setLocationStatus("success");

        // Ajouter un message système pour informer
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `📍 C'est noté ! J'ai ta position (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}). Maintenant dis-moi où tu veux aller et je calculerai le trajet depuis là où tu es !`,
          },
        ]);
      },
      (error) => {
        setLocationStatus("error");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "😅 Pas de souci, tu n'as pas partagé ta position. Dis-moi juste d'où tu pars quand tu demandes un trajet !",
          },
        ]);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    let userMessage = inputValue.trim();

    // Si l'utilisateur a partagé sa position, on l'ajoute au contexte du message
    // (seulement si ça ressemble à une demande de trajet)
    let messageWithContext = userMessage;
    if (userLocation && (
      userMessage.toLowerCase().includes("aller") ||
      userMessage.toLowerCase().includes("trajet") ||
      userMessage.toLowerCase().includes("itinéraire") ||
      userMessage.toLowerCase().includes("comment") ||
      userMessage.toLowerCase().includes("rejoindre")
    )) {
      messageWithContext = `[Position de l'utilisateur: ${userLocation.lat}, ${userLocation.lng}]\n\n${userMessage}`;
    }

    setInputValue("");

    // Ajouter le message utilisateur (sans le contexte de position pour l'affichage)
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    // Appeler notre API chat
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageWithContext,
          // On envoie l'historique (sans le message système initial)
          history: newMessages.slice(1).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Ajouter la réponse de l'IA
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      } else {
        // Afficher l'erreur
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Oups, y'a eu un souci : ${data.error}`,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Mince, je n'arrive pas à me connecter. Réessaie dans quelques secondes ! 🔄",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Comment aller de Ramonville à Capitole ?",
    "Quelles lignes passent à Jean Jaurès ?",
    "C'est quoi la ligne A ?",
    "Je veux aller à Toulouse",
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-gray-50">
      {/* Chat Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex max-w-[80%] gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                      message.role === "user"
                        ? "bg-gray-700"
                        : "bg-gradient-to-br from-[#e5056e] to-[#2d1d67]"
                    }`}
                  >
                    <span className="text-sm font-semibold text-white">
                      {message.role === "user" ? "U" : "SM"}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gray-700 text-white"
                        : "bg-white text-gray-900 shadow-sm"
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[80%] gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e5056e] to-[#2d1d67]">
                    <span className="text-sm font-semibold text-white">SM</span>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions (only show at start) */}
            {messages.length === 1 && (
              <div className="space-y-3 pt-4">
                <p className="text-center text-sm font-medium text-gray-500">
                  Essaie une de ces questions :
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInputValue(suggestion)}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 transition-all hover:border-[#e5056e] hover:bg-gray-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ref pour auto-scroll */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              {/* Bouton Localisation */}
              <button
                type="button"
                onClick={requestLocation}
                disabled={locationStatus === "loading"}
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all ${
                  locationStatus === "success"
                    ? "bg-green-500 text-white"
                    : locationStatus === "error"
                    ? "bg-red-100 text-red-500"
                    : locationStatus === "loading"
                    ? "bg-gray-200 text-gray-400 animate-pulse"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title={
                  locationStatus === "success"
                    ? "Position partagée !"
                    : "Partager ma position"
                }
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Où veux-tu aller ?"
                className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 outline-none transition-all focus:border-[#e5056e] focus:bg-white focus:ring-2 focus:ring-[#e5056e]/20"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#e5056e] to-[#2d1d67] text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </form>
            <p className="mt-2 text-center text-xs text-gray-500">
              {userLocation
                ? "📍 Position partagée • SmartMove peut calculer tes trajets"
                : "Clique sur 📍 pour partager ta position"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}