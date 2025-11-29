import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkipForward, Music2 } from "lucide-react";
import { QueueSong } from "@/hooks/useMusicQueue";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

interface NowPlayingPlayerProps {
  currentSong: QueueSong | null;
  onNext: () => void;
}

export const NowPlayingPlayer = ({ currentSong, onNext }: NowPlayingPlayerProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!currentSong) return;

    const duration = currentSong.duration_ms;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / (duration / 1000));
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onNext, 500);
          return 100;
        }
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      setProgress(0);
    };
  }, [currentSong?.id]);

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
