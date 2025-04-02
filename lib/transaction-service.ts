import { db } from "./firebase"
import { 
  runTransaction, 
  collection, 
  doc, 
  serverTimestamp,
  DocumentReference,
  getDoc 
} from "firebase/firestore"
import type { Transaction } from "./patient-firebase"
import { showBlockchainStatus } from '@/components/transaction-status-toast';
import { Wallet } from "@/lib/blockchain"

const getWalletForUser = async (userId: string): Promise<Wallet> => {
  try {
    return new Wallet(userId); // No initialization needed
  } catch (error) {
    console.error("Error getting wallet for user:", error);
    throw new Error("Failed to get or create wallet");
  }
}

const getSystemWallet = async (): Promise<Wallet> => {
  const SYSTEM_WALLET_ID = "system_wallet"
  try {
    return new Wallet(SYSTEM_WALLET_ID); // No initialization needed
  } catch (error) {
    console.error("Error getting system wallet:", error)
    throw new Error("Failed to get or create system wallet")
  }
}

export const manageFunds = async (
  userId: string,
  amount: number,
  transactionType: "deposit" | "payment" | "refund",
  metadata: {
    appointmentId?: string,
    doctorId?: string,
    doctorName?: string,
    description: string
  }
): Promise<{ success: boolean; transaction: Transaction }> => {
  const blockchainStatus = showBlockchainStatus();
  
  try {
    return await runTransaction(db, async (transaction) => {
      // Get user wallet reference
      const walletRef = doc(db, "patients", userId)
      const walletDoc = await transaction.get(walletRef)
      
      // Get current balance
      const currentBalance = walletDoc.exists() 
        ? (walletDoc.data().balance || 0) 
        : 0

      // Calculate new balance based on transaction type
      let newBalance = currentBalance
      switch (transactionType) {
        case "deposit":
          newBalance += amount
          break
        case "payment":
          if (currentBalance < amount) {
            throw new Error("Insufficient funds")
          }
          newBalance -= amount
          break
        case "refund":
          newBalance += amount
          break
      }

      // Create transaction record with only defined fields
      const transactionRef = doc(collection(db, "transactions"))
      const transactionData: Partial<Transaction> = {
        id: transactionRef.id,
        userId,
        type: transactionType,
        amount: amount,
        description: metadata.description,
        timestamp: serverTimestamp(),
        balanceAfter: newBalance
      }

      // Only add optional fields if they exist
      if (metadata.appointmentId) {
        transactionData.appointmentId = metadata.appointmentId
      }
      if (metadata.doctorId) {
        transactionData.doctorId = metadata.doctorId
      }
      if (metadata.doctorName) {
        transactionData.doctorName = metadata.doctorName
      }

      // Update wallet and create transaction atomically
      transaction.update(walletRef, {
        balance: newBalance,
        updatedAt: serverTimestamp()
      })

      transaction.set(transactionRef, transactionData)

      // Add to blockchain
      try {
        const wallet = await getWalletForUser(userId);
        if (metadata.doctorId) {
          const doctorWallet = await getWalletForUser(metadata.doctorId);
          await wallet.sendMoney(amount, doctorWallet.publicKey);
        } else {
          // For deposits/refunds, send from system wallet
          const systemWallet = await getSystemWallet();
          await systemWallet.sendMoney(amount, wallet.publicKey);
        }
        blockchainStatus.success();
      } catch (error) {
        console.error("Blockchain error:", error);
        blockchainStatus.error(error.message);
        // Note: We don't throw here as the Firebase transaction was successful
      }

      return {
        success: true,
        transaction: transactionData as Transaction
      }
    })
  } catch (error) {
    console.error("Error in manageFunds:", error)
    blockchainStatus.error(error.message)
    throw error
  }
}

// Get wallet balance
export const getWalletBalance = async (userId: string): Promise<number> => {
  try {
    const walletDoc = await db.collection("wallets").doc(userId).get()
    return walletDoc.exists ? (walletDoc.data()?.balance || 0) : 0
  } catch (error) {
    console.error("Error getting wallet balance:", error)
    throw error
  }
}

// Get transaction history
export const getTransactionHistory = async (
  userId: string,
  limit = 10,
  startAfter?: Date
): Promise<Transaction[]> => {
  try {
    let query = collection(db, "transactions")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(limit)

    if (startAfter) {
      query = query.startAfter(startAfter)
    }

    const snapshot = await getDocs(query)
    return snapshot.docs.map(doc => doc.data() as Transaction)
  } catch (error) {
    console.error("Error getting transaction history:", error)
    throw error
  }
} 