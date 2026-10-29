def get_user_orders(user_id):
    try:
        return db.query(user_id)
    except Exception as e:
        logger.error("query failed for %s: %s", user_id, e)
        raise


# A NARROW except for the one expected miss, returning None, is the
# find-or-None contract: the caller asked "is there one?" and None answers
# it. 20 of 23 saleor hits were this (Model.DoesNotExist, ValueError).
def get_user(user_id):
    try:
        return User.objects.get(pk=user_id, is_active=True)
    except User.DoesNotExist:
        return None


def parse_uuid(value):
    try:
        return UUID(value, version=4)
    except ValueError:
        return None
