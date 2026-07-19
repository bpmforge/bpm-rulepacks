def get_user_orders(user_id):
    try:
        return db.query(user_id)
    except Exception as e:
        return []
