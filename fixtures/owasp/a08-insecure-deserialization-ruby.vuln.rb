class SessionStore
  def restore(raw_cookie)
    Marshal.load(raw_cookie)
  end
end
