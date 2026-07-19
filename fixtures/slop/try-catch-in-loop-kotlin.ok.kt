package com.example.svc

import java.io.IOException

class BatchProcessor {
    // processAll validates paths before the loop, then wraps the whole
    // loop in a single try/catch instead of one per iteration.
    fun processAll(paths: List<String>): List<String> {
        val out = mutableListOf<String>()
        try {
            for (path in paths) {
                out.add(java.io.File(path).readText())
            }
        } catch (e: IOException) {
            throw BatchReadException("failed reading batch", e)
        }
        return out
    }
}

class BatchReadException(message: String, cause: Throwable) : RuntimeException(message, cause)
