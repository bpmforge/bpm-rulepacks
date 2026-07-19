def get_user(user_id, include_deleted):
    user = repository.get_user(user_id, include_deleted)
    if user is None:
        raise UserNotFoundError(user_id)
    return user
