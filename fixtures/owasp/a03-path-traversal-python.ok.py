import os

from flask import request
from werkzeug.utils import secure_filename


def read_report():
    filename = secure_filename(request.args.get("filename"))
    path = os.path.join("/var/reports", filename)
    with open(path) as f:
        return f.read()
