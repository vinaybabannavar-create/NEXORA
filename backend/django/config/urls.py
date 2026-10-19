
from django.contrib import admin
from django.urls import include, path

from .views import admin_dashboard

urlpatterns = [
    path("admin/", admin.site.urls),
    path("admin-dashboard/", admin_dashboard, name="admin_dashboard"),
    path("api/auth/", include("nexora_accounts.urls")),
    path("api/", include("nexora_api.urls")),
]
