from django.contrib.auth.models import User


def search_users(request):
    name_filter = request.GET.get("name")
    return User.objects.raw(
        "SELECT * FROM auth_user WHERE username = %s", [name_filter]
    )
