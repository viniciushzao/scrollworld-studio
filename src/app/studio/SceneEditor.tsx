"use client";

import React, { useState } from "react";
import { SceneMedia } from "@/lib/engine/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Tag,
  Link,
  Clock,
  Layers,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

interface SceneEditorProps {
  scenes: SceneMedia[];
  selectedSceneIndex: number;
  onSelectScene: (index: number) => void;
  onUpdateScenes: (scenes: SceneMedia[]) => void;
}

export function SceneEditor({
  scenes,
  selectedSceneIndex,
  onSelectScene,
  onUpdateScenes,
}: SceneEditorProps) {
  const [newTagInput, setNewTagInput] = useState("");
  const { t } = useTranslation();

  const activeScene = scenes[selectedSceneIndex] || scenes[0];

  const handleUpdateField = <K extends keyof SceneMedia>(
    field: K,
    value: SceneMedia[K]
  ) => {
    const updated = scenes.map((s, idx) => {
      if (idx === selectedSceneIndex) {
        return { ...s, [field]: value };
      }
      return s;
    });
    onUpdateScenes(updated);
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const currentTags = activeScene.tags || [];
    if (!currentTags.includes(newTagInput.trim().toUpperCase())) {
      handleUpdateField("tags", [...currentTags, newTagInput.trim().toUpperCase()]);
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = activeScene.tags || [];
    handleUpdateField(
      "tags",
      currentTags.filter((t) => t !== tagToRemove)
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...scenes];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    updated.forEach((s, idx) => (s.index = idx));
    onUpdateScenes(updated);
    onSelectScene(index - 1);
  };

  const handleMoveDown = (index: number) => {
    if (index === scenes.length - 1) return;
    const updated = [...scenes];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    updated.forEach((s, idx) => (s.index = idx));
    onUpdateScenes(updated);
    onSelectScene(index + 1);
  };

  const handleDeleteScene = (index: number) => {
    if (scenes.length <= 1) return;
    const updated = scenes.filter((_, idx) => idx !== index);
    updated.forEach((s, idx) => (s.index = idx));
    onUpdateScenes(updated);
    onSelectScene(Math.max(0, index - 1));
  };

  const handleAddScene = () => {
    const newScene: SceneMedia = {
      id: `scene-${Date.now()}`,
      index: scenes.length,
      title: `New Scene ${scenes.length + 1}`,
      subtitle: "DISCOVERY LAYER",
      description: "Describe the architectural detail or narrative progression for this scene.",
      tags: ["FEATURE", "INNOVATION"],
      duration: 4.0,
      lingerFactor: 0.5,
      stillPosterUrl:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80",
      videoDesktopUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      videoMobileUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    };
    const updated = [...scenes, newScene];
    onUpdateScenes(updated);
    onSelectScene(updated.length - 1);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/70 backdrop-blur-xl border-r border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">{t("studio.scenesSequence", "Scenes Sequence")}</h2>
          <Badge variant="cyan">{scenes.length} Scenes</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={handleAddScene} className="gap-1.5 h-8">
          <Plus className="h-3.5 w-3.5" />
          <span>{t("studio.addScene", "Add Scene")}</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400">Sequence Order</label>
          <div className="space-y-2">
            {scenes.map((scene, idx) => {
              const isSelected = idx === selectedSceneIndex;
              return (
                <div
                  key={scene.id || idx}
                  onClick={() => onSelectScene(idx)}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer group",
                    isSelected
                      ? "border-cyan-500 bg-cyan-950/30 shadow-md shadow-cyan-500/10"
                      : "border-white/5 bg-zinc-900/50 hover:border-white/15 hover:bg-zinc-900"
                  )}
                >
                  <div className="relative h-12 w-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-white/10">
                    <img
                      src={scene.stillPosterUrl}
                      alt={scene.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-1 left-1 rounded bg-black/70 px-1 py-0.2 text-[9px] font-mono text-zinc-200">
                      {idx + 1}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{scene.title}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{scene.subtitle || "No subtitle"}</p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(idx);
                      }}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(idx);
                      }}
                      disabled={idx === scenes.length - 1}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScene(idx);
                      }}
                      disabled={scenes.length <= 1}
                      className="p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {activeScene && (
          <div className="space-y-4 pt-3 border-t border-white/10 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 font-mono">
                {t("studio.editingScene", "EDITING SCENE")} {selectedSceneIndex + 1} OF {scenes.length}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">{t("studio.kickerTag", "Subtitle / Kicker Tag")}</label>
              <Input
                value={activeScene.subtitle || ""}
                onChange={(e) => handleUpdateField("subtitle", e.target.value)}
                placeholder="e.g. AERODYNAMIC CHASSIS"
                className="h-9 text-xs uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">{t("studio.headlineTitle", "Headline Title")}</label>
              <Input
                value={activeScene.title}
                onChange={(e) => handleUpdateField("title", e.target.value)}
                placeholder="Enter scene title"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">{t("studio.bodyDesc", "Body Description")}</label>
              <Textarea
                value={activeScene.description || ""}
                onChange={(e) => handleUpdateField("description", e.target.value)}
                placeholder="Detailed copy displayed when reader scrolls to this scene"
                className="min-h-[70px] text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-cyan-400" />
                <span>Feature Tag Pills</span>
              </label>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {(activeScene.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-mono text-cyan-300"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-white rounded-full"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tag (e.g. 4K OLED, TITANIUM)"
                  className="h-8 text-xs flex-1"
                />
                <Button size="sm" variant="outline" onClick={handleAddTag} className="h-8 px-3 text-xs">
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Linger / Dwell Pacing</span>
                </span>
                <span className="font-mono text-cyan-400 font-bold">
                  {Math.round((activeScene.lingerFactor ?? 0.5) * 100)}%
                </span>
              </div>
              <Slider
                value={[activeScene.lingerFactor ?? 0.5]}
                min={0}
                max={0.9}
                step={0.05}
                onValueChange={([val]) => handleUpdateField("lingerFactor", val)}
              />
              <p className="text-[10px] text-zinc-400">
                Controls the central deceleration plateau curve (`lingerEase`) allowing users to read the headline comfortably without breaking continuous scroll.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Link className="h-3.5 w-3.5 text-cyan-400" />
                <span>Call to Action Button (Optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={activeScene.cta?.text || ""}
                  onChange={(e) =>
                    handleUpdateField("cta", {
                      text: e.target.value,
                      url: activeScene.cta?.url || "https://scrollworld.studio",
                    })
                  }
                  placeholder="Button label (e.g. Order Now)"
                  className="h-8 text-xs"
                />
                <Input
                  value={activeScene.cta?.url || ""}
                  onChange={(e) =>
                    handleUpdateField("cta", {
                      text: activeScene.cta?.text || "Learn More",
                      url: e.target.value,
                    })
                  }
                  placeholder="https://..."
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
                <span>2K Still Poster URL</span>
              </label>
              <Input
                value={activeScene.stillPosterUrl}
                onChange={(e) => handleUpdateField("stillPosterUrl", e.target.value)}
                placeholder="https://..."
                className="h-8 text-xs font-mono text-[11px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
