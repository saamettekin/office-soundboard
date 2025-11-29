import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMusicQueue } from "@/hooks/useMusicQueue";
import { SpotifySearch } from "@/components/SpotifySearch";
import { MusicQueue } from "@/components/MusicQueue";
import { NowPlayingPlayer } from "@/components/NowPlayingPlayer";
import { SongHistory } from "@/components/SongHistory";

const SoundboardWork = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  const { queue, currentSong, loading: queueLoading, addToQueue, removeFromQueue, playNextSong } = useMusicQueue();
  const [showHistory, setShowHistory] = useState(false);

  if (loading || queueLoading) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg pb-32">
      <div className="mx-auto max-w-5xl p-6">
        <header className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/menu")}
            className="gap-2 mb-6"
          >
            <ArrowLeft size={20} />
            Ana Menü
          </Button>
          <div className="text-center mb-6">
            <h1 className="mb-2 text-5xl font-bold text-foreground">
              🎵 Soundboard Work
            </h1>
            <p className="text-lg text-muted-foreground">
              Ofis için ortak müzik sırası
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              variant={showHistory ? "outline" : "default"}
              onClick={() => setShowHistory(false)}
            >
              Sıra & Arama
            </Button>
            <Button
              variant={showHistory ? "default" : "outline"}
              onClick={() => setShowHistory(true)}
            >
              Geçmiş & İstatistikler
            </Button>
          </div>
        </header>

        {!showHistory ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Şarkı Ara</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <SpotifySearch onAddToQueue={addToQueue} />
              </CardContent>
            </Card>

            <div>
              <MusicQueue
                songs={queue}
                currentSong={currentSong}
                onRemove={removeFromQueue}
              />
            </div>
          </div>
        ) : (
          <SongHistory />
        )}
      </div>

      <NowPlayingPlayer currentSong={currentSong} onNext={playNextSong} />
    </div>
  );
};

export default SoundboardWork;
