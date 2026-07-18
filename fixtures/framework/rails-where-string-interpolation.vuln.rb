class User < ApplicationRecord
  def self.search(name)
    where("name = '#{name}'")
  end
end
