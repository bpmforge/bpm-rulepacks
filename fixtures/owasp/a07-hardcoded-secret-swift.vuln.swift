import Foundation

struct APIConfig {
    static let apiKey = "sk_live_51H8x9KZvB2n4gT7pQmR3sYw"
    let password: String = "SuperSecretPass123!"
}

func connect() {
    let authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    print(authToken)
}
