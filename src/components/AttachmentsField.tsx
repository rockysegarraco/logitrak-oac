import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Attachment } from "@/lib/exhibitors.functions";
import { TwLabel } from "@/components/ui/tw";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const BUCKET = "exhibitor-attachments";
const MAX_BYTES = 20 * 1024 * 1024;
const IMAGE_RE = /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i;

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const isImage = (a: Attachment) => IMAGE_RE.test(a.name) || IMAGE_RE.test(a.path);

export function AttachmentsField({
  value,
  onChange,
  disabled,
}: {
  value: Attachment[];
  onChange: (next: Attachment[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [viewing, setViewing] = useState<Attachment | null>(null);

  useEffect(() => {
    const missing = value.filter((a) => !urls[a.path]).map((a) => a.path);
    if (missing.length === 0) return;
    let cancelled = false;
    supabase.storage
      .from(BUCKET)
      .createSignedUrls(missing, 3600)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setUrls((prev) => {
          const next = { ...prev };
          for (const d of data) if (d.path && d.signedUrl) next[d.path] = d.signedUrl;
          return next;
        });
      });
    return () => {
      cancelled = true;
    };
  }, [value, urls]);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const added: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 20 MB.`);
        continue;
      }
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${crypto.randomUUID()}/${safe}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, file.type ? { contentType: file.type } : {});
      if (error) toast.error(`Couldn't upload ${file.name}: ${error.message}`);
      else added.push({ path, name: file.name, size: file.size });
    }
    setUploading(false);
    if (added.length) onChange([...value, ...added]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const open = (item: Attachment) => {
    if (isImage(item)) {
      setViewing(item);
      return;
    }
    const url = urls[item.path];
    if (!url) {
      toast.error("Still loading that file, try again in a moment.");
      return;
    }
    window.open(url, "_blank", "noopener");
  };

  const viewingUrl = viewing ? urls[viewing.path] : undefined;

  return (
    <div>
      <TwLabel htmlFor="attachments">Attachments</TwLabel>
      <input
        ref={inputRef}
        id="attachments"
        type="file"
        multiple
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(e) => upload(e.target.files)}
      />
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className="mt-2 inline-flex h-10 items-center gap-2 rounded-full border border-input bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        {uploading ? "Uploading..." : "Add attachment"}
      </button>
      {value.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {value.map((item) => {
            const url = urls[item.path];
            const img = isImage(item);
            return (
              <li
                key={item.path}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2 text-sm"
              >
                <button
                  type="button"
                  onClick={() => open(item)}
                  aria-label={`View ${item.name}`}
                  className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted"
                >
                  {img && url ? (
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => open(item)}
                  className="min-w-0 flex-1 truncate text-left text-foreground underline-offset-2 hover:underline"
                >
                  {item.name}
                </button>
                <span className="shrink-0 text-xs text-muted-foreground">{formatSize(item.size)}</span>
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => onChange(value.filter((a) => a.path !== item.path))}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="truncate pr-8">{viewing?.name}</DialogTitle>
          {viewingUrl ? (
            <>
              <img src={viewingUrl} alt={viewing?.name ?? ""} className="max-h-[75vh] w-full rounded-xl object-contain" />
              <a
                href={viewingUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <ExternalLink className="h-4 w-4" /> Open full size
              </a>
            </>
          ) : (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
