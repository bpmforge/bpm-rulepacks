package com.example.net;

import java.util.List;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;

public class SecureHttpClient {

    public void useDefaultVerification(HttpsURLConnection conn) {
        // Delegate to the JDK's own hostname verifier instead of stubbing
        // one out — it performs real RFC 2818/6125 hostname matching.
        HostnameVerifier defaultVerifier = HttpsURLConnection.getDefaultHostnameVerifier();
        conn.setHostnameVerifier(defaultVerifier);
    }

    // A method that happens to be named "verify" and can legitimately
    // return true is fine as long as it isn't an unconditional TLS
    // trust-everything stub — this checks a real allowlist.
    public boolean verify(String hostname, List<String> pinnedHosts) {
        return pinnedHosts.contains(hostname);
    }
}
