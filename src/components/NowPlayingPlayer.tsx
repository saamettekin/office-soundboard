import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkipForward, Music2 } from "lucide-react";
import { QueueSong } from "@/hooks/useMusicQueue";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState, useRef } from "react";
import { useYouTubeAPI } from "@/hooks/useYouTubeAPI";

interface NowPlayingPlayerProps {
  currentSong: QueueSong | null;
  onNext: () => void;
}

export const NowPlayingPlayer = ({ currentSong, onNext }: NowPlayingPlayerProps) => {
  const [progress, setProgress] = useState(0);
  const playerRef = useRef<YT.Player | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const isYouTubeReady = useYouTubeAPI();
  const progressIntervalRef = useRef<number | null>(null);

  useEffect(() => {
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
            startProgressTracking();
          },
          onStateChange: (event: any) => {
            // When video ends (state 0)
            if (event.data === 0) {
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
  }, [currentSong?.id, isYouTubeReady]);

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = window.setInterval(() => {
      if (playerRef.current && currentSong) {
        try {
          const currentTime = playerRef.current.getCurrentTime?.() || 0;
          const duration = currentSong.duration_ms / 1000;
          const newProgress = (currentTime / duration) * 100;
          setProgress(Math.min(newProgress, 100));
        } catch (e) {
          console.error("Error getting player time:", e);
        }
      }
    }, 1000);
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

  return (
    <Card className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-50">
      <div ref={playerContainerRef} style={{ display: 'none' }} />
      <div className="max-w-5xl mx-auto">
        <Progress value={progress} className="mb-3 h-1" />
        
        <div className="flex items-center gap-4">
          <img
            src={currentSong.album_cover_url || "/placeholder.svg"}
            alt={currentSong.title}
            className="w-16 h-16 rounded object-cover"
          />

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {currentSong.title}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {currentSong.artist}
            </p>
            <p className="text-xs text-muted-foreground">
              Added by {currentSong.added_by_name} 🎵
            </p>
          </div>

          <Button
            onClick={onNext}
            variant="ghost"
            size="icon"
            className="h-12 w-12"
          >
            <SkipForward className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
