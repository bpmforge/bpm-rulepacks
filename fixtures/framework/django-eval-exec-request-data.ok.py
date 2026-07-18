import ast


def compute(request):
    expr = request.POST.get("expr")
    return ast.literal_eval(expr)
