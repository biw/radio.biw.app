"use client";

import { Loader2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useMobile } from "@/hooks/use-mobile";

// Station type definition
type RadioStation = {
  description: string;
  disabled?: boolean;
  id: number;
  logo: string;
  name: string;
  url: string;
};

export default function RadioStationList() {
  // Sample radio stations - you can edit these URLs
  const stations: RadioStation[] = [
    {
      description: "The best classic rock hits from the 70s and 80s",
      id: 1,
      logo: "https://cdn.bonneville.cloud/i/KUFX-FM/square_600x600.webp",
      name: "98.5 KFOX",
      url: "https://bonneville.cdnstream1.com/2620_48.aac",
    },
    {
      description: "San Francisco Bay Area's Relaxing Favorites At Work",
      disabled: true,
      id: 2,
      logo: "https://i.iheart.com/v3/re/assets.brands/5e0a3df06f30114a05e0279e?ops=gravity(%22center%22),contain(600,600)&quality=80",
      name: "98.1 The Breeze",
      url: "https://example.com/stream2.aac",
    },
    {
      description: "Today's Hits and Yesterday's Favorites at Work",
      id: 3,
      logo: "https://cdn.bonneville.cloud/i/KOIT-FM/square_600x600.webp",
      name: "96.5 KOIT",
      url: "https://bonneville.cdnstream1.com/2624_48.aac",
    },
    {
      description: "#1 For All The Hits",
      id: 4,
      logo: "https://cdn.bonneville.cloud/i/KMVQ-FM/square_600x600.webp",
      name: "99.7 Now",
      url: "https://bonneville.cdnstream1.com/2622_48.aac",
    },
  ];

  const [currentStationId, setCurrentStationId] = useState<null | number>(null);
  const [hoveredStationId, setHoveredStationId] = useState<null | number>(null);
  const [preloadingStationId, setPreloadingStationId] = useState<null | number>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [error, setError] = useState<null | string>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const isMobile = useMobile();

  // Initialize audio elements
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "none";
      audio.onerror = () => {
        setError("Error loading stream. Please check the URL and try again.");
        setIsPlaying(false);
        setCurrentStationId(null);
      };
      audioRef.current = audio;
    }

    if (!preloadAudioRef.current) {
      const preloadAudio = new Audio();
      preloadAudio.preload = "auto";
      preloadAudio.volume = 0; // Mute preloading audio
      preloadAudioRef.current = preloadAudio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (preloadAudioRef.current) {
        preloadAudioRef.current.pause();
        preloadAudioRef.current.src = "";
      }
    };
  }, []);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Preload station on hover
  const preloadStation = (stationId: null | number) => {
    // Skip preloading on mobile devices
    if (isMobile) return;

    // Don't preload the currently playing station
    if (stationId === currentStationId) {
      setHoveredStationId(stationId);
      return;
    }

    setHoveredStationId(stationId);

    // If no station to preload, clear preload audio
    if (stationId === null || !preloadAudioRef.current) {
      if (preloadAudioRef.current) {
        preloadAudioRef.current.pause();
        preloadAudioRef.current.src = "";
      }
      setPreloadingStationId(null);
      return;
    }

    const station = stations.find((s) => s.id === stationId);
    if (!station || station.disabled) return;

    // Start preloading the station
    setPreloadingStationId(stationId);
    preloadAudioRef.current.src = station.url;

    // Use the load() method to start buffering without playing
    preloadAudioRef.current.load();

    // Create a promise that resolves when enough data has loaded
    const preloadPromise = new Promise<void>((resolve) => {
      if (!preloadAudioRef.current) return;

      // Listen for the canplay event which indicates enough data is loaded to start playback
      const handleCanPlay = () => {
        if (preloadAudioRef.current) {
          preloadAudioRef.current.removeEventListener("canplay", handleCanPlay);
          resolve();
        }
      };

      preloadAudioRef.current.addEventListener("canplay", handleCanPlay);

      // Also set a timeout in case the canplay event never fires
      setTimeout(() => {
        if (preloadAudioRef.current) {
          preloadAudioRef.current.removeEventListener("canplay", handleCanPlay);
          resolve();
        }
      }, 5000);
    });

    // When preloading is done, update state
    preloadPromise.then(() => {
      // Only update if this is still the station being hovered
      if (hoveredStationId === stationId) {
        setPreloadingStationId(null);
      }
    });
  };

  const playStation = (stationId: number) => {
    const station = stations.find((s) => s.id === stationId);
    if (!station || station.disabled || !audioRef.current) return;

    setError(null);

    // If this station is already playing, pause it
    if (currentStationId === stationId && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // If another station is playing, stop it first
    if (isPlaying) {
      audioRef.current.pause();
    }

    // Check if we have a preloaded version of this station
    if (
      preloadAudioRef.current &&
      hoveredStationId === stationId &&
      preloadAudioRef.current.src
    ) {
      // Swap the audio elements
      const tempSrc = preloadAudioRef.current.src;
      const tempCurrentTime = preloadAudioRef.current.currentTime;

      // Clear the preload audio
      preloadAudioRef.current.pause();
      preloadAudioRef.current.src = "";

      // Set the main audio to the preloaded source
      audioRef.current.src = tempSrc;
      audioRef.current.currentTime = tempCurrentTime;
    } else {
      // No preloaded version, load directly
      audioRef.current.src = station.url;
    }

    // Play the station
    audioRef.current.play().catch((err) => {
      setError(`Failed to play ${station.name}: ${err.message}`);
      setIsPlaying(false);
      setCurrentStationId(null);
      return;
    });

    setCurrentStationId(stationId);
    setIsPlaying(true);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex min-h-screen flex-col p-4 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-center my-8">
          SF Radio Stations
        </h1>

        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {stations
            .filter((i) => !i.disabled)
            .map((station) => (
              <Card
                className={`transition-all ${
                  currentStationId === station.id && isPlaying
                    ? "border-primary shadow-md"
                    : hoveredStationId === station.id
                    ? "border-primary/50"
                    : ""
                }`}
                key={station.id}
                onMouseEnter={() => preloadStation(station.id)}
                onMouseLeave={() => preloadStation(null)}
              >
                <div className="flex items-center">
                  <div className="p-4 flex-shrink-0">
                    <img
                      alt={`${station.name} logo`}
                      className="h-16 w-16 rounded-md object-cover"
                      src={
                        station.logo || "/placeholder.svg?height=64&width=64"
                      }
                    />
                  </div>
                  <CardContent className="flex-grow py-4">
                    <CardTitle>{station.name}</CardTitle>
                    <CardDescription>{station.description}</CardDescription>
                  </CardContent>
                  <div className="pr-4">
                    <Button
                      className="h-12 w-12 rounded-full"
                      onClick={() => playStation(station.id)}
                      size="icon"
                      variant={
                        currentStationId === station.id && isPlaying
                          ? "default"
                          : "outline"
                      }
                    >
                      {currentStationId === station.id && isPlaying ? (
                        <Pause className="h-6 w-6" />
                      ) : currentStationId === station.id ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Play className="h-6 w-6" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground justify-center items-center flex flex-col items-center gap-4">
          <p>
            Currently playing:{" "}
            {currentStationId && isPlaying
              ? stations.find((s) => s.id === currentStationId)?.name
              : "No station selected"}
          </p>
          {isPlaying && (
            <div className="flex items-center space-x-2  border bg-card/80  shadow-sm  p-2 rounded-md w-full max-w-80">
              <Button
                className="h-8 w-8"
                onClick={toggleMute}
                size="icon"
                variant="ghost"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <Slider
                className="flex-1"
                max={100}
                min={0}
                onValueChange={(value) => setVolume(value[0])}
                step={1}
                value={[volume]}
              />
              <span className="w-8 text-center text-sm">{volume}%</span>
            </div>
          )}
        </div>
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Made by</span>
          <a
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 hover:bg-slate-300 text-muted-foreground hover:text-foreground transition-colors"
            href="https://x.com/biwills"
            rel="noopener noreferrer"
            target="_blank"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            @biwills
          </a>
          <span>•</span>
          <a
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 hover:bg-slate-300 text-muted-foreground hover:text-foreground transition-colors"
            href="https://github.com/biw/radio.biw.app"
            rel="noopener noreferrer"
            target="_blank"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
