from django.contrib.auth.models import User


def search_users(request):
    name_filter = request.GET.get("name")
    return User.objects.raw(f"SELECT * FROM auth_user WHERE username = '{name_filter}'")
