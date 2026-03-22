from django.contrib import admin
from papers.models import Paper, PaperMetadata

admin.site.register(Paper)
admin.site.register(PaperMetadata)
