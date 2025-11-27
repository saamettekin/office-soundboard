import { Plus, User, Trash2, Pencil } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
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
  onAddProfile: (name: string, avatar: string) => void;
  onDeleteProfile: (profileId: string) => void;
  onEditProfile: (profileId: string, name: string, avatar: string) => void;
}

export const ProfileSelection = ({
  profiles,
  onSelectProfile,
  onAddProfile,
  onDeleteProfile,
  onEditProfile,
}: ProfileSelectionProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("👤");
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null);
  const [editProfileId, setEditProfileId] = useState<string | null>(null);
  const [editProfileName, setEditProfileName] = useState("");
  const [editProfileAvatar, setEditProfileAvatar] = useState("👤");

  const handleAddProfile = () => {
    if (newProfileName.trim()) {
      onAddProfile(newProfileName.trim(), selectedAvatar);
      setNewProfileName("");
      setSelectedAvatar("👤");
      setIsAddDialogOpen(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteProfileId) {
      onDeleteProfile(deleteProfileId);
      setDeleteProfileId(null);
    }
  };

  const handleOpenEdit = (profile: Profile) => {
    setEditProfileId(profile.id);
    setEditProfileName(profile.name);
    setEditProfileAvatar(profile.avatar);
  };

  const handleEditConfirm = () => {
    if (editProfileId && editProfileName.trim()) {
      onEditProfile(editProfileId, editProfileName.trim(), editProfileAvatar);
      setEditProfileId(null);
      setEditProfileName("");
      setEditProfileAvatar("👤");
    }
  };

  const avatarEmojis = ["👤", "😀", "😎", "🎭", "🎮", "🎵", "⭐", "🚀", "🔥", "💎", "🎨", "🌟"];
  const avatarColors = [
    "hsl(0, 84%, 60%)",
    "hsl(221, 83%, 53%)",
    "hsl(142, 71%, 45%)",
    "hsl(48, 96%, 53%)",
    "hsl(271, 91%, 65%)",
    "hsl(330, 81%, 60%)",
    "hsl(24, 95%, 53%)",
    "hsl(173, 80%, 40%)",
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
      <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-12">
        Kim dinliyor?
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-4xl">
        {profiles.map((profile) => (
          <div key={profile.id} className="relative group">
            <button
              onClick={() => onSelectProfile(profile.id)}
              className="flex flex-col items-center gap-3 transition-transform hover:scale-105 w-full"
            >
              <div
                className="w-32 h-32 rounded-lg flex items-center justify-center text-6xl font-bold shadow-lg group-hover:shadow-xl transition-shadow"
                style={{ 
                  backgroundColor: profile.avatar.startsWith("hsl") ? profile.avatar : "hsl(var(--primary))",
                }}
              >
                {profile.avatar.startsWith("hsl") ? <User size={64} className="text-white" /> : profile.avatar}
              </div>
              <span className="text-lg text-muted-foreground group-hover:text-foreground transition-colors">
                {profile.name}
              </span>
            </button>
            <div className="absolute top-0 right-0 flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEdit(profile);
                }}
                className="p-2 bg-primary text-primary-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
              >
                <Pencil size={16} />
              </button>
              {profiles.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteProfileId(profile.id);
                  }}
                  className="p-2 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
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
            
            <div className="space-y-2">
              <Label>Avatar Seç</Label>
              <div className="flex flex-wrap gap-2">
                {avatarEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`w-12 h-12 text-2xl rounded-lg transition-all ${
                      selectedAvatar === emoji
                        ? "ring-2 ring-primary scale-110"
                        : "hover:scale-105 bg-muted"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              
              <Label className="mt-4 block">veya Renk Seç</Label>
              <div className="flex flex-wrap gap-2">
                {avatarColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedAvatar(color)}
                    className={`w-12 h-12 rounded-lg transition-all flex items-center justify-center ${
                      selectedAvatar === color
                        ? "ring-2 ring-primary scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {selectedAvatar === color && <User size={24} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>
            
            <Button onClick={handleAddProfile} className="w-full">
              Profil Oluştur
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editProfileId} onOpenChange={() => setEditProfileId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profili Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editProfileName">Profil Adı</Label>
              <Input
                id="editProfileName"
                value={editProfileName}
                onChange={(e) => setEditProfileName(e.target.value)}
                placeholder="İsim girin..."
                onKeyDown={(e) => e.key === "Enter" && handleEditConfirm()}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Avatar Seç</Label>
              <div className="flex flex-wrap gap-2">
                {avatarEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setEditProfileAvatar(emoji)}
                    className={`w-12 h-12 text-2xl rounded-lg transition-all ${
                      editProfileAvatar === emoji
                        ? "ring-2 ring-primary scale-110"
                        : "hover:scale-105 bg-muted"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              
              <Label className="mt-4 block">veya Renk Seç</Label>
              <div className="flex flex-wrap gap-2">
                {avatarColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditProfileAvatar(color)}
                    className={`w-12 h-12 rounded-lg transition-all flex items-center justify-center ${
                      editProfileAvatar === color
                        ? "ring-2 ring-primary scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {editProfileAvatar === color && <User size={24} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>
            
            <Button onClick={handleEditConfirm} className="w-full">
              Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteProfileId} onOpenChange={() => setDeleteProfileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Profili Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu profili silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm ses efektleri silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
