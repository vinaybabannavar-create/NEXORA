from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    ordering = ("email",)

    list_display = (
        "email",
        "employee_id",
        "first_name",
        "last_name",
        "role",
        "department",
        "is_active",
        "is_staff",
    )

    list_filter = (
        "role",
        "department",
        "is_active",
        "is_staff",
    )

    search_fields = (
        "email",
        "employee_id",
        "first_name",
        "last_name",
    )

    readonly_fields = (
        "id",
        "date_joined",
        "updated_at",
        "last_login",
    )

    fieldsets = (
        (
            "Account",
            {
                "fields": (
                    "id",
                    "email",
                    "password",
                )
            },
        ),
        (
            "Personal Information",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "employee_id",
                    "phone_number",
                )
            },
        ),
        (
            "Organization",
            {
                "fields": (
                    "role",
                    "department",
                    "job_title",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (
            "Important Dates",
            {
                "fields": (
                    "last_login",
                    "date_joined",
                    "updated_at",
                )
            },
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "first_name",
                    "last_name",
                    "employee_id",
                    "role",
                    "department",
                    "job_title",
                    "phone_number",
                    "is_active",
                    "is_staff",
                ),
            },
        ),
    )