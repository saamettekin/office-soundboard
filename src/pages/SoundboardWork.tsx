import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMusicQueue } from "@/hooks/useMusicQueue";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { SpotifySearch } from "@/components/SpotifySearch";
import { MusicQueue } from "@/components/MusicQueue";
import { NowPlayingPlayer } from "@/components/NowPlayingPlayer";
import { SongHistory } from "@/components/SongHistory";
import { toast } from "sonner";

const SoundboardWork = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const { queue, currentSong, loading: queueLoading, addToQueue, removeFromQueue, playNextSong } = useMusicQueue();
  const { isConnected, connectToSpotify, play, pause, resume, togglePlay, isPaused, isReady, seek, skipBackward, skipForward, setVolume, volume, position, duration } = useSpotifyPlayer(!loading, playNextSong);

  // Check for Spotify connection callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('spotify') === 'connected') {
      toast.success('Spotify bağlantısı başarılı!');
      window.history.replaceState({}, '', '/soundboard-work');
    }
  }, []);

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

          {/* Spotify Connection Status */}
          <div className="flex justify-center items-center gap-4 mb-4">
            {!isConnected && (
              <Button onClick={connectToSpotify} variant="default" size="lg">
                Spotify'a Bağlan
              </Button>
            )}
            {isConnected && !isReady && (
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  Spotify player hazırlanıyor...
                </div>
                <Button onClick={connectToSpotify} variant="outline" size="sm">
                  Yeniden Bağlan
                </Button>
              </div>
            )}
            {isConnected && isReady && (
              <div className="text-sm text-green-600 font-medium">
                ✓ Spotify bağlı ve hazır
              </div>
            )}
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

      <NowPlayingPlayer 
        currentSong={currentSong} 
        onNext={playNextSong}
        spotifyPlayer={{ play, pause, resume, togglePlay, isPaused, isReady, isConnected, seek, skipBackward, skipForward, setVolume, volume, position, duration }}
      />
    </div>
  );
};

export default SoundboardWork;
