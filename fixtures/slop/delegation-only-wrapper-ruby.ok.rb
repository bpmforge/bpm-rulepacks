class UserService
  def get_user(user_id, include_deleted)
    user = @repository.get_user(user_id, include_deleted)
    raise UserNotFoundError, user_id if user.nil?
    user
  end
end

class OrderService
  extend Forwardable
  def_delegator :@repository, :find_order

  delegate :find_order, to: :repository
end
