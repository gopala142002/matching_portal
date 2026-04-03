from django.shortcuts import render
from django.db import connection

def paper_reviewer_table(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT paper_id, researcher_id FROM paper_to_reviewer")
        rows = cursor.fetchall()

    data = [
        {"paper_id": row[0], "researcher_id": row[1]}
        for row in rows
    ]

    return render(request, "table.html", {"data": data})