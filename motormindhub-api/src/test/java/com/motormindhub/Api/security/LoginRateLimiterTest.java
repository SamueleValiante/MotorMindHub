package com.motormindhub.Api.security;

import com.motormindhub.Api.security.exception.TroppiTentativiLoginException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;

class LoginRateLimiterTest {

    @Test
    void consenteFinoAllaSogliaConfigurata_poiSollevaEccezione() {
        LoginRateLimiter limiter = new LoginRateLimiter(3);

        assertThatCode(() -> {
            limiter.checkAndConsume("utente@example.com");
            limiter.checkAndConsume("utente@example.com");
            limiter.checkAndConsume("utente@example.com");
        }).doesNotThrowAnyException();

        assertThatThrownBy(() -> limiter.checkAndConsume("utente@example.com"))
                .isInstanceOf(TroppiTentativiLoginException.class);
    }

    @Test
    void ogniEmailHaUnBucketIndipendente() {
        LoginRateLimiter limiter = new LoginRateLimiter(1);

        assertThatCode(() -> limiter.checkAndConsume("prima@example.com")).doesNotThrowAnyException();
        assertThatThrownBy(() -> limiter.checkAndConsume("prima@example.com"))
                .isInstanceOf(TroppiTentativiLoginException.class);

        // Email diversa: bucket separato, non ancora esaurito.
        assertThatCode(() -> limiter.checkAndConsume("seconda@example.com")).doesNotThrowAnyException();
    }

    @Test
    void chiaveEmail_ignoraMaiuscoleMinuscoleESpazi() {
        LoginRateLimiter limiter = new LoginRateLimiter(1);

        assertThatCode(() -> limiter.checkAndConsume("Utente@Example.com")).doesNotThrowAnyException();

        // Stessa email, case/spazi diversi: deve contare sullo stesso bucket, gia' esaurito.
        assertThatThrownBy(() -> limiter.checkAndConsume(" utente@example.com "))
                .isInstanceOf(TroppiTentativiLoginException.class);
    }
}
