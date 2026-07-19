import ast

from flask import request


def calculate():
    expr = request.args.get("expr")
    return ast.literal_eval(expr)
