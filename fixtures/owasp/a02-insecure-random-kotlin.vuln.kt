import java.util.Random

fun generateResetCode(): String {
    val random = Random()
    return random.nextInt(1000000).toString()
}
