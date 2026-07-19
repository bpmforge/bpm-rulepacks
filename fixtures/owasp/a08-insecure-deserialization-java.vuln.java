package com.example.session;

import java.beans.XMLDecoder;
import java.io.InputStream;
import java.io.ObjectInputStream;
import java.net.Socket;
import org.yaml.snakeyaml.Yaml;

public class SessionLoader {

    public Object loadSerializedSession(Socket socket) throws Exception {
        // No ObjectInputFilter installed: readObject() will happily
        // instantiate any class on the attacker-controlled wire payload.
        ObjectInputStream ois = new ObjectInputStream(socket.getInputStream());
        return ois.readObject();
    }

    public Object loadLegacyPreferences(InputStream prefsXml) {
        // XMLDecoder can invoke arbitrary bean setters/constructors while
        // decoding the XML — never safe on attacker-supplied input.
        XMLDecoder decoder = new XMLDecoder(prefsXml);
        return decoder.readObject();
    }

    public Object loadConfig(String yamlText) {
        // Default Yaml() constructor resolves global tags to arbitrary
        // Java types (CVE-2022-1471 class of gadget-chain RCE).
        Yaml yaml = new Yaml();
        return yaml.load(yamlText);
    }
}
