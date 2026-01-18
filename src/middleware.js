import { NextResponse } from 'next/server'

export function middleware(request) {
  // Si SITE_PASSWORD n'est pas défini, pas d'authentification
  if (!process.env.SITE_PASSWORD) {
    return NextResponse.next()
  }

  // Récupérer le cookie d'auth
  const authCookie = request.cookies.get('auth')

  // Si pas authentifié et pas déjà sur /login ou /api/login
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isLoginApi = request.nextUrl.pathname === '/api/login'
  const isPublicAsset = request.nextUrl.pathname.startsWith('/_next') ||
                        request.nextUrl.pathname.startsWith('/favicon')

  // Laisser passer les assets, la page login et l'API login
  if (isLoginPage || isLoginApi || isPublicAsset) {
    return NextResponse.next()
  }

  // Si pas de cookie auth, rediriger vers /login
  if (!authCookie || authCookie.value !== 'true') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// Appliquer le middleware à toutes les routes sauf les fichiers statiques
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}