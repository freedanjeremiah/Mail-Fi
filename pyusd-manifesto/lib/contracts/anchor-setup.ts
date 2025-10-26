import { Connection, PublicKey } from '@solana/web3.js'
import { AnchorProvider } from '@coral-xyz/anchor'

const PROGRAM_ID_STR = 'Ezs5NC81twpytKzrHtPbe11VvXggAZFqLR9ELz562jt'

export const PROGRAM_ID = new PublicKey(PROGRAM_ID_STR)

export function getProgram(connection: Connection, wallet: any) {
  if (!wallet || !wallet.publicKey || !wallet.connected) {
    throw new Error('Wallet not connected')
  }

  const provider = new AnchorProvider(
    connection,
    wallet,
    {
      preflightCommitment: 'confirmed',
      commitment: 'confirmed',
    }
  )

  // Return provider and programId for manual instruction building
  return {
    provider,
    programId: PROGRAM_ID,
    connection,
    wallet
  }
}

export function getPDA(seeds: (Buffer | Uint8Array)[], programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId)
}
