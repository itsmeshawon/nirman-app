import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

// Upload routes get a stricter limit: 20 requests per minute
const UPLOAD_PATHS = [
  '/api/projects/',   // covers documents, payment-proofs, posts/media, expenses attachments
  '/api/profile/avatar',
]

const WINDOW_MS = 60_000        // 1 minute
const MAX_REQUESTS = 60         // general API limit
const MAX_UPLOAD_REQUESTS = 20  // upload endpoint limit

// In-memory store: key → { count, windowStart }
const store = new Map<string, { count: number; windowStart: number }>()

function isUploadPath(pathname: string): boolean {
  return UPLOAD_PATHS.some(p => pathname.startsWith(p))
}

function getRateLimitKey(request: NextRequest): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  return ip
}

function checkRateLimit(key: string, limit: number): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  entry.count += 1
  return { allowed: true, remaining: limit - entry.count }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    const upload = isUploadPath(pathname)
    const limit = upload ? MAX_UPLOAD_REQUESTS : MAX_REQUESTS
    const key = `${getRateLimitKey(request)}:${upload ? 'upload' : 'api'}`
    const { allowed, remaining } = checkRateLimit(key, limit)

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const response = await updateSession(request)
    response.headers.set('X-RateLimit-Limit', String(limit))
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    return response
  }

  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
