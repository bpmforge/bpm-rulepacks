import java.security.SecureRandom

fun generateResetCode(): String {
    val random = SecureRandom()
    return random.nextInt(1000000).toString()
}
