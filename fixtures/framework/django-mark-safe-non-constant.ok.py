from django.utils.safestring import mark_safe


def render_comment(comment):
    return mark_safe("<p>Static welcome message</p>")
