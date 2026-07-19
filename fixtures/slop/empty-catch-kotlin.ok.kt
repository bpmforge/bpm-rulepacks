package com.example.svc

import java.io.IOException

class ConfigLoader {
    // loadConfig logs the failure with context and rethrows a domain
    // exception so the caller can react to it.
    fun loadConfig(path: String): String {
        return try {
            java.io.File(path).readText()
        } catch (e: IOException) {
            logger.warn("failed to read config at $path", e)
            throw ConfigLoadException("could not load config: $path", e)
        }
    }

    private val logger = org.slf4j.LoggerFactory.getLogger(ConfigLoader::class.java)
}

class ConfigLoadException(message: String, cause: Throwable) : RuntimeException(message, cause)
