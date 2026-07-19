def get_user_orders(user_id):
    try:
        return db.query(user_id)
    except Exception as e:
        logger.error("query failed for %s: %s", user_id, e)
        raise
