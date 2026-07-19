from flask import request
from flask_login import current_user


def admin_dashboard():
    if current_user.is_authenticated and current_user.role == "admin":
        return render_admin_panel()
    return "forbidden", 403
