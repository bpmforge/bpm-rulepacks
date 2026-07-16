import json


def load_session(raw_cookie):
    return json.loads(raw_cookie)
