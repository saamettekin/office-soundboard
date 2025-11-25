import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Trash2, Star, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import AudioWaveform from "./AudioWaveform";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SoundButtonProps {
  title: string;
  videoId: string;
  colorClass: string;
  isFavorite: boolean;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

const SoundButton = ({ title, videoId, colorClass, isFavorite, onDelete, onToggleFavorite }: SoundButtonProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: videoId });

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div id={`player-${videoId}`} className="hidden"></div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={cn(
          "absolute -top-2 -left-2 z-10 h-8 w-8 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110",
          isFavorite 
            ? "bg-yellow-500 text-white hover:bg-yellow-600" 
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
        aria-label="Favorilere ekle/çıkar"
      >
        <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute -top-2 -right-2 z-10 h-8 w-8 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center shadow-lg transition-all hover:scale-110"
        aria-label="Sesi sil"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-6 w-6 text-foreground/40 hover:text-foreground/60" />
      </div>
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
          <AudioWaveform isPlaying={isPlaying} />
          <span>{title}</span>
        </div>
      </Button>
    </div>
  );
};

export default SoundButton;
