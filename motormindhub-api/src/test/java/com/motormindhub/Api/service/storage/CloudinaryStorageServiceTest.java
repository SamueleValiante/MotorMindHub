package com.motormindhub.Api.service.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.motormindhub.Api.service.storage.exception.CloudStorageNonDisponibileException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Unica implementazione reale di CloudStorageService (SDD 3.2): SDK Cloudinary mockato, nessuna chiamata di rete. */
@ExtendWith(MockitoExtension.class)
class CloudinaryStorageServiceTest {

    @Mock
    private Cloudinary cloudinary;
    @Mock
    private Uploader uploader;

    private CloudinaryStorageService service() {
        return new CloudinaryStorageService(cloudinary);
    }

    @Test
    void upload_ritornaSecureUrlDallaRispostaDelProvider() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(), anyMap())).thenReturn(Map.of(
                "secure_url", "https://res.cloudinary.com/demo/image/upload/v123/profili/abc123.jpg",
                "public_id", "profili/abc123"));

        MockMultipartFile file = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", "contenuto-finto".getBytes());

        String url = service().upload(file, "profili");

        assertThat(url).isEqualTo("https://res.cloudinary.com/demo/image/upload/v123/profili/abc123.jpg");
    }

    @Test
    void upload_lanciaCloudStorageNonDisponibile_seIlProviderRifiutaLaRichiesta() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(), anyMap())).thenThrow(new IOException("rete non raggiungibile"));

        MockMultipartFile file = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", "contenuto-finto".getBytes());

        assertThatThrownBy(() -> service().upload(file, "profili"))
                .isInstanceOf(CloudStorageNonDisponibileException.class);
    }

    @Test
    void delete_estraeIlPublicIdDallUrlEChiamaDestroy() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);

        service().delete("https://res.cloudinary.com/demo/image/upload/v1234567890/profili/abc123.jpg");

        verify(uploader).destroy(eq("profili/abc123"), anyMap());
    }

    @Test
    void delete_estraeIlPublicIdConSottocartelle() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);

        service().delete("https://res.cloudinary.com/demo/image/upload/v42/copertine-articoli/xyz-789.png");

        verify(uploader).destroy(eq("copertine-articoli/xyz-789"), anyMap());
    }

    @Test
    void delete_nonChiamaIlProvider_seUrlNonERiconosciutoComeAssetCloudinary() {
        service().delete("https://esempio-esterno.it/una/immagine/incollata/a/mano.jpg");

        verify(cloudinary, never()).uploader();
    }

    @Test
    void delete_nonChiamaIlProvider_seUrlENulloOVuoto() {
        assertThatCode(() -> service().delete(null)).doesNotThrowAnyException();
        assertThatCode(() -> service().delete("")).doesNotThrowAnyException();

        verify(cloudinary, never()).uploader();
    }

    @Test
    void delete_nonPropagaLEccezione_seDestroyFallisceLatoProvider() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.destroy(any(), anyMap())).thenThrow(new IOException("provider non raggiungibile"));

        assertThatCode(() -> service().delete("https://res.cloudinary.com/demo/image/upload/v1/profili/abc.jpg"))
                .doesNotThrowAnyException();
    }
}
