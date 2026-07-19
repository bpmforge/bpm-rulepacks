from flask import request


def calculate():
    expr = request.args.get("expr")
    return eval(expr)
