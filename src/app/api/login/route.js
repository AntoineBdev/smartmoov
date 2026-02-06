import { cookies } from 'next/headers'

export async function POST(request) {
  const { password } = await request.json()

  // Mot de passe défini dans .env.local
  const correctPassword = process.env.SITE_PASSWORD

  // Si pas de mot de passe configuré, accès libre
  if (!correctPassword) {
    return Response.json({ success: true })
  }

  if (password === correctPassword) {
    // Créer un cookie d'authentification (expire dans 1 jour)
    const cookieStore = await cookies()
    cookieStore.set('auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24  // 1 jour
    })

    return Response.json({ success: true })
  }

  return Response.json({ error: 'Mot de passe incorrect' }, { status: 401 })
}