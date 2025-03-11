import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Youtube, Clock, Copy, CheckCircle2, Plus, Play, Trash2, ChevronLeft, ChevronRight, Pause, Rewind, FastForward, Upload, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface VideoMetadata {
  title: string;
  thumbnail: string;
  videoId?: string;
  isLocal?: boolean;
  localUrl?: string;
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
  const [videoSource, setVideoSource] = useState<"youtube" | "local">("youtube");
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

    if (videoSource === "youtube") {
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
    }
  };

  // Handle local video time updates
  useEffect(() => {
    if (videoRef.current && metadata?.isLocal) {
      const video = videoRef.current;
      
      const handleTimeUpdate = () => {
        setCurrentTime(formatSeconds(Math.floor(video.currentTime)));
      };

      const handleDurationChange = () => {
        setVideoDuration(Math.floor(video.duration));
      };

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('durationchange', handleDurationChange);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('durationchange', handleDurationChange);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
      };
    }
  }, [metadata?.isLocal]);

  // Modify togglePlayPause to handle both video types
  const togglePlayPause = () => {
    if (metadata?.isLocal && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Modify seekTo to handle both video types
  const seekTo = (seconds: number) => {
    if (metadata?.isLocal && videoRef.current) {
      videoRef.current.currentTime = seconds;
    } else if (player) {
      player.seekTo(seconds, true);
    }
  };

  const adjustTime = (seconds: number) => {
    if (metadata?.isLocal && videoRef.current) {
      const currentSeconds = Math.floor(videoRef.current.currentTime);
      const newSeconds = Math.min(Math.max(currentSeconds + seconds, 0), videoDuration);
      videoRef.current.currentTime = newSeconds;
      setCurrentTime(formatSeconds(newSeconds));
    } else if (player) {
      const currentSeconds = Math.floor(player.getCurrentTime());
      const newSeconds = Math.min(Math.max(currentSeconds + seconds, 0), videoDuration);
      setCurrentTime(formatSeconds(newSeconds));
      seekTo(newSeconds);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is a video
    if (!file.type.startsWith('video/')) {
      toast.error("Please upload a video file");
      return;
    }

    const url = URL.createObjectURL(file);
    setMetadata({
      title: file.name,
      thumbnail: "",
      isLocal: true,
      localUrl: url
    });

    // Reset timestamps for new video
    setTimestamps([]);
    toast.success("Video loaded successfully");
  };

  const captureCurrentTime = () => {
    let currentSeconds = 0;
    if (metadata?.isLocal && videoRef.current) {
      currentSeconds = Math.floor(videoRef.current.currentTime);
    } else if (player && player.getCurrentTime) {
      currentSeconds = Math.floor(player.getCurrentTime());
    }
    const formattedTime = formatSeconds(currentSeconds);
    setCurrentTime(formattedTime);
    
    // Focus the time input after capturing
    const timeInput = document.querySelector('input[placeholder="mm:ss"]') as HTMLInputElement;
    if (timeInput) {
      timeInput.focus();
    }
    
    toast.success("Current time captured");
  };

  // Add theme toggle function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Update document class for global dark mode
    document.documentElement.classList.toggle('dark');
  };

  // Initialize theme on mount
  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <div 
      className={`min-h-screen p-6 flex flex-col items-center justify-center gap-8 ${isDarkMode ? 'dark bg-black' : ''}`}
      style={{
        background: isDarkMode ? 
          `linear-gradient(to right, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.95)),
          url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23FFFFFF' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`
          :
          `linear-gradient(to right, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)),
          url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        backgroundAttachment: 'fixed',
        backgroundSize: '500px 500px'
      }}
    >
      {/* Theme toggle button */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className={`fixed top-4 right-4 p-2 rounded-full ${
          isDarkMode ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-700' : 'bg-white text-gray-900 hover:bg-gray-100'
        }`}
        title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <div className={`text-center space-y-4 max-w-2xl ${isDarkMode ? 'text-white' : ''}`}>
        <h1 className="text-4xl font-bold tracking-tight flex items-center justify-center gap-2">
          <Youtube className="h-8 w-8 text-red-600" />
          YouTube Timestamp Creator
        </h1>
        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-muted-foreground'}`}>
          Create, manage and share clickable timestamps for YouTube videos
        </p>
      </div>

      <div className="w-full max-w-2xl">
        <div className={`glass-panel p-6 space-y-6 ${isDarkMode ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/60'} backdrop-blur-sm rounded-lg shadow-lg`}>
          <div className="flex gap-4 mb-4">
            <Button
              variant={videoSource === "youtube" ? "default" : "outline"}
              onClick={() => setVideoSource("youtube")}
              className="flex-1 flex items-center justify-center gap-2 py-6"
            >
              <Youtube className="h-5 w-5" />
              YouTube Video
            </Button>
            <Button
              variant={videoSource === "local" ? "default" : "outline"}
              onClick={() => setVideoSource("local")}
              className="flex-1 flex items-center justify-center gap-2 py-6"
            >
              <Upload className="h-5 w-5" />
              Upload Video
            </Button>
          </div>

          {videoSource === "youtube" ? (
            <div className="relative">
              <Input
                type="url"
                placeholder="Paste YouTube URL here"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-12 pr-4 py-6 rounded-lg border bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black transition-all text-base"
                required
              />
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-4 w-full py-6 rounded-lg font-medium hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-auto flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Clock className="h-5 w-5 animate-spin" />
                    Loading Video...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Load Video
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-black transition-colors flex flex-col items-center justify-center gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mb-2 text-muted-foreground" />
                <p className="text-lg font-medium">Click to upload a video or drag and drop</p>
                <p className="text-sm text-muted-foreground">MP4, WebM, or OGG</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="video/*"
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>

      {metadata && (
        <div className={`glass-panel p-6 w-full max-w-2xl space-y-6 ${isDarkMode ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/60'} backdrop-blur-sm rounded-lg shadow-lg`}>
          <div className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              {metadata.isLocal ? (
                <video
                  ref={videoRef}
                  src={metadata.localUrl}
                  className="w-full h-full"
                  playsInline
                  controls
                  controlsList="nodownload"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                <div ref={playerRef} className="w-full h-full" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {metadata.isLocal ? (
                  <Upload className="h-5 w-5" />
                ) : (
                  <Youtube className="h-5 w-5 text-red-600" />
                )}
                {metadata.title}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayPause}
                  className="flex items-center gap-2 min-w-[80px]"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={captureCurrentTime}
                  className="flex items-center gap-2"
                  title="Capture current video time"
                >
                  <Clock className="h-4 w-4" />
                  Capture Time
                </Button>
              </div>
            </div>
          </div>

          <Card className={`border-none shadow-sm ${isDarkMode ? 'bg-gray-900/60' : 'bg-white/60'} backdrop-blur-sm`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Add Timestamp
              </CardTitle>
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
                      className="w-full pl-4 pr-4 font-mono text-left"
                    />
                    {showTimeTooltip && (
                      <div className="absolute -top-12 left-0 right-0 bg-black text-white text-xs py-2 px-3 rounded text-center">
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
                      className="flex items-center justify-center w-10 h-10 p-0"
                    >
                      <Rewind className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePlayPause}
                      className="flex items-center justify-center w-12 h-10 p-0"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustTime(10)}
                      title="Forward 10 seconds"
                      className="flex items-center justify-center w-10 h-10 p-0"
                    >
                      <FastForward className="h-4 w-4" />
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
                className="w-full flex items-center justify-center gap-2"
                disabled={!currentTime || !currentDescription}
              >
                <Plus className="h-5 w-5" />
                Add Timestamp
              </Button>
            </CardContent>
          </Card>

          {timestamps.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timestamps
                </h3>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
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
                      <Clock className="h-4 w-4 text-muted-foreground" />
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
                          onClick={() => seekTo(timestamp.seconds)}
                          title="Play from this timestamp"
                          className="h-8 w-8"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTimestamp(timestamp.id)}
                          title="Remove timestamp"
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
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
