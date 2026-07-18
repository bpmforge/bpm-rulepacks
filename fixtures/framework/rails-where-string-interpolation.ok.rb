class User < ApplicationRecord
  def self.search(name)
    where("name = ?", name)
  end

  def self.search_by_hash(name)
    where(name: name)
  end
end
