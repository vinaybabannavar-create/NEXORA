from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("nexora_accounts.urls")),
    path("api/", include("nexora_api.urls")),
]
