#!/usr/bin/env node
import * as w3up from "@web3-storage/w3up-client"
import * as ucanto from '@ucanto/core'
import { parseArgs } from 'node:util'
import fs from "fs/promises"
import assert from 'assert'
import { StoreConf } from '@web3-storage/access/stores/store-conf'
import { createRecovery } from "@web3-storage/w3up-client/space"
import * as AccessSpace from "@web3-storage/access/space"
import { spaceAccess } from "@web3-storage/access/access"

const store = new StoreConf({
  profile: process.env.W3_STORE_NAME ?? 'w3cli'
})  
const client = await w3up.create({
  store,
})

await main(client)

/**
 * 
 * @param {import("@web3-storage/w3up-client").Client} client 
 * @returns 
 */
async function main(client) {
  const args = parseArgs({
    options: {
      'list-spaces': {
        type: 'boolean'
      },
      space: {
        // should be did
        type: 'string',
      },
      audience: {
        // should be did
        type: 'string',
      },
      output: {
        // path to output file car
        type: 'string',
      }
    }
  })

  if (args.values['list-spaces']) {
    console.info('spaces', client.agent.spaces)
    return;
  }

  assert(args.values.space, '--space option must be provided')
  assert(args.values.audience, '--audience option must be provided')

  const spaceToClientDelegations = [...findDelegationsForSpace(client, args.values.space)]
  assert.equal(spaceToClientDelegations.length, 1, 'found 1 space delegation')  

  const clientToAudienceForSpaceDelegation = await ucanto.delegate({
    issuer: client.agent.issuer,
    audience: ucanto.DID.parse(args.values.audience),
    capabilities: Object.keys(spaceAccess).map(can => ({
      can,
      with: args.values.space,
    })),
    proofs: spaceToClientDelegations,
  })
  const outputFile = args.values.output
  if ( ! outputFile) {
    throw new Error('pass output file as --output <file>')
  }
  const delegationCarResult = await clientToAudienceForSpaceDelegation.archive()
  if ( ! delegationCarResult.ok) { throw delegationCarResult.error }
  const delegationCar = delegationCarResult.ok
  await fs.writeFile(outputFile, delegationCar)
  console.warn('wrote delegation CAR to', outputFile)
}

/**
 * 
 * @param {import('@web3-storage/w3up-client').Client} client 
 * @param {string} spaceDID 
 */
function * findDelegationsForSpace (client, spaceDID) {
  for (const d of client.agent.proofs()) {
    const delegatesToClientAgent = d.audience.did() === client.agent.issuer.did()
    const isForSpace = d.capabilities[0]?.with === spaceDID;
    if (isForSpace && delegatesToClientAgent) {
      yield d
    }
  }
}
