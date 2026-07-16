import requests


def fetch_internal(url):
    return requests.get(url, verify=True, timeout=5)
