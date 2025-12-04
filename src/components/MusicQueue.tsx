import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical } from "lucide-react";
import { QueueSong } from "@/hooks/useMusicQueue";
import { EmojiReactions } from "./EmojiReactions";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MusicQueueProps {
  songs: QueueSong[];
  currentSong: QueueSong | null;
  onRemove: (id: string) => void;
  onReorder?: (draggedId: string, targetId: string) => void;
}

interface SortableSongItemProps {
  song: QueueSong;
  index: number;
  currentUserId: string | null;
  onRemove: (id: string) => void;
}

const SortableSongItem = ({ song, index, currentUserId, onRemove }: SortableSongItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 transition-all ${
        song.is_playing ? "bg-primary/10 border-primary" : ""
      } ${isDragging ? "shadow-lg z-50" : ""}`}
    >
      <div className="flex items-center gap-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-shrink-0 w-8 text-center">
          <span className="text-lg font-bold text-muted-foreground">
            {index + 1}
          </span>
        </div>

        <img
          src={song.album_cover_url || "/placeholder.svg"}
          alt={song.title}
          className="w-16 h-16 rounded object-cover"
        />

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{song.title}</h3>
          <p className="text-sm text-muted-foreground truncate">
            {song.artist}
          </p>
          <p className="text-xs text-muted-foreground">
            Added by {song.added_by_name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <EmojiReactions songId={song.id} />
          
          {currentUserId === song.added_by_user_id && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(song.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export const MusicQueue = ({ songs, currentSong, onRemove, onReorder }: MusicQueueProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorder) {
      onReorder(active.id as string, over.id as string);
    }
  };

  if (songs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground mb-2">
          Henüz sırada şarkı yok
        </p>
        <p className="text-sm text-muted-foreground">
          Yukarıdan arama yaparak şarkı ekleyebilirsiniz 🎵
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold mb-4">
        Sıradaki Şarkılar ({songs.length})
      </h2>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={songs.map((song) => song.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {songs.map((song, index) => (
              <SortableSongItem
                key={song.id}
                song={song}
                index={index}
                currentUserId={currentUserId}
                onRemove={onRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
