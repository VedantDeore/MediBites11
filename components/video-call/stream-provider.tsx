import { StreamVideo, StreamVideoClient, User } from '@stream-io/video-react-sdk';
import { ReactNode } from 'react';

interface StreamProviderProps {
  children: ReactNode;
  apiKey: string;
  token: string;
  userData: {
    id: string;
    name: string;
    image?: string;
  };
}

export function StreamProvider({ children, apiKey, token, userData }: StreamProviderProps) {
  const user: User = {
    id: userData.id,
    name: userData.name,
    image: userData.image || `https://getstream.io/random_svg/?id=${userData.id}&name=${userData.name}`,
  };

  const client = new StreamVideoClient({ apiKey, user, token });

  return (
    <StreamVideo client={client}>
      {children}
    </StreamVideo>
  );
} 