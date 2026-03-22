from django.contrib import admin
from django.urls import path, include  

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/files/", include("files.urls")),
    path("api/papers/", include("papers.urls")),
    path("api/reviewers/", include("reviewers.urls")),
    path("api/paperassign/",include("paperAssign.urls")),
    path("api/data/",include("data.urls"))
]