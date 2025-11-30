import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { useSpotifySearch } from "@/hooks/useSpotifySearch";
import { Card } from "@/components/ui/card";

interface SpotifySearchProps {
  onAddToQueue: (song: {
    spotify_song_id: string;
    title: string;
    artist: string;
    album_cover_url: string | null;
    duration_ms: number;
  }) => void;
}

export const SpotifySearch = ({ onAddToQueue }: SpotifySearchProps) => {
  const { searchQuery, results, searching, search, error } = useSpotifySearch();

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Şarkı, sanatçı veya albüm ara..."
          value={searchQuery}
          onChange={(e) => search(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive text-center py-4">
          {error}
        </p>
      )}

      {searching && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aranıyor...
        </p>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {results.map((track) => (
            <Card
              key={track.id}
              className="p-3 flex items-center gap-3 hover:bg-accent/50 transition-colors"
            >
              <img
                src={track.album_cover}
                alt={track.name}
                className="w-14 h-14 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{track.name}</h4>
                <p className="text-xs text-muted-foreground truncate">
                  {track.artists}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.floor(track.duration_ms / 60000)}:
                  {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, "0")}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  onAddToQueue({
                    spotify_song_id: track.id,
                    title: track.name,
                    artist: track.artists,
                    album_cover_url: track.album_cover,
                    duration_ms: track.duration_ms,
                  })
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {!searching && searchQuery && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Sonuç bulunamadı
        </p>
      )}
    </div>
  );
};
