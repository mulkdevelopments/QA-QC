import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import seedDocuments from '../src/seedDocuments.json' with { type: 'json' }

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment to seed the admin user')
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  })

  const count = await prisma.document.count()
  if (count === 0) {
    await prisma.document.createMany({
      data: seedDocuments.map((d) => ({
        name: d.name,
        label: d.label,
        url: d.url,
        type: d.type,
        category: d.category,
      })),
    })
    console.log(`Seeded ${seedDocuments.length} documents`)
  } else {
    console.log(`Documents already present (${count}), skipping document seed`)
  }

  console.log('Admin user seeded')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
