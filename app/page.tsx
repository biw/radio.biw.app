"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMobile } from "@/hooks/use-mobile";

// Station type definition
type RadioStation = {
  id: number;
  name: string;
  description: string;
  url: string;
  logo: string;
  disabled?: boolean;
};

export default function RadioStationList() {
  // Sample radio stations - you can edit these URLs
  const stations: RadioStation[] = [
    {
      id: 1,
      name: "98.5 KFOX",
      description: "The best classic rock hits from the 70s and 80s",
      url: "https://bonneville.cdnstream1.com/2620_48.aac",
      logo: "https://cdn.bonneville.cloud/i/KUFX-FM/square_600x600.webp",
    },
    {
      id: 2,
      name: "98.1 The Breeze",
      description: "San Francisco Bay Area's Relaxing Favorites At Work",
      url: "https://example.com/stream2.aac",
      logo: "https://i.iheart.com/v3/re/assets.brands/5e0a3df06f30114a05e0279e?ops=gravity(%22center%22),contain(600,600)&quality=80",
      disabled: true,
    },
    {
      id: 3,
      name: "96.5 KOIT",
      description: "Today's Hits and Yesterday's Favorites at Work",
      url: "https://bonneville.cdnstream1.com/2624_48.aac",
      logo: "https://cdn.bonneville.cloud/i/KOIT-FM/square_600x600.webp",
    },
    {
      id: 4,
      name: "99.7 Now",
      description: "#1 For All The Hits",
      url: "https://bonneville.cdnstream1.com/2622_48.aac",
      logo: "https://cdn.bonneville.cloud/i/KMVQ-FM/square_600x600.webp",
    },
  ];

  const [currentStationId, setCurrentStationId] = useState<number | null>(null);
  const [hoveredStationId, setHoveredStationId] = useState<number | null>(null);
  const [preloadingStationId, setPreloadingStationId] = useState<number | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [error, setError] = useState<string | null>(null);
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
  const preloadStation = (stationId: number | null) => {
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
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {stations
            .filter((i) => !i.disabled)
            .map((station) => (
              <Card
                key={station.id}
                className={`transition-all ${
                  currentStationId === station.id && isPlaying
                    ? "border-primary shadow-md"
                    : hoveredStationId === station.id
                    ? "border-primary/50"
                    : ""
                }`}
                onMouseEnter={() => preloadStation(station.id)}
                onMouseLeave={() => preloadStation(null)}
              >
                <div className="flex items-center">
                  <div className="p-4 flex-shrink-0">
                    <img
                      src={
                        station.logo || "/placeholder.svg?height=64&width=64"
                      }
                      alt={`${station.name} logo`}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  </div>
                  <CardContent className="flex-grow py-4">
                    <CardTitle>{station.name}</CardTitle>
                    <CardDescription>{station.description}</CardDescription>
                  </CardContent>
                  <div className="pr-4">
                    <Button
                      onClick={() => playStation(station.id)}
                      variant={
                        currentStationId === station.id && isPlaying
                          ? "default"
                          : "outline"
                      }
                      size="icon"
                      className="h-12 w-12 rounded-full"
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
                onClick={toggleMute}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0])}
                className="flex-1"
              />
              <span className="w-8 text-center text-sm">{volume}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
