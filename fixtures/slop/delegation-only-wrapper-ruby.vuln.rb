class UserService
  def get_user(user_id, include_deleted)
    @repository.get_user(user_id, include_deleted)
  end
end
