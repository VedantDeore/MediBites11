import { StreamVideoClient } from '@stream-io/video-react-sdk';

const STREAM_API_KEY = 'n723n44fka2n647ydh9wg2w2zw7n6pen4rrdd93aw4kd976nhfxuwwz7qt4xv4jv';

// Generate a token on your backend in production
const generateStreamToken = async (userId: string) => {
  // For demo purposes, we're using a temporary token
  // In production, implement this on your backend
  return `${userId}_temp_token`;
};

export const initializeStreamClient = async (userId: string, userName: string) => {
  const token = await generateStreamToken(userId);
  
  return new StreamVideoClient({
    apiKey: STREAM_API_KEY,
    user: {
      id: userId,
      name: userName,
      image: `https://getstream.io/random_svg/?id=${userId}&name=${userName}`,
    },
    token,
  });
}; 