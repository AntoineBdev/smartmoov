import { NextResponse } from 'next/server'

export function middleware(request) {
  // Mode maintenance : bloquer tout le monde
  if (process.env.MAINTENANCE_MODE === 'true') {
    return new NextResponse('Site en maintenance, reviens bientôt !', { status: 503 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
