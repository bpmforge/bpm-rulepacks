package com.example.svc

import java.io.IOException

class ConfigLoader {
    // loadConfig swallows a read failure: the empty catch drops the
    // exception with no caller notification.
    fun loadConfig(path: String): String? {
        var result: String? = null
        try {
            result = java.io.File(path).readText()
        } catch (e: IOException) {
        }
        return result
    }
}
