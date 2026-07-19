class SessionStore
  def restore(raw_cookie)
    JSON.parse(raw_cookie)
  end
end
