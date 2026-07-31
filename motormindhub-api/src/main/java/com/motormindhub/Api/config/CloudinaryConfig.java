package com.motormindhub.Api.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Costruisce il client Cloudinary (SDD 3.2, CloudStorageService/CloudinaryStorageService). A
 * differenza di altri segreti applicativi (es. security.jwt.secret), qui non esiste un default
 * letterale in application.properties: un provider di storage mal configurato non deve avviarsi e
 * fallire in modo criptico al primo upload, deve far fallire l'avvio dell'applicazione con un
 * messaggio chiaro.
 */
@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary(@Value("${cloudinary.cloud-name}") String cloudName,
                                  @Value("${cloudinary.api-key}") String apiKey,
                                  @Value("${cloudinary.api-secret}") String apiSecret) {
        if (cloudName.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
            throw new IllegalStateException(
                    "Credenziali Cloudinary mancanti: valorizzare CLOUDINARY_CLOUD_NAME, "
                            + "CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.");
        }

        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true));
    }
}
