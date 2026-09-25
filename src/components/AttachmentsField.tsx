import { useRef, useState } from "react";
import { Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Attachment } from "@/lib/exhibitors.functions";
import { TwLabel } from "@/components/ui/tw";

const BUCKET = "exhibitor-attachments";
const MAX_BYTES = 20 * 1024 * 1024;

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

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

  const open = async (item: Attachment) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(item.path, 300);
    if (error || !data) {
      toast.error("Couldn't open that file.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

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
          {value.map((item) => (
            <li
              key={item.path}
              className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 text-sm"
            >
              <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
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
          ))}
        </ul>
      ) : null}
    </div>
  );
}
