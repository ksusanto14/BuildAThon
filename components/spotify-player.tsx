"use client";

import { useState } from "react";
import Image from "next/image";

type SpotifyPlaylist = {
  id: string;
  title: string;
  description: string;
  mood: string;
  performanceTip: string;
};

const TRAINING_PLAYLISTS: SpotifyPlaylist[] = [
  {
    id: "37i9dQZF1DX76Wlfdnj7AP",
    title: "Beast Mode",
    description: "High-energy hits for max effort",
    mood: "Intense",
    performanceTip: "Fast-tempo music (140+ BPM) boosts power output by up to 15%. Use this for PRs and heavy lifts.",
  },
  {
    id: "37i9dQZF1DX70RN3TfnE9m",
    title: "Cardio",
    description: "Upbeat tracks for running and endurance",
    mood: "Energetic",
    performanceTip: "Syncing your stride to the beat improves running efficiency. These tracks keep you in the 150-170 BPM sweet spot.",
  },
  {
    id: "37i9dQZF1DWTl4y3SSa0cj",
    title: "Recovery & Chill",
    description: "Calm beats for stretching and cooldown",
    mood: "Relaxed",
    performanceTip: "Slow music lowers cortisol and heart rate post-workout. Use this during cooldown to speed up recovery.",
  },
  {
    id: "37i9dQZF1DWZq91oLsHZvy",
    title: "Peaceful Piano",
    description: "Wind down for better sleep",
    mood: "Calm",
    performanceTip: "Listening to calming music before bed improves sleep quality by 35%. Better sleep = better recovery tomorrow.",
  },
  {
    id: "37i9dQZF1DX3rxVfibe1L0",
    title: "Mood Booster",
    description: "Feel-good music for lighter sessions",
    mood: "Happy",
    performanceTip: "Positive music elevates mood and reduces perceived effort. Great for moderate sessions when motivation is low.",
  },
  {
    id: "37i9dQZF1DX32NsLKyzScr",
    title: "Power Workout",
    description: "Heavy lifting and strength training",
    mood: "Aggressive",
    performanceTip: "Aggressive music increases adrenaline and grip strength. Pair with compound movements for best results.",
  },
];

export function SpotifyPlayer() {
  const [activePlaylist, setActivePlaylist] = useState(TRAINING_PLAYLISTS[0]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Image src="/spotify-logo.svg" alt="Spotify" width={28} height={28} />
          <h1 className="text-2xl font-bold">Training Music</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          What you listen to changes how you perform. Pick your playlist.
        </p>
      </div>

      {/* Active Player */}
      <div className="p-5 rounded-xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/spotify-logo.svg" alt="" width={18} height={18} />
            <h2 className="font-semibold text-sm">{activePlaylist.title}</h2>
            <span className="px-2 py-0.5 rounded-full bg-[#1ed760]/15 text-[#1ed760] text-xs font-medium">
              {activePlaylist.mood}
            </span>
          </div>
        </div>
        <iframe
          style={{ borderRadius: "12px" }}
          src={`https://open.spotify.com/embed/playlist/${activePlaylist.id}?utm_source=generator&theme=0`}
          width="100%"
          height="252"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title={activePlaylist.title}
        />
        {/* Performance insight for active playlist */}
        <div className="flex gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <span className="text-primary text-lg leading-none">&#9889;</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {activePlaylist.performanceTip}
          </p>
        </div>
      </div>

      {/* Playlist Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TRAINING_PLAYLISTS.map((pl) => (
          <button
            key={pl.id}
            onClick={() => setActivePlaylist(pl)}
            className={`p-4 rounded-xl border text-left transition-colors ${
              activePlaylist.id === pl.id
                ? "border-[#1ed760] bg-[#1ed760]/10"
                : "border-border bg-card hover:border-[#1ed760]/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Image src="/spotify-logo.svg" alt="" width={14} height={14} />
              <p className="font-medium text-sm">{pl.title}</p>
            </div>
            <p className="text-xs text-muted-foreground">{pl.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
