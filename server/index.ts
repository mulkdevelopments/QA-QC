import 'dotenv/config'
import { createApp } from './app.js'
import { prisma } from './db.js'

const app = createApp()
const port = Number(process.env.PORT) || 3000

app.listen(port, '0.0.0.0', () => {
  console.log(`Alubond Connect API listening on http://0.0.0.0:${port}`)
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
