package com.motormindhub.Api.utility;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;

/**
 * Calcolo puro (isolato dal wall-clock: accetta "oggi" invece di chiamare LocalDate.now(), cosi' da
 * essere testabile senza dipendere dall'istante di esecuzione del test) dei confini di periodo
 * calendario (giorno/settimana/mese/anno) usato dalle dashboard che aggregano "da inizio periodo
 * corrente" - non finestre mobili. Estratto da GestioneAmministrazioneUtenti (ODD 2.5,
 * getVisiteStatistiche) perche' riusato identico da GestioneAutori (ODD 2.4, getStatisticheLetture):
 * due punti che fanno esattamente lo stesso calcolo di boundary temporali, a differenza di altri casi
 * di query "andamento giornaliero" di questa sessione, dove ogni sottosistema ha volutamente la
 * propria copia di costanti come GIORNI_ANDAMENTO_MIN/MAX (poche righe, nessun rischio di divergenza
 * silenziosa) invece di un'astrazione condivisa. Settimana da lunedi' (TemporalAdjusters.previousOrSame:
 * resta "oggi" se oggi e' gia' lunedi').
 */
public final class ConfiniPeriodoCalculator {

    private ConfiniPeriodoCalculator() {
    }

    public static ConfiniPeriodo calcola(LocalDate oggi, ZoneId zona) {
        Instant inizioGiorno = oggi.atStartOfDay(zona).toInstant();
        Instant inizioSettimana = oggi.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay(zona).toInstant();
        Instant inizioMese = oggi.withDayOfMonth(1).atStartOfDay(zona).toInstant();
        Instant inizioAnno = oggi.withDayOfYear(1).atStartOfDay(zona).toInstant();
        return new ConfiniPeriodo(inizioGiorno, inizioSettimana, inizioMese, inizioAnno);
    }
}
