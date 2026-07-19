class SessionManager
  def generate_session_id
    session_token = rand(999_999_999)
    session_token
  end
end
