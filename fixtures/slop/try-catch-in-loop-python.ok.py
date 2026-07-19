def process_all(items):
    results = []
    try:
        for item in items:
            results.append(transform(item))
    except Exception as e:
        logger.error("transform failed: %s", e)
        raise
    return results
