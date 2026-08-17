package com.motormindhub.Api.utility;

import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Calcolo puro isolato dal wall-clock (ConfiniPeriodoCalculator.calcola accetta "oggi" invece di
 * chiamare LocalDate.now()), condiviso da GestioneAmministrazioneUtenti.getVisiteStatistiche (ODD
 * 2.5) e GestioneAutori.getStatisticheLetture (ODD 2.4): un solo set di casi limite copre entrambi i
 * chiamanti, non serve duplicarli per consumatore.
 */
class ConfiniPeriodoCalculatorTest {

    private static final ZoneId ROMA = ZoneId.of("Europe/Rome");

    @Test
    void calcola_calcolaICorrettiInizioPeriodo_casoBaseMetaSettimana() {
        var confini = ConfiniPeriodoCalculator.calcola(LocalDate.of(2026, 8, 12), ROMA);

        assertThat(confini.inizioGiorno()).isEqualTo(LocalDate.of(2026, 8, 12).atStartOfDay(ROMA).toInstant());
        assertThat(confini.inizioSettimana()).isEqualTo(LocalDate.of(2026, 8, 10).atStartOfDay(ROMA).toInstant());
        assertThat(confini.inizioMese()).isEqualTo(LocalDate.of(2026, 8, 1).atStartOfDay(ROMA).toInstant());
        assertThat(confini.inizioAnno()).isEqualTo(LocalDate.of(2026, 1, 1).atStartOfDay(ROMA).toInstant());
    }

    @Test
    void calcola_inizioSettimanaCoincideConOggi_quandoOggiELunedi() {
        LocalDate lunedi = LocalDate.of(2026, 8, 10);
        assertThat(lunedi.getDayOfWeek()).isEqualTo(DayOfWeek.MONDAY);

        var confini = ConfiniPeriodoCalculator.calcola(lunedi, ROMA);

        assertThat(confini.inizioSettimana()).isEqualTo(confini.inizioGiorno());
    }

    @Test
    void calcola_inizioMeseCoincideConOggi_quandoOggiEIlPrimoDelMese() {
        var confini = ConfiniPeriodoCalculator.calcola(LocalDate.of(2026, 8, 1), ROMA);

        assertThat(confini.inizioMese()).isEqualTo(confini.inizioGiorno());
    }

    @Test
    void calcola_inizioSettimanaRicadeNellAnnoPrecedente_quandoOggiEIl1GennaioDiGiovedi() {
        LocalDate primoGennaio = LocalDate.of(2026, 1, 1);
        assertThat(primoGennaio.getDayOfWeek()).isEqualTo(DayOfWeek.THURSDAY);

        var confini = ConfiniPeriodoCalculator.calcola(primoGennaio, ROMA);

        assertThat(confini.inizioAnno()).isEqualTo(confini.inizioGiorno()).isEqualTo(confini.inizioMese());
        assertThat(confini.inizioSettimana()).isEqualTo(LocalDate.of(2025, 12, 29).atStartOfDay(ROMA).toInstant());
    }

    @Test
    void calcola_gestisceCorrettamenteIlCambioOraLegale_inizioMarzo() {
        var prima = ConfiniPeriodoCalculator.calcola(LocalDate.of(2026, 3, 29), ROMA);
        var dopo = ConfiniPeriodoCalculator.calcola(LocalDate.of(2026, 3, 30), ROMA);

        // 29 marzo 2026, ultima domenica del mese: le lancette avanzano da 02:00 a 03:00, quel
        // giorno dura solo 23 ore in Europe/Rome.
        assertThat(Duration.between(prima.inizioGiorno(), dopo.inizioGiorno())).isEqualTo(Duration.ofHours(23));
    }

    @Test
    void calcola_gestisceCorrettamenteIlCambioOraSolare_fineOttobre() {
        var prima = ConfiniPeriodoCalculator.calcola(LocalDate.of(2026, 10, 25), ROMA);
        var dopo = ConfiniPeriodoCalculator.calcola(LocalDate.of(2026, 10, 26), ROMA);

        // 25 ottobre 2026, ultima domenica del mese: le lancette arretrano da 03:00 a 02:00, quel
        // giorno dura 25 ore in Europe/Rome.
        assertThat(Duration.between(prima.inizioGiorno(), dopo.inizioGiorno())).isEqualTo(Duration.ofHours(25));
    }
}
