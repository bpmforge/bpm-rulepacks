import Foundation

func pingHost(components: URLComponents) {
    let hostParam = components.queryItems?.first(where: { $0.name == "host" })?.value ?? ""
    let cmd = "ping -c 1 \(hostParam)"
    let task = Process()
    task.launchPath = "/bin/sh"
    task.arguments = ["-c", cmd]
    try? task.run()
}
