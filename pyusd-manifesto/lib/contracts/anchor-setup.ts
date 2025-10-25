import { Connection, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import { PROGRAM_ID } from './program-id'
import idlJson from './idl.json'

export function getProgram(connection: Connection, wallet: any) {
  // Debug logging
  console.log('🔍 getProgram called with wallet:', {
    exists: !!wallet,
    publicKey: wallet?.publicKey?.toString(),
    connected: wallet?.connected,
    connecting: wallet?.connecting
  })

  // Check if wallet is defined and has required methods
  if (!wallet || typeof wallet !== 'object') {
    console.error('❌ Invalid wallet object:', wallet)
    throw new Error('Invalid wallet object. Please connect your wallet.')
  }

  // Check if wallet has publicKey and it's valid
  if (!wallet.publicKey) {
    console.error('❌ Wallet publicKey is missing. Wallet state:', {
      connected: wallet.connected,
      connecting: wallet.connecting,
      disconnecting: wallet.disconnecting
    })
    throw new Error('Wallet public key not available. Please ensure your wallet is connected.')
  }

  // Convert string publicKey to PublicKey if needed
  let publicKey: PublicKey;
  try {
    publicKey = wallet.publicKey instanceof PublicKey 
      ? wallet.publicKey 
      : new PublicKey(wallet.publicKey);
  } catch (error) {
    console.error('❌ Invalid public key format:', wallet.publicKey, error)
    throw new Error('Invalid wallet public key format')
  }

  console.log('✅ Wallet validated successfully:', publicKey.toString())

  // Create anchor wallet with proper error handling
  const anchorWallet: Wallet = {
    publicKey,
    signTransaction: async (tx) => {
      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support signing transactions')
      }
      try {
        return await wallet.signTransaction(tx)
      } catch (error) {
        console.error('❌ Error signing transaction:', error)
        throw new Error('Failed to sign transaction')
      }
      // Fallback for older wallet adapters
      throw new Error('Wallet does not support transaction signing')
    },
    signAllTransactions: async (txs) => {
      // Phantom wallet's signAllTransactions method
      if (wallet.signAllTransactions) {
        return await wallet.signAllTransactions(txs)
      }
      // Fallback to signing one by one if batch signing not supported
      if (wallet.signTransaction) {
        const signedTxs = []
        for (const tx of txs) {
          signedTxs.push(await wallet.signTransaction(tx))
        }
        return signedTxs
      }
      throw new Error('Wallet does not support transaction signing')
    },
  }

  try {
    // Create provider with proper configuration
    const provider = new AnchorProvider(
      connection,
      {
        publicKey: anchorWallet.publicKey,
        signTransaction: anchorWallet.signTransaction,
        signAllTransactions: anchorWallet.signAllTransactions
      },
      {
        preflightCommitment: 'confirmed',
        commitment: 'confirmed',
      }
    )

    // Set the provider as the default
    // @ts-ignore - This is a workaround for Anchor's provider setup
    AnchorProvider.env().then((defaultProvider) => {
      // @ts-ignore
      if (defaultProvider && !defaultProvider._program) {
        // @ts-ignore
        defaultProvider.connection = provider.connection
      }
    }).catch(console.error)

    // Create and return the program
    const program = new Program(
      idlJson as any,
      PROGRAM_ID,
      provider
    )
    
    console.log('✅ Program initialized successfully')
    return program
    
  } catch (error) {
    console.error('❌ Error initializing provider:', error)
    throw new Error(`Failed to initialize provider: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export function getPDA(seeds: (Buffer | Uint8Array)[], programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  try {
    return PublicKey.findProgramAddressSync(seeds, programId);
  } catch (error) {
    console.error('❌ Error generating PDA:', error);
    throw new Error('Failed to generate program derived address');
  }
}
