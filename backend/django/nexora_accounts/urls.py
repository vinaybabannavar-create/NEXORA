from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    AdminOnlyView,
    CurrentUserView,
    ForgotPasswordView,
    LogoutView,
    ManagerOrAdminView,
    RegisterView,
    ResetPasswordView,
)

urlpatterns = [
    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),
    path(
        "login/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path(
        "refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path(
        "me/",
        CurrentUserView.as_view(),
        name="current_user",
    ),
    path(
        "logout/",
        LogoutView.as_view(),
        name="logout",
    ),
    path(
        "forgot-password/",
        ForgotPasswordView.as_view(),
        name="forgot_password",
    ),
    path(
        "reset-password/",
        ResetPasswordView.as_view(),
        name="reset_password",
    ),
    path(
        "admin-only/",
        AdminOnlyView.as_view(),
        name="admin_only",
    ),
    path(
        "manager-or-admin/",
        ManagerOrAdminView.as_view(),
        name="manager_or_admin",
    ),
]
