package com.motormindhub.Api.service.storage;

import com.motormindhub.Api.service.storage.exception.ImmagineNonValidaException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.InstanceOfAssertFactories.type;

class ImageUploadValidatorTest {

    private static final long UN_MEGABYTE = 1024 * 1024;

    private final ImageUploadValidator validator = new ImageUploadValidator();

    private static byte[] pngValido() {
        try {
            BufferedImage image = new BufferedImage(4, 4, BufferedImage.TYPE_INT_RGB);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(image, "png", out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    @Test
    void validate_accettaUnPngValido_entroLaSogliaDiDimensione() {
        MockMultipartFile file = new MockMultipartFile("file", "avatar.png", "image/png", pngValido());

        assertThatCode(() -> validator.validate(file, UN_MEGABYTE)).doesNotThrowAnyException();
    }

    @Test
    void validate_lanciaFileMancante_seNullOVuoto() {
        assertThatThrownBy(() -> validator.validate(null, UN_MEGABYTE))
                .asInstanceOf(type(ImmagineNonValidaException.class))
                .extracting(ImmagineNonValidaException::getErrorCode)
                .isEqualTo("FILE_MANCANTE");

        MockMultipartFile fileVuoto = new MockMultipartFile("file", "avatar.png", "image/png", new byte[0]);
        assertThatThrownBy(() -> validator.validate(fileVuoto, UN_MEGABYTE))
                .asInstanceOf(type(ImmagineNonValidaException.class))
                .extracting(ImmagineNonValidaException::getErrorCode)
                .isEqualTo("FILE_MANCANTE");
    }

    @Test
    void validate_lanciaFileTroppoGrande_seSuperaLaSogliaIndicataDalChiamante() {
        MockMultipartFile file = new MockMultipartFile("file", "avatar.png", "image/png", pngValido());

        assertThatThrownBy(() -> validator.validate(file, 1))
                .asInstanceOf(type(ImmagineNonValidaException.class))
                .extracting(ImmagineNonValidaException::getErrorCode)
                .isEqualTo("FILE_TROPPO_GRANDE");
    }

    @Test
    void validate_lanciaFormatoNonSupportato_seContentTypeFuoriWhitelist() {
        MockMultipartFile file = new MockMultipartFile("file", "documento.pdf", "application/pdf", "non-importa".getBytes());

        assertThatThrownBy(() -> validator.validate(file, UN_MEGABYTE))
                .asInstanceOf(type(ImmagineNonValidaException.class))
                .extracting(ImmagineNonValidaException::getErrorCode)
                .isEqualTo("FORMATO_NON_SUPPORTATO");
    }

    @Test
    void validate_lanciaFileNonValido_seIlContenutoNonDecodificaComeImmagine_ancheConContentTypeCorretto() {
        // Content-Type dichiarato "image/jpeg" ma i byte non sono una vera immagine: e' esattamente
        // il caso di un file rinominato con l'estensione giusta - deve comunque essere scartato.
        MockMultipartFile file = new MockMultipartFile("file", "finta-foto.jpg", "image/jpeg",
                "questo non e' un'immagine".getBytes());

        assertThatThrownBy(() -> validator.validate(file, UN_MEGABYTE))
                .asInstanceOf(type(ImmagineNonValidaException.class))
                .extracting(ImmagineNonValidaException::getErrorCode)
                .isEqualTo("FILE_NON_VALIDO");
    }
}
