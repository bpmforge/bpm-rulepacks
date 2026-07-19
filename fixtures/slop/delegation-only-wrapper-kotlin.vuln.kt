package com.example.svc

class Dep {
    fun close(): Boolean = true
}

// Wrapper adds a type and a call frame for zero behavior — close just
// forwards to dep.close with no transformation, validation, or error
// mapping.
class Wrapper(private val dep: Dep) {
    fun close(): Boolean {
        return dep.close()
    }
}
