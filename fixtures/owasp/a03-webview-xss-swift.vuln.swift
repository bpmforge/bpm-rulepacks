import WebKit

func renderGreeting(webView: WKWebView, components: URLComponents) {
    let name = components.queryItems?.first(where: { $0.name == "name" })?.value ?? ""
    let html = "<html><body>Hello \(name)</body></html>"
    webView.loadHTMLString(html, baseURL: nil)
}
