"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Help, Input, Label } from "@/components/ui";

type Props = {
  name: string; // form field name for the image URL
  altName: string; // form field name for the alt text
  label?: string;
  defaultUrl?: string | null;
  defaultAlt?: string | null;
  errors?: Record<string, string>;
};

/**
 * Image picker: upload a file (stored under /uploads) or paste an https URL.
 * Alt text is required whenever an image is set; the server enforces this too.
 */
export function ImageField({ name, altName, label = "Image", defaultUrl, defaultAlt, errors = {} }: Props) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const id = useId();

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
      setUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <fieldset className="rounded-lg border border-default p-4">
      <legend className="px-1 text-sm font-medium">{label}</legend>
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md border border-dashed border-default bg-surface-muted">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={28} aria-hidden className="text-muted" />
          )}
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={`${id}-file`}
              className="cursor-pointer rounded-md border border-default bg-card px-3 py-1.5 text-sm font-medium hover:bg-surface-muted"
            >
              {uploading ? "Uploading…" : "Upload image"}
            </label>
            <input
              ref={fileRef}
              id={`${id}-file`}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
              }}
            />
            {url && (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted hover:text-red-600"
              >
                <X size={14} aria-hidden /> Remove
              </button>
            )}
          </div>
          <div>
            <Label htmlFor={`${id}-url`} className="text-xs">
              or paste an image URL
            </Label>
            <Input
              id={`${id}-url`}
              name={name}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              aria-invalid={!!errors[name]}
            />
            {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>}
          </div>
          <div>
            <Label htmlFor={`${id}-alt`} className="text-xs">
              Alt text {url && <span className="text-red-600">(required)</span>}
            </Label>
            <Input
              id={`${id}-alt`}
              name={altName}
              defaultValue={defaultAlt ?? ""}
              required={!!url}
              placeholder="Describe the image for screen readers"
              aria-invalid={!!errors[altName]}
            />
            {errors[altName] ? (
              <p className="mt-1 text-xs text-red-600">{errors[altName]}</p>
            ) : (
              <Help>Say what&apos;s in the picture, e.g. “Students at a laptop during the Git workshop.”</Help>
            )}
          </div>
          {error && (
            <p role="alert" className="text-xs text-red-600">
              {error}
            </p>
          )}
          <Help>JPEG, PNG, WebP, GIF, or AVIF up to 5 MB.</Help>
        </div>
      </div>
    </fieldset>
  );
}
