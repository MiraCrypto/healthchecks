import { buildServer } from './server.js'
import { userRepo, checkRepo, pingRepo } from './db/DatabaseFactory.js'
import process from 'node:process'

buildServer({ userRepo, checkRepo, pingRepo }).then((app) => {
  const { PORT } = process.env
  const portNum = Number.parseInt(PORT || '8080', 10)
  app.listen({ port: portNum, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    app.log.info(`Server listening at ${address}`)
  })
})
