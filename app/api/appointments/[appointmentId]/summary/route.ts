import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useParticipants } from '@stream-io/video-react-sdk/dist/hooks';

export async function POST(
  request: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const appointmentId = params.appointmentId;
    const { summary, followUp, endTime } = await request.json();
    
    // Update the appointment in Firestore
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, {
      status: 'completed',
      summary,
      followUpRecommendation: followUp,
      endTime,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error saving appointment summary:', error);
    return NextResponse.json(
      { error: 'Failed to save appointment summary' },
      { status: 500 }
    );
  }
} 