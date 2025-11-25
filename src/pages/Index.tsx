import { useState, useEffect } from "react";
import { useYouTubeAPI } from "@/hooks/useYouTubeAPI";
import SoundButton from "@/components/SoundButton";
import AddSoundForm from "@/components/AddSoundForm";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Sound {
  title: string;
  videoId: string;
  colorClass: string;
  category: string;
}

const DEFAULT_SOUNDS: Sound[] = [
  { title: "Alkış", videoId: "barWV7RWkq0", colorClass: "bg-sound-1 hover:bg-sound-1/90", category: "Alkış" },
  { title: "Fail Sesi", videoId: "267Z-i_3k2c", colorClass: "bg-sound-2 hover:bg-sound-2/90", category: "Efekt" },
  { title: "Trampet", videoId: "IIzVnuhttYs", colorClass: "bg-sound-3 hover:bg-sound-3/90", category: "Efekt" },
  { title: "Komik Gülme", videoId: "H47ow4_Cmk0", colorClass: "bg-sound-4 hover:bg-sound-4/90", category: "Komedi" },
  { title: "Vay Be!", videoId: "KlLMlJ2tDkg", colorClass: "bg-sound-5 hover:bg-sound-5/90", category: "Efekt" },
  { title: "Drama", videoId: "YPRtYP8g40Y", colorClass: "bg-sound-6 hover:bg-sound-6/90", category: "Drama" },
  { title: "Neee Diyooo", videoId: "1vdYlqYVX2I", colorClass: "bg-sound-6 hover:bg-sound-6/90", category: "Komedi" },
  { title: "İğrenç Kahkaha", videoId: "Cfo6C15QEOU", colorClass: "bg-sound-6 hover:bg-sound-6/90", category: "Komedi" },
  { title: "Güldür Güldür", videoId: "5zaDrU4LNv4", colorClass: "bg-sound-6 hover:bg-sound-6/90", category: "Komedi" },
];

export const CATEGORIES = ["Tümü", "Alkış", "Komedi", "Efekt", "Drama", "Diğer"] as const;

const STORAGE_KEY = "soundboard-sounds";

const Index = () => {
  const isYouTubeReady = useYouTubeAPI();
  const [sounds, setSounds] = useState<Sound[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SOUNDS;
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sounds));
  }, [sounds]);

  const handleAddSound = (title: string, videoId: string, category: string) => {
    const colorClasses = [
      "bg-sound-1 hover:bg-sound-1/90",
      "bg-sound-2 hover:bg-sound-2/90",
      "bg-sound-3 hover:bg-sound-3/90",
      "bg-sound-4 hover:bg-sound-4/90",
      "bg-sound-5 hover:bg-sound-5/90",
      "bg-sound-6 hover:bg-sound-6/90",
    ];
    const colorClass = colorClasses[sounds.length % colorClasses.length];
    
    setSounds([...sounds, { title, videoId, colorClass, category }]);
  };

  const filteredSounds = selectedCategory === "Tümü" 
    ? sounds 
    : sounds.filter(sound => sound.category === selectedCategory);

  const handleDeleteSound = (videoId: string) => {
    setSounds(sounds.filter((sound) => sound.videoId !== videoId));
  };

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
          <>
            <div className="mb-8">
              <AddSoundForm onAddSound={handleAddSound} />
            </div>
            
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((category) => (
                <Button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="transition-all"
                >
                  {category}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSounds.map((sound) => (
                <SoundButton
                  key={sound.videoId}
                  title={sound.title}
                  videoId={sound.videoId}
                  colorClass={sound.colorClass}
                  onDelete={() => handleDeleteSound(sound.videoId)}
                />
              ))}
            </div>
          </>
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
