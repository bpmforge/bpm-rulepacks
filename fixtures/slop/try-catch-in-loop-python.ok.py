def process_all(items):
    results = []
    try:
        for item in items:
            results.append(transform(item))
    except Exception as e:
        logger.error("transform failed: %s", e)
        raise
    return results


# A narrow except for the one expected miss is per-item handling, not a
# swallowed failure (saleor's bulk mutations collect ValidationErrors this way).
def clean_each(items, errors):
    for item in items:
        try:
            item.full_clean()
        except ValidationError as err:
            errors.append(err)


# A broad except that logs or re-raises still surfaces the failure.
def sync_all(accounts):
    for account in accounts:
        try:
            account.refresh()
        except Exception:
            logger.exception("refresh failed for %s", account.id)
    for account in accounts:
        try:
            account.save()
        except Exception as e:
            raise SyncError(account.id) from e
