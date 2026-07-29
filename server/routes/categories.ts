import { Router } from 'express'
import { prisma } from '../db.js'

export const categoriesRouter = Router()

categoriesRouter.get('/', async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
  res.json({ categories })
})

categoriesRouter.post('/', async (req, res) => {
  const name = String(req.body?.name || '').trim()
  if (!name) {
    res.status(400).json({ error: 'Category name is required' })
    return
  }

  const existing = await prisma.category.findUnique({ where: { name } })
  if (existing) {
    res.status(400).json({ error: 'A category with that name already exists' })
    return
  }

  const last = await prisma.category.findFirst({ orderBy: { sortOrder: 'desc' } })
  const category = await prisma.category.create({
    data: {
      name,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  })
  res.status(201).json({ category })
})

categoriesRouter.put('/:id', async (req, res) => {
  const name = String(req.body?.name || '').trim()
  if (!name) {
    res.status(400).json({ error: 'Category name is required' })
    return
  }

  const current = await prisma.category.findUnique({ where: { id: req.params.id } })
  if (!current) {
    res.status(404).json({ error: 'Category not found' })
    return
  }

  const clash = await prisma.category.findFirst({
    where: { name, NOT: { id: current.id } },
  })
  if (clash) {
    res.status(400).json({ error: 'A category with that name already exists' })
    return
  }

  const [, category] = await prisma.$transaction([
    prisma.document.updateMany({
      where: { category: current.name },
      data: { category: name },
    }),
    prisma.category.update({
      where: { id: current.id },
      data: { name },
    }),
  ])

  res.json({ category })
})

categoriesRouter.delete('/:id', async (req, res) => {
  const current = await prisma.category.findUnique({ where: { id: req.params.id } })
  if (!current) {
    res.status(404).json({ error: 'Category not found' })
    return
  }

  const total = await prisma.category.count()
  if (total <= 1) {
    res.status(400).json({ error: 'Keep at least one category' })
    return
  }

  const fallback =
    (await prisma.category.findFirst({
      where: { name: 'Other', NOT: { id: current.id } },
    })) ||
    (await prisma.category.findFirst({
      where: { NOT: { id: current.id } },
      orderBy: { sortOrder: 'asc' },
    }))

  if (!fallback) {
    res.status(400).json({ error: 'No fallback category available' })
    return
  }

  await prisma.$transaction([
    prisma.document.updateMany({
      where: { category: current.name },
      data: { category: fallback.name },
    }),
    prisma.category.delete({ where: { id: current.id } }),
  ])

  res.json({ ok: true, movedTo: fallback.name })
})
