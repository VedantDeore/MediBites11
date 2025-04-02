import { initializeApp, getApps } from "firebase/app"
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth"
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, runTransaction } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Wallet } from "./blockchain"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-II52_zio0Yjet8GqX69IYHCnFSQa6mY",
  authDomain: "medicare11.firebaseapp.com",
  projectId: "medicare11",
  storageBucket: "medicare11.appspot.com", // Fixed storage bucket URL
  messagingSenderId: "680235132153",
  appId: "1:680235132153:web:6abafe6ec282c6f4ac6e28",
  measurementId: "G-58S0C38CFY",
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

// Doctor authentication functions
export const registerDoctor = async (email: string, password: string, doctorData: any) => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update profile with name
    await updateProfile(user, {
      displayName: doctorData.name,
    })

    // Create blockchain wallet for doctor
    const wallet = new Wallet(user.uid)
    const publicKey = await wallet.getPublicKey() // This will auto-generate keys if needed
    
    // Store doctor data in Firestore with wallet
    await setDoc(doc(db, "doctors", user.uid), {
      ...doctorData,
      id: user.uid,
      walletPublicKey: publicKey,
      revenue: 0,
      totalPatients: 0,
      totalAppointments: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return user
  } catch (error) {
    console.error("Error registering doctor:", error)
    throw error
  }
}

export const loginDoctor = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    console.error("Error logging in doctor:", error)
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

export const getDoctorProfile = async (userId: string) => {
  try {
    const docRef = doc(db, "doctors", userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting doctor profile:", error)
    throw error
  }
}

// Update the updateDoctorProfile function to better handle working hours
export const updateDoctorProfile = async (userId: string, data: any) => {
  try {
    // Create a copy of the data to avoid modifying the original
    const updatedData = { ...data }

    // Make sure we're storing the working hours in a consistent format
    if (updatedData.workingHours) {
      // If it's already an object, keep it as is
      // No need to do any conversion
    }

    const docRef = doc(db, "doctors", userId)
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.error("Error updating doctor profile:", error)
    throw error
  }
}

// Upload profile picture
export const uploadProfilePicture = async (userId: string, file: File) => {
  try {
    const storageRef = ref(storage, `doctors/${userId}/profile-picture`)
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)

    // Update user profile with photo URL
    const user = auth.currentUser
    if (user) {
      await updateProfile(user, {
        photoURL: downloadURL,
      })
    }

    // Update doctor document with profile picture URL
    await updateDoc(doc(db, "doctors", userId), {
      profilePicture: downloadURL,
      updatedAt: new Date().toISOString(),
    })

    return downloadURL
  } catch (error) {
    console.error("Error uploading profile picture:", error)
    throw error
  }
}

// Get patients for a doctor
export const getDoctorPatients = async (doctorId: string) => {
  try {
    const patientsRef = collection(db, "patients")
    const q = query(patientsRef, where("doctorId", "==", doctorId))
    const querySnapshot = await getDocs(q)

    const patients: any[] = []
    querySnapshot.forEach((doc) => {
      patients.push({ id: doc.id, ...doc.data() })
    })

    return patients
  } catch (error) {
    console.error("Error getting doctor patients:", error)
    throw error
  }
}

// Get appointments for a doctor
export const getDoctorAppointments = async (doctorId: string) => {
  try {
    const appointmentsRef = collection(db, "appointments")
    const q = query(appointmentsRef, where("doctorId", "==", doctorId))
    const querySnapshot = await getDocs(q)

    const appointments: any[] = []
    querySnapshot.forEach((doc) => {
      appointments.push({ id: doc.id, ...doc.data() })
    })

    return appointments
  } catch (error) {
    console.error("Error getting doctor appointments:", error)
    throw error
  }
}

// Get doctor revenue
export const getDoctorRevenue = async (doctorId: string) => {
  try {
    const docRef = doc(db, "doctors", doctorId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return data.revenue || 0
    }
    return 0
  } catch (error) {
    console.error("Error getting doctor revenue:", error)
    throw error
  }
}

// Update doctor revenue
export const updateDoctorRevenue = async (doctorId: string, amount: number) => {
  try {
    const docRef = doc(db, "doctors", doctorId)
    // Use transaction to ensure atomic updates
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef)
      if (!docSnap.exists()) {
        throw new Error("Doctor document does not exist!")
      }
      
      const data = docSnap.data()
      const currentRevenue = data.revenue || 0
      const newRevenue = currentRevenue + amount
      
      transaction.update(docRef, {
        revenue: newRevenue,
        updatedAt: new Date().toISOString(),
      })
      
      return newRevenue
    })
  } catch (error) {
    console.error("Error updating doctor revenue:", error)
    throw error
  }
}

export { auth, db, storage }

