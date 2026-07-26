import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export type AuthPayload = { userId: string; email: string }

const COOKIE = 'docshare_token'

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return secret
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
}

export function setAuthCookie(res: Response, token: string) {
  const secure = process.env.NODE_ENV === 'production'
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

export function clearAuthCookie(res: Response) {
  const secure = process.env.NODE_ENV === 'production'
  res.clearCookie(COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
  })
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE] as string | undefined
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthPayload
    ;(req as Request & { user?: AuthPayload }).user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE] as string | undefined
  if (token) {
    try {
      const payload = jwt.verify(token, getJwtSecret()) as AuthPayload
      ;(req as Request & { user?: AuthPayload }).user = payload
    } catch {
      // ignore
    }
  }
  next()
}

export function getUser(req: Request): AuthPayload | undefined {
  return (req as Request & { user?: AuthPayload }).user
}

export { COOKIE }
