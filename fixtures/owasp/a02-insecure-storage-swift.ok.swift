import Foundation

func saveTheme(_ theme: String) {
    UserDefaults.standard.set(theme, forKey: "appTheme")
}
