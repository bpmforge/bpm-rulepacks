from django.db.models.expressions import RawSQL


def annotate_by_status(queryset, status_code):
    return queryset.annotate(
        status=RawSQL("SELECT status FROM statuses WHERE code = %s", [status_code])
    )
