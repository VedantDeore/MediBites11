import { CallingState, StreamCall, useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface ConsultationCallProps {
  consultationId: string;
  onEndCall?: () => void;
}

export function ConsultationCall({ consultationId, onEndCall }: ConsultationCallProps) {
  const [call, setCall] = useState<any>(null);
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();

  useEffect(() => {
    const initializeCall = async () => {
      const currentCall = useCall()?.client.call('default', consultationId);
      if (currentCall) {
        await currentCall.join({ create: true });
        setCall(currentCall);
      }
    };

    initializeCall();

    return () => {
      if (call) {
        call.leave();
      }
    };
  }, [consultationId]);

  if (!call || callingState !== CallingState.JOINED) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3">Connecting to call...</span>
      </div>
    );
  }

  return (
    <StreamCall call={call}>
      <div className="flex flex-col h-full">
        <div className="flex-1 relative">
          {/* Video grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {/* Participant videos will be rendered here */}
          </div>
          
          {/* Call controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center space-x-4 bg-gradient-to-t from-black/50">
            <Button
              variant="destructive"
              onClick={() => {
                call.leave();
                onEndCall?.();
              }}
            >
              End Call
            </Button>
            <Button
              variant="outline"
              onClick={() => call.camera.toggle()}
            >
              Toggle Camera
            </Button>
            <Button
              variant="outline"
              onClick={() => call.microphone.toggle()}
            >
              Toggle Mic
            </Button>
          </div>
        </div>

        {/* Call info */}
        <div className="p-4 bg-muted">
          <p className="text-sm text-muted-foreground">
            Consultation ID: {call.id} | Participants: {participantCount}
          </p>
        </div>
      </div>
    </StreamCall>
  );
} 