import yaml


def load_config(raw):
    return yaml.safe_load(raw)
