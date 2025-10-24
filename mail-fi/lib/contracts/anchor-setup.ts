import { Connection, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor'
import { PROGRAM_ID } from './program-id'

// IDL will be generated after build - for now using placeholder
const IDL_PLACEHOLDER = {
  version: "0.1.0",
  name: "mail_fi_contracts",
  instructions: []
}

export function getProgram(connection: Connection, wallet: any) {
  const provider = new AnchorProvider(
    connection,
    wallet,
    {commit: 'confirmed'}
  )

  // TODO: Replace with actual IDL after anchor build completes
  return new Program(IDL_PLACEHOLDER as any, PROGRAM_ID, provider)
}

export function getPDA(seeds: (Buffer | Uint8Array)[], programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId)
}
