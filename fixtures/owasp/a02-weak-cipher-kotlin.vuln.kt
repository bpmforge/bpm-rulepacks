import javax.crypto.Cipher
import java.security.Key

fun encrypt(data: ByteArray, key: Key): ByteArray {
    // AES is a strong cipher, but ECB mode encrypts each block
    // independently — identical plaintext blocks produce identical
    // ciphertext blocks regardless of key strength.
    val cipher = Cipher.getInstance("AES/ECB/PKCS5Padding")
    cipher.init(Cipher.ENCRYPT_MODE, key)
    return cipher.doFinal(data)
}
