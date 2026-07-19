class SessionManager
  def generate_session_id
    session_token = SecureRandom.hex(32)
    session_token
  end
end
