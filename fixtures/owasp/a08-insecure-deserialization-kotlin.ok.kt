package com.example.session

import java.io.ObjectInputFilter
import java.io.ObjectInputStream
import java.net.Socket

class SessionLoader {

    fun loadSerializedSession(socket: Socket): Any {
        // JEP 290 allowlist: only SessionData may be reconstructed, every
        // other type (including gadget-chain classes) is rejected.
        val filter = ObjectInputFilter.Config.createFilter(
            "com.example.session.SessionData;!*"
        )
        val ois = ObjectInputStream(socket.getInputStream())
        ois.setObjectInputFilter(filter)
        return ois.readObject()
    }

    class SessionData(val userId: String)
}
