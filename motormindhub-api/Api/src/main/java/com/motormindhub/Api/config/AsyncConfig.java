package com.motormindhub.Api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Abilita l'esecuzione asincrona di GestioneNotifiche.on...(evt) (ODD 2.6, SDD 3.5): i listener di
 * notifica devono girare fuori dal thread/transazione del sottosistema che pubblica l'evento (a
 * differenza di CategoriaEliminataListener, che resta volutamente sincrono - vedi la sua javadoc).
 */
@Configuration
@EnableAsync
public class AsyncConfig {
}
