import Security
import Foundation

func saveSecret(_ data: Data) {
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
        kSecValueData as String: data
    ]
    SecItemAdd(query as CFDictionary, nil)
}
