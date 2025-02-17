
import { useState } from "react";
import { YoutubeVideo, Clock, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface VideoMetadata {
  title: string;
  thumbnail: string;
}

interface Timestamp {
  time: string;
  description: string;
}

const Index = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      // This is a mockup of the video analysis
      // In a real implementation, you would call your backend API
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Mock data for demonstration
      setMetadata({
        title: "Sample YouTube Video",
        thumbnail: "https://picsum.photos/seed/1/640/360",
      });
      
      setTimestamps([
        { time: "0:00", description: "Introduction" },
        { time: "2:30", description: "Main Topic Discussion" },
        { time: "5:45", description: "Key Points and Examples" },
        { time: "8:15", description: "Summary and Conclusion" },
      ]);
    } catch (error) {
      toast.error("Error analyzing video");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const formattedTimestamps = timestamps
      .map(({ time, description }) => `${time} - ${description}`)
      .join("\n");
    
    navigator.clipboard.writeText(formattedTimestamps);
    setCopied(true);
    toast.success("Timestamps copied to clipboard!");
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-center gap-8">
      <div className="text-center space-y-4 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">
          YouTube Timestamp Creator
        </h1>
        <p className="text-lg text-muted-foreground">
          Generate smart timestamps from any YouTube video
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <div className="glass-panel p-6 space-y-6">
          <div className="relative">
            <YoutubeVideo className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="url"
              placeholder="Paste YouTube URL here"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Clock className="animate-spin" />
                Analyzing Video...
              </span>
            ) : (
              "Generate Timestamps"
            )}
          </button>
        </div>
      </form>

      {metadata && (
        <div className="glass-panel p-6 w-full max-w-2xl space-y-6">
          <div className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden">
              <img
                src={metadata.thumbnail}
                alt={metadata.title}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-xl font-semibold">{metadata.title}</h2>
          </div>

          {timestamps.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Generated Timestamps</h3>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/5 hover:bg-black/10 transition-colors"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? "Copied!" : "Copy All"}
                </button>
              </div>
              <div className="space-y-2">
                {timestamps.map(({ time, description }, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-black/5 transition-colors"
                  >
                    <span className="font-mono font-medium min-w-[60px]">
                      {time}
                    </span>
                    <span className="text-muted-foreground">{description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Index;
