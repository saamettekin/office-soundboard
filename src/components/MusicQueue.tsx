import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { QueueSong } from "@/hooks/useMusicQueue";
import { EmojiReactions } from "./EmojiReactions";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface MusicQueueProps {
  songs: QueueSong[];
  currentSong: QueueSong | null;
  onRemove: (id: string) => void;
}

export const MusicQueue = ({ songs, currentSong, onRemove }: MusicQueueProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

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
      
      {songs.map((song, index) => (
        <Card
          key={song.id}
          className={`p-4 transition-all ${
            song.is_playing ? "bg-primary/10 border-primary" : ""
          }`}
        >
          <div className="flex items-center gap-4">
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
      ))}
    </div>
  );
};
