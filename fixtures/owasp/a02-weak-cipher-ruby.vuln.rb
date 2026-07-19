class LegacyEncryptor
  def encrypt(data, key)
    cipher = OpenSSL::Cipher.new("DES-EDE3-CBC")
    cipher.encrypt
    cipher.key = key
    cipher.update(data) + cipher.final
  end
end
