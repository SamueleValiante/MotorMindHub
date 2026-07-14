package com.motormindhub.Api.security;

import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Adapter tra {@link Utente} e Spring Security. Il ruolo viene mappato su una singola
 * GrantedAuthority "ROLE_&lt;ruolo&gt;" (SDD 3.4), coerente con la progressione cumulativa di
 * privilegi definita nel RAD - le regole di ereditarieta' tra ruoli sono espresse nelle
 * annotazioni @PreAuthorize dei singoli endpoint, non qui.
 */
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String passwordHash;
    private final StatoUtente stato;
    private final Collection<GrantedAuthority> authorities;

    public UserPrincipal(Utente utente) {
        this.id = utente.getId();
        this.email = utente.getEmail();
        this.passwordHash = utente.getPasswordHash();
        this.stato = utente.getStato();
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + utente.getRuolo().name()));
    }

    public Long getId() {
        return id;
    }

    @Override
    public Collection<GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return stato != StatoUtente.SOSPESO;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return stato == StatoUtente.ATTIVO;
    }
}
