import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
    error: '/login',
  },
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|login|register|assets).*)',
  ],
}
