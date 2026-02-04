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
  const [pendingRequest, setPendingRequest] = useState(null); // Demande en attente de position
  const messagesEndRef = useRef(null);
  const pendingRequestRef = useRef(null);
  const messagesRef = useRef(messages);

  // Garder les refs à jour
  useEffect(() => {
    pendingRequestRef.current = pendingRequest;
  }, [pendingRequest]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto-scroll vers le bas quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fonction pour envoyer un message (réutilisable)
  const sendMessage = async (userMessage, currentMessages, location = null) => {
    // Injecter le GPS quand l'utilisateur mentionne une destination sans départ
    // ou quand il fait référence à sa position
    const needsGPS =
      // "aller à X", "comment aller à X", "je veux aller à X"
      /\b(aller à|aller a|aller au|aller aux|aller vers|je veux aller|pour aller|comment aller|emmène[- ]moi|amène[- ]moi|direction)\b/i.test(userMessage) ||
      // "je vais à X", "comment je vais à X", "j'y vais"
      /\b(je vais|comment je vais|j'y vais|pour me rendre)\s+(à|a|au|aux|vers)\b/i.test(userMessage) ||
      // Référence explicite à la position : "de là où je suis", "depuis ici", "ma position"
      /\b(d'ici|depuis ici|où je suis|ma position|depuis ma position|de chez moi|depuis chez moi)\b/i.test(userMessage);

    let messageWithContext = userMessage;
    if (location && needsGPS) {
      messageWithContext = `[Position de l'utilisateur: ${location.lat}, ${location.lng}]\n\n${userMessage}`;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageWithContext,
          history: currentMessages.slice(1).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);

        // Si l'IA demande la position, on stocke la demande originale
        const responseText = data.response.toLowerCase();
        const askingForLocation =
          (responseText.includes("tu pars d'où") ||
           responseText.includes("d'où tu pars") ||
           responseText.includes("où tu pars") ||
           responseText.includes("point de départ")) &&
          !responseText.includes("pour y aller"); // Pas si c'est un itinéraire

        if (askingForLocation) {
          setPendingRequest(userMessage);
        } else {
          // Sinon on efface la demande en attente
          setPendingRequest(null);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Oups, y'a eu un souci : ${data.error}` },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Mince, je n'arrive pas à me connecter. Réessaie dans quelques secondes ! 🔄" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

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

        // Si une demande est en attente, on la relance avec la position
        // On utilise les refs pour avoir les valeurs actuelles (closure)
        if (pendingRequestRef.current) {
          const pending = pendingRequestRef.current;
          setPendingRequest(null);

          // Ajouter un message pour montrer qu'on a la position
          const currentMessages = messagesRef.current;
          const newMessages = [
            ...currentMessages,
            {
              role: "assistant",
              content: `📍 Position reçue ! Je calcule ton trajet...`,
            },
          ];
          setMessages(newMessages);

          // Relancer la demande avec la position
          sendMessage(pending, newMessages, loc);
        } else {
          // Pas de demande en attente, juste confirmer la position
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `📍 C'est noté ! J'ai ta position. Maintenant dis-moi où tu veux aller et je calculerai le trajet depuis là où tu es !`,
            },
          ]);
        }
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

    const userMessage = inputValue.trim();
    setInputValue("");

    // Ajouter le message utilisateur
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    // Envoyer le message
    await sendMessage(userMessage, newMessages, userLocation);
  };

  const suggestions = [
    "Comment aller de Ramonville à Capitole ?",
    "Quelles lignes passent à Jean Jaurès ?",
    "C'est quoi la ligne A ?",
    "Je veux aller à Toulouse",
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-gray-50 dark:bg-gray-900">
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
                        : "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
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
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-gray-800">
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
                <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  Essaie une de ces questions :
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInputValue(suggestion)}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 transition-all hover:border-[#e5056e] hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
        <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800">
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
                    ? "bg-red-100 text-red-500 dark:bg-red-900/30"
                    : locationStatus === "loading"
                    ? "bg-gray-200 text-gray-400 animate-pulse dark:bg-gray-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
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
                className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 outline-none transition-all focus:border-[#e5056e] focus:bg-white focus:ring-2 focus:ring-[#e5056e]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:bg-gray-700"
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
            <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
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