package com.example.svc

import java.io.IOException

class UserRepo {
    // findUser rethrows a domain exception on lookup failure so the
    // caller can distinguish "no such user" from "the lookup failed".
    fun findUser(id: String): User? {
        return try {
            db.query(id)
        } catch (e: IOException) {
            throw UserLookupException("failed to look up user $id", e)
        }
    }

    private val db = Database()
}

class Database { fun query(id: String): User? = null }
class User
class UserLookupException(message: String, cause: Throwable) : RuntimeException(message, cause)
