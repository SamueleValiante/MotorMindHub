package com.motormindhub.Api.service.gestioneArticoli;

import com.motormindhub.Api.events.CategoriaEliminataEvent;
import com.motormindhub.Api.model.entity.Categoria;
import com.motormindhub.Api.model.repository.ArticoloRepository;
import com.motormindhub.Api.model.repository.CategoriaRepository;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reagisce a CategoriaEliminataEvent (pubblicato da GestioneCategorie.deleteCategory, ODD 2.3) per
 * riassegnare gli articoli orfani alla categoria di destinazione (RF3.5, UC_13). Non e' un listener
 * di notifica come quelli di GestioneNotifiche (SDD 3.5): resta volutamente sincrono (nessun
 * @Async), perche' deve eseguire nella stessa transazione della cancellazione della categoria -
 * altrimenti il vincolo di integrita' referenziale articoli.categoria_id verrebbe violato nella
 * finestra tra la pubblicazione dell'evento e la sua elaborazione asincrona.
 */
@Component
public class CategoriaEliminataListener {

    private final ArticoloRepository articoloRepository;
    private final CategoriaRepository categoriaRepository;

    public CategoriaEliminataListener(ArticoloRepository articoloRepository, CategoriaRepository categoriaRepository) {
        this.articoloRepository = articoloRepository;
        this.categoriaRepository = categoriaRepository;
    }

    @EventListener
    @Transactional
    public void onCategoriaEliminata(CategoriaEliminataEvent evento) {
        // La categoria di destinazione e' gia' stata validata da GestioneCategorie prima di
        // pubblicare l'evento: getReferenceById evita una SELECT superflua.
        Categoria destinazione = categoriaRepository.getReferenceById(evento.categoriaDestinazioneId());
        articoloRepository.riassegnaCategoria(evento.categoriaEliminataId(), destinazione);
    }
}
