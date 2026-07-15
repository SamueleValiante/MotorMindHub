package com.motormindhub.Api.service.gestioneArticoli;

import com.motormindhub.Api.events.CategoriaEliminataEvent;
import com.motormindhub.Api.model.entity.Categoria;
import com.motormindhub.Api.model.repository.ArticoloRepository;
import com.motormindhub.Api.model.repository.CategoriaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoriaEliminataListenerTest {

    @Mock
    private ArticoloRepository articoloRepository;
    @Mock
    private CategoriaRepository categoriaRepository;

    private CategoriaEliminataListener listener;

    @BeforeEach
    void setUp() {
        listener = new CategoriaEliminataListener(articoloRepository, categoriaRepository);
    }

    @Test
    void onCategoriaEliminata_riassegnaGliArticoliOrfaniAllaDestinazione() {
        Categoria destinazione = new Categoria("Motori Termici", "descrizione", null);
        ReflectionTestUtils.setField(destinazione, "id", 2L);
        when(categoriaRepository.getReferenceById(2L)).thenReturn(destinazione);

        listener.onCategoriaEliminata(new CategoriaEliminataEvent(1L, 2L));

        verify(articoloRepository).riassegnaCategoria(1L, destinazione);
    }
}
