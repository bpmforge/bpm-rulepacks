import CryptoKit
import CommonCrypto

struct PasswordHasher {

    func hash(_ password: String) -> String {
        let digest = Insecure.MD5.hash(data: Data(password.utf8))
        return digest.map { String(format: "%02x", $0) }.joined()
    }

    func legacyChecksum(_ data: Data) -> [UInt8] {
        var digest = [UInt8](repeating: 0, count: Int(CC_SHA1_DIGEST_LENGTH))
        _ = data.withUnsafeBytes { CC_SHA1($0.baseAddress, CC_LONG(data.count), &digest) }
        return digest
    }
}
