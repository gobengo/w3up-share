import { parseArgs } from 'node:util'
import assert from 'assert'
import * as fsp from "fs/promises"
import * as fs from "fs"
import { StoreConf } from '@web3-storage/access/stores/store-conf'
import * as w3up from "@web3-storage/w3up-client"
import * as ucanto from '@ucanto/core'
import * as didMailto from '@web3-storage/did-mailto'

await main()

async function main() {
  const store = new StoreConf({
    profile: process.env.W3_STORE_NAME ?? 'w3cli'
  })  
  const client = await w3up.create({ store })
  const args = parseArgs({
    options: {
      car: {
        // path to car file
        type: 'string'
      }
    }
  })
  assert.ok(args.values.car, 'missing required flag: --car <path-to-delegation.car>')

  const carPath = args.values.car
  // ensure carPath is an existing file
  if ( ! await fsp.stat(carPath)) {
    throw new Error(`no file found for car ${args.values.car}`)
  }

  const car = await fsp.readFile(args.values.car)
  const { ok: delegation, error: extractionError } = await ucanto.Delegation.extract(car)
  if (extractionError) {
    throw extractionError
  }


  const accessDelegateResult = await client.capability.access.delegate({
    delegations: [delegation],
  })
  if ( ! accessDelegateResult.ok) {
    throw accessDelegateResult.error
  }
  console.warn(`Delegation sent to web3.storage to make available to ${delegation.audience.did()}.`)
  console.warn(`Have them install w3cli and then do \`w3 login ${didMailto.toEmail(delegation.audience.did())}\` to claim the delegation.`)
}
