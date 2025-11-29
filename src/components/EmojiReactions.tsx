import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSongReactions } from "@/hooks/useSongReactions";
import { Smile } from "lucide-react";

interface EmojiReactionsProps {
  songId: string;
}

export const EmojiReactions = ({ songId }: EmojiReactionsProps) => {
  const { userReaction, availableEmojis, addReaction, getReactionCounts } =
    useSongReactions(songId);

  const counts = getReactionCounts();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {userReaction ? (
            <span className="text-lg">{userReaction}</span>
          ) : (
            <Smile className="h-4 w-4" />
          )}
          {Object.keys(counts).length > 0 && (
            <span className="text-xs text-muted-foreground">
              {Object.values(counts).reduce((a, b) => a + b, 0)}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex gap-1">
          {availableEmojis.map((emoji) => (
            <Button
              key={emoji}
              variant={userReaction === emoji ? "secondary" : "ghost"}
              size="sm"
              onClick={() => addReaction(emoji)}
              className="text-xl h-10 w-10 p-0"
            >
              <span>{emoji}</span>
              {counts[emoji] && (
                <span className="absolute -top-1 -right-1 text-xs bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                  {counts[emoji]}
                </span>
              )}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
