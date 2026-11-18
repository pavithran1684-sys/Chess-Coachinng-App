import 'dotenv/config'
import { createApp } from './app.js'

const port = Number(process.env.PORT || 3001)
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be a valid TCP port.')

const { app, close } = createApp()
const server = app.listen(port, '0.0.0.0', () => {
  const address = server.address()
  const actualPort = typeof address === 'object' && address ? address.port : port
  console.log(`ChessDesk server listening on http://0.0.0.0:${actualPort}`)
})

function shutdown() {
  server.close(() => {
    close()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
