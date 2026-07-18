from django.utils.safestring import mark_safe


def render_comment(comment):
    body = comment.body
    return mark_safe(body)
