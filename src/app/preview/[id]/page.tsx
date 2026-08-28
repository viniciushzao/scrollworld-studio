"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SAMPLE_WORLDS } from "@/lib/data/sample-worlds";
import { StudioProject } from "@/lib/types/studio";
import { StudioClient } from "@/lib/api/studio-client";
import { ScrollWorldPlayer } from "@/components/player/ScrollWorldPlayer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Share2,
  Sparkles,
  Check,
} from "lucide-react";
import Link from "next/link";

export default function PreviewPage() {
  const params = useParams();
  const id = params?.id as string;

  const [project, setProject] = useState<StudioProject | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    if (!id) return;
    const all = StudioClient.getProjects();
    const found = all.find((p) => p.id === id) || SAMPLE_WORLDS[0];
    setProject(found);

    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setViewportMode("mobile");
    }
  }, [id]);

  const handleShare = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black text-white p-6">
        <div className="text-center space-y-3">
          <Sparkles className="h-8 w-8 text-cyan-400 mx-auto animate-spin-slow" />
          <p className="text-sm font-mono text-zinc-400">Loading ScrollWorld Experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-black overflow-hidden flex items-center justify-center">
      <div className="pointer-events-auto absolute top-4 left-4 right-4 z-40 flex items-center justify-between">
        <Link href="/studio">
          <Button
            size="sm"
            variant="glass"
            className="gap-2 rounded-2xl text-xs bg-black/60 backdrop-blur-xl border border-white/10 hover:bg-black/80"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back to Studio</span>
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="glass"
            onClick={handleShare}
            className="gap-1.5 rounded-2xl text-xs bg-black/60 backdrop-blur-xl border border-white/10 hover:bg-black/80"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
          </Button>
        </div>
      </div>

      <div className={`relative w-full h-full ${viewportMode === "mobile" ? "max-w-[420px] aspect-[9/16] my-auto" : ""}`}>
        <ScrollWorldPlayer
          scenes={project.scenes}
          mode={viewportMode}
          dampingFactor={project.settings?.dampingFactor || 0.18}
          lingerEasePower={3.0}
          showControls={true}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
