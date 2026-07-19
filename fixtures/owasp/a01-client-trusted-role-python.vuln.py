from flask import request


def admin_dashboard():
    if request.form.get("is_admin"):
        return render_admin_panel()
    return "forbidden", 403
