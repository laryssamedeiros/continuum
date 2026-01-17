"use client";

import React, { useState, useEffect, DragEvent, ChangeEvent } from "react";

type FileUploaderProps = {
  onResult: (data: { profileText: string; profileJson: any }) => void;
};

export default function FileUploader({ onResult }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Smooth, fake-ish progress animation (UX candy)
  useEffect(() => {
    if (!loading) return;

    let animationFrame: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      setDisplayProgress((prev) => {
        // Target "pre-finish" max
        const target = 80;
        if (prev >= target) return prev;

        // Speed: 10–20% per second, but small steps
        const incrementPerMs = 0.015; // tweak feel here
        const increment = delta * incrementPerMs;

        const next = prev + increment;
        return next > target ? target : next;
      });

      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [loading]);

  const resetState = () => {
    setLoading(false);
    setIsDragging(false);
    setSelectedFiles([]);
    setStatusText(null);
    setDisplayProgress(0);
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setSelectedFiles(fileArray);
    setLoading(true);
    setDisplayProgress(5);
    setStatusText("Uploading & parsing files...");

    try {
      const formData = new FormData();
      fileArray.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/upload-files", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Upload error:", data);
        setStatusText(data.error || "Something went wrong while parsing.");
        setLoading(false);
        setDisplayProgress(0);
        return;
      }

      // Snap to 100% for nice UX
      setDisplayProgress(100);
      setStatusText("Identity graph extracted.");

      // Pass result up
      onResult({
        profileText: data.profileText,
        profileJson: data.profileJson,
      });

      // Let user see 100% briefly, then reset bar but keep result visible
      setTimeout(() => {
        setDisplayProgress(0);
        setStatusText(null);
        setSelectedFiles([]);
        setLoading(false);
      }, 800);
    } catch (err) {
      console.error(err);
      setStatusText("Network error. Please try again.");
      setLoading(false);
      setDisplayProgress(0);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (loading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loading) setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    if (loading) return;
    handleFiles(e.target.files);
  };

  const borderStyle = isDragging
    ? "border-2 border-dashed border-purple-500 glass"
    : "border-2 border-dashed border-white/20 glass hover:border-purple-400/50";

  return (
    <div className="w-full space-y-4">
      <div
        className={`rounded-3xl p-8 cursor-pointer transition-smooth hover-glow ${borderStyle}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => {
          if (loading) return;
          const input = document.getElementById(
            "file-input-hidden"
          ) as HTMLInputElement | null;
          input?.click();
        }}
      >
        <input
          id="file-input-hidden"
          type="file"
          multiple
          className="hidden"
          onChange={onFileChange}
          accept=".txt,.json,.md,.zip"
        />

        <div className="flex flex-col items-center justify-center text-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-3xl shadow-lg">
            📂
          </div>
          <div>
            <p className="text-base font-medium">
              Drag & drop your AI chat exports here
            </p>
            <p className="text-sm opacity-70 mt-2">
              ChatGPT • Claude • Gemini
            </p>
            <p className="text-xs opacity-50 mt-1">
              Supports: .zip, .json, .txt, .md
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-2 w-full max-w-sm text-left text-xs text-neutral-600 bg-white/70 border border-neutral-200 rounded-lg p-2">
              <p className="font-semibold mb-1">Selected files:</p>
              <ul className="max-h-24 overflow-auto list-disc list-inside space-y-0.5">
                {selectedFiles.map((file, idx) => (
                  <li key={idx} className="truncate">
                    {file.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Progress + status */}
      {(loading || displayProgress > 0 || statusText) && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-600">
              {statusText || (loading ? "Processing..." : "Ready")}
            </span>
            {displayProgress > 0 && (
              <span className="text-neutral-500">{Math.round(displayProgress)}%</span>
            )}
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-neutral-900 transition-[width] duration-200 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Reset / hint */}
      {!loading && selectedFiles.length === 0 && (
        <p className="text-[11px] text-neutral-500">
          Tip: start with your full ChatGPT export ZIP to build a dense identity
          graph in one go.
        </p>
      )}
    </div>
  );
}

