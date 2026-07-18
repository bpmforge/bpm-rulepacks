import Foundation

func readFile(components: URLComponents) -> Data? {
    let filename = components.queryItems?.first(where: { $0.name == "file" })?.value ?? ""
    let allowedFile: String
    switch filename {
    case "readme": allowedFile = "readme.txt"
    case "license": allowedFile = "license.txt"
    default: allowedFile = "readme.txt"
    }
    let path = NSHomeDirectory() + "/Documents/" + allowedFile
    return FileManager.default.contents(atPath: path)
}
