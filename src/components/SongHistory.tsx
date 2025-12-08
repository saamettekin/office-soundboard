import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSongHistory, HistorySong } from "@/hooks/useSongHistory";
import { useMusicQueue } from "@/hooks/useMusicQueue";
import { Clock, TrendingUp, User, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const SongHistory = () => {
  const { history, loading, getMostAddedUser, getMostPlayedSong } = useSongHistory();
  const { addToQueue } = useMusicQueue();

  const handleReAddSong = async (song: HistorySong) => {
    await addToQueue({
      spotify_song_id: song.spotify_song_id,
      title: song.title,
      artist: song.artist,
      album_cover_url: song.album_cover_url,
      duration_ms: 0,
    });
  };

  if (loading) {
    return <p className="text-muted-foreground">Yükleniyor...</p>;
  }

  const topUser = getMostAddedUser();
  const topSong = getMostPlayedSong();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              En Çok Şarkı Ekleyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topUser ? (
              <div>
                <p className="text-2xl font-bold">{topUser.name}</p>
                <p className="text-sm text-muted-foreground">
                  {topUser.count} şarkı ekledi
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Henüz veri yok</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              En Çok Çalınan Şarkı
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSong ? (
              <div className="flex items-center gap-3">
                <img
                  src={topSong.song.album_cover_url || "/placeholder.svg"}
                  alt={topSong.song.title}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{topSong.song.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {topSong.song.artist} • {topSong.count}x çalındı
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Henüz veri yok</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Son Çalınan Şarkılar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Henüz şarkı çalınmadı
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {history.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-accent/50 transition-colors"
                >
                  <img
                    src={song.album_cover_url || "/placeholder.svg"}
                    alt={song.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {song.artist} • {song.added_by_name}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(song.played_at).toLocaleDateString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleReAddSong(song)}
                    title="Sıraya tekrar ekle"
                  >
                    <ListPlus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};