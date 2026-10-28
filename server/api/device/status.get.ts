import { defineEventHandler } from 'h3'
import { deviceAccount, deviceStub } from '../../device-api'

export default defineEventHandler(async event => {
  const account = await deviceAccount(event)
  return { account, device: await deviceStub(event, account).status() }
})
