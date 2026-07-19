package com.example.svc

/**
 * Reports whether id is a non-empty account identifier.
 */
fun validateAccount(id: String): Boolean {
    return id.isNotEmpty()
}
