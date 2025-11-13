interface AudioWaveformProps {
  isPlaying: boolean;
}

const AudioWaveform = ({ isPlaying }: AudioWaveformProps) => {
  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-primary-foreground rounded-full transition-all duration-300 ${
            isPlaying ? "animate-wave" : "h-2"
          }`}
          style={{
            animationDelay: `${i * 0.1}s`,
            height: isPlaying ? undefined : "8px",
          }}
        />
      ))}
    </div>
  );
};

export default AudioWaveform;
