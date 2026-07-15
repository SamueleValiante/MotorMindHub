package com.motormindhub.Api.service.gestioneArticoli.dto;

/**
 * Opzioni di ordinamento di "Esplora Articoli" (mockup 02_esplora_articoli.png). IN_EVIDENZA non ha
 * un campo editoriale dedicato nel modello dei dati (RAD 3.4.4 non lo prevede): come
 * semplificazione, viene trattato come sinonimo di PIU_LETTI (proxy ragionevole di "rilevanza").
 */
public enum OrdinamentoArticoli {
    PIU_RECENTI,
    PIU_LETTI,
    IN_EVIDENZA
}
