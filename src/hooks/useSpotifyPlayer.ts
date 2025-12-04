import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export const useSpotifyPlayer = (enabled: boolean = true, onTrackEnd?: () => void) => {
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<any>(null);
  const currentlyPlayingRef = useRef<string | null>(null);
  const positionIntervalRef = useRef<number | null>(null);
  const onTrackEndRef = useRef(onTrackEnd);

  // Keep callback ref updated
  useEffect(() => {
    onTrackEndRef.current = onTrackEnd;
  }, [onTrackEnd]);

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

    const initializePlayer = () => {
      if (playerRef.current) return; // Already initialized
      
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
        // Try to recover by reconnecting
        toast.error('Oynatma hatası - yeniden bağlanıyor...');
        spotifyPlayer.connect();
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
        setPosition(state.position);
        setDuration(state.duration);
      });

      // Start position tracking interval - detect song end
      let trackEndTriggered = false;
      let lastPosition = 0;
      
      positionIntervalRef.current = window.setInterval(() => {
        spotifyPlayer.getCurrentState().then((state: any) => {
          if (state) {
            const currentPos = state.position;
            const currentDur = state.duration;
            
            setPosition(currentPos);
            setDuration(currentDur);
            setIsPaused(state.paused);
            
            // Detect song end: position reached near end AND paused AND position not moving
            // This happens when song naturally ends
            if (currentDur > 0 && 
                currentPos >= currentDur - 500 && 
                state.paused && 
                !trackEndTriggered &&
                Math.abs(currentPos - lastPosition) < 100) {
              console.log('Song ended naturally at position:', currentPos, '/', currentDur);
              trackEndTriggered = true;
              currentlyPlayingRef.current = null;
              if (onTrackEndRef.current) {
                onTrackEndRef.current();
              }
            }
            
            // Reset flag when a new song starts (position resets to beginning)
            if (currentPos < 3000 && lastPosition > 10000) {
              trackEndTriggered = false;
            }
            
            lastPosition = currentPos;
          }
        });
      }, 500);

      spotifyPlayer.connect().then((success: boolean) => {
        if (success) {
          console.log('The Web Playback SDK successfully connected to Spotify!');
        }
      });

      playerRef.current = spotifyPlayer;
      setPlayer(spotifyPlayer);
    };

    // If SDK is already loaded, initialize immediately
    if (window.Spotify) {
      initializePlayer();
    } else {
      // Otherwise, set up the callback
      window.onSpotifyWebPlaybackSDKReady = initializePlayer;
    }

    return () => {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
        setPlayer(null);
        setIsReady(false);
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

    // Prevent duplicate play calls for the same track
    if (currentlyPlayingRef.current === spotifyUri) {
      console.log('Already playing this track, skipping...');
      return;
    }

    currentlyPlayingRef.current = spotifyUri;

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
        const errorData = await response.json().catch(() => ({}));
        console.error('Spotify API error:', response.status, errorData);
        
        if (response.status === 429) {
          toast.error('Çok fazla istek gönderildi, lütfen bekleyin');
        } else {
          throw new Error('Failed to play track');
        }
      }
    } catch (error) {
      console.error('Error playing track:', error);
      currentlyPlayingRef.current = null;
      toast.error('Şarkı çalınamadı');
    }
  };

  const skipForward = () => {
    if (player) {
      player.nextTrack();
    }
  };

  const skipBackward = () => {
    if (player && position > 3000) {
      // If more than 3 seconds in, restart current track
      player.seek(0);
    } else if (player) {
      // Otherwise go to previous track
      player.previousTrack();
    }
  };

  const pause = async () => {
    if (player) {
      try {
        await player.pause();
      } catch (e) {
        console.error('Error pausing:', e);
      }
    }
  };

  const resume = async () => {
    if (player) {
      try {
        await player.resume();
      } catch (e) {
        console.error('Error resuming:', e);
        // If resume fails, try toggle
        try {
          await player.togglePlay();
        } catch (e2) {
          console.error('Error toggling play:', e2);
        }
      }
    }
  };

  const togglePlay = async () => {
    if (player) {
      try {
        await player.togglePlay();
      } catch (e) {
        console.error('Error toggling play:', e);
      }
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
    position,
    duration,
    connectToSpotify,
    play,
    pause,
    resume,
    togglePlay,
    seek,
    skipForward,
    skipBackward
  };
};