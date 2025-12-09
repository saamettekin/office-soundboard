import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkipForward, Music2, Play, Pause, SkipBack, Volume2, VolumeX } from "lucide-react";
import { QueueSong } from "@/hooks/useMusicQueue";
import { useEffect, useRef } from "react";
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
  const lastPlayedSongRef = useRef<string | null>(null);

  const isConnected = spotifyPlayer?.isConnected && spotifyPlayer?.isReady;
  const currentTimeMs = spotifyPlayer?.position || 0;
  const durationMs = spotifyPlayer?.duration || 0;
  const progress = durationMs > 0 ? (currentTimeMs / durationMs) * 100 : 0;
  const isPlaying = spotifyPlayer ? !spotifyPlayer.isPaused : false;

  // Pause Spotify when queue is empty
  useEffect(() => {
    if (!currentSong && isConnected && spotifyPlayer && !spotifyPlayer.isPaused) {
      console.log('Queue empty, pausing Spotify');
      spotifyPlayer.pause();
      lastPlayedSongRef.current = null;
    }
  }, [currentSong, isConnected, spotifyPlayer?.isPaused]);

  // Play song when currentSong changes
  useEffect(() => {
    if (!currentSong) {
      lastPlayedSongRef.current = null;
      return;
    }

    // Prevent duplicate play calls for same song
    if (lastPlayedSongRef.current === currentSong.id) {
      return;
    }

    // Only play if Spotify is connected
    if (!isConnected || !spotifyPlayer) {
      console.log('Spotify not ready, cannot play');
      return;
    }

    console.log('Playing new song:', currentSong.title, 'ID:', currentSong.id);
    lastPlayedSongRef.current = currentSong.id;
    
    const spotifyUri = `spotify:track:${currentSong.spotify_song_id}`;
    spotifyPlayer.play(spotifyUri);
  }, [currentSong?.id, isConnected]);

  const togglePlayPause = () => {
    if (spotifyPlayer) {
      spotifyPlayer.togglePlay();
    }
  };

  const handleSeek = (value: number[]) => {
    if (spotifyPlayer && durationMs > 0) {
      const seekMs = (value[0] / 100) * durationMs;
      spotifyPlayer.seek(seekMs);
    }
  };

  const handleSkipBackward = () => {
    if (spotifyPlayer) {
      spotifyPlayer.skipBackward();
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

  if (!isConnected) {
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
            <p className="text-xs text-destructive mt-1">Spotify bağlantısı gerekli</p>
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
          {spotifyPlayer && (
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