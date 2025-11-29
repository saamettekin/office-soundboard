import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <div className="min-h-screen bg-gradient-bg p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12">
          <Button
            variant="ghost"
            onClick={() => navigate("/menu")}
            className="gap-2 mb-8"
          >
            <ArrowLeft size={20} />
            Ana Menü
          </Button>
          <div className="text-center">
            <h1 className="mb-4 text-6xl font-bold text-foreground">
              🎵 Soundboard Work
            </h1>
            <p className="text-xl text-muted-foreground">
              Spotify entegrasyonu yakında eklenecek...
            </p>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Spotify Entegrasyonu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Bu bölüm henüz geliştirilme aşamasındadır. Spotify credentials'larınızı hazırladıktan sonra
              entegrasyon tamamlanacaktır.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SoundboardWork;
