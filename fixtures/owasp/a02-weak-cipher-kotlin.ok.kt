import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import java.security.Key

fun encrypt(data: ByteArray, key: Key, iv: ByteArray): ByteArray {
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(128, iv))
    return cipher.doFinal(data)
}
