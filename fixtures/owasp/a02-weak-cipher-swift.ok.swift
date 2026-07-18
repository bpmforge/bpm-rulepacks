import CommonCrypto

func encrypt(data: Data, key: Data, iv: Data) -> [UInt8] {
    var buffer = [UInt8](repeating: 0, count: data.count + kCCBlockSizeAES128)
    var bytesWritten = 0
    _ = key.withUnsafeBytes { keyBytes in
        data.withUnsafeBytes { dataBytes in
            CCCrypt(CCOperation(kCCEncrypt),
                    CCAlgorithm(kCCAlgorithmAES),
                    CCOptions(kCCOptionPKCS7Padding),
                    keyBytes.baseAddress, key.count,
                    nil,
                    dataBytes.baseAddress, data.count,
                    &buffer, buffer.count, &bytesWritten)
        }
    }
    return buffer
}
