package com.example.svc

interface Closeable {
    fun close(): Boolean
}

class Dep : Closeable {
    override fun close(): Boolean = true
}

// Idiomatic Kotlin interface delegation via `by` — the compiler generates
// the forwarding, this is not AI-generated slop, it's the language's own
// delegation feature and must not be flagged.
class DelegatingWrapper(dep: Dep) : Closeable by dep

// This wrapper adds a real null guard and wraps the failure in a domain
// exception, so it is not pure delegation.
class GuardedWrapper(private val dep: Dep?) {
    fun close(): Boolean {
        if (dep == null) {
            return false
        }
        return try {
            dep.close()
        } catch (e: Exception) {
            throw WrapperCloseException("failed to close dependency", e)
        }
    }
}

class WrapperCloseException(message: String, cause: Throwable) : RuntimeException(message, cause)
