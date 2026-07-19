def process_all(items):
    results = []
    for item in items:
        try:
            results.append(transform(item))
        except Exception as e:
            results.append(None)
    return results
