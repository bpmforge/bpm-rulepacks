def process(data):
    # Validates then transforms; order matters because transform assumes
    # normalized field names produced by validate().
    validate(data)
    transform(data)
