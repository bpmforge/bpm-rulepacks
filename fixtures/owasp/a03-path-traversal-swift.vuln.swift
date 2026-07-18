import Foundation

func readFile(components: URLComponents) -> Data? {
    let filename = components.queryItems?.first(where: { $0.name == "file" })?.value ?? ""
    let path = NSHomeDirectory() + "/Documents/" + filename
    return FileManager.default.contents(atPath: path)
}
