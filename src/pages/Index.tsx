import { useYouTubeAPI } from "@/hooks/useYouTubeAPI";
import SoundButton from "@/components/SoundButton";
import { Loader2 } from "lucide-react";

const Index = () => {
  const isYouTubeReady = useYouTubeAPI();

  const sounds = [
    { title: "Alkış", videoId: "barWV7RWkq0", colorClass: "bg-sound-1 hover:bg-sound-1/90" },
    { title: "Fail Sesi", videoId: "267Z-i_3k2c", colorClass: "bg-sound-2 hover:bg-sound-2/90" },
    { title: "Trampet", videoId: "IIzVnuhttYs", colorClass: "bg-sound-3 hover:bg-sound-3/90" },
    { title: "Komik Gülme", videoId: "H47ow4_Cmk0", colorClass: "bg-sound-4 hover:bg-sound-4/90" },
    { title: "Vay Be!", videoId: "KlLMlJ2tDkg", colorClass: "bg-sound-5 hover:bg-sound-5/90" },
    { title: "Drama", videoId: "YPRtYP8g40Y", colorClass: "bg-sound-6 hover:bg-sound-6/90" },
    { title: "Neee Diyooo", videoId: "1vdYlqYVX2I", colorClass: "bg-sound-6 hover:bg-sound-6/90" },
    { title: "İğrenç Kahkaha", videoId: "Cfo6C15QEOU", colorClass: "bg-sound-6 hover:bg-sound-6/90" },
  ];

  return (
    <div className="min-h-screen bg-gradient-bg p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-6xl font-bold text-foreground">
            🎵 Soundboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Ofis eğlencesi için ses efektleri - Butona tıkla ve eğlen!
          </p>
        </header>

        {!isYouTubeReady ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Yükleniyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sounds.map((sound) => (
              <SoundButton
                key={sound.videoId}
                title={sound.title}
                videoId={sound.videoId}
                colorClass={sound.colorClass}
              />
            ))}
          </div>
        )}

        <footer className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            💡 İpucu: Ses çalarken tekrar tıklayarak durdurabilirsin!
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
