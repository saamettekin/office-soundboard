import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Volume2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Menu = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Çıkış yapıldı",
      description: "Başarıyla çıkış yaptınız",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg p-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-6xl font-bold text-foreground">
            🎵 Soundboard
          </h1>
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut size={20} />
            Çıkış
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
            onClick={() => navigate("/soundboard-work")}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Music className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-3xl">Soundboard Work</CardTitle>
              <CardDescription className="text-base">
                Ofis ortak müzik çalma sırası
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Spotify entegrasyonu ile ofis için ortak müzik kuyruğu
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
            onClick={() => navigate("/soundboard-effect")}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center">
                <Volume2 className="w-10 h-10 text-secondary" />
              </div>
              <CardTitle className="text-3xl">Soundboard Effect</CardTitle>
              <CardDescription className="text-base">
                Ses efektleri paneli
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              YouTube ses efektleri ile eğlenceli anlar
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Menu;
