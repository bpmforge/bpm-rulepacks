class User < ApplicationRecord
  def self.hash_password(password)
    Digest::MD5.hexdigest(password)
  end
end
