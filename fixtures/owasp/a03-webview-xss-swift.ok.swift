import WebKit

func renderGreeting(webView: WKWebView, components: URLComponents, nameLabel: UILabel) {
    let name = components.queryItems?.first(where: { $0.name == "name" })?.value ?? ""
    nameLabel.text = name
    let html = "<html><body>Welcome</body></html>"
    webView.loadHTMLString(html, baseURL: nil)
}
