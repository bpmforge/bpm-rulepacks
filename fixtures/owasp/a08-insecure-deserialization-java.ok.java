package com.example.session;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ObjectInputFilter;
import java.io.ObjectInputStream;
import java.net.Socket;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;

public class SessionLoader {

    public Object loadSerializedSession(Socket socket) throws Exception {
        // JEP 290 allowlist: only SessionData may be reconstructed, every
        // other type (including gadget-chain classes) is rejected.
        ObjectInputFilter filter = ObjectInputFilter.Config.createFilter(
            "com.example.session.SessionData;!*");
        ObjectInputStream ois = new ObjectInputStream(socket.getInputStream());
        ois.setObjectInputFilter(filter);
        return ois.readObject();
    }

    public AppPreferences loadLegacyPreferences(String prefsJson) throws Exception {
        // Data-only Jackson binding to a fixed, known type instead of
        // XMLDecoder's arbitrary bean-graph reconstruction.
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(prefsJson, AppPreferences.class);
    }

    public Object loadConfig(String yamlText) {
        // SafeConstructor restricts YAML loading to plain Java types
        // (no arbitrary class instantiation via global tags).
        Yaml yaml = new Yaml(new SafeConstructor());
        return yaml.load(yamlText);
    }

    static class AppPreferences {
        public String theme;
    }

    static class SessionData {
        public String userId;
    }
}
