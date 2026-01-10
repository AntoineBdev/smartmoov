"use client";

import { useState, useEffect } from "react";

export default function Toto() {
  const [prenom, setPrenom] = useState("toto");

  const fetchPrenom = async () => {
    try {
      const response = await fetch("/api/prenom");
      const data = await response.json();
      setPrenom(data.prenom);
    } catch (error) {
      console.error("Erreur lors de la récupération du prénom:", error);
    }
  };

  useEffect(() => {
    fetchPrenom();
  }, []);

  const handleAnimationIteration = () => {
    fetchPrenom();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black overflow-hidden">
      <style jsx global>{`
        @keyframes slideLeftRight {
          0% {
            transform: translateX(-10vw);
          }
          50% {
            transform: translateX(10vw);
          }
          100% {
            transform: translateX(-10vw);
          }
        }
      `}</style>
      <h1
        className="text-4xl font-bold text-black dark:text-white"
        style={{
          animation: 'slideLeftRight 10s ease-in-out infinite'
        }}
        onAnimationIteration={handleAnimationIteration}
      >
        {prenom}
      </h1>
    </div>
  );
}