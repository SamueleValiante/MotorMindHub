package com.motormindhub.Api.utility;

import java.time.Instant;

/** I quattro istanti di inizio periodo (giorno/settimana/mese/anno) calcolati da ConfiniPeriodoCalculator. */
public record ConfiniPeriodo(Instant inizioGiorno, Instant inizioSettimana, Instant inizioMese, Instant inizioAnno) {
}
