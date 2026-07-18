import android.webkit.WebView

fun setup(webView: WebView) {
    webView.addJavascriptInterface(JsBridge(), "Android")
}
