import Security
import Foundation

func saveSecret(_ data: Data) {
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrAccessible as String: kSecAttrAccessibleAlways,
        kSecValueData as String: data
    ]
    SecItemAdd(query as CFDictionary, nil)
}
