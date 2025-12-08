import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkipForward, Music2, Play, Pause, SkipBack, Volume2, VolumeX } from "lucide-react";
import { QueueSong } from "@/hooks/useMusicQueue";
import { useEffect, useState, useRef } from "react";
import { useYouTubeAPI } from "@/hooks/useYouTubeAPI";
import { Slider } from "@/components/ui/slider";

interface SpotifyPlayer {
  play: (uri: string) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (positionMs: number) => void;
  skipBackward: () => void;
  skipForward: () => void;
  setVolume: (volume: number) => void;
  isPaused: boolean;
  isReady: boolean;
  isConnected: boolean;
  position: number;
  duration: number;
  volume: number;
}

interface NowPlayingPlayerProps {
  currentSong: QueueSong | null;
  onNext: () => void;
  spotifyPlayer?: SpotifyPlayer;
  queueLength?: number;
  onStartFirstSong?: () => void;
}

export const NowPlayingPlayer = ({ currentSong, onNext, spotifyPlayer, queueLength = 0, onStartFirstSong }: NowPlayingPlayerProps) => {
  const [ytProgress, setYtProgress] = useState(0);
  const [ytCurrentTime, setYtCurrentTime] = useState(0);
  const [ytDuration, setYtDuration] = useState(0);
  const [ytIsPlaying, setYtIsPlaying] = useState(false);
  const playerRef = useRef<YT.Player | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const isYouTubeReady = useYouTubeAPI();
  const progressIntervalRef = useRef<number | null>(null);
  const lastPlayedSongRef = useRef<string | null>(null);

  // Determine if using Spotify
  const useSpotify = spotifyPlayer?.isConnected && spotifyPlayer?.isReady;

  // Calculate display values based on player type
  const currentTimeMs = useSpotify ? spotifyPlayer.position : ytCurrentTime * 1000;
  const durationMs = useSpotify ? spotifyPlayer.duration : ytDuration * 1000;
  const progress = durationMs > 0 ? (currentTimeMs / durationMs) * 100 : 0;
  const isPlaying = useSpotify ? !spotifyPlayer.isPaused : ytIsPlaying;

  // Pause Spotify when queue is empty (no current song)
  useEffect(() => {
    if (!currentSong && useSpotify && !spotifyPlayer.isPaused) {
      console.log('Queue empty, pausing Spotify');
      spotifyPlayer.pause();
      lastPlayedSongRef.current = null;
    }
  }, [currentSong, useSpotify, spotifyPlayer?.isPaused]);

  // Play song based on available player (Spotify or YouTube)
  useEffect(() => {
    if (!currentSong) {
      lastPlayedSongRef.current = null;
      return;
    }

    // Prevent duplicate play calls for same song
    if (lastPlayedSongRef.current === currentSong.id) {
      return;
    }

    console.log('NowPlayingPlayer: Playing new song:', currentSong.title, 'ID:', currentSong.id);

    // Try Spotify first if connected and ready
    if (useSpotify && currentSong.spotify_song_id) {
      lastPlayedSongRef.current = currentSong.id;
      const spotifyUri = `spotify:track:${currentSong.spotify_song_id}`;
      spotifyPlayer.play(spotifyUri);
      return;
    }

    // Fallback to YouTube if no Spotify or no YouTube video ID
    if (!currentSong?.youtube_video_id || !isYouTubeReady || !playerContainerRef.current) return;

    lastPlayedSongRef.current = currentSong.id;

    // Clear any existing player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.error("Error destroying player:", e);
      }
      playerRef.current = null;
    }

    // Create hidden container for player
    const playerId = `youtube-player-${Date.now()}`;
    const playerDiv = document.createElement('div');
    playerDiv.id = playerId;
    playerDiv.style.display = 'none';
    playerContainerRef.current.appendChild(playerDiv);

    // Initialize YouTube player
    try {
      playerRef.current = new (window as any).YT.Player(playerId, {
        videoId: currentSong.youtube_video_id,
        playerVars: {
          autoplay: 1,
          controls: 0,
        },
        events: {
          onReady: (event: any) => {
            event.target.playVideo();
            setYtIsPlaying(true);
            const videoDuration = event.target.getDuration();
            setYtDuration(videoDuration);
            startProgressTracking();
          },
          onStateChange: (event: any) => {
            if (event.data === 1) { // Playing
              setYtIsPlaying(true);
            } else if (event.data === 2) { // Paused
              setYtIsPlaying(false);
            } else if (event.data === 0) { // Ended
              onNext();
            }
          },
          onError: (event: any) => {
            console.error("YouTube player error:", event.data);
            onNext();
          }
        },
      });
    } catch (e) {
      console.error("Error creating YouTube player:", e);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error("Error destroying player:", e);
        }
      }
      setYtProgress(0);
    };
  }, [currentSong?.id, isYouTubeReady, useSpotify]);

  // Log when currentSong changes for debugging
  useEffect(() => {
    console.log('NowPlayingPlayer: currentSong changed to:', currentSong?.title || 'null');
  }, [currentSong?.id]);

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = window.setInterval(() => {
      if (playerRef.current && currentSong) {
        try {
          const time = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          setYtCurrentTime(time);
          setYtDuration(dur);
          const newProgress = (time / dur) * 100;
          setYtProgress(Math.min(newProgress, 100));
        } catch (e) {
          console.error("Error getting player time:", e);
        }
      }
    }, 500);
  };

  const togglePlayPause = () => {
    if (useSpotify) {
      // Use togglePlay for most reliable behavior
      spotifyPlayer.togglePlay();
      return;
    }

    // Fallback to YouTube
    if (!playerRef.current) return;
    
    try {
      if (ytIsPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (e) {
      console.error("Error toggling play/pause:", e);
    }
  };

  const handleSeek = (value: number[]) => {
    const seekPercent = value[0];
    
    if (useSpotify) {
      const seekMs = (seekPercent / 100) * spotifyPlayer.duration;
      spotifyPlayer.seek(seekMs);
      return;
    }

    // YouTube seek
    if (!playerRef.current || !ytDuration) return;
    
    try {
      const newTime = (seekPercent / 100) * ytDuration;
      playerRef.current.seekTo(newTime, true);
      setYtCurrentTime(newTime);
    } catch (e) {
      console.error("Error seeking:", e);
    }
  };

  const handleSkipBackward = () => {
    if (useSpotify) {
      spotifyPlayer.skipBackward();
      return;
    }

    // YouTube skip backward
    if (!playerRef.current) return;
    
    try {
      const newTime = Math.max(0, ytCurrentTime - 10);
      playerRef.current.seekTo(newTime, true);
    } catch (e) {
      console.error("Error skipping backward:", e);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) {
    return (
      <Card className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-3">
          <Music2 className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">Şu anda çalan şarkı yok</p>
          {queueLength > 0 && onStartFirstSong && (
            <Button onClick={onStartFirstSong} variant="default" size="sm" className="ml-2">
              <Play className="h-4 w-4 mr-1" />
              Çalmaya Başla
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // If Spotify is connected, we can play without YouTube
  const canPlayWithSpotify = useSpotify;
  
  if (!currentSong.youtube_video_id && !canPlayWithSpotify) {
    return (
      <Card className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-50">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <img
            src={currentSong.album_cover_url || "/placeholder.svg"}
            alt={currentSong.title}
            className="w-16 h-16 rounded object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold">{currentSong.title}</h3>
            <p className="text-sm text-muted-foreground">{currentSong.artist}</p>
            <p className="text-xs text-destructive mt-1">Spotify bağlantısı gerekli veya YouTube videosu bulunamadı</p>
          </div>
          <Button onClick={onNext} variant="ghost" size="icon">
            <SkipForward className="h-6 w-6" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-50">
      <div ref={playerContainerRef} style={{ display: 'none' }} />
      <div className="max-w-5xl mx-auto space-y-2">
        {/* Progress Bar with Time */}
        <div className="space-y-1">
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTimeMs)}</span>
            <span>{formatTime(durationMs)}</span>
          </div>
        </div>
        
        {/* Player Controls */}
        <div className="flex items-center gap-4">
          <img
            src={currentSong.album_cover_url || "/placeholder.svg"}
            alt={currentSong.title}
            className="w-14 h-14 rounded object-cover"
          />

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">
              {currentSong.title}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {currentSong.artist}
            </p>
            <p className="text-xs text-muted-foreground">
              Added by {currentSong.added_by_name} 🎵
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSkipBackward}
              variant="ghost"
              size="icon"
              className="h-10 w-10"
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            
            <Button
              onClick={togglePlayPause}
              variant="default"
              size="icon"
              className="h-12 w-12"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>

            <Button
              onClick={onNext}
              variant="ghost"
              size="icon"
              className="h-10 w-10"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Volume Control */}
          {useSpotify && (
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => spotifyPlayer.setVolume(spotifyPlayer.volume > 0 ? 0 : 0.8)}
              >
                {spotifyPlayer.volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[spotifyPlayer.volume * 100]}
                onValueChange={(value) => spotifyPlayer.setVolume(value[0] / 100)}
                max={100}
                step={1}
                className="w-24"
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
