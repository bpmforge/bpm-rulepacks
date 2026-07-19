def load_config(path):
    try:
        with open(path) as f:
            return f.read()
    except:
        pass
