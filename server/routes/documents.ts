import { Router } from 'express'
import { prisma } from '../db.js'

export const documentsRouter = Router()

async function resolveCategoryName(input: unknown): Promise<string | null> {
  const name = String(input || '').trim()
  if (!name) return null
  const found = await prisma.category.findUnique({ where: { name } })
  return found?.name ?? null
}

documentsRouter.get('/', async (_req, res) => {
  const docs = await prisma.document.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] })
  res.json({ documents: docs })
})

documentsRouter.post('/', async (req, res) => {
  const { name, label, url, type, category } = req.body || {}
  if (!name?.trim() || !url?.trim()) {
    res.status(400).json({ error: 'Name and URL are required' })
    return
  }
  try {
    new URL(String(url).trim())
  } catch {
    res.status(400).json({ error: 'Invalid URL' })
    return
  }

  const categoryName = await resolveCategoryName(category)
  if (!categoryName) {
    res.status(400).json({ error: 'Choose a valid category' })
    return
  }

  const doc = await prisma.document.create({
    data: {
      name: String(name).trim(),
      label: String(label || name).trim(),
      url: String(url).trim(),
      type: type === 'folder' ? 'folder' : 'file',
      category: categoryName,
    },
  })
  res.status(201).json({ document: doc })
})

documentsRouter.put('/:id', async (req, res) => {
  const { name, label, url, type, category } = req.body || {}
  if (!name?.trim() || !url?.trim()) {
    res.status(400).json({ error: 'Name and URL are required' })
    return
  }
  try {
    new URL(String(url).trim())
  } catch {
    res.status(400).json({ error: 'Invalid URL' })
    return
  }

  const categoryName = await resolveCategoryName(category)
  if (!categoryName) {
    res.status(400).json({ error: 'Choose a valid category' })
    return
  }

  try {
    const doc = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        name: String(name).trim(),
        label: String(label || name).trim(),
        url: String(url).trim(),
        type: type === 'folder' ? 'folder' : 'file',
        category: categoryName,
      },
    })
    res.json({ document: doc })
  } catch {
    res.status(404).json({ error: 'Document not found' })
  }
})

documentsRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.document.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(404).json({ error: 'Document not found' })
  }
})
