"use client";

import Image from "next/image";
import { LoaderCircle, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/api";

export function ImageUploader({
  images,
  onChange,
  maxFiles = 5,
  uploadFile = uploadImage,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
  uploadFile?: (file: File) => Promise<string>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const remaining = maxFiles - images.length;
    if (files.length > remaining) {
      toast.error(`You can add up to ${maxFiles} images.`);
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        uploaded.push(await uploadFile(file));
      }
      onChange([...images, ...uploaded]);
      toast.success(
        uploaded.length === 1 ? "Image uploaded." : "Images uploaded.",
      );
    } catch {
      // uploadImage already reports the server or validation error.
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <div
            className="group relative size-24 overflow-hidden rounded-xl border bg-muted"
            key={`${image}-${index}`}
          >
            <Image
              alt={`Uploaded service image ${index + 1}`}
              className="object-cover"
              fill
              sizes="96px"
              src={image}
            />
            <Button
              aria-label={`Remove image ${index + 1}`}
              className="absolute right-1 top-1 size-7 bg-background/90 opacity-100 shadow-sm md:opacity-0 md:group-hover:opacity-100"
              disabled={uploading}
              onClick={() => onChange(images.filter((_, item) => item !== index))}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        {images.length < maxFiles ? (
          <button
            aria-label="Choose service images"
            className="flex size-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed bg-muted/40 text-muted-foreground transition hover:border-primary hover:text-primary"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {uploading ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <Plus className="size-5" />
            )}
            <span className="text-xs">{uploading ? "Uploading" : "Add image"}</span>
          </button>
        ) : null}
      </div>
      <input
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        disabled={uploading}
        multiple
        onChange={(event) => void addFiles(event.target.files)}
        ref={inputRef}
        type="file"
      />
      <p className="text-xs text-muted-foreground">
        Add 1–{maxFiles} JPEG, PNG, WebP, or GIF images. 5 MB maximum each.
        {uploading ? " Uploading securely…" : ""}
      </p>
    </div>
  );
}
