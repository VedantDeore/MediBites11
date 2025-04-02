"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import VideoConference from '@/components/telemedicine/VideoConference';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, VideoOff, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AppointmentDetails {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  isPaid: boolean;
}

export default function TelehealthAppointment() {
  const { appointmentId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinedCall, setJoinedCall] = useState(false);
  const [roomId, setRoomId] = useState<string>('');
  
  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId || !user) return;
      
      try {
        setLoading(true);
        
        // Fetch appointment details from your API
        // This is a placeholder - replace with your actual API call
        const response = await fetch(`/api/appointments/${appointmentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch appointment details');
        }
        
        const data = await response.json();
        setAppointment(data);
        
        // Generate or get room ID (could be the appointmentId or a function of it)
        setRoomId(`appointment-${appointmentId}`);
        
      } catch (error) {
        console.error('Error fetching appointment:', error);
        setError('Could not load appointment details. Please try again.');
        
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointment();
  }, [appointmentId, user]);
  
  const handleJoinCall = () => {
    if (!appointment) return;
    
    // Check if appointment is today and within time window
    const today = new Date();
    const appointmentDate = new Date(appointment.date);
    
    if (
      appointmentDate.getFullYear() === today.getFullYear() &&
      appointmentDate.getMonth() === today.getMonth() &&
      appointmentDate.getDate() === today.getDate()
    ) {
      // We're on the correct day, now check time (allow joining 10 min early)
      const [startHour, startMinute] = appointment.startTime.split(':').map(Number);
      const appointmentStart = new Date(appointmentDate);
      appointmentStart.setHours(startHour, startMinute, 0, 0);
      
      const earlyWindow = new Date(appointmentStart);
      earlyWindow.setMinutes(earlyWindow.getMinutes() - 10);
      
      if (today >= earlyWindow) {
        // Time to join!
        setJoinedCall(true);
      } else {
        // Too early
        const minutesUntil = Math.ceil((earlyWindow.getTime() - today.getTime()) / (1000 * 60));
        toast({
          title: "Too early to join",
          description: `You can join this appointment in about ${minutesUntil} minutes`,
        });
      }
    } else {
      // Wrong day
      toast({
        title: "Wrong day",
        description: `This appointment is scheduled for ${new Date(appointment.date).toLocaleDateString()}`,
      });
    }
  };
  
  const handleEndCall = (summary?: any) => {
    // Handle end of call, save summary if provided
    if (summary) {
      // Save the summary to the appointment record
      // This is a placeholder - replace with your actual API call
      fetch(`/api/appointments/${appointmentId}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(summary),
      });
    }
    
    // Return to appointments page
    router.push('/dashboard/appointments');
    
    toast({
      title: "Call ended",
      description: "Your telemedicine appointment has ended",
    });
  };
  
  // Determine if user is doctor or patient
  const isDoctor = user?.role === 'doctor' || (appointment && user?.id === appointment.doctorId);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-t-green-500 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error || !appointment) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md p-6">
          <CardContent className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-bold">Error Loading Appointment</h1>
            <p className="text-gray-500">{error || "Appointment not found"}</p>
            <Button 
              onClick={() => router.push('/dashboard/appointments')}
              className="bg-green-600 hover:bg-green-700"
            >
              Return to Appointments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If we've joined the call, show the VideoConference component
  if (joinedCall) {
    return (
      <VideoConference
        roomId={roomId}
        appointmentId={appointmentId as string}
        doctorId={appointment.doctorId}
        patientId={appointment.patientId}
        isDoctor={isDoctor}
        onEndCall={handleEndCall}
        user={{
          id: user?.id || '',
          name: user?.name || 'User',
          role: isDoctor ? 'doctor' : 'patient',
          avatar: user?.photoURL,
        }}
      />
    );
  }
  
  // Otherwise, show appointment details and join button
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Telemedicine Appointment</h1>
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Appointment Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-gray-600">{new Date(appointment.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-gray-600">
                      {appointment.startTime} - {appointment.endTime}
                    </p>
                  </div>
                </div>
                
                {isDoctor ? (
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 flex items-center justify-center bg-blue-100 rounded-full text-blue-600 mt-0.5">P</div>
                    <div>
                      <p className="font-medium">Patient</p>
                      <p className="text-gray-600">{appointment.patientName}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 flex items-center justify-center bg-green-100 rounded-full text-green-600 mt-0.5">D</div>
                    <div>
                      <p className="font-medium">Doctor</p>
                      <p className="text-gray-600">Dr. {appointment.doctorName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
              <VideoOff className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Ready to connect?</h3>
              <p className="text-gray-500 text-center mb-6">
                You're about to join a secure video appointment. Make sure your camera and microphone are working.
              </p>
              <Button 
                onClick={handleJoinCall}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Join Video Call
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Prepare for Your Visit</h2>
          <div className="space-y-4">
            <p className="text-gray-600">For the best telemedicine experience:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Find a quiet, private space with good lighting</li>
              <li>Ensure you have a stable internet connection</li>
              <li>Test your camera and microphone before joining</li>
              <li>Have a list of your current medications ready</li>
              <li>Write down any questions or symptoms you want to discuss</li>
              <li>Be ready 5 minutes before your scheduled appointment time</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 