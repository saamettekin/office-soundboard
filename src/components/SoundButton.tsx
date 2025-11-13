import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface SoundButtonProps {
  title: string;
  videoId: string;
  colorClass: string;
}

const SoundButton = ({ title, videoId, colorClass }: SoundButtonProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState<any>(null);

  const toggleSound = () => {
    if (!player) {
      // Create player if it doesn't exist
      const newPlayer = new (window as any).YT.Player(`player-${videoId}`, {
        height: "0",
        width: "0",
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
        },
        events: {
          onReady: (event: any) => {
            event.target.playVideo();
            setIsPlaying(true);
          },
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.ENDED) {
              setIsPlaying(false);
            }
          },
        },
      });
      setPlayer(newPlayer);
    } else {
      // Toggle play/pause
      if (isPlaying) {
        player.stopVideo();
        setIsPlaying(false);
      } else {
        player.playVideo();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="relative">
      <div id={`player-${videoId}`} className="hidden"></div>
      <Button
        onClick={toggleSound}
        className={cn(
          "h-32 w-full text-lg font-bold transition-all duration-300",
          "hover:scale-105 active:scale-95",
          "shadow-lg hover:shadow-2xl",
          isPlaying && "animate-pulse-glow scale-105",
          colorClass
        )}
      >
        <div className="flex flex-col items-center gap-2">
          {isPlaying ? (
            <VolumeX className="h-8 w-8" />
          ) : (
            <Volume2 className="h-8 w-8" />
          )}
          <span>{title}</span>
        </div>
      </Button>
    </div>
  );
};

export default SoundButton;
