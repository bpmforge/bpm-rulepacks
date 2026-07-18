from django.db.models.expressions import RawSQL


def annotate_by_status(queryset, status_column):
    sql = f"SELECT status FROM statuses WHERE code = {status_column}"
    return queryset.annotate(status=RawSQL(sql, []))
