/**
 * Immagini di test generate in memoria (nessun fixture binario committato):
 * i buffer "troppo grandi" e quello a formato non supportato non hanno
 * bisogno di essere immagini reali - ImageUploadValidator controlla
 * dimensione e Content-Type PRIMA di decodificare il contenuto
 * (ImageIO.read), quindi un buffer riempito con byte arbitrari basta a
 * esercitare quei due percorsi di errore. Solo il caso di successo deve
 * essere un'immagine vera e decodificabile.
 */

// PNG 4x4 rosso pieno, generato con Pillow e verificato contro
// javax.imageio.ImageIO.read (lo stesso decoder usato da
// ImageUploadValidator) - un 1x1 "well-known" trovato in giro non basta:
// ImageIO e' piu' severo dei browser sui PNG minimali/malformati.
const VALID_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGP8z4AATAxEcQAz0QEHOoQ+uAAAAABJRU5ErkJggg==";

export function validPng(): { name: string; mimeType: string; buffer: Buffer } {
  return {
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(VALID_PNG_BASE64, "base64"),
  };
}

/** Supera il ceiling globale servlet (6MB, spring.servlet.multipart.max-file-size) -> 413. */
export function oversizedImage(): { name: string; mimeType: string; buffer: Buffer } {
  return {
    name: "troppo-grande.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(7 * 1024 * 1024, 0),
  };
}

/** Sotto il ceiling globale (6MB) ma sopra il limite applicativo della foto profilo (2MB) -> 400. */
export function overAvatarLimitImage(): { name: string; mimeType: string; buffer: Buffer } {
  return {
    name: "troppo-grande-per-avatar.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(3 * 1024 * 1024, 0),
  };
}

/** Content-Type fuori whitelist (JPEG/PNG/WEBP) -> 400 FORMATO_NON_SUPPORTATO. */
export function unsupportedFormatFile(): { name: string; mimeType: string; buffer: Buffer } {
  return {
    name: "documento.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("non è un'immagine"),
  };
}
