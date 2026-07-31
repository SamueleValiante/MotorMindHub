package com.motormindhub.Api.service.storage;

import com.motormindhub.Api.service.storage.exception.CloudStorageNonDisponibileException;
import org.springframework.web.multipart.MultipartFile;

/**
 * Astrazione dal provider concreto di Cloud Storage (SDD 3.2, pattern Strategy/Adapter): usata da
 * GestioneUtenti (foto profilo) e GestioneArticoli (immagine di copertina), entrambi sottosistemi
 * diversi - vive quindi qui, non annidata sotto il /specific di uno dei due (ODD 2 corretto di
 * conseguenza), cosi' come CloudinaryStorageService non e' la sola implementazione futuribile: il
 * contratto e' pensato per restare stabile se in futuro si aggiungesse un secondo provider (es. S3),
 * senza impatti su GestioneUtenti/GestioneArticoli.
 *
 * Nessuna validazione di formato/dimensione/contenuto qui dentro (cfr. ImageUploadValidator): e'
 * identica a prescindere dal provider, quindi non deve essere duplicata in ogni implementazione
 * Strategy - upload() riceve un file gia' validato dal chiamante.
 */
public interface CloudStorageService {

    /**
     * Carica il file nella cartella indicata e ne restituisce l'URL pubblico. La cartella
     * distingue i namespace logici (es. "profili", "copertine-articoli") senza che il chiamante
     * debba conoscere concetti specifici del provider (folder Cloudinary, key prefix S3, ...).
     */
    String upload(MultipartFile file, String folder) throws CloudStorageNonDisponibileException;

    /**
     * Elimina il file identificato dall'URL restituito da upload(). Best-effort: se l'URL non
     * appartiene a questo provider (es. un valore inserito manualmente prima dell'introduzione
     * dell'upload reale) o l'eliminazione fallisce lato provider, l'implementazione logga e non
     * propaga l'errore - non deve mai far fallire l'operazione applicativa (es. updateProfile) che
     * la invoca come effetto collaterale di sostituzione di un'immagine.
     */
    void delete(String url);
}
