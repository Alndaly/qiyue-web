import { NextResponse, NextRequest } from 'next/server'

const auth = (request: NextRequest) => {
    const { pathname } = request.nextUrl
    if (pathname === '/login' || pathname === '/register') return true
    if (!request.cookies.get('access_token')) {
        console.log('路由拦截成功')
        return false
    }
    return true
}

export function middleware(request: NextRequest) {
    console.log('test')
    // If the user is authenticated, continue as normal
    if (auth(request)) {
        if (request.nextUrl.pathname === '/') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        return NextResponse.next()
    }
    // Redirect to login page if not authenticated and the destination page is not the sign page
    return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - serviceWorker
         */
        '/((?!api|_next/static|_next/image|favicon.ico|serviceWorker).*)/',
    ],
}