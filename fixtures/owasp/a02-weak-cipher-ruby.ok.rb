class ModernEncryptor
  def encrypt(data, key)
    cipher = OpenSSL::Cipher.new("aes-256-gcm")
    cipher.encrypt
    cipher.key = key
    cipher.iv = cipher.random_iv
    cipher.update(data) + cipher.final
  end
end
