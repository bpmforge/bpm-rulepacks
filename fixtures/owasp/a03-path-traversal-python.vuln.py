from flask import request


def read_report():
    filename = request.args.get("filename")
    path = "/var/reports/" + filename
    with open(path) as f:
        return f.read()
