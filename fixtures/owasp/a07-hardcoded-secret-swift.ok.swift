import Foundation

struct APIConfig {
    static let apiKey = ProcessInfo.processInfo.environment["API_KEY"] ?? ""
    let password: String = KeychainService.shared.readPassword()
}

func connect() {
    let authToken = TokenStore.shared.currentToken()
    print(authToken)
}
