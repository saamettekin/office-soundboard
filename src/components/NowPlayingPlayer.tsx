import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkipForward, Music2, Play, Pause, SkipBack } from "lucide-react";
import { QueueSong } from "@/hooks/useMusicQueue";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState, useRef } from "react";
import { useYouTubeAPI } from "@/hooks/useYouTubeAPI";
import { Slider } from "@/components/ui/slider";

interface SpotifyPlayer {
  play: (uri: string) => void;
  pause: () => void;
  resume: () => void;
  isPaused: boolean;
  isReady: boolean;
  isConnected: boolean;
}

interface NowPlayingPlayerProps {
  currentSong: QueueSong | null;
  onNext: () => void;
  spotifyPlayer?: SpotifyPlayer;
}

export const NowPlayingPlayer = ({ currentSong, onNext, spotifyPlayer }: NowPlayingPlayerProps) => {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<YT.Player | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const isYouTubeReady = useYouTubeAPI();
  const progressIntervalRef = useRef<number | null>(null);

  // Play song based on available player (Spotify or YouTube)
  useEffect(() => {
    if (!currentSong) return;

    // Try Spotify first if connected and ready
    if (spotifyPlayer?.isConnected && spotifyPlayer?.isReady && currentSong.spotify_song_id) {
      const spotifyUri = `spotify:track:${currentSong.spotify_song_id}`;
      spotifyPlayer.play(spotifyUri);
      setIsPlaying(true);
      return;
    }

    // Fallback to YouTube if no Spotify or no YouTube video ID
    if (!currentSong?.youtube_video_id || !isYouTubeReady || !playerContainerRef.current) return;

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
            setIsPlaying(true);
            const videoDuration = event.target.getDuration();
            setDuration(videoDuration);
            startProgressTracking();
          },
          onStateChange: (event: any) => {
            // Update playing state based on player state
            if (event.data === 1) { // Playing
              setIsPlaying(true);
            } else if (event.data === 2) { // Paused
              setIsPlaying(false);
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
      setProgress(0);
    };
  }, [currentSong?.id, isYouTubeReady, spotifyPlayer]);

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = window.setInterval(() => {
      if (playerRef.current && currentSong) {
        try {
          const time = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          setCurrentTime(time);
          setDuration(dur);
          const newProgress = (time / dur) * 100;
          setProgress(Math.min(newProgress, 100));
        } catch (e) {
          console.error("Error getting player time:", e);
        }
      }
    }, 500);
  };

  const togglePlayPause = () => {
    // Use Spotify player if available and connected
    if (spotifyPlayer?.isConnected && spotifyPlayer?.isReady) {
      if (spotifyPlayer.isPaused) {
        spotifyPlayer.resume();
      } else {
        spotifyPlayer.pause();
      }
      return;
    }

    // Fallback to YouTube
    if (!playerRef.current) return;
    
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (e) {
      console.error("Error toggling play/pause:", e);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!playerRef.current || !duration) return;
    
    try {
      const newTime = (value[0] / 100) * duration;
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
    } catch (e) {
      console.error("Error seeking:", e);
    }
  };

  const skipBackward = () => {
    if (!playerRef.current) return;
    
    try {
      const newTime = Math.max(0, currentTime - 10);
      playerRef.current.seekTo(newTime, true);
    } catch (e) {
      console.error("Error skipping backward:", e);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) {
    return (
      <Card className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-3">
          <Music2 className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">Şu anda çalan şarkı yok</p>
        </div>
      </Card>
    );
  }

  if (!currentSong.youtube_video_id) {
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
            <p className="text-xs text-destructive mt-1">YouTube videosu bulunamadı</p>
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
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
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
              onClick={skipBackward}
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
        </div>
      </div>
    </Card>
  );
};
