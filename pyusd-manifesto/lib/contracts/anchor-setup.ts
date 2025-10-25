import { Connection, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor'
import { PROGRAM_ID } from './program-id'
import IDL from './idl.json'

export function getProgram(connection: Connection, wallet: any) {
  const provider = new AnchorProvider(
    connection,
    wallet,
    {commitment: 'confirmed'}
  )

  return new Program(IDL as any, PROGRAM_ID, provider)
}

export function getPDA(seeds: (Buffer | Uint8Array)[], programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId)
}
