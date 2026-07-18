from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def submit_form(request):
    return handle(request)
