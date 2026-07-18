import java.security.cert.CertificateException
import java.security.cert.X509Certificate
import javax.net.ssl.X509TrustManager

class PinnedTrustManager(private val pinnedCert: X509Certificate) : X509TrustManager {
    override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {
        if (chain.isEmpty() || chain[0] != pinnedCert) throw CertificateException("untrusted client cert")
    }
    override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {
        if (chain.isEmpty() || chain[0] != pinnedCert) throw CertificateException("untrusted server cert")
    }
    override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf(pinnedCert)
}
