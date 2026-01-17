"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
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
          <span className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-pixel)' }}>SmartMove</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              pathname === "/"
                ? "bg-[#e5056e] text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Accueil
          </Link>
          <Link
            href="/chat"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              pathname === "/chat"
                ? "bg-[#e5056e] text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Chat
          </Link>
        </nav>
      </div>
    </header>
  );
}