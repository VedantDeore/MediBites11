"use client";

import { useEffect, useState } from 'react';
import { VideoCall } from '@/components/video-call/video-call';
import { useAuth } from '@/lib/auth-context';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { PhoneOff, Video, Mic } from 'lucide-react';

export default function ConsultationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [consultation, setConsultation] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  useEffect(() => {
    const fetchConsultationData = async () => {
      if (!user) return;

      try {
        const consultationDoc = await getDoc(doc(db, "consultations", params.id));
        if (consultationDoc.exists()) {
          const consultationData = consultationDoc.data();
          setConsultation(consultationData);

          // Fetch other participant's data
          const otherUserId = consultationData.doctorId === user.id 
            ? consultationData.patientId 
            : consultationData.doctorId;

          const otherUserDoc = await getDoc(doc(db, 
            consultationData.doctorId === user.id ? "patients" : "doctors", 
            otherUserId
          ));

          if (otherUserDoc.exists()) {
            setOtherUser({
              id: otherUserId,
              name: otherUserDoc.data().name,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching consultation:", error);
      }
    };

    fetchConsultationData();
  }, [user, params.id]);

  const handleEndCall = async () => {
    try {
      // Update consultation status
      await updateDoc(doc(db, "consultations", params.id), {
        status: 'completed',
        endedAt: serverTimestamp(),
      });

      // Redirect to feedback or summary page
      router.push(`/consultation/${params.id}/summary`);
    } catch (error) {
      console.error("Error ending consultation:", error);
    }
  };

  if (!user || !consultation || !otherUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">
          Consultation with {otherUser.name}
        </h1>
        <p className="text-muted-foreground">
          {new Date(consultation.scheduledFor).toLocaleString()}
        </p>
      </div>

      <div className="rounded-lg overflow-hidden border bg-card h-[800px]">
        <VideoCall
          consultationId={params.id}
          currentUser={{
            id: user.id,
            name: user.name,
            image: user.profilePicture,
          }}
          otherUser={otherUser}
          onEndCall={handleEndCall}
        />
      </div>
    </div>
  );
} 