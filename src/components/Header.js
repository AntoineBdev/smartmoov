"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Header() {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    const isDark = saved === "true";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem("darkMode", newValue);
    document.documentElement.classList.toggle("dark", newValue);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-gray-700 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="SmartMove Logo"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <span className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'var(--font-pixel)' }}>SmartMove</span>
        </Link>

        {/* Navigation + Dark Mode */}
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-[#e5056e] text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              Accueil
            </Link>
            <Link
              href="/chat"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                pathname === "/chat"
                  ? "bg-[#e5056e] text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              Chat
            </Link>
            <Link
              href="/presentation"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                pathname === "/presentation"
                  ? "bg-[#e5056e] text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              📽️ Présentation
            </Link>
          </nav>

          {/* Toggle Dark Mode - Style Apple */}
          <button
            onClick={toggleDarkMode}
            className="relative h-7 w-12 rounded-full bg-gray-300 transition-colors duration-300 dark:bg-[#e5056e]"
            aria-label="Toggle dark mode"
          >
            <span
              className={`absolute top-0.5 left-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ${
                darkMode ? "translate-x-5" : "translate-x-0"
              }`}
            >
              {darkMode ? (
                <svg className="h-3.5 w-3.5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              )}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}