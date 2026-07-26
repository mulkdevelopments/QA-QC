import { Router } from 'express'
import { customAlphabet } from 'nanoid'
import { prisma } from '../db.js'
import { getUser, requireAuth } from '../middleware/auth.js'

const nanoid = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', 12)

export const sharesRouter = Router()

type SnapshotItem = {
  id: string
  name: string
  label: string
  url: string
  type: string
  category: string
}

sharesRouter.post('/', requireAuth, async (req, res) => {
  const auth = getUser(req)!
  const documentIds: string[] = Array.isArray(req.body?.documentIds) ? req.body.documentIds : []
  const title = req.body?.title ? String(req.body.title).trim() : null

  if (!documentIds.length) {
    res.status(400).json({ error: 'Select at least one document' })
    return
  }

  const docs = await prisma.document.findMany({
    where: { id: { in: documentIds } },
  })

  if (!docs.length) {
    res.status(400).json({ error: 'No matching documents found' })
    return
  }

  // Preserve selection order
  const byId = new Map(docs.map((d) => [d.id, d]))
  const items: SnapshotItem[] = documentIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((d) => ({
      id: d!.id,
      name: d!.name,
      label: d!.label,
      url: d!.url,
      type: d!.type,
      category: d!.category,
    }))

  const token = nanoid()
  const share = await prisma.share.create({
    data: {
      token,
      title,
      items,
      createdById: auth.userId,
    },
  })

  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '')
  const path = `/s/${share.token}`
  const url = appUrl ? `${appUrl}${path}` : path

  res.status(201).json({
    share: {
      id: share.id,
      token: share.token,
      title: share.title,
      createdAt: share.createdAt,
      itemCount: items.length,
      path,
      url,
    },
  })
})

sharesRouter.get('/:token', async (req, res) => {
  const share = await prisma.share.findUnique({ where: { token: req.params.token } })
  if (!share) {
    res.status(404).json({ error: 'Share not found' })
    return
  }

  res.json({
    share: {
      token: share.token,
      title: share.title,
      createdAt: share.createdAt,
      items: share.items,
    },
  })
})
