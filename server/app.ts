import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { authRouter } from './routes/auth.js'
import { documentsRouter } from './routes/documents.js'
import { categoriesRouter } from './routes/categories.js'
import { sharesRouter } from './routes/shares.js'
import { requireAuth } from './middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'
const isVercel = Boolean(process.env.VERCEL)

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)
  app.use(
    cors({
      origin: isProd ? true : ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/documents', requireAuth, documentsRouter)
  app.use('/api/categories', requireAuth, categoriesRouter)
  app.use('/api/shares', sharesRouter)

  // On Vercel, static files are served by the CDN; only local/prod Node serves dist.
  if (isProd && !isVercel) {
    const dist = path.join(__dirname, '..', 'dist')
    app.use(express.static(dist))
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next()
      res.sendFile(path.join(dist, 'index.html'))
    })
  }

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}
