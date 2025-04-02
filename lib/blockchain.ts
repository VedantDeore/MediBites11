import * as crypto from 'crypto';
import { db } from './firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';

// Transaction class with Firebase integration
export class Transaction {
  constructor(
    public amount: number,
    public payer: string,
    public payee: string,
    public timestamp = Date.now()
  ) {}

  toString() {
    return JSON.stringify(this);
  }

  // Save transaction to Firebase
  async saveToFirebase() {
    try {
      await addDoc(collection(db, "blockchain_transactions"), {
        amount: this.amount,
        payer: this.payer,
        payee: this.payee,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving transaction to Firebase:", error);
      throw error;
    }
  }
}

export class Block {
  public nonce = Math.round(Math.random() * 999999999);

  constructor(
    public prevHash: string,
    public transaction: Transaction,
    public ts = Date.now()
  ) {}

  async getHash(): Promise<string> {
    const str = JSON.stringify(this);
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Save block to Firebase
  async saveToFirebase() {
    try {
      await addDoc(collection(db, "blockchain_blocks"), {
        prevHash: this.prevHash,
        transaction: {
          amount: this.transaction.amount,
          payer: this.transaction.payer,
          payee: this.transaction.payee,
          timestamp: this.transaction.timestamp,
        },
        nonce: this.nonce,
        timestamp: serverTimestamp(),
        hash: await this.getHash()
      });
    } catch (error) {
      console.error("Error saving block to Firebase:", error);
      throw error;
    }
  }
}

export class Chain {
  public static instance = new Chain();
  chain: Block[];

  constructor() {
    this.chain = [
      new Block('', new Transaction(100, 'genesis', 'satoshi'))
    ];
    this.initializeChain();
  }

  private async initializeChain() {
    // Save genesis block to Firebase
    await this.chain[0].saveToFirebase();
  }

  get lastBlock() {
    return this.chain[this.chain.length - 1];
  }

  async mine(nonce: number): Promise<number> {
    let solution = 1;
    console.log('⛏️  mining...')

    while(true) {
      const encoder = new TextEncoder();
      const data = encoder.encode((nonce + solution).toString());
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if(hash.substr(0,4) === '0000'){
        console.log(`Solved: ${solution}`);
        return solution;
      }
      solution += 1;
    }
  }

  async addBlock(
    transaction: Transaction,
    senderId: string,
    signature: string
  ): Promise<void> {
    try {
      // Verify signature
      const isValid = await this.verifySignature(
        transaction.toString(),
        signature,
        senderId
      );

      if (isValid) {
        const newBlock = new Block(await this.lastBlock.getHash(), transaction);
        await this.mine(newBlock.nonce);
        this.chain.push(newBlock);
        
        // Save transaction and block to Firebase
        await Promise.all([
          transaction.saveToFirebase(),
          newBlock.saveToFirebase()
        ]);
      }
    } catch (error) {
      console.error("Error adding block:", error);
      throw error;
    }
  }

  private async verifySignature(
    data: string,
    signature: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Get user's public key from Firebase
      const walletDoc = await getDoc(doc(db, "blockchain_wallets", userId));
      if (!walletDoc.exists()) {
        throw new Error("Wallet not found");
      }

      const publicKeyBase64 = walletDoc.data().publicKey;
      
      // Convert base64 to ArrayBuffer
      const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
      
      // Import public key
      const publicKey = await window.crypto.subtle.importKey(
        "spki",
        publicKeyBuffer,
        {
          name: "RSA-PSS",
          hash: "SHA-256",
        },
        true,
        ["verify"]
      );

      // Verify signature
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);
      const signatureBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));

      return await window.crypto.subtle.verify(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        publicKey,
        signatureBuffer,
        encodedData
      );
    } catch (error) {
      console.error("Error verifying signature:", error);
      return false;
    }
  }
}

export class Wallet {
  private publicKey: CryptoKey | null = null;
  private privateKey: CryptoKey | null = null;
  public userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  private async generateKeyPair(): Promise<void> {
    try {
      // Generate new key pair
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-PSS",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["sign", "verify"]
      );

      this.privateKey = keyPair.privateKey;
      this.publicKey = keyPair.publicKey;

      // Export and store public key
      const exportedPublicKey = await window.crypto.subtle.exportKey(
        "spki",
        this.publicKey
      );

      const publicKeyBase64 = btoa(
        String.fromCharCode(...new Uint8Array(exportedPublicKey))
      );

      // Store in Firebase
      await setDoc(doc(db, "blockchain_wallets", this.userId), {
        publicKey: publicKeyBase64,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error generating key pair:", error);
      throw new Error("Failed to generate key pair");
    }
  }

  async getPrivateKey(): Promise<CryptoKey> {
    if (!this.privateKey) {
      await this.generateKeyPair();
    }
    return this.privateKey!;
  }

  async getPublicKey(): Promise<string> {
    try {
      if (!this.publicKey) {
        // Check if we have a stored public key
        const walletDoc = await getDoc(doc(db, "blockchain_wallets", this.userId));
        
        if (walletDoc.exists()) {
          const publicKeyBase64 = walletDoc.data().publicKey;
          const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
          
          this.publicKey = await window.crypto.subtle.importKey(
            "spki",
            publicKeyBuffer,
            {
              name: "RSA-PSS",
              hash: "SHA-256",
            },
            true,
            ["verify"]
          );
        } else {
          // Generate new keys if none exist
          await this.generateKeyPair();
        }
      }

      const exportedKey = await window.crypto.subtle.exportKey(
        "spki",
        this.publicKey!
      );
      return btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
    } catch (error) {
      console.error("Error getting public key:", error);
      throw new Error("Failed to get public key");
    }
  }

  async sign(data: string): Promise<string> {
    try {
      const privateKey = await this.getPrivateKey();
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);

      const signature = await window.crypto.subtle.sign(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        privateKey,
        encodedData
      );

      return btoa(String.fromCharCode(...new Uint8Array(signature)));
    } catch (error) {
      console.error("Error signing data:", error);
      throw error;
    }
  }

  async sendMoney(amount: number, recipientPublicKeyBase64: string): Promise<void> {
    try {
      const transaction = new Transaction(amount, this.userId, recipientPublicKeyBase64);
      const signature = await this.sign(transaction.toString());
      await Chain.instance.addBlock(transaction, this.userId, signature);
    } catch (error) {
      console.error("Error sending money:", error);
      throw error;
    }
  }
} 