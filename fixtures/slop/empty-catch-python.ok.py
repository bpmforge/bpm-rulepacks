import logging

logger = logging.getLogger(__name__)

def load_config(path):
    try:
        with open(path) as f:
            return f.read()
    except OSError as err:
        logger.error("failed to load config %s: %s", path, err)
        raise
