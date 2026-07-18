import javax.crypto.Cipher
import java.security.Key

fun encrypt(data: ByteArray, key: Key): ByteArray {
    val cipher = Cipher.getInstance("DES/ECB/PKCS5Padding")
    cipher.init(Cipher.ENCRYPT_MODE, key)
    return cipher.doFinal(data)
}
