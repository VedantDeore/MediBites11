import { initializeApp, getApps } from "firebase/app"
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth"
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  Timestamp,
  runTransaction,
} from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Wallet } from "./blockchain"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-II52_zio0Yjet8GqX69IYHCnFSQa6mY",
  authDomain: "medicare11.firebaseapp.com",
  projectId: "medicare11",
  storageBucket: "medicare11.appspot.com",
  messagingSenderId: "680235132153",
  appId: "1:680235132153:web:6abafe6ec282c6f4ac6e28",
  measurementId: "G-58S0C38CFY",
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

// Transaction type definition
export interface Transaction {
  id: string
  userId: string
  type: "deposit" | "payment" | "refund"
  amount: number
  description: string
  timestamp: any // or use proper Firebase Timestamp type
  balanceAfter: number
  appointmentId?: string // Make optional
  doctorId?: string // Make optional
  doctorName?: string // Make optional
}

// Function to add a transaction
const addTransaction = async (patientId: string, transactionData: Omit<Transaction, "id">) => {
  try {
    await addDoc(collection(db, "transactions"), {
      patientId,
      ...transactionData,
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error adding transaction:", error)
    throw error
  }
}

// Patient authentication functions
export const registerPatient = async (email: string, password: string, patientData: any) => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update profile with name
    await updateProfile(user, {
      displayName: patientData.name,
    })

    // Create blockchain wallet for patient
    const wallet = new Wallet(user.uid);
    
    // Add wallet public key to patient data
    const initializedPatientData = {
      ...patientData,
      id: user.uid,
      walletPublicKey: wallet.publicKey,
      allergies: [],
      chronicConditions: [],
      medications: [],
      pastSurgeries: [],
      familyHistory: [],
      upcomingAppointments: [],
      pastAppointments: [],
      labReports: [],
      prescriptions: [],
      vaccinations: [],
      healthPredictions: [],
      preferredDoctors: [],
      emergencyContacts: [],
      balance: 5000, // Initial balance of $5000
      notificationPreferences: {
        appointments: true,
        medications: true,
        labResults: true,
        newsletters: false,
      },
      privacySettings: {
        shareRecordsWithDoctors: true,
        allowResearchUse: false,
        showProfileToOthers: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Store patient data in Firestore
    await setDoc(doc(db, "patients", user.uid), initializedPatientData)

    // Create initial transaction for the starting balance
    await addTransaction(user.uid, {
      type: "deposit",
      amount: 5000,
      description: "Initial account balance",
      timestamp: new Date().toISOString(),
      balanceAfter: 5000,
    })

    return user
  } catch (error) {
    console.error("Error registering patient:", error)
    throw error
  }
}

export const loginPatient = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    console.error("Error logging in patient:", error)
    throw error
  }
}

export const signOut = async () => {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

export const getPatientProfile = async (userId: string) => {
  try {
    const docRef = doc(db, "patients", userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting patient profile:", error)
    throw error
  }
}

export const updatePatientProfile = async (userId: string, data: any) => {
  try {
    const docRef = doc(db, "patients", userId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.error("Error updating patient profile:", error)
    throw error
  }
}

// Update medical information
export const updateMedicalInfo = async (userId: string, medicalData: any) => {
  try {
    const docRef = doc(db, "patients", userId)
    await updateDoc(docRef, {
      ...medicalData,
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.error("Error updating medical information:", error)
    throw error
  }
}

// Upload profile picture
export const uploadProfilePicture = async (userId: string, file: File) => {
  try {
    const storageRef = ref(storage, `patients/${userId}/profile-picture`)
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)

    // Update user profile with photo URL
    const user = auth.currentUser
    if (user) {
      await updateProfile(user, {
        photoURL: downloadURL,
      })
    }

    // Update patient document with profile picture URL
    await updateDoc(doc(db, "patients", userId), {
      profilePicture: downloadURL,
      updatedAt: new Date().toISOString(),
    })

    return downloadURL
  } catch (error) {
    console.error("Error uploading profile picture:", error)
    throw error
  }
}

// Get appointments for a patient
export const getPatientAppointments = async (patientId: string) => {
  try {
    const appointmentsRef = collection(db, "appointments")
    const q = query(appointmentsRef, where("patientId", "==", patientId))
    const querySnapshot = await getDocs(q)

    const appointments: any[] = []
    querySnapshot.forEach((doc) => {
      appointments.push({ id: doc.id, ...doc.data() })
    })

    return appointments
  } catch (error) {
    console.error("Error getting patient appointments:", error)
    throw error
  }
}

// Get medical records for a patient
export const getPatientMedicalRecords = async (patientId: string) => {
  try {
    // First check if the patient has records in the medicalRecords collection
    const recordsRef = collection(db, "medicalRecords")
    const q = query(recordsRef, where("patientId", "==", patientId))
    const querySnapshot = await getDocs(q)

    const records: any[] = []
    querySnapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() })
    })

    // Also check for records in the patient document itself
    const patientDoc = await getDoc(doc(db, "patients", patientId))
    if (patientDoc.exists()) {
      const patientData = patientDoc.data()

      // Add lab reports if they exist
      if (patientData.labReports && Array.isArray(patientData.labReports)) {
        patientData.labReports.forEach((report: any, index: number) => {
          records.push({
            id: `lab-${index}-${Date.now()}`,
            name: report.name || "Lab Report",
            type: "lab-report",
            date: report.date,
            results: report.results || [],
            summary: report.summary,
            doctorName: report.doctorName,
            doctorId: report.doctorId,
            url: report.documentUrl,
            uploadedAt: report.date,
          })
        })
      }

      // Add prescriptions if they exist
      if (patientData.prescriptions && Array.isArray(patientData.prescriptions)) {
        patientData.prescriptions.forEach((prescription: any, index: number) => {
          records.push({
            id: `prescription-${index}-${Date.now()}`,
            name: prescription.name || `Prescription ${index + 1}`,
            type: "prescription",
            date: prescription.date,
            doctorName: prescription.doctorName,
            results:
              prescription.medications?.map((med: string) => ({
                name: med,
                value: "As prescribed",
                isAbnormal: false,
              })) || [],
            uploadedAt: prescription.date,
          })
        })
      }

      // Add vaccinations if they exist
      if (patientData.vaccinations && Array.isArray(patientData.vaccinations)) {
        patientData.vaccinations.forEach((vaccination: any, index: number) => {
          records.push({
            id: `vaccination-${index}-${Date.now()}`,
            name: vaccination.name,
            type: "vaccination",
            date: vaccination.date,
            results: vaccination.nextDue
              ? [
                  {
                    name: "Next Due Date",
                    value: vaccination.nextDue,
                    isAbnormal: false,
                  },
                ]
              : [],
            uploadedAt: vaccination.date,
          })
        })
      }
    }

    // Sort records by date (newest first)
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error("Error getting patient medical records:", error)
    throw error
  }
}

// Upload a document for a patient
export const uploadPatientDocument = async (
  patientId: string,
  document: {
    name: string
    type: string
    uploadedAt: string
    uploadedBy: string
  },
  file: File,
): Promise<any> => {
  try {
    // Upload file to storage
    const storageRef = ref(storage, `patients/${patientId}/documents/${Date.now()}_${file.name}`)
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)

    // Create document data with URL
    const documentData = {
      ...document,
      url: downloadURL,
      patientId,
      date: new Date().toISOString(),
    }

    // Add document to medicalRecords collection
    const docRef = await addDoc(collection(db, "medicalRecords"), documentData)

    // Return the document with ID
    return {
      id: docRef.id,
      ...documentData,
    }
  } catch (error) {
    console.error("Error uploading patient document:", error)
    throw error
  }
}

// New functions for balance management

// Get patient balance
export const getPatientBalance = async (patientId: string): Promise<number> => {
  try {
    const patientDoc = await getDoc(doc(db, "patients", patientId))
    if (!patientDoc.exists()) {
      throw new Error("Patient not found")
    }
    return patientDoc.data().balance || 0
  } catch (error) {
    console.error("Error getting patient balance:", error)
    throw error
  }
}

// Add funds to patient account
export const addFundsToPatient = async (patientId: string, amount: number): Promise<number> => {
  try {
    return await runTransaction(db, async (transaction) => {
      const patientRef = doc(db, "patients", patientId)
      const patientDoc = await transaction.get(patientRef)

      if (!patientDoc.exists()) {
        throw new Error("Patient not found")
      }

      const currentBalance = patientDoc.data()?.balance || 0
      const newBalance = currentBalance + amount

      transaction.update(patientRef, {
        balance: newBalance,
        updatedAt: serverTimestamp()
      })

      // Add transaction record
      const transactionRef = doc(collection(db, "transactions"))
      transaction.set(transactionRef, {
        id: transactionRef.id,
        userId: patientId,
        type: "deposit",
        amount,
        description: "Added funds to account",
        timestamp: serverTimestamp(),
        balanceAfter: newBalance
      })

      return newBalance
    })
  } catch (error) {
    console.error("Error adding funds to patient:", error)
    throw error
  }
}

// Process payment for appointment
export const processAppointmentPayment = async (
  patientId: string,
  doctorId: string,
  amount: number,
  appointmentId: string,
  appointmentType: string
): Promise<void> => {
  try {
    // Get patient and doctor wallet info
    const patientDoc = await getDoc(doc(db, "patients", patientId));
    const doctorDoc = await getDoc(doc(db, "doctors", doctorId));
    
    if (!patientDoc.exists() || !doctorDoc.exists()) {
      throw new Error("Patient or doctor not found");
    }

    // Create wallet instances
    const patientWallet = new Wallet(patientId);
    
    // Process payment through blockchain
    await patientWallet.sendMoney(amount, doctorDoc.data().walletPublicKey);
    
    // Update appointment status
    await updateDoc(doc(db, "appointments", appointmentId), {
      isPaid: true,
      paymentDate: serverTimestamp()
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
}

// Get patient transactions
export const getPatientTransactions = async (patientId: string) => {
  try {
    const transactionsRef = collection(db, "transactions")
    const q = query(transactionsRef, where("patientId", "==", patientId), orderBy("timestamp", "desc"))

    const querySnapshot = await getDocs(q)
    const transactions: any[] = []

    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return transactions
  } catch (error) {
    console.error("Error getting patient transactions:", error)
    throw error
  }
}

// Get doctor revenue
export const getDoctorRevenue = async (doctorId: string): Promise<number> => {
  try {
    const doctorDoc = await getDoc(doc(db, "doctors", doctorId))

    if (doctorDoc.exists()) {
      const doctorData = doctorDoc.data()
      return doctorData.revenue || 0
    }

    return 0
  } catch (error) {
    console.error("Error getting doctor revenue:", error)
    throw error
  }
}

// Get doctor transactions
export const getDoctorTransactions = async (doctorId: string) => {
  try {
    const transactionsRef = collection(db, "doctorTransactions")
    const q = query(transactionsRef, where("doctorId", "==", doctorId), orderBy("timestamp", "desc"))

    const querySnapshot = await getDocs(q)
    const transactions: any[] = []

    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return transactions
  } catch (error) {
    console.error("Error getting doctor transactions:", error)
    throw error
  }
}

export { auth, db, storage }

