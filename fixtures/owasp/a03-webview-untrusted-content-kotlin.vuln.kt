import android.webkit.WebView

fun render(webView: WebView, serverHtml: String) {
    webView.loadData(serverHtml, "text/html", "UTF-8")
}
