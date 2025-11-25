import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Trash2, Star, GripVertical, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import AudioWaveform from "./AudioWaveform";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SoundButtonProps {
  title: string;
  videoId: string;
  colorClass: string;
  isFavorite: boolean;
  category: string;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onEdit: (newTitle: string, newCategory: string) => void;
}

const SoundButton = ({ title, videoId, colorClass, isFavorite, category, onDelete, onToggleFavorite, onEdit }: SoundButtonProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editCategory, setEditCategory] = useState(category);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: videoId });

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onEdit(editTitle, editCategory);
      setIsEditOpen(false);
    }
  };

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
    <>
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
            setIsEditOpen(true);
          }}
          className="absolute top-8 -right-2 z-10 h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center shadow-lg transition-all hover:scale-110"
          aria-label="Sesi düzenle"
        >
          <Edit className="h-4 w-4" />
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

    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sesi Düzenle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Ses Adı</Label>
            <Input
              id="edit-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Ses adı"
            />
          </div>
          <div>
            <Label htmlFor="edit-category">Kategori</Label>
            <Select value={editCategory} onValueChange={setEditCategory}>
              <SelectTrigger id="edit-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Alkış">Alkış</SelectItem>
                <SelectItem value="Komedi">Komedi</SelectItem>
                <SelectItem value="Efekt">Efekt</SelectItem>
                <SelectItem value="Drama">Drama</SelectItem>
                <SelectItem value="Diğer">Diğer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEditOpen(false)}>
            İptal
          </Button>
          <Button onClick={handleSaveEdit}>
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
};

export default SoundButton;
