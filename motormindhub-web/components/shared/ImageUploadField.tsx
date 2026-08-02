"use client";

import { useRef, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import { toast } from "@/lib/toast/toast";
import { Avatar } from "@/components/shared/Avatar";
import { ImageIcon } from "@/components/autore/icons";

interface ErrorBody {
  messages?: string[];
}

interface ImageUploadFieldProps {
  /** URL corrente: Cloudinary o un URL esterno storico pre-migrazione, e' sempre solo una stringa. */
  value: string | null;
  /** Chiamato solo dopo un upload riuscito - non persiste da solo, il form chiamante lo fa al submit. */
  onChange: (url: string) => void;
  endpoint: string;
  /**
   * Solo per l'hint testuale sotto il bottone ("max N MB"): la validazione
   * vera resta interamente server-side (ImageUploadValidator). Un pre-check
   * qui bloccherebbe la richiesta prima che parta, impedendo di verificare
   * dal vivo le risposte reali 413/400 del backend - stessa ragione per cui
   * non c'e' nemmeno un pre-check sul formato.
   */
  maxSizeBytes: number;
  variant: "avatar" | "cover";
  label: string;
  /** Richiesto solo dalla variante avatar, per il fallback a iniziali di Avatar. */
  nome?: string;
  cognome?: string;
}

/**
 * Componente condiviso tra Impostazioni Profilo e Editor Articolo (stesso
 * principio di riuso gia' applicato altrove in questo progetto): un
 * bottone file-picker dietro un input nascosto - il mockup 16 mostra un
 * bottone ("CARICA NUOVA FOTO"), non una drop-zone, nessuna indicazione di
 * drag&drop da rispettare.
 */
export function ImageUploadField({
  value,
  onChange,
  endpoint,
  maxSizeBytes,
  variant,
  label,
  nome,
  cognome,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value);

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    let response: Response;
    try {
      response = await apiFetch(endpoint, { method: "POST", body: formData });
    } catch {
      setUploading(false);
      setPreviewUrl(value);
      URL.revokeObjectURL(objectUrl);
      toast.error("Impossibile contattare il server. Riprova più tardi.");
      return;
    }

    setUploading(false);

    if (!response.ok) {
      setPreviewUrl(value);
      URL.revokeObjectURL(objectUrl);
      let body: ErrorBody = {};
      try {
        body = await response.json();
      } catch {
        // corpo non JSON: si ricade sul messaggio generico sotto
      }
      toast.error(body.messages?.[0] ?? "Non è stato possibile caricare l'immagine. Riprova.");
      return;
    }

    const { url } = (await response.json()) as { url: string };
    URL.revokeObjectURL(objectUrl);
    setPreviewUrl(url);
    onChange(url);
  };

  const buttonClassName =
    "shrink-0 rounded-md border border-chrome/40 px-5 py-3 text-center font-heading text-sm font-bold uppercase tracking-wide text-paper disabled:opacity-60";

  return (
    <div className={variant === "avatar" ? "flex items-center gap-4" : "flex flex-col gap-2"}>
      {variant === "avatar" ? (
        <Avatar nome={nome ?? ""} cognome={cognome ?? ""} fotoProfilo={previewUrl} className="h-16 w-16" />
      ) : previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL arbitraria (Cloudinary o storica), stesso pattern di ArticleCard/Avatar
        <img
          src={previewUrl}
          alt=""
          className="aspect-video w-full max-w-xs rounded-md object-cover"
        />
      ) : (
        <div className="flex aspect-video w-full max-w-xs items-center justify-center rounded-md border border-dashed border-chrome/30 text-fog">
          <ImageIcon className="h-6 w-6" />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => void handleFileSelected(event)}
      />
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={buttonClassName}
        >
          {uploading ? "Caricamento…" : label}
        </button>
        <p className="text-xs text-fog">
          JPEG, PNG o WEBP, max {Math.round(maxSizeBytes / (1024 * 1024))} MB
        </p>
      </div>
    </div>
  );
}
