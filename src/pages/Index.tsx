import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Youtube, Clock, Copy, CheckCircle2, Plus, Play, Trash2, ChevronLeft, ChevronRight, Pause, Rewind, FastForward } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface VideoMetadata {
  title: string;
  thumbnail: string;
  videoId: string;
}

interface Timestamp {
  id: string;
  time: string;
  description: string;
  seconds: number;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const Index = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [currentDescription, setCurrentDescription] = useState("");
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showTimeTooltip, setShowTimeTooltip] = useState(false);
  
  // Extract YouTube video ID from URL
  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  // Convert time string to seconds
  const timeToSeconds = (time: string): number => {
    const parts = time.split(':').map(part => parseInt(part));
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  // Format seconds to display time
  const formatSeconds = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Parse time input and validate
  const parseTimeInput = (input: string): number => {
    const parts = input.split(':').map(part => parseInt(part));
    let totalSeconds = 0;
    
    if (parts.length === 2) {
      totalSeconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    
    return Math.min(totalSeconds, videoDuration);
  };

  // Format time string with validation
  const formatTimeString = (input: string): string => {
    // Remove non-numeric characters except colon
    let cleaned = input.replace(/[^\d:]/g, '');
    
    // Ensure proper time format (m:ss or h:mm:ss)
    const parts = cleaned.split(':');
    let totalSeconds = 0;
    
    if (parts.length <= 2) {
      // Handle minutes:seconds format
      const minutes = parts[0] || '0';
      const seconds = parts.length > 1 ? parts[1].padEnd(2, '0').substring(0, 2) : '00';
      totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
      cleaned = `${minutes}:${seconds}`;
    } else {
      // Handle hours:minutes:seconds format
      const hours = parts[0] || '0';
      const minutes = parts[1] || '00';
      const seconds = parts[2].padEnd(2, '0').substring(0, 2) || '00';
      totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
      cleaned = `${hours}:${minutes}:${seconds}`;
    }
    
    // Validate against video duration
    if (totalSeconds > videoDuration && videoDuration > 0) {
      return formatSeconds(videoDuration);
    }
    
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      toast.error("Invalid YouTube URL");
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, you would call your backend API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock data for demonstration
      setMetadata({
        title: "Sample YouTube Video",
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        videoId
      });
      
      // Clear existing timestamps when a new video is loaded
      setTimestamps([]);
      toast.success("Video loaded successfully");
    } catch (error) {
      toast.error("Error loading video");
    } finally {
      setLoading(false);
    }
  };

  const addTimestamp = () => {
    if (!metadata) return;
    if (!currentTime || !currentDescription) {
      toast.error("Please enter both time and description");
      return;
    }

    // Validate time format
    const timeRegex = /^(\d+:)?([0-5]?\d):([0-5]\d)$/;
    if (!timeRegex.test(currentTime)) {
      toast.error("Invalid time format. Please use mm:ss or h:mm:ss");
      return;
    }

    const newTimestamp: Timestamp = {
      id: Date.now().toString(),
      time: currentTime,
      description: currentDescription,
      seconds: timeToSeconds(currentTime)
    };

    setTimestamps([...timestamps, newTimestamp]);
    setCurrentDescription("");
    setCurrentTime("0:00");
    
    // Focus back on description input for quick entry of multiple timestamps
    if (descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
    
    toast.success("Timestamp added");
  };

  const removeTimestamp = (id: string) => {
    setTimestamps(timestamps.filter(ts => ts.id !== id));
    toast.success("Timestamp removed");
  };

  const copyToClipboard = () => {
    if (timestamps.length === 0) {
      toast.error("No timestamps to copy");
      return;
    }
    
    const formattedTimestamps = timestamps
      .sort((a, b) => a.seconds - b.seconds)
      .map(({ time, description }) => `${time} - ${description}`)
      .join("\n");
    
    navigator.clipboard.writeText(formattedTimestamps);
    setCopied(true);
    toast.success("Timestamps copied to clipboard!");
    
    setTimeout(() => setCopied(false), 2000);
  };

  // Load YouTube IFrame API
  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      if (metadata?.videoId && playerRef.current) {
        initializePlayer(metadata.videoId);
      }
    };
  }, []);

  // Initialize or update player when video ID changes
  useEffect(() => {
    if (metadata?.videoId && window.YT) {
      initializePlayer(metadata.videoId);
    }
  }, [metadata?.videoId]);

  // Handle keyboard shortcuts
  const handleTimeKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!player) return;

    const currentSeconds = timeToSeconds(currentTime);
    
    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        adjustTime(-5);
        break;
      case 'ArrowRight':
        e.preventDefault();
        adjustTime(5);
        break;
      case ' ':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'Enter':
        e.preventDefault();
        if (currentSeconds <= videoDuration) {
          seekTo(currentSeconds);
        }
        break;
    }
  };

  // Initialize player with duration tracking
  const initializePlayer = (videoId: string) => {
    if (!playerRef.current) return;

    const newPlayer = new window.YT.Player(playerRef.current, {
      height: '360',
      width: '640',
      videoId: videoId,
      playerVars: {
        playsinline: 1,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onReady: (event: any) => {
          setVideoDuration(event.target.getDuration());
        },
        onStateChange: (event: any) => {
          setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          
          // Update current time while playing
          if (event.data === window.YT.PlayerState.PLAYING) {
            const timeUpdateInterval = setInterval(() => {
              if (player && player.getCurrentTime) {
                const currentSeconds = Math.floor(player.getCurrentTime());
                setCurrentTime(formatSeconds(currentSeconds));
              }
            }, 1000);

            return () => clearInterval(timeUpdateInterval);
          }
        }
      }
    });

    setPlayer(newPlayer);
  };

  const togglePlayPause = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  const captureCurrentTime = () => {
    if (!player) return;
    
    const currentSeconds = Math.floor(player.getCurrentTime());
    const minutes = Math.floor(currentSeconds / 60);
    const seconds = currentSeconds % 60;
    setCurrentTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  };

  const seekTo = (seconds: number) => {
    if (!player) return;
    player.seekTo(seconds, true);
  };

  // Update openTimestampedVideo to use embedded player when possible
  const openTimestampedVideo = (timestamp: Timestamp) => {
    if (!metadata) return;
    
    if (player) {
      seekTo(timestamp.seconds);
      player.playVideo();
    } else {
      const timestampUrl = `https://www.youtube.com/watch?v=${metadata.videoId}&t=${timestamp.seconds}s`;
      window.open(timestampUrl, "_blank");
    }
  };

  const adjustTime = (seconds: number) => {
    if (!player) return;
    
    const currentSeconds = Math.floor(player.getCurrentTime());
    const newSeconds = Math.min(Math.max(currentSeconds + seconds, 0), videoDuration);
    setCurrentTime(formatSeconds(newSeconds));
    seekTo(newSeconds);
  };

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-center gap-8">
      <div className="text-center space-y-4 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">
          YouTube Timestamp Creator
        </h1>
        <p className="text-lg text-muted-foreground">
          Create, manage and share clickable timestamps for YouTube videos
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <div className="glass-panel p-6 space-y-6">
          <div className="relative">
            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="url"
              placeholder="Paste YouTube URL here"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-12 pr-4 py-6 rounded-lg border bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black transition-all text-base"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 rounded-lg font-medium hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-auto"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Clock className="animate-spin" />
                Loading Video...
              </span>
            ) : (
              "Load Video"
            )}
          </Button>
        </div>
      </form>

      {metadata && (
        <div className="glass-panel p-6 w-full max-w-2xl space-y-6">
          <div className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <div ref={playerRef} className="w-full h-full" />
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{metadata.title}</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayPause}
                  className="flex items-center gap-2"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={captureCurrentTime}
                  className="flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Capture Time
                </Button>
              </div>
            </div>
          </div>

          <Card className="border-none shadow-sm bg-white/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Add Timestamp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3 space-y-2">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="mm:ss"
                      value={currentTime}
                      onChange={(e) => setCurrentTime(formatTimeString(e.target.value))}
                      onKeyDown={handleTimeKeyDown}
                      onFocus={() => setShowTimeTooltip(true)}
                      onBlur={() => setShowTimeTooltip(false)}
                      className="w-full text-center font-mono"
                    />
                    {showTimeTooltip && (
                      <div className="absolute -top-12 left-0 right-0 bg-black text-white text-xs py-1 px-2 rounded text-center">
                        Use arrow keys to adjust time. Space to play/pause.
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustTime(-10)}
                      title="Back 10 seconds"
                    >
                      <Rewind className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePlayPause}
                      className="min-w-[80px]"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustTime(10)}
                      title="Forward 10 seconds"
                    >
                      <FastForward className="w-4 h-4" />
                    </Button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={videoDuration}
                    value={timeToSeconds(currentTime)}
                    onChange={(e) => {
                      const seconds = parseInt(e.target.value);
                      setCurrentTime(formatSeconds(seconds));
                      seekTo(seconds);
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0:00</span>
                    <span>{formatSeconds(videoDuration)}</span>
                  </div>
                </div>
                <div className="w-full sm:w-2/3">
                  <Textarea
                    ref={descriptionInputRef}
                    placeholder="Timestamp description"
                    value={currentDescription}
                    onChange={(e) => setCurrentDescription(e.target.value)}
                    className="w-full resize-none h-[42px] py-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addTimestamp();
                      }
                    }}
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={addTimestamp}
                className="w-full"
                disabled={!currentTime || !currentDescription}
              >
                <Plus className="mr-2" />
                Add Timestamp
              </Button>
            </CardContent>
          </Card>

          {timestamps.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Timestamps</h3>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? "Copied!" : "Copy All"}
                </Button>
              </div>
              <div className="space-y-2">
                {timestamps
                  .sort((a, b) => a.seconds - b.seconds)
                  .map((timestamp) => (
                    <div
                      key={timestamp.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-black/5 transition-colors group"
                    >
                      <span className="font-mono font-medium min-w-[60px]">
                        {timestamp.time}
                      </span>
                      <span className="text-muted-foreground flex-grow truncate">
                        {timestamp.description}
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openTimestampedVideo(timestamp)}
                          title="Play from this timestamp"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTimestamp(timestamp.id)}
                          title="Remove timestamp"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
