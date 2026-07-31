package com.motormindhub.Api.service.storage;

import com.motormindhub.Api.service.storage.exception.ImmagineNonValidaException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.io.IOException;
import java.util.Locale;
import java.util.Set;

/**
 * Validazione condivisa tra GestioneUtenti e GestioneArticoli, indipendente dal provider di Cloud
 * Storage (per questo vive qui e non in CloudinaryStorageService: e' identica qualunque sia
 * l'implementazione di CloudStorageService, non va duplicata se in futuro se ne aggiunge una
 * seconda). La dimensione massima e' l'unico parametro lasciato al chiamante, perche' varia per
 * scopo (foto profilo vs copertina articolo); whitelist MIME e verifica del contenuto sono invece
 * fisse, stesso rischio per entrambi gli usi.
 *
 * Il Content-Type dichiarato dal client (MultipartFile.getContentType()) e' un header HTTP
 * arbitrario, falsificabile: usato solo come filtro veloce, non come prova che il file sia
 * un'immagine. La verifica autoritativa e' ImageIO.read(...) sui byte reali - se non decodifica
 * un'immagine valida, il file viene scartato indipendentemente da nome/estensione/Content-Type
 * dichiarati, cosi' un eseguibile o uno script rinominato "foto.jpg" non supera comunque il
 * controllo.
 */
@Component
public class ImageUploadValidator {

    private static final Set<String> MIME_AMMESSI = Set.of("image/jpeg", "image/png", "image/webp");

    public void validate(MultipartFile file, long dimensioneMassimaBytes) {
        if (file == null || file.isEmpty()) {
            throw new ImmagineNonValidaException("Nessun file caricato.", "FILE_MANCANTE");
        }

        if (file.getSize() > dimensioneMassimaBytes) {
            throw new ImmagineNonValidaException(
                    "Il file supera la dimensione massima consentita (%d MB)."
                            .formatted(dimensioneMassimaBytes / (1024 * 1024)),
                    "FILE_TROPPO_GRANDE");
        }

        String contentType = file.getContentType();
        if (contentType == null || !MIME_AMMESSI.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new ImmagineNonValidaException(
                    "Formato non supportato. Sono ammessi solo immagini JPEG, PNG o WEBP.",
                    "FORMATO_NON_SUPPORTATO");
        }

        try {
            if (ImageIO.read(file.getInputStream()) == null) {
                throw new ImmagineNonValidaException(
                        "Il file caricato non e' un'immagine valida.", "FILE_NON_VALIDO");
            }
        } catch (IOException e) {
            throw new ImmagineNonValidaException(
                    "Il file caricato non e' un'immagine valida.", "FILE_NON_VALIDO");
        }
    }
}
