package com.example.session

import java.io.ObjectInputStream
import java.net.Socket

class SessionLoader {

    fun loadSerializedSession(socket: Socket): Any {
        // No ObjectInputFilter installed: readObject() will happily
        // instantiate any class on the attacker-controlled wire payload.
        val ois = ObjectInputStream(socket.getInputStream())
        return ois.readObject()
    }
}
