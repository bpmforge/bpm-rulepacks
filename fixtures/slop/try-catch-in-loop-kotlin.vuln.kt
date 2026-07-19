package com.example.svc

import java.io.IOException

class BatchProcessor {
    // processAll wraps a try/catch around every iteration instead of
    // validating up front or wrapping the whole loop.
    fun processAll(paths: List<String>): List<String> {
        val out = mutableListOf<String>()
        for (path in paths) {
            try {
                out.add(java.io.File(path).readText())
            } catch (e: IOException) {
                out.add("")
            }
        }
        return out
    }
}
