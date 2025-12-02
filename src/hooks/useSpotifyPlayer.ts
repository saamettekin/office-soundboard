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
      
      // Handle any error as "not connected" - this includes 404 responses
      if (error) {
        console.log('Spotify connection check - not connected or error:', error);
        setIsConnected(false);
        return;
      }
      
      // Check if the response indicates not connected
      if (!data || data?.error || !data?.access_token) {
        console.log('User not connected to Spotify yet');
        setIsConnected(false);
        return;
      }
      
      setAccessToken(data.access_token);
      setIsConnected(true);
    } catch (error) {
      // Any exception means not connected - don't crash the app
      console.log('Spotify connection check failed:', error);
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
        // Open popup window for Spotify auth
        const width = 500;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.authUrl,
          'spotify-auth',
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );

        // Listen for message from popup
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'SPOTIFY_AUTH_CALLBACK') {
            window.removeEventListener('message', handleMessage);
            if (event.data.success) {
              toast.success('Spotify bağlantısı kuruldu!');
              // Re-check connection to get the token
              checkSpotifyConnection();
            } else {
              toast.error('Spotify bağlantısı başarısız oldu');
            }
          }
        };

        window.addEventListener('message', handleMessage);

        // Clean up if popup is closed without completing auth
        const checkPopupClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopupClosed);
            window.removeEventListener('message', handleMessage);
          }
        }, 1000);
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