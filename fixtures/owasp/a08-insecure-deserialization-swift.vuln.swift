import Foundation

func loadProfile(from data: Data) -> Any? {
    return NSKeyedUnarchiver.unarchiveObject(with: data)
}

func loadCachedProfile(path: String) -> Any? {
    return NSKeyedUnarchiver.unarchiveObject(withFile: path)
}

func decode(data: Data) throws -> UserProfile {
    let unarchiver = try NSKeyedUnarchiver(forReadingFrom: data)
    unarchiver.requiresSecureCoding = false
    let profile = unarchiver.decodeObject(forKey: "profile") as! UserProfile
    unarchiver.finishDecoding()
    return profile
}
