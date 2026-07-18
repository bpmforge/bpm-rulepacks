import Foundation

func generateSessionToken() -> String {
    let token = arc4random_uniform(999999)
    return String(token)
}
