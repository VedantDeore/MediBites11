import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  Timestamp,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"

// Get total number of patients
export const getTotalPatients = async () => {
  try {
    const patientsRef = collection(db, "patients")
    const patientsSnapshot = await getDocs(patientsRef)
    console.log("getTotalPatients found:", patientsSnapshot.size, "patients")
    return patientsSnapshot.size
  } catch (error) {
    console.error("Error getting total patients:", error)
    return 0
  }
}

// Get total number of doctors
export const getTotalDoctors = async () => {
  try {
    const doctorsRef = collection(db, "doctors")
    const doctorsSnapshot = await getDocs(doctorsRef)
    console.log("getTotalDoctors found:", doctorsSnapshot.size, "doctors")
    return doctorsSnapshot.size
  } catch (error) {
    console.error("Error getting total doctors:", error)
    return 0
  }
}

// Get total revenue
export const getTotalRevenue = async () => {
  try {
    // Get all transactions
    const transactionsRef = collection(db, "transactions")
    const snapshot = await getDocs(transactionsRef)

    // Calculate total revenue
    let totalRevenue = 0
    snapshot.forEach((doc) => {
      const transaction = doc.data()
      if (transaction.type === "payment" || transaction.type === "appointment") {
        // Ensure amount is treated as a number
        const amount = Number.parseFloat(transaction.amount) || 0
        totalRevenue += amount
      }
    })

    return totalRevenue
  } catch (error) {
    console.error("Error getting total revenue:", error)
    throw error
  }
}

// Get recent transactions with pagination
export const getTransactions = async (lastDoc?: QueryDocumentSnapshot<DocumentData>, pageSize = 10) => {
  try {
    let transactionsQuery

    if (lastDoc) {
      transactionsQuery = query(
        collection(db, "transactions"),
        orderBy("timestamp", "desc"),
        startAfter(lastDoc),
        limit(pageSize),
      )
    } else {
      transactionsQuery = query(collection(db, "transactions"), orderBy("timestamp", "desc"), limit(pageSize))
    }

    const snapshot = await getDocs(transactionsQuery)

    const transactions: any[] = []
    snapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    const lastVisible = snapshot.docs[snapshot.docs.length - 1]

    return {
      transactions,
      lastDoc: lastVisible,
      hasMore: snapshot.size === pageSize,
    }
  } catch (error) {
    console.error("Error getting transactions:", error)
    throw error
  }
}

// Get transaction by ID
export const getTransactionById = async (id: string) => {
  try {
    const docRef = doc(db, "transactions", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting transaction:", error)
    throw error
  }
}

// Get recent patients
export const getRecentPatients = async (limit = 5) => {
  try {
    const patientsQuery = query(collection(db, "patients"), orderBy("createdAt", "desc"), limit(limit))

    const snapshot = await getDocs(patientsQuery)

    const patients: any[] = []
    snapshot.forEach((doc) => {
      patients.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return patients
  } catch (error) {
    console.error("Error getting recent patients:", error)
    throw error
  }
}

// Get recent doctors
export const getRecentDoctors = async (limit = 5) => {
  try {
    const doctorsQuery = query(collection(db, "doctors"), orderBy("createdAt", "desc"), limit(limit))

    const snapshot = await getDocs(doctorsQuery)

    const doctors: any[] = []
    snapshot.forEach((doc) => {
      doctors.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return doctors
  } catch (error) {
    console.error("Error getting recent doctors:", error)
    throw error
  }
}

// Get monthly revenue data for chart
export const getMonthlyRevenue = async (months = 6) => {
  try {
    const result = [];
    const now = new Date();
    
    // Build date strings for the past N months
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      
      // Format for display
      const monthLabel = `${month} ${year}`;
      
      // Format for query (YYYY-MM)
      const monthStart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;
      
      console.log(`Getting revenue for ${monthLabel} (${monthStart} to ${monthEnd})`);
      
      // Get appointments for this month to count them
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("date", ">=", monthStart),
        where("date", "<=", monthEnd)
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const appointmentsCount = appointmentsSnapshot.size;
      
      // Get transactions for this month to sum revenue
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("date", ">=", monthStart),
        where("date", "<=", monthEnd),
        where("status", "==", "completed")
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      
      let monthlyRevenue = 0;
      transactionsSnapshot.forEach(doc => {
        const transaction = doc.data();
        if (transaction.amount) {
          monthlyRevenue += parseFloat(transaction.amount);
        }
      });
      
      result.unshift({
        month: monthLabel,
        revenue: monthlyRevenue,
        appointments: appointmentsCount
      });
    }
    
    return result;
  } catch (error) {
    console.error("Error getting monthly revenue:", error);
    return [];
  }
}

// Get revenue by doctor
export const getRevenueByDoctor = async (limit = 5) => {
  try {
    // Get all doctors
    const doctorsRef = collection(db, "doctors");
    const doctorsSnapshot = await getDocs(doctorsRef);
    
    const doctorsRevenue = [];
    
    // Get transactions for each doctor
    for (const doctorDoc of doctorsSnapshot.docs) {
      const doctorId = doctorDoc.id;
      const doctorData = doctorDoc.data();
      
      // Query transactions for this doctor
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("doctorId", "==", doctorId),
        where("status", "==", "completed")
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      
      let revenue = 0;
      transactionsSnapshot.forEach(doc => {
        const transaction = doc.data();
        if (transaction.amount) {
          revenue += parseFloat(transaction.amount);
        }
      });
      
      // Query appointments for this doctor to count them
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("doctorId", "==", doctorId)
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      
      doctorsRevenue.push({
        id: doctorId,
        name: doctorData.name || "Unknown Doctor",
        revenue: revenue,
        transactions: appointmentsSnapshot.size
      });
    }
    
    // Sort by revenue (highest first) and limit
    return doctorsRevenue
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
      
  } catch (error) {
    console.error("Error getting doctor revenue:", error);
    return [];
  }
};

// Get appointment commissions (monthly for the last N months)
export const getAppointmentCommissions = async (months = 6) => {
  try {
    const result = [];
    const now = new Date();
    
    // Build date strings for the past N months
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      
      // Format for display
      const monthLabel = `${month} ${year}`;
      
      // Format for query (YYYY-MM)
      const monthStart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;
      
      // Get appointments for this month to calculate commission
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("date", ">=", monthStart),
        where("date", "<=", monthEnd)
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const appointmentsCount = appointmentsSnapshot.size;
      
      // Commission is $10 per appointment
      const commission = appointmentsCount * 10;
      
      result.unshift({
        month: monthLabel,
        appointments: appointmentsCount,
        commission: commission
      });
    }
    
    return result;
  } catch (error) {
    console.error("Error getting appointment commissions:", error);
    return [];
  }
};

// Get telemedicine vs in-person stats
export async function getTelemedicineStats() {
  try {
    // Query telemedicine appointments
    const teleMedicineQuery = query(
      collection(db, "appointments"),
      where("type", "==", "telemedicine")
    )
    
    // Query in-person appointments
    const inPersonQuery = query(
      collection(db, "appointments"),
      where("type", "==", "in-person")
    )
    
    const [teleQuerySnapshot, inPersonQuerySnapshot] = await Promise.all([
      getDocs(teleMedicineQuery),
      getDocs(inPersonQuery)
    ])
    
    return {
      telemedicine: teleQuerySnapshot.size,
      inPerson: inPersonQuerySnapshot.size,
      total: teleQuerySnapshot.size + inPersonQuerySnapshot.size
    }
  } catch (error) {
    console.error("Error getting telemedicine stats:", error)
    return { telemedicine: 0, inPerson: 0, total: 0 }
  }
}

