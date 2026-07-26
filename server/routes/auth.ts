import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../db.js'
import {
  clearAuthCookie,
  getUser,
  requireAuth,
  setAuthCookie,
  signToken,
} from '../middleware/auth.js'

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase()
  const password = String(req.body?.password || '')

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const token = signToken({ userId: user.id, email: user.email })
  setAuthCookie(res, token)
  res.json({ user: { id: user.id, email: user.email } })
})

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res)
  res.json({ ok: true })
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const auth = getUser(req)!
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, email: true },
  })
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  res.json({ user })
})
