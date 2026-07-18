import Foundation

func saveAuthToken(_ token: String) {
    UserDefaults.standard.set(token, forKey: "authToken")
}
