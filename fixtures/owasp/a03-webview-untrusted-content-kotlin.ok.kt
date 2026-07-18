import android.webkit.WebView

fun render(webView: WebView) {
    webView.loadData("<html><body>Static content</body></html>", "text/html", "UTF-8")
}
