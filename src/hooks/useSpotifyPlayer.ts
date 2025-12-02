import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export const useSpotifyPlayer = (enabled: boolean = true) => {
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const playerRef = useRef<any>(null);

  // Load Spotify SDK only when enabled
  useEffect(() => {
    if (!enabled) return;
    
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [enabled]);

  // Check if user is connected to Spotify only when enabled
  useEffect(() => {
    if (!enabled) return;
    checkSpotifyConnection();
  }, [enabled]);

  const checkSpotifyConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth/token');
      
      // Handle "Not connected to Spotify" as a normal state, not an error
      if (error) {
        // Check if it's the expected "not connected" response
        const errorMessage = error?.message || '';
        if (errorMessage.includes('Not connected') || errorMessage.includes('404')) {
          console.log('User not connected to Spotify yet');
          setIsConnected(false);
          return;
        }
        throw error;
      }
      
      // Also check if the response indicates not connected
      if (data?.error === 'Not connected to Spotify') {
        console.log('User not connected to Spotify yet');
        setIsConnected(false);
        return;
      }
      
      if (data?.access_token) {
        setAccessToken(data.access_token);
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.log('Error checking Spotify connection:', error);
      setIsConnected(false);
    }
  };

  // Initialize player when token is available
  useEffect(() => {
    if (!accessToken) return;

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Soundboard Work Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(accessToken);
        },
        volume: 0.8
      });

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }: any) => {
        console.error('Initialization error:', message);
        toast.error('Spotify player başlatılamadı');
      });

      spotifyPlayer.addListener('authentication_error', ({ message }: any) => {
        console.error('Authentication error:', message);
        toast.error('Spotify kimlik doğrulama hatası');
        setIsConnected(false);
      });

      spotifyPlayer.addListener('account_error', ({ message }: any) => {
        console.error('Account error:', message);
        toast.error('Spotify Premium hesabı gerekli');
      });

      spotifyPlayer.addListener('playback_error', ({ message }: any) => {
        console.error('Playback error:', message);
      });

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }: any) => {
        console.log('Spotify player ready with device ID:', device_id);
        setDeviceId(device_id);
        setIsReady(true);
        toast.success('Spotify bağlantısı kuruldu');
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }: any) => {
        console.log('Device has gone offline:', device_id);
        setIsReady(false);
      });

      // Player state changes
      spotifyPlayer.addListener('player_state_changed', (state: any) => {
        if (!state) return;

        setCurrentTrack(state.track_window.current_track);
        setIsPaused(state.paused);
      });

      spotifyPlayer.connect().then((success: boolean) => {
        if (success) {
          console.log('The Web Playback SDK successfully connected to Spotify!');
        }
      });

      playerRef.current = spotifyPlayer;
      setPlayer(spotifyPlayer);
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, [accessToken]);

  const connectToSpotify = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth/authorize');
      
      if (error) throw error;
      
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      toast.error('Spotify bağlantısı kurulamadı');
    }
  };

  const play = async (spotifyUri: string) => {
    if (!deviceId || !accessToken) {
      toast.error('Spotify player hazır değil');
      return;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [spotifyUri]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to play track');
      }
    } catch (error) {
      console.error('Error playing track:', error);
      toast.error('Şarkı çalınamadı');
    }
  };

  const pause = () => {
    if (player) {
      player.pause();
    }
  };

  const resume = () => {
    if (player) {
      player.resume();
    }
  };

  const seek = (positionMs: number) => {
    if (player) {
      player.seek(positionMs);
    }
  };

  return {
    player,
    deviceId,
    isReady,
    isPaused,
    currentTrack,
    isConnected,
    connectToSpotify,
    play,
    pause,
    resume,
    seek
  };
};