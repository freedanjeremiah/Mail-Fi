import { Connection } from '@solana/web3.js'

export async function sendAndConfirmTransactionWithLogs(
  signature: string,
  connection: Connection
): Promise<void> {
  console.log('=== TRANSACTION DEBUG ===')
  console.log('Signature:', signature)
  console.log('Explorer URL:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)

  try {
    const latestBlockhash = await connection.getLatestBlockhash('confirmed')
    console.log('Latest blockhash:', latestBlockhash.blockhash)

    const confirmation = await connection.confirmTransaction(
      {
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        signature: signature,
      },
      'confirmed'
    )

    console.log('Confirmation status:', confirmation.value)

    // Always try to get transaction details
    const txDetails = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    })

    if (txDetails) {
      console.log('Transaction details:', {
        slot: txDetails.slot,
        blockTime: txDetails.blockTime,
        err: txDetails.meta?.err,
      })

      if (txDetails.meta?.logMessages) {
        console.log('=== TRANSACTION LOGS ===')
        txDetails.meta.logMessages.forEach((log, i) => {
          console.log(`[${i}]`, log)
        })
        console.log('=== END LOGS ===')
      }

      if (txDetails.meta?.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(txDetails.meta.err)}\nLogs: ${txDetails.meta.logMessages?.join('\n')}`
        )
      }
    }

    if (confirmation.value.err) {
      throw new Error(`Transaction confirmation failed: ${JSON.stringify(confirmation.value.err)}`)
    }

    console.log('Transaction confirmed successfully')
  } catch (error: any) {
    console.error('=== TRANSACTION ERROR ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)

    // Try one more time to get logs
    try {
      const txDetails = await connection.getTransaction(signature, {
        commitment: 'finalized',
        maxSupportedTransactionVersion: 0,
      })
      if (txDetails?.meta?.logMessages) {
        console.error('Transaction logs:', txDetails.meta.logMessages)
      }
    } catch (e) {
      console.error('Could not retrieve transaction logs')
    }

    throw error
  }
}
