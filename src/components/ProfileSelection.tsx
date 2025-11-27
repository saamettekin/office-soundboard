import { Plus, User } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export interface Profile {
  id: string;
  name: string;
  avatar: string;
}

interface ProfileSelectionProps {
  profiles: Profile[];
  onSelectProfile: (profileId: string) => void;
  onAddProfile: (name: string) => void;
}

export const ProfileSelection = ({
  profiles,
  onSelectProfile,
  onAddProfile,
}: ProfileSelectionProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");

  const handleAddProfile = () => {
    if (newProfileName.trim()) {
      onAddProfile(newProfileName.trim());
      setNewProfileName("");
      setIsAddDialogOpen(false);
    }
  };

  const avatarColors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-teal-500",
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
      <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-12">
        Kim dinliyor?
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-4xl">
        {profiles.map((profile, index) => (
          <button
            key={profile.id}
            onClick={() => onSelectProfile(profile.id)}
            className="flex flex-col items-center gap-3 group transition-transform hover:scale-105"
          >
            <div
              className={`w-32 h-32 rounded-lg ${
                avatarColors[index % avatarColors.length]
              } flex items-center justify-center text-white text-4xl font-bold shadow-lg group-hover:shadow-xl transition-shadow`}
            >
              <User size={64} />
            </div>
            <span className="text-lg text-muted-foreground group-hover:text-foreground transition-colors">
              {profile.name}
            </span>
          </button>
        ))}

        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="flex flex-col items-center gap-3 group transition-transform hover:scale-105"
        >
          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/50 flex items-center justify-center group-hover:border-primary transition-colors">
            <Plus size={48} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-lg text-muted-foreground group-hover:text-foreground transition-colors">
            Profil Ekle
          </span>
        </button>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Profil Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="profileName">Profil Adı</Label>
              <Input
                id="profileName"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="İsim girin..."
                onKeyDown={(e) => e.key === "Enter" && handleAddProfile()}
              />
            </div>
            <Button onClick={handleAddProfile} className="w-full">
              Profil Oluştur
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
