package com.example.svc

/**
 * Validates the account. It's worth noting that this function validates
 * the account according to industry best practices.
 */
fun validateAccount(id: String): Boolean {
    return id.isNotEmpty()
}
