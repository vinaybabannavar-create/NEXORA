from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from unfold.admin import ModelAdmin
from unfold.decorators import display
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import User


@admin.register(User)
class CustomUserAdmin(ModelAdmin, UserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm
    ordering = ("email",)

    list_display = (
        "display_email",
        "employee_id",
        "first_name",
        "last_name",
        "display_role",
        "department",
        "display_active",
        "display_staff",
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

    @display(description="Email", header=True)
    def display_email(self, instance: User):
        full_name = f"{instance.first_name} {instance.last_name}".strip()
        if instance.first_name or instance.last_name:
            initials = f"{instance.first_name[:1]}{instance.last_name[:1]}".upper()
        else:
            initials = instance.email[:2].upper() if instance.email else "??"
        return [
            instance.email,
            full_name or instance.employee_id or "",
            initials,
        ]

    @display(
        description="Role",
        label={
            User.Role.ADMIN: "danger",
            User.Role.MANAGER: "warning",
            User.Role.EMPLOYEE: "info",
        },
    )
    def display_role(self, instance: User):
        return instance.role

    @display(description="Is Active", boolean=True)
    def display_active(self, instance: User):
        return instance.is_active

    @display(description="Is Staff", boolean=True)
    def display_staff(self, instance: User):
        return instance.is_staff

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