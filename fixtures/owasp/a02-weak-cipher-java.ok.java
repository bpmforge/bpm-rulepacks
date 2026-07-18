package com.example.crypto;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;

public class ModernEncryptor {

    public byte[] encrypt(SecretKey key, byte[] plaintext) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        return cipher.doFinal(plaintext);
    }
}
