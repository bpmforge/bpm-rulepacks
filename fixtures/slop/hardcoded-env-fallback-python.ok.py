import os

PORT = os.getenv("PORT", "3000")

API_TOKEN = os.environ.get("API_TOKEN")
if not API_TOKEN:
    raise RuntimeError("API_TOKEN is required")
