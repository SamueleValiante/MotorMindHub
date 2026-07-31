package com.motormindhub.Api.web;

/** Risposta di un endpoint di upload: l'URL del file caricato su Cloud Storage. */
public record UploadResponseDTO(String url) {
}
