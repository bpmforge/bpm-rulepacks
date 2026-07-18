import android.database.sqlite.SQLiteDatabase

fun findUser(db: SQLiteDatabase, userId: String) {
    db.rawQuery("SELECT * FROM users WHERE id = ?", arrayOf(userId))
}
