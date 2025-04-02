"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Clock, MessageCircle, Phone, Search, Video } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import io, { Socket } from 'socket.io-client'
import { getSocket } from "@/lib/socket-config"

interface Message {
  username: string;
  text: string;
  fromSelf: boolean;
}

export default function ConsultationsPage() {
  const { user } = useAuth()
  const [date, setDate] = useState<Date>()
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isConsultationOpen, setIsConsultationOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const isMobile = useMobile()

  // Video conferencing state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [inCall, setInCall] = useState<boolean>(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Mock consultations data
  const consultations = [
    {
      id: "consult1",
      doctorName: "Dr. Sarah Johnson",
      doctorSpecialty: "Cardiologist",
      doctorImage: "/placeholder.svg?height=40&width=40",
      date: "2023-12-20T14:30:00",
      status: "scheduled",
      type: "video",
      duration: 30,
      reason: "Follow-up on recent test results",
      notes: "Please have your recent blood pressure readings available.",
    },
    {
      id: "consult2",
      doctorName: "Dr. Michael Chen",
      doctorSpecialty: "Endocrinologist",
      doctorImage: "/placeholder.svg?height=40&width=40",
      date: "2024-01-05T10:00:00",
      status: "scheduled",
      type: "video",
      duration: 45,
      reason: "Diabetes management",
      notes: "Bring your glucose monitoring log.",
    },
    {
      id: "consult3",
      doctorName: "Dr. Emily Wilson",
      doctorSpecialty: "Dermatologist",
      doctorImage: "/placeholder.svg?height=40&width=40",
      date: "2023-11-15T09:30:00",
      status: "completed",
      type: "video",
      duration: 20,
      reason: "Skin condition assessment",
      notes: "Follow-up in 3 months if condition persists.",
    },
    {
      id: "consult4",
      doctorName: "Dr. James Rodriguez",
      doctorSpecialty: "Neurologist",
      doctorImage: "/placeholder.svg?height=40&width=40",
      date: "2023-10-28T13:15:00",
      status: "completed",
      type: "phone",
      duration: 15,
      reason: "Headache consultation",
      notes: "Prescribed migraine medication. Monitor frequency of headaches.",
    },
  ]

  // Mock available doctors
  const availableDoctors = [
    {
      id: "doc1",
      name: "Dr. Sarah Johnson",
      specialty: "Cardiologist",
      image: "/placeholder.svg?height=40&width=40",
      rating: 4.9,
      reviewCount: 124,
      nextAvailable: "Tomorrow",
      consultationFee: "$75",
    },
    {
      id: "doc2",
      name: "Dr. Michael Chen",
      specialty: "Endocrinologist",
      image: "/placeholder.svg?height=40&width=40",
      rating: 4.8,
      reviewCount: 98,
      nextAvailable: "Dec 18",
      consultationFee: "$85",
    },
    {
      id: "doc3",
      name: "Dr. Emily Wilson",
      specialty: "Dermatologist",
      image: "/placeholder.svg?height=40&width=40",
      rating: 4.7,
      reviewCount: 156,
      nextAvailable: "Today",
      consultationFee: "$70",
    },
    {
      id: "doc4",
      name: "Dr. James Rodriguez",
      specialty: "Neurologist",
      image: "/placeholder.svg?height=40&width=40",
      rating: 4.9,
      reviewCount: 112,
      nextAvailable: "Dec 19",
      consultationFee: "$90",
    },
    {
      id: "doc5",
      name: "Dr. Lisa Wong",
      specialty: "General Practitioner",
      image: "/placeholder.svg?height=40&width=40",
      rating: 4.8,
      reviewCount: 203,
      nextAvailable: "Today",
      consultationFee: "$60",
    },
  ]

  // Filter consultations based on status
  const upcomingConsultations = consultations.filter((consult) => consult.status === "scheduled")

  const pastConsultations = consultations.filter((consult) => consult.status === "completed")

  // Filter doctors based on search query
  const filteredDoctors = availableDoctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Helper function to render consultation type icon
  const getConsultationTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />
      case "phone":
        return <Phone className="h-4 w-4" />
      case "chat":
        return <MessageCircle className="h-4 w-4" />
      default:
        return <Video className="h-4 w-4" />
    }
  }

  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    peer.onicecandidate = (e) => {
      if (e.candidate && socketRef.current && currentRoom) {
        console.log('Sending ICE candidate for room:', currentRoom);
        socketRef.current.emit('ice-candidate', {
          roomId: currentRoom,
          candidate: e.candidate,
        });
      }
    };

    peer.ontrack = (e) => {
      console.log('Received remote track:', e.streams[0]);
      if (e.streams && e.streams[0]) {
        setRemoteStream(e.streams[0]);
      }
    };

    peer.onconnectionstatechange = () => {
      console.log('Connection state changed:', peer.connectionState);
      setConnectionStatus(`Connection state: ${peer.connectionState}`);
    };

    return peer;
  };
  
  const startCall = async (roomId: string) => {
    if (!peerRef.current || !socketRef.current) return;

    try {
      const offer = await peerRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await peerRef.current.setLocalDescription(offer);
      
      socketRef.current.emit('start-call', {
        roomId,
        offer,
      });
      
      console.log('Call started, waiting for answer...');
    } catch (err) {
      console.error('Error starting call:', err);
      setConnectionStatus(`Error starting call: ${err.message}`);
    }
  };
  
  const startConsultation = async (consultation: any) => {
    try {
      console.log('Starting consultation for room:', consultation.id);
      
      // Clean up any existing streams first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // Get user media BEFORE creating peer connection
      const userMedia = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      }).catch(err => {
        console.error('Error accessing media devices:', err);
        throw new Error('Could not access camera/microphone. Please ensure permissions are granted.');
      });

      console.log('Got user media:', userMedia.getTracks().map(t => t.kind).join(','));
      
      // Set stream immediately so local video shows up
      setStream(userMedia);
      
      // Ensure local video is displayed
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = userMedia;
        try {
          await localVideoRef.current.play();
        } catch (e) {
          console.error('Error playing local video:', e);
        }
      }

      // Rest of the setup...
      setCurrentRoom(consultation.id);
      const socket = getSocket();
      socketRef.current = socket;
      
      const peer = createPeer();
      peerRef.current = peer;

      userMedia.getTracks().forEach(track => {
        console.log('Adding track to peer:', track.kind);
        peer.addTrack(track, userMedia);
      });

      socket.on('chat-message', ({ username, text }) => {
        console.log('Received chat message:', username, text);
        setMessages(prev => [...prev, {
          username,
          text,
          fromSelf: false
        }]);
      });

      socket.emit('create-room', {
        username: user?.name || 'Patient',
        consultationId: consultation.id
      });

      setInCall(true);
      setIsConsultationOpen(true);
    } catch (err) {
      console.error('Error starting consultation:', err);
      setConnectionStatus(`Error starting consultation: ${err.message}`);
    }
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && currentRoom && socketRef.current) {
      console.log('Sending message:', message, 'to room:', currentRoom);
      
      // Send message to server
      socketRef.current.emit('chat-message', {
        roomId: currentRoom,
        text: message,
        username: user?.name || 'Patient'
      });

      // Add message to local state
      setMessages(prev => [...prev, {
        username: user?.name || 'Patient',
        text: message,
        fromSelf: true
      }]);

      // Clear input
      setMessage('');
    }
  };
  
  const endConsultation = () => {
    setIsConsultationOpen(false);
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }
    if (socketRef.current) {
      socketRef.current.off('chat-message');
      socketRef.current.disconnect();
    }
    if (peerRef.current) {
      peerRef.current.close();
    }
    setStream(null);
    setRemoteStream(null);
    setInCall(false);
    setCurrentRoom(null);
    setMessages([]);
  };

  // Set up video streams when they change
  useEffect(() => {
    const setVideoStream = async (videoRef: HTMLVideoElement | null, mediaStream: MediaStream | null) => {
      if (!videoRef || !mediaStream) return;
      
      try {
        // Only set if different
        if (videoRef.srcObject !== mediaStream) {
          videoRef.srcObject = mediaStream;
          await videoRef.play();
          console.log(`Video playing: ${mediaStream.id}`);
        }
      } catch (err) {
        console.error('Error setting video stream:', err);
      }
    };

    // Set local video
    setVideoStream(localVideoRef.current, stream);
    
    // Set remote video
    setVideoStream(remoteVideoRef.current, remoteStream);

  }, [stream, remoteStream]);

  // Setup WebRTC and socket connections
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    // Set up socket event listeners
    socket.on('room-created', (roomId: string) => {
      console.log('Room created:', roomId);
      setConnectionStatus(`Connected to consultation room: ${roomId}`);
    });

    socket.on('user-joined', ({ username }: { username: string }) => {
      console.log('User joined:', username);
      setConnectionStatus(`Dr. ${username} joined the consultation`);
    });

    socket.on('incoming-call', async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      console.log('Incoming call from:', from);
      try {
        if (!peerRef.current) {
          const peer = createPeer();
          peerRef.current = peer;
        }

        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);

        socket.emit('call-accepted', {
          to: from,
          answer,
        });
      } catch (err) {
        console.error('Error accepting call:', err);
        setConnectionStatus(`Error accepting call: ${err.message}`);
      }
    });

    socket.on('call-accepted', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log('Call accepted, setting remote description');
      try {
        if (!peerRef.current) return;
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setConnectionStatus('Call connected!');
      } catch (err) {
        console.error('Error setting remote description:', err);
        setConnectionStatus(`Error connecting: ${err.message}`);
      }
    });

    socket.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try {
        if (!peerRef.current) return;
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    socket.on('error', ({ message }: { message: string }) => {
      setConnectionStatus(`Error: ${message}`);
      setInCall(false);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
    });

    return () => {
      socket.off('room-created');
      socket.off('user-joined');
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('ice-candidate');
      socket.off('error');
    };
  }, [currentRoom, stream]);

  // Define the ConsultationDialog component with proper message handling
  const ConsultationDialog = () => (
    <DialogContent className="sm:max-w-[800px]">
      <DialogHeader>
        <DialogTitle>Video Consultation</DialogTitle>
        <DialogDescription>{connectionStatus}</DialogDescription>
      </DialogHeader>

      {/* Current consultation details */}
      {upcomingConsultations.length > 0 && (
        <div className="flex items-center gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
          <Avatar>
            <AvatarImage 
              src={upcomingConsultations[0].doctorImage} 
              alt={upcomingConsultations[0].doctorName} 
            />
            <AvatarFallback>
              {upcomingConsultations[0].doctorName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{upcomingConsultations[0].doctorName}</h3>
            <p className="text-sm text-muted-foreground">
              {upcomingConsultations[0].doctorSpecialty}
            </p>
            <p className="text-sm text-muted-foreground">
              Duration: {upcomingConsultations[0].duration} minutes
            </p>
            {currentRoom && (
              <p className="text-xs text-muted-foreground">
                Room ID: {currentRoom}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Video streams */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="bg-gray-100 rounded-lg p-2">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-[240px] object-cover rounded"
              style={{ transform: 'scaleX(-1)' }} // Mirror local video
            />
            <div className="text-center mt-2">
              You {stream ? '(Connected)' : '(No stream)'}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="bg-gray-100 rounded-lg p-2">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-[240px] object-cover rounded"
              />
            ) : (
              <div className="h-[240px] flex items-center justify-center bg-gray-200 rounded">
                <div className="text-center">
                  <p className="font-medium">Waiting for doctor...</p>
                  <p className="text-sm text-muted-foreground">
                    The doctor will join the consultation shortly
                  </p>
                </div>
              </div>
            )}
            <div className="text-center mt-2">Doctor {remoteStream ? '(Connected)' : '(Waiting)'}</div>
          </div>
        </div>
      </div>

      {/* Debug controls */}
      <div className="flex justify-center gap-2 mt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            if (currentRoom && peerRef.current) {
              startCall(currentRoom);
            }
          }}
          disabled={!currentRoom || !peerRef.current}
        >
          Restart Call
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={async () => {
            try {
              // Try to restart local video if it's not showing
              if (!stream) {
                const newStream = await navigator.mediaDevices.getUserMedia({
                  video: true,
                  audio: true,
                });
                setStream(newStream);
                if (localVideoRef.current) {
                  localVideoRef.current.srcObject = newStream;
                  await localVideoRef.current.play();
                }
              }
              
              // Log debug info
              console.log('Local video element:', localVideoRef.current);
              console.log('Local video srcObject:', localVideoRef.current?.srcObject);
              console.log('Stream tracks:', stream?.getTracks().map(t => ({
                kind: t.kind,
                enabled: t.enabled,
                muted: t.muted,
                readyState: t.readyState
              })));
            } catch (err) {
              console.error('Error in debug action:', err);
            }
          }}
        >
          Debug Video
        </Button>
      </div>

      {/* Chat section */}
      <div className="mt-4">
        <div 
          className="h-32 overflow-y-auto border rounded-lg p-2"
          style={{ scrollBehavior: 'smooth' }}
        >
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground">No messages yet</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex flex-col ${msg.fromSelf ? 'items-end' : 'items-start'} mb-2`}>
                <span className="text-xs text-muted-foreground">{msg.username}</span>
                <p className={`p-2 rounded ${msg.fromSelf ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {msg.text}
                </p>
              </div>
            ))
          )}
        </div>
        
        <form onSubmit={handleSendMessage} className="flex gap-2 mt-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!currentRoom || !socketRef.current?.connected}
          />
          <Button 
            type="submit"
            disabled={!currentRoom || !message.trim() || !socketRef.current?.connected}
          >
            Send
          </Button>
        </form>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={endConsultation}>
          End Consultation
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  // Add a cleanup effect for media streams
  useEffect(() => {
    return () => {
      // Cleanup function to stop all tracks when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Online Consultations</h1>
          <p className="text-muted-foreground">Schedule and manage your virtual doctor appointments</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsBookingOpen(true)}>
          Book New Consultation
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="doctors">Available Doctors</TabsTrigger>
        </TabsList>

        {/* Upcoming Consultations Tab */}
        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {upcomingConsultations.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingConsultations.map((consultation) => (
                <Card key={consultation.id} className="overflow-hidden">
                  <CardHeader className="pb-2 bg-green-50">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          {format(new Date(consultation.date), "MMM d, yyyy")}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getConsultationTypeIcon(consultation.type)}
                          <span className={isMobile ? "sr-only" : "capitalize"}>{consultation.type}</span>
                        </Badge>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        {format(new Date(consultation.date), "h:mm a")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar>
                        <AvatarImage src={consultation.doctorImage} alt={consultation.doctorName} />
                        <AvatarFallback>
                          {consultation.doctorName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{consultation.doctorName}</h3>
                        <p className="text-sm text-muted-foreground">{consultation.doctorSpecialty}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span>{consultation.duration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reason:</span>
                        <span className="text-right">{consultation.reason}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="outline" size="sm" onClick={() => setIsConsultationOpen(true)}>
                      View Details
                    </Button>
                    <a href="https://meet.google.com/jci-qarz-vty">
                    <Button 
                      className="bg-green-600 hover:bg-green-700" 
                      size="sm"
                      disabled={inCall} // Prevent joining multiple calls
                    >
                      {inCall ? 'In Consultation' : 'Join Consultation'}
                    </Button>
                    </a>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Upcoming Consultations</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  You don't have any upcoming consultations scheduled. Book a consultation with one of our healthcare
                  professionals.
                </p>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsBookingOpen(true)}>
                  Book New Consultation
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Past Consultations Tab */}
        <TabsContent value="past" className="space-y-4 mt-4">
          {pastConsultations.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {pastConsultations.map((consultation) => (
                <Card key={consultation.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{format(new Date(consultation.date), "MMM d, yyyy")}</Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getConsultationTypeIcon(consultation.type)}
                          <span className="capitalize">{consultation.type}</span>
                        </Badge>
                      </div>
                      <Badge variant="outline">{format(new Date(consultation.date), "h:mm a")}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar>
                        <AvatarImage src={consultation.doctorImage} alt={consultation.doctorName} />
                        <AvatarFallback>
                          {consultation.doctorName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{consultation.doctorName}</h3>
                        <p className="text-sm text-muted-foreground">{consultation.doctorSpecialty}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reason:</span>
                        <span className="text-right">{consultation.reason}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Notes:</span>
                        <span className="text-right">{consultation.notes}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="outline" size="sm">
                      View Summary
                    </Button>
                    <Button variant="outline" size="sm">
                      Book Follow-up
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Past Consultations</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  You don't have any past consultations. Once you complete a consultation, it will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Available Doctors Tab */}
        <TabsContent value="doctors" className="space-y-4 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search doctors by name or specialty..."
              className="flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <Card key={doctor.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={doctor.image} alt={doctor.name} />
                      <AvatarFallback>
                        {doctor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{doctor.name}</h3>
                      <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-sm font-medium">{doctor.rating}</span>
                        <span className="text-xs text-muted-foreground">({doctor.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm mb-4">
                    <div>
                      <div className="text-muted-foreground">Next Available</div>
                      <div className="font-medium">{doctor.nextAvailable}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-muted-foreground">Consultation Fee</div>
                      <div className="font-medium">{doctor.consultationFee}</div>
                    </div>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setIsBookingOpen(true)}>
                    Book Consultation
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Consultation Details Dialog */}
      <Dialog open={isConsultationOpen} onOpenChange={setIsConsultationOpen}>
        <ConsultationDialog />
      </Dialog>

      {/* Book Consultation Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Book New Consultation</DialogTitle>
            <DialogDescription>
              Schedule a virtual consultation with one of our healthcare professionals
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Doctor</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {availableDoctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Consultation Type</label>
              <Select defaultValue="video">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video Call</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Time</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="13:00">1:00 PM</SelectItem>
                    <SelectItem value="14:00">2:00 PM</SelectItem>
                    <SelectItem value="15:00">3:00 PM</SelectItem>
                    <SelectItem value="16:00">4:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Consultation</label>
              <Input placeholder="Brief description of your health concern" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Notes</label>
              <Input placeholder="Any additional information for the doctor" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookingOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">Book Appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

