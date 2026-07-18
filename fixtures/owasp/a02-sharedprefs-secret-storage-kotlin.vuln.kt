import android.content.SharedPreferences

fun saveCredentials(prefs: SharedPreferences, authToken: String) {
    prefs.edit().putString("auth_token", authToken).apply()
}
