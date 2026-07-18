import Foundation

func pingHost(components: URLComponents) {
    let hostParam = components.queryItems?.first(where: { $0.name == "host" })?.value ?? ""
    let allowedHost: String
    switch hostParam {
    case "internal-a": allowedHost = "10.0.0.1"
    case "internal-b": allowedHost = "10.0.0.2"
    default: allowedHost = "10.0.0.1"
    }
    let task = Process()
    task.launchPath = "/sbin/ping"
    task.arguments = ["-c", "1", allowedHost]
    try? task.run()
}
