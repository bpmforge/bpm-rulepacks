import requests


def fetch_internal(url):
    return requests.get(url, verify=False, timeout=5)
