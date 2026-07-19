class User < ApplicationRecord
  has_secure_password

  def self.hash_password(password)
    BCrypt::Password.create(password)
  end
end
