import pickle


def load_session(raw_cookie):
    return pickle.loads(raw_cookie)
