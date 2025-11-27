import { useState, useEffect } from "react";
import { useYouTubeAPI } from "@/hooks/useYouTubeAPI";
import SoundButton from "@/components/SoundButton";
import AddSoundForm from "@/components/AddSoundForm";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { SplashScreen } from "@/components/SplashScreen";
import { ProfileSelection, Profile } from "@/components/ProfileSelection";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface Sound {
  title: string;
  videoId: string;
  colorClass: string;
  category: string;
  isFavorite: boolean;
}

const DEFAULT_SOUNDS: Sound[] = [
  { title: "Alkış", videoId: "barWV7RWkq0", colorClass: "bg-sound-1 hover:bg-sound-1/90", category: "Alkış", isFavorite: false },
  { title: "Fail Sesi", videoId: "267Z-i_3k2c", colorClass: "bg-sound-2 hover:bg-sound-2/90", category: "Efekt", isFavorite: false },
  { title: "Trampet", videoId: "IIzVnuhttYs", colorClass: "bg-sound-3 hover:bg-sound-3/90", category: "Efekt", isFavorite: false },
  { title: "Komik Gülme", videoId: "H47ow4_Cmk0", colorClass: "bg-sound-4 hover:bg-sound-4/90", category: "Komedi", isFavorite: false },
  { title: "Vay Be!", videoId: "KlLMlJ2tDkg", colorClass: "bg-sound-5 hover:bg-sound-5/90", category: "Efekt", isFavorite: false },
  { title: "Drama", videoId: "YPRtYP8g40Y", colorClass: "bg-sound-6 hover:bg-sound-6/90", category: "Drama", isFavorite: false },
  { title: "Neee Diyooo", videoId: "1vdYlqYVX2I", colorClass: "bg-sound-6 hover:bg-sound-6/90", category: "Komedi", isFavorite: false },
  { title: "İğrenç Kahkaha", videoId: "Cfo6C15QEOU", colorClass: "bg-sound-6 hover:bg-sound-6/90", category: "Komedi", isFavorite: false },
  { title: "Güldür Güldür", videoId: "5zaDrU4LNv4", colorClass: "bg-sound-6 hover:bg-sound-6/90", category: "Komedi", isFavorite: false },
];

export const CATEGORIES = ["Tümü", "Alkış", "Komedi", "Efekt", "Drama", "Diğer"] as const;

const STORAGE_KEY = "soundboard-sounds";
const PROFILES_KEY = "soundboard-profiles";
const PROFILE_SOUNDS_KEY = "soundboard-profile-sounds";
const CURRENT_PROFILE_KEY = "soundboard-current-profile";

const Index = () => {
  const isYouTubeReady = useYouTubeAPI();
  const [showSplash, setShowSplash] = useState(() => {
    return !localStorage.getItem(CURRENT_PROFILE_KEY);
  });
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const stored = localStorage.getItem(PROFILES_KEY);
    if (stored) return JSON.parse(stored);
    
    // İlk yükleme: Samet profili ile başla
    const defaultProfile: Profile = {
      id: "samet",
      name: "Samet",
      avatar: "👤"
    };
    return [defaultProfile];
  });
  
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(() => {
    return localStorage.getItem(CURRENT_PROFILE_KEY);
  });
  
  const [profileSounds, setProfileSounds] = useState<{ [key: string]: Sound[] }>(() => {
    const stored = localStorage.getItem(PROFILE_SOUNDS_KEY);
    if (stored) return JSON.parse(stored);
    
    // Mevcut sesleri Samet profiline taşı
    const oldSounds = localStorage.getItem(STORAGE_KEY);
    const initialSounds = oldSounds ? JSON.parse(oldSounds) : DEFAULT_SOUNDS;
    
    return {
      "samet": initialSounds
    };
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  
  const sounds = currentProfileId ? (profileSounds[currentProfileId] || []) : [];
  
  const setSounds = (newSounds: Sound[] | ((prev: Sound[]) => Sound[])) => {
    if (!currentProfileId) return;
    
    setProfileSounds(prev => {
      const updated = typeof newSounds === 'function' 
        ? newSounds(prev[currentProfileId] || [])
        : newSounds;
      
      return {
        ...prev,
        [currentProfileId]: updated
      };
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  }, [profiles]);
  
  useEffect(() => {
    localStorage.setItem(PROFILE_SOUNDS_KEY, JSON.stringify(profileSounds));
  }, [profileSounds]);
  
  useEffect(() => {
    if (currentProfileId) {
      localStorage.setItem(CURRENT_PROFILE_KEY, currentProfileId);
    }
  }, [currentProfileId]);
  
  const handleSelectProfile = (profileId: string) => {
    setCurrentProfileId(profileId);
  };
  
  const handleAddProfile = (name: string, avatar: string) => {
    const newProfile: Profile = {
      id: Date.now().toString(),
      name,
      avatar
    };
    setProfiles([...profiles, newProfile]);
    setProfileSounds(prev => ({
      ...prev,
      [newProfile.id]: []
    }));
  };

  const handleDeleteProfile = (profileId: string) => {
    setProfiles(profiles.filter(p => p.id !== profileId));
    setProfileSounds(prev => {
      const updated = { ...prev };
      delete updated[profileId];
      return updated;
    });
    if (currentProfileId === profileId) {
      setCurrentProfileId(null);
    }
  };

  const handleEditProfile = (profileId: string, name: string, avatar: string) => {
    setProfiles(profiles.map(p => 
      p.id === profileId ? { ...p, name, avatar } : p
    ));
  };
  
  const handleBackToProfiles = () => {
    setCurrentProfileId(null);
  };

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
    
    setSounds([...sounds, { title, videoId, colorClass, category, isFavorite: false }]);
  };

  const handleToggleFavorite = (videoId: string) => {
    setSounds(sounds.map((sound) =>
      sound.videoId === videoId
        ? { ...sound, isFavorite: !sound.isFavorite }
        : sound
    ));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSounds((items) => {
        const oldIndex = items.findIndex((item) => item.videoId === active.id);
        const newIndex = items.findIndex((item) => item.videoId === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const filteredSounds = selectedCategory === "Tümü" 
    ? sounds 
    : sounds.filter(sound => sound.category === selectedCategory);

  const sortedSounds = [...filteredSounds].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0;
  });

  const handleDeleteSound = (videoId: string) => {
    setSounds(sounds.filter((sound) => sound.videoId !== videoId));
  };

  const handleEditSound = (videoId: string, newTitle: string, newCategory: string) => {
    setSounds(sounds.map((sound) =>
      sound.videoId === videoId
        ? { ...sound, title: newTitle, category: newCategory }
        : sound
    ));
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }
  
  if (!currentProfileId) {
    return (
      <ProfileSelection
        profiles={profiles}
        onSelectProfile={handleSelectProfile}
        onAddProfile={handleAddProfile}
        onDeleteProfile={handleDeleteProfile}
        onEditProfile={handleEditProfile}
      />
    );
  }
  
  const currentProfile = profiles.find(p => p.id === currentProfileId);

  return (
    <div className="min-h-screen bg-gradient-bg p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={handleBackToProfiles}
              className="gap-2"
            >
              <ArrowLeft size={20} />
              Profiller
            </Button>
            <div className="text-lg text-muted-foreground">
              {currentProfile?.name}
            </div>
          </div>
          <div className="text-center">
            <h1 className="mb-4 text-6xl font-bold text-foreground">
              🎵 Soundboard
            </h1>
            <p className="text-xl text-muted-foreground">
              Ofis eğlencesi için ses efektleri - Butona tıkla ve eğlen!
            </p>
          </div>
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

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedSounds.map((s) => s.videoId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedSounds.map((sound) => (
                    <SoundButton
                      key={sound.videoId}
                      title={sound.title}
                      videoId={sound.videoId}
                      colorClass={sound.colorClass}
                      isFavorite={sound.isFavorite}
                      category={sound.category}
                      onDelete={() => handleDeleteSound(sound.videoId)}
                      onToggleFavorite={() => handleToggleFavorite(sound.videoId)}
                      onEdit={(newTitle, newCategory) => handleEditSound(sound.videoId, newTitle, newCategory)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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
