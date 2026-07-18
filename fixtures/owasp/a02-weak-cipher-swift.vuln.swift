import CommonCrypto

func encryptLegacy(data: Data, key: Data) -> [UInt8] {
    var buffer = [UInt8](repeating: 0, count: data.count + kCCBlockSizeDES)
    var bytesWritten = 0
    _ = key.withUnsafeBytes { keyBytes in
        data.withUnsafeBytes { dataBytes in
            CCCrypt(CCOperation(kCCEncrypt),
                    CCAlgorithm(kCCAlgorithmDES),
                    CCOptions(kCCOptionECBMode),
                    keyBytes.baseAddress, key.count,
                    nil,
                    dataBytes.baseAddress, data.count,
                    &buffer, buffer.count, &bytesWritten)
        }
    }
    return buffer
}
