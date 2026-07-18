import android.webkit.WebView

fun setup(webView: WebView) {
    webView.settings.javaScriptEnabled = true
    webView.settings.allowFileAccess = false
}
