import java.security.MessageDigest

fun hashPassword(password: String): ByteArray {
    val md = MessageDigest.getInstance("MD5")
    return md.digest(password.toByteArray())
}
