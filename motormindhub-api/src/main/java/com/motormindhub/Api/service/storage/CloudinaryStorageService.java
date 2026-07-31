package com.motormindhub.Api.service.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.motormindhub.Api.service.storage.exception.CloudStorageNonDisponibileException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Unica implementazione reale di CloudStorageService oggi (provider scelto: Cloudinary). Il client
 * Cloudinary e' costruito e validato in CloudinaryConfig (fail-fast se le credenziali mancano),
 * iniettato qui gia' pronto - questa classe non conosce ne' legge le proprieta' di configurazione.
 */
@Service
public class CloudinaryStorageService implements CloudStorageService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryStorageService.class);

    // Estrae il public_id (incluso l'eventuale prefisso di folder) da un secure_url standard
    // Cloudinary: https://res.cloudinary.com/<cloud>/image/upload/v<versione>/<folder>/<public_id>.<ext>
    // Il public_id e' esattamente il segmento tra "/v<versione>/" e l'estensione finale.
    private static final Pattern PUBLIC_ID_PATTERN = Pattern.compile(".*/upload/v\\d+/(.+)\\.[a-zA-Z0-9]+$");

    private final Cloudinary cloudinary;

    public CloudinaryStorageService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @Override
    public String upload(MultipartFile file, String folder) {
        try {
            Map<String, Object> options = ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image");
            Map<?, ?> risultato = cloudinary.uploader().upload(file.getBytes(), options);
            return (String) risultato.get("secure_url");
        } catch (IOException e) {
            throw new CloudStorageNonDisponibileException(
                    "Upload verso il servizio di archiviazione non riuscito.", e);
        }
    }

    /**
     * Best-effort (cfr. CloudStorageService): un url che non rispetta il formato Cloudinary (es.
     * inserito manualmente prima dell'introduzione dell'upload reale) o un errore lato provider non
     * fanno fallire il chiamante, solo un log.
     */
    @Override
    public void delete(String url) {
        if (url == null || url.isBlank()) {
            return;
        }

        Matcher matcher = PUBLIC_ID_PATTERN.matcher(url);
        if (!matcher.matches()) {
            log.debug("URL non riconosciuto come asset Cloudinary, eliminazione saltata: {}", url);
            return;
        }

        String publicId = matcher.group(1);
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            log.warn("Eliminazione dell'asset Cloudinary '{}' non riuscita", publicId, e);
        }
    }
}
