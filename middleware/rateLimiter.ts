import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator: (req: NextRequest, userId: string) => string
}

const rateLimitStore = new Map()

export function createRateLimiter(config: RateLimitConfig) {
  return async (req: NextRequest) => {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const key = config.keyGenerator(req, userId)
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    const userRequests = rateLimitStore.get(key) || []
    const recentRequests = userRequests.filter((time: number) => time > windowStart)
    
    if (recentRequests.length >= config.maxRequests) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          retryAfter: Math.ceil(config.windowMs / 1000),
          limit: config.maxRequests,
          windowMs: config.windowMs
        },
        { status: 429 }
      )
    }
    
    recentRequests.push(now)
    rateLimitStore.set(key, recentRequests)
    
    return NextResponse.next()
  }
}

export const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyGenerator: (req, userId) => `chat:${userId}`
})

export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  keyGenerator: (req, userId) => `upload:${userId}`
})

export const sessionRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  keyGenerator: (req, userId) => `session:${userId}`
}) 