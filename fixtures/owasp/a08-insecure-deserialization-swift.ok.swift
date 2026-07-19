import Foundation

func loadProfile(from data: Data) throws -> UserProfile? {
    return try NSKeyedUnarchiver.unarchivedObject(ofClass: UserProfile.self, from: data)
}

func decode(data: Data) throws -> UserProfile {
    let unarchiver = try NSKeyedUnarchiver(forReadingFrom: data)
    unarchiver.requiresSecureCoding = true
    let profile = unarchiver.decodeObject(of: UserProfile.self, forKey: "profile")!
    unarchiver.finishDecoding()
    return profile
}
