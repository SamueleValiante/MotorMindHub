package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifica con un DB reale (non un mock del repository) che UtenteRepository.search e
 * countByStatoNot escludano davvero gli account CANCELLATO (StatoUtente): una stringa JPQL puo'
 * essere sintatticamente valida e comunque avere una logica sbagliata, cosa che un test unitario che
 * mocka il repository non puo' rilevare (stesso principio del test end-to-end sul lockout).
 * @AutoConfigureTestDatabase(Replace.NONE): il progetto usa Postgres reale anche nei test, non un
 * DB embedded sostituito automaticamente da @DataJpaTest.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UtenteRepositoryTest {

    @Autowired
    private UtenteRepository utenteRepository;

    private Utente creaUtente(String email, StatoUtente stato) {
        Utente utente = new Utente("Test", "Repository", email, "hash", null, null, true, null);
        utente.setStato(stato);
        return utenteRepository.saveAndFlush(utente);
    }

    @Test
    void search_esclude_utentiCancellati_ancheSenzaFiltroDiStato() {
        creaUtente("attivo-repo-test@provider.it", StatoUtente.ATTIVO);
        Utente cancellato = creaUtente("cancellato-repo-test@provider.it", StatoUtente.CANCELLATO);

        List<Utente> risultati = utenteRepository.search(null, null);

        assertThat(risultati).extracting(Utente::getId).doesNotContain(cancellato.getId());
    }

    @Test
    void search_esclude_utenteCancellato_ancheSeIlFiltroTestualeLoIntercetterebbe() {
        Utente cancellato = creaUtente("match-univoco-xyz@provider.it", StatoUtente.CANCELLATO);

        List<Utente> risultati = utenteRepository.search("match-univoco-xyz", null);

        assertThat(risultati).extracting(Utente::getId).doesNotContain(cancellato.getId());
    }

    @Test
    void countByStatoNot_esclude_utentiCancellatiDalTotale() {
        long totalePrima = utenteRepository.countByStatoNot(StatoUtente.CANCELLATO);
        creaUtente("attivo-count-test@provider.it", StatoUtente.ATTIVO);
        creaUtente("cancellato-count-test@provider.it", StatoUtente.CANCELLATO);

        long totaleDopo = utenteRepository.countByStatoNot(StatoUtente.CANCELLATO);

        assertThat(totaleDopo).isEqualTo(totalePrima + 1);
    }
}
