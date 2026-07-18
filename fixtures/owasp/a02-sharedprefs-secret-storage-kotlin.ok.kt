import android.content.SharedPreferences

fun saveThemePreference(prefs: SharedPreferences, theme: String) {
    prefs.edit().putString("theme", theme).apply()
}
