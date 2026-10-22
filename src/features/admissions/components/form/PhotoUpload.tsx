"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImagePlus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

const MAX_FILE_MB = 5;
const OUTPUT_SIZE = 320;

/**
 * Crops the image to a square and shrinks it so the demo can keep it in
 * localStorage. TODO (backend phase): upload the original file to storage
 * (e.g. S3 / Cloudinary) and save the returned URL instead.
 */
async function toSquareDataUrl(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const side = Math.min(img.width, img.height);
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    canvas.getContext("2d")!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

type PhotoUploadProps = {
  value: string | null;
  onChange: (photo: string | null) => void;
};

export function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file (JPG or PNG).");
    if (file.size > MAX_FILE_MB * 1024 * 1024) return setError(`Image must be smaller than ${MAX_FILE_MB} MB.`);
    setError("");
    try {
      onChange(await toSquareDataUrl(file));
    } catch {
      setError("Could not read this image. Try another file.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files[0]);
        }}
        aria-label={value ? "Change student photo" : "Upload student photo"}
        className={cn(
          "group relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition",
          value ? "border-transparent" : "border-line-strong bg-subtle hover:border-indigo-400 hover:bg-indigo-50/50",
          dragging && "border-indigo-500 bg-indigo-50",
        )}
      >
        {value ? (
          <>
            <Image src={value} alt="Student photo" fill unoptimized className="object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-slate-950/50 text-white opacity-0 transition group-hover:opacity-100">
              <Camera className="h-6 w-6" />
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-fg-subtle">
            <ImagePlus className="h-7 w-7" />
            <span className="text-xs font-medium">Upload photo</span>
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="text-center sm:text-left">
        <p className="text-sm font-semibold text-fg">Student photo</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-fg-muted">
          Recent passport-size photo with a plain background. JPG or PNG, up to {MAX_FILE_MB} MB. Click or drag & drop.
        </p>
        {error && <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove photo
          </button>
        )}
      </div>
    </div>
  );
}
