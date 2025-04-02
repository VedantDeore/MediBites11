"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { io, Socket } from 'socket.io-client';
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff,
  MessageSquare, FileText, Clock, ChevronRight, 
  ChevronLeft, Plus, X, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface VideoConferenceProps {
  roomId: string;
  appointmentId?: string;
  doctorId?: string;
  patientId?: string;
  isDoctor?: boolean;
  onEndCall?: (summary?: any) => void;
  user: {
    id: string;
    name: string;
    role: 'doctor' | 'patient';
    avatar?: string;
  };
}

interface Participant {
  userId: string;
  profile: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  stream?: MediaStream;
}

const VideoConference: React.FC<VideoConferenceProps> = ({
  roomId,
  appointmentId,
  doctorId,
  patientId,
  isDoctor = false,
  onEndCall,
  user
}) => {
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerConnections, setPeerConnections] = useState<{[key: string]: RTCPeerConnection}>({});
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(false);
  const [medicalNotes, setMedicalNotes] = useState<string>('');
  const [isEndCallDialogOpen, setIsEndCallDialogOpen] = useState<boolean>(false);
  const [appointmentSummary, setAppointmentSummary] = useState<string>('');
  const [followUpRecommendation, setFollowUpRecommendation] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  const [roomMetadata, setRoomMetadata] = useState<any>({});
  const [callDuration, setCallDuration] = useState<number>(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const remoteVideoRefs = useRef<{[key: string]: HTMLVideoElement}>({});
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // STUN/TURN servers for NAT traversal
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:your-turn-server.com:3478',
        username: 'username',
        credential: 'credential'
      }
    ]
  };

  // Initialize WebRTC and Socket connection
  useEffect(() => {
    if (!roomId || !user) return;

    const SERVER_URL = process.env.NEXT_PUBLIC_VIDEO_SERVER_URL || 'http://localhost:3001';
    
    // Establish socket connection
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    // Start call duration timer
    durationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Request media access
    const initializeMediaStream = async () => {
      try {
        setIsConnecting(true);
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Join room with user profile
        newSocket.emit('join-room', { 
          roomId,
          userProfile: {
            id: user.id,
            name: user.name,
            role: user.role,
            avatar: user.avatar || ''
          }
        });

        // Handle new user joining
        newSocket.on('user-connected', async (data: { 
          userId: string,
          profile: any
        }) => {
          console.log('User connected:', data.userId);
          await createPeerConnection(data.userId, stream);
          
          setParticipants(prev => [
            ...prev, 
            { userId: data.userId, profile: data.profile }
          ]);
          
          // Show toast
          toast({
            title: "User joined",
            description: `${data.profile.name || 'A user'} has joined the call`,
          });
        });

        // Handle room participants list
        newSocket.on('room-participants', (data: {
          participants: Participant[],
          metadata: any
        }) => {
          setParticipants(data.participants);
          setRoomMetadata(data.metadata || {});
          setIsConnecting(false);
        });

        // Handle incoming offer
        newSocket.on('offer', async (data: { 
          userId: string, 
          profile: any,
          offer: RTCSessionDescriptionInit 
        }) => {
          console.log('Received offer from:', data.userId);
          await handleOffer(data.userId, data.offer, stream);
          
          // Add participant if not already in list
          setParticipants(prev => {
            if (!prev.find(p => p.userId === data.userId)) {
              return [...prev, { userId: data.userId, profile: data.profile }];
            }
            return prev;
          });
        });

        // Handle incoming answer
        newSocket.on('answer', async (data: { 
          userId: string,
          answer: RTCSessionDescriptionInit 
        }) => {
          console.log('Received answer from:', data.userId);
          await handleAnswer(data.userId, data.answer);
        });

        // Handle ICE candidates
        newSocket.on('ice-candidate', async (data: { 
          userId: string, 
          candidate: RTCIceCandidateInit 
        }) => {
          await handleIceCandidate(data.userId, data.candidate);
        });

        // Handle chat messages
        newSocket.on('chat-message', (data: {
          userId: string,
          profile: any,
          message: string,
          timestamp: string
        }) => {
          setChatMessages(prev => [...prev, data]);
          
          // If chat is closed, show notification
          if (!chatOpen) {
            toast({
              title: "New message",
              description: `${data.profile.name}: ${data.message.substring(0, 30)}${data.message.length > 30 ? '...' : ''}`,
            });
          }

          // Scroll to bottom
          setTimeout(() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
          }, 100);
        });

        // Handle medical record events
        newSocket.on('medical-record-started', (data) => {
          toast({
            title: "Medical record started",
            description: "The doctor has started documenting your visit",
          });
        });

        newSocket.on('medical-record-updated', (data) => {
          if (!isDoctor) {
            toast({
              title: "Medical record updated",
              description: "The doctor is documenting your visit",
            });
          }
        });

        // Handle appointment end
        newSocket.on('appointment-ended', (data) => {
          toast({
            title: "Appointment ended",
            description: "The appointment has been completed",
          });
          
          // Clean up and redirect
          if (onEndCall) {
            onEndCall({
              summary: data.summary,
              followUp: data.followUp,
              endTime: data.endTime
            });
          }
        });

        // Handle disconnection
        newSocket.on('user-disconnected', (data: {
          userId: string,
          profile: any
        }) => {
          console.log('User disconnected:', data.userId);
          
          // Remove peer connection
          if (peerConnections[data.userId]) {
            peerConnections[data.userId].close();
            const newConnections = {...peerConnections};
            delete newConnections[data.userId];
            setPeerConnections(newConnections);
          }
          
          // Remove participant
          setParticipants(prev => prev.filter(p => p.userId !== data.userId));
          
          toast({
            title: "User left",
            description: `${data.profile?.name || 'A user'} has left the call`,
            variant: "destructive"
          });
        });

        // Handle room ending
        newSocket.on('room-ended', () => {
          toast({
            title: "Call ended",
            description: "The meeting has been ended by the host",
            variant: "destructive"
          });
          
          if (onEndCall) {
            onEndCall();
          }
        });

        setIsConnecting(false);
      } catch (error) {
        console.error('Error accessing media devices', error);
        setIsConnecting(false);
        
        toast({
          title: "Camera/Microphone Error",
          description: "Could not access your camera or microphone. Please check permissions.",
          variant: "destructive"
        });
      }
    };

    initializeMediaStream();

    return () => {
      // Cleanup resources
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      Object.values(peerConnections).forEach(pc => pc.close());
      
      newSocket.disconnect();
      
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [roomId, user]);

  // Create peer connection
  const createPeerConnection = async (userId: string, stream: MediaStream) => {
    try {
      const peerConnection = new RTCPeerConnection(configuration);

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Track remote stream
      peerConnection.ontrack = (event) => {
        console.log('Got remote track:', event.streams[0]);
        
        // Update participant with stream
        setParticipants(prev => 
          prev.map(p => 
            p.userId === userId 
              ? {...p, stream: event.streams[0]} 
              : p
          )
        );
        
        // Set remote video ref
        if (remoteVideoRefs.current[userId]) {
          remoteVideoRefs.current[userId].srcObject = event.streams[0];
        }
      };

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socket?.emit('offer', {
        roomId,
        offer: peerConnection.localDescription
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit('ice-candidate', {
            roomId,
            candidate: event.candidate
          });
        }
      };

      // Save peer connection
      setPeerConnections(prev => ({
        ...prev,
        [userId]: peerConnection
      }));

      return peerConnection;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      throw error;
    }
  };

  // Handle incoming offer
  const handleOffer = async (
    userId: string, 
    offer: RTCSessionDescriptionInit, 
    stream: MediaStream
  ) => {
    try {
      const peerConnection = new RTCPeerConnection(configuration);

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Track remote stream
      peerConnection.ontrack = (event) => {
        console.log('Got remote track from offer:', event.streams[0]);
        
        // Update participant with stream
        setParticipants(prev => 
          prev.map(p => 
            p.userId === userId 
              ? {...p, stream: event.streams[0]} 
              : p
          )
        );
        
        // Set remote video ref
        if (remoteVideoRefs.current[userId]) {
          remoteVideoRefs.current[userId].srcObject = event.streams[0];
        }
      };

      // Set remote description (the offer)
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send answer
      socket?.emit('answer', {
        roomId,
        answer: peerConnection.localDescription
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit('ice-candidate', {
            roomId,
            candidate: event.candidate
          });
        }
      };

      // Save peer connection
      setPeerConnections(prev => ({
        ...prev,
        [userId]: peerConnection
      }));
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  // Handle incoming answer
  const handleAnswer = async (
    userId: string, 
    answer: RTCSessionDescriptionInit
  ) => {
    try {
      const peerConnection = peerConnections[userId];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  // Handle ICE candidate
  const handleIceCandidate = async (
    userId: string, 
    candidate: RTCIceCandidateInit
  ) => {
    try {
      const peerConnection = peerConnections[userId];
      if (peerConnection) {
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // Send chat message
  const sendMessage = () => {
    if (!messageInput.trim() || !socket) return;
    
    socket.emit('chat-message', {
      roomId,
      message: messageInput
    });
    
    setMessageInput('');
  };

  // Update medical notes
  const updateMedicalNotes = () => {
    if (!socket) return;
    
    socket.emit('update-medical-record', {
      roomId,
      appointmentId,
      notes: medicalNotes
    });
    
    toast({
      title: "Notes updated",
      description: "Medical notes have been updated"
    });
  };

  // End appointment
  const endAppointment = () => {
    if (!socket) return;
    
    socket.emit('end-appointment', {
      roomId,
      summary: appointmentSummary,
      followUp: followUpRecommendation
    });
    
    // Close dialog
    setIsEndCallDialogOpen(false);
    
    // Clean up and redirect
    if (onEndCall) {
      onEndCall({
        summary: appointmentSummary,
        followUp: followUpRecommendation,
        endTime: new Date().toISOString()
      });
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Call info bar */}
      <div className="bg-gray-800 text-white p-2 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-600 text-white border-none">
            Live
          </Badge>
          <span className="text-sm">{formatDuration(callDuration)}</span>
        </div>
        <div className="text-center flex-1">
          <h1 className="text-lg font-medium">
            {roomMetadata?.type === 'appointment' ? 'Telemedicine Appointment' : 'Video Conference'}
          </h1>
        </div>
        <div>
          <Button variant="ghost" size="sm" onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}>
            {isSidePanelOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main video area */}
        <div className={`flex-1 relative ${isSidePanelOpen ? 'flex-1' : 'flex-[3]'} transition-all duration-300`}>
          {/* Loading state */}
          {isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-10">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-t-green-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white">Connecting to video call...</p>
              </div>
            </div>
          )}

          {/* Remote videos grid */}
          <div className="grid grid-cols-1 gap-4 p-4 h-full">
            {participants.length > 0 ? (
              participants.map((participant) => (
                <div key={participant.userId} className="relative bg-gray-800 rounded-lg overflow-hidden h-full">
                  <video
                    ref={(el) => {
                      if (el) remoteVideoRefs.current[participant.userId] = el;
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.profile?.avatar} />
                        <AvatarFallback className="bg-green-600 text-white">
                          {participant.profile?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white text-sm">{participant.profile?.name || 'Unknown'}</p>
                        <p className="text-gray-300 text-xs">{participant.profile?.role || 'Participant'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg">
                <div className="text-center text-white">
                  <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-medium">Waiting for others to join</h3>
                  <p className="text-gray-400 mt-2">Share the room ID: {roomId}</p>
                </div>
              </div>
            )}
          </div>

          {/* Local video (self-view) */}
          <div className="absolute bottom-4 right-4 w-1/4 max-w-xs rounded-lg overflow-hidden shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
              <p className="text-white text-sm">{user?.name || 'You'} (You)</p>
            </div>
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <VideoOff className="h-12 w-12 text-white opacity-50" />
              </div>
            )}
          </div>

          {/* Call controls */}
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-80 rounded-full px-6 py-3 flex items-center space-x-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-full ${isAudioEnabled ? 'bg-gray-700' : 'bg-red-600'}`}
                    onClick={toggleAudio}
                  >
                    {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-full ${isVideoEnabled ? 'bg-gray-700' : 'bg-red-600'}`}
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-gray-700"
                    onClick={() => setChatOpen(!chatOpen)}
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open chat</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {isDoctor && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-gray-700"
                      onClick={() => setIsSidePanelOpen(true)}
                    >
                      <FileText className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Medical records</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-red-600"
                    onClick={() => setIsEndCallDialogOpen(true)}
                  >
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>End call</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Side panel (Medical records, Chat) */}
        <div
          className={`bg-white h-full overflow-hidden transition-all duration-300 ${
            isSidePanelOpen ? 'w-96' : 'w-0'
          }`}
        >
          {isSidePanelOpen && (
            <Tabs defaultValue={isDoctor ? "notes" : "chat"} className="h-full flex flex-col">
              <div className="px-4 pt-4 border-b">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="notes" disabled={!isDoctor && !roomMetadata.isSharedNotes}>
                    {isDoctor ? "Medical Notes" : "Visit Summary"}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Chat tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col p-0 overflow-hidden">
                <div className="p-4 flex-1 overflow-y-auto" ref={chatContainerRef}>
                  {chatMessages.length > 0 ? (
                    chatMessages.map((message, index) => (
                      <div key={index} className="mb-4">
                        <div
                          className={`flex ${
                            message.userId === socket?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs rounded-lg px-4 py-2 ${
                              message.userId === socket?.id
                                ? 'bg-green-600 text-white rounded-br-none'
                                : 'bg-gray-200 text-gray-800 rounded-bl-none'
                            }`}
                          >
                            {message.userId !== socket?.id && (
                              <p className="text-xs font-medium mb-1">
                                {message.profile?.name || 'Unknown'}
                              </p>
                            )}
                            <p>{message.message}</p>
                            <p className="text-xs opacity-70 text-right mt-1">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No messages yet</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t">
                  <div className="flex">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button onClick={sendMessage} className="ml-2 bg-green-600 hover:bg-green-700">
                      Send
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Medical Notes tab */}
              <TabsContent value="notes" className="flex-1 flex flex-col p-0 overflow-hidden">
                <div className="p-4 flex-1 overflow-y-auto">
                  {isDoctor ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">PATIENT INFORMATION</h3>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {participants[0]?.profile?.name?.charAt(0) || 'P'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{participants[0]?.profile?.name || 'Patient'}</p>
                                <p className="text-sm text-gray-500">
                                  {appointmentId ? `Appointment ID: ${appointmentId}` : 'Consultation'}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">MEDICAL NOTES</h3>
                        <Textarea
                          placeholder="Enter visit notes, observations, and diagnosis..."
                          value={medicalNotes}
                          onChange={(e) => setMedicalNotes(e.target.value)}
                          className="min-h-[200px]"
                        />
                        <Button 
                          onClick={updateMedicalNotes} 
                          className="mt-2 bg-green-600 hover:bg-green-700"
                        >
                          Save Notes
                        </Button>
                      </div>

                      <div className="pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">QUICK TEMPLATES</h3>
                        <div className="grid grid-cols-1 gap-2">
                          <Button 
                            variant="outline" 
                            className="justify-start"
                            onClick={() => setMedicalNotes(prev => prev + "\n\nSubjective: Patient reports...\nObjective: Physical examination reveals...\nAssessment: Diagnosis is...\nPlan: Recommended treatment...")}
                          >
                            <Plus className="h-4 w-4 mr-2" /> SOAP Template
                          </Button>
                          <Button 
                            variant="outline" 
                            className="justify-start"
                            onClick={() => setMedicalNotes(prev => prev + "\n\nPrescription:\n- Medication name: \n- Dosage: \n- Frequency: \n- Duration: \n- Special instructions: ")}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Prescription Template
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">The doctor will share visit notes here</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* End Call Dialog */}
      <Dialog open={isEndCallDialogOpen} onOpenChange={setIsEndCallDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End Appointment</DialogTitle>
          </DialogHeader>
          {isDoctor ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Visit Summary</label>
                <Textarea
                  placeholder="Summarize the visit and findings..."
                  value={appointmentSummary}
                  onChange={(e) => setAppointmentSummary(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Follow-up Recommendation</label>
                <Textarea
                  placeholder="Recommend follow-up actions for the patient..."
                  value={followUpRecommendation}
                  onChange={(e) => setFollowUpRecommendation(e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
          ) : (
            <p>Are you sure you want to leave this appointment?</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEndCallDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={endAppointment} className="bg-red-600 hover:bg-red-700">
              {isDoctor ? "End Appointment" : "Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoConference;