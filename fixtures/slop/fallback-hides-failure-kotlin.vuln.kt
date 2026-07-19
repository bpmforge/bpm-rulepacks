package com.example.svc

import java.io.IOException

class UserRepo {
    // findUser masks a lookup failure: on error it returns null, which
    // looks identical to "no such user" instead of "the lookup failed".
    fun findUser(id: String): User? {
        return try {
            db.query(id)
        } catch (e: IOException) {
            null
        }
    }

    private val db = Database()
}

class Database { fun query(id: String): User? = null }
class User
