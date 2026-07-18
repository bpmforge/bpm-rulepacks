import android.content.Intent
import java.io.File

fun readAttachedFile(intent: Intent) {
    val path = intent.getStringExtra("filePath")
    val f = File(path)
    f.readText()
}
