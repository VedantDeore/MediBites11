import { useEffect, useState } from 'react';
import {
  StreamVideo,
  StreamCall,
  CallingState,
  useCallStateHooks,
  User,
  Participant,
  useParticipants,
  VideoPreview,
} from '@stream-io/video-react-sdk';
import { Button } from '@/components/ui/button';
import { initializeStreamClient } from '@/lib/stream-service';
import { PhoneOff, Video, Mic } from 'lucide-react';

interface VideoCallProps {
  consultationId: string;
  currentUser: User;
  otherUser: {
    id: string;
    name: string;
  };
  onEndCall?: () => void;
}

export function VideoCall({ consultationId, currentUser, otherUser, onEndCall }: VideoCallProps) {
  const [client, setClient] = useState<any>(null);
  const [call, setCall] = useState<any>(null);

  useEffect(() => {
    const setupCall = async () => {
      const streamClient = await initializeStreamClient(
        currentUser.id,
        currentUser.name || ''
      );
      
      setClient(streamClient);

      const newCall = streamClient.call('default', consultationId);
      await newCall.join({ create: true });
      setCall(newCall);
    };

    setupCall();

    return () => {
      if (call) {
        call.leave();
      }
      if (client) {
        client.disconnectUser();
      }
    };
  }, [consultationId, currentUser]);

  if (!client || !call) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3">Connecting to call...</span>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallUI onEndCall={onEndCall} otherUserName={otherUser.name} />
      </StreamCall>
    </StreamVideo>
  );
}

function CallUI({ onEndCall, otherUserName }: { onEndCall?: () => void, otherUserName: string }) {
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();
  const call = useCall();

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex items-center justify-center h-64">
        <span>Connecting to {otherUserName}...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      <div className="flex-1 relative bg-black">
        {/* Video grid */}
        <div className="grid grid-cols-2 gap-4 h-full p-4">
          {/* Local participant video */}
          <div className="relative rounded-lg overflow-hidden bg-gray-800">
            <VideoPreview 
              participant={participants.find(p => p.isLocalParticipant)}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
              You (Connected)
            </div>
          </div>

          {/* Remote participant video */}
          <div className="relative rounded-lg overflow-hidden bg-gray-800">
            <VideoPreview 
              participant={participants.find(p => !p.isLocalParticipant)}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
              {otherUserName} {participants.find(p => !p.isLocalParticipant) ? '(Connected)' : '(Waiting)'}
            </div>
          </div>
        </div>

        {/* Call controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4 bg-black/50 p-4 rounded-full">
          <Button
            variant="destructive"
            onClick={onEndCall}
            className="rounded-full w-12 h-12 flex items-center justify-center"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => call?.camera.toggle()}
            className="rounded-full w-12 h-12 flex items-center justify-center"
          >
            <Video className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => call?.microphone.toggle()}
            className="rounded-full w-12 h-12 flex items-center justify-center"
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Chat section */}
      <div className="h-[200px] border-t">
        <div className="flex flex-col h-full">
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Chat messages will go here */}
            <div className="text-center text-gray-500">
              No messages yet
            </div>
          </div>
          <div className="p-4 border-t">
            <form className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 rounded-md border px-3 py-2"
              />
              <Button type="submit">Send</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 