import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

const CATEGORIES = ["Alkış", "Komedi", "Efekt", "Drama", "Diğer"] as const;

const formSchema = z.object({
  title: z.string().min(1, "Ses adı gerekli").max(50, "Ses adı çok uzun"),
  youtubeUrl: z.string().min(1, "YouTube linki gerekli").refine(
    (url) => {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      return youtubeRegex.test(url);
    },
    { message: "Geçerli bir YouTube linki girin" }
  ),
  category: z.string().min(1, "Kategori seçmelisiniz"),
});

type FormValues = z.infer<typeof formSchema>;

interface AddSoundFormProps {
  onAddSound: (title: string, videoId: string, category: string) => void;
}

const AddSoundForm = ({ onAddSound }: AddSoundFormProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      youtubeUrl: "",
      category: "",
    },
  });

  const extractVideoId = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : "";
  };

  const onSubmit = (values: FormValues) => {
    const videoId = extractVideoId(values.youtubeUrl);
    if (videoId) {
      onAddSound(values.title, videoId, values.category);
      form.reset();
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="flex justify-center">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          Yeni Ses Ekle
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-6 shadow-lg">
      <h2 className="mb-4 text-2xl font-bold text-foreground">Yeni Ses Ekle</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ses Adı</FormLabel>
                <FormControl>
                  <Input placeholder="Örn: Alkış" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="youtubeUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>YouTube Linki</FormLabel>
                <FormControl>
                  <Input placeholder="https://youtube.com/watch?v=..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seç" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              Ekle
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                form.reset();
              }}
            >
              İptal
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddSoundForm;
