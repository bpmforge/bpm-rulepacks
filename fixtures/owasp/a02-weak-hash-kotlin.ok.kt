import java.security.MessageDigest

fun hashPassword(password: String): ByteArray {
    val md = MessageDigest.getInstance("SHA-256")
    return md.digest(password.toByteArray())
}
