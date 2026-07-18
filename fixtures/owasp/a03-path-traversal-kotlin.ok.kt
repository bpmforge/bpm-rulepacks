import android.content.Intent
import java.io.File

fun readAttachedFile(intent: Intent) {
    val name = intent.getStringExtra("fileName")
    val safePath = when (name) {
        "report" -> "/data/data/app/files/report.txt"
        "log" -> "/data/data/app/files/log.txt"
        else -> "/data/data/app/files/default.txt"
    }
    val f = File(safePath)
    f.readText()
}
