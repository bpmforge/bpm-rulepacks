def compute(request):
    expr = request.POST.get("expr")
    return eval(expr)
