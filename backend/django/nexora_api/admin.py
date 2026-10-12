from django.contrib import admin

from .models import Customer, Department, Employee

from .models import (
    Customer,
    Department,
    Document,
    Employee,
    Project,
    SupportTicket,
    Task,
)

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "department_head",
        "is_active",
        "employee_count",
        "created_at",
    )

    list_filter = ("is_active",)

    search_fields = (
        "name",
        "code",
        "department_head",
    )

    ordering = ("name",)

    readonly_fields = (
        "employee_count",
        "created_at",
        "updated_at",
    )

    fields = (
        "name",
        "code",
        "description",
        "department_head",
        "is_active",
        "employee_count",
        "created_at",
        "updated_at",
    )

    def employee_count(self, obj):
        return obj.employees.count()

    employee_count.short_description = "Employees"


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        "employee_id",
        "first_name",
        "last_name",
        "email",
        "department",
        "job_title",
        "is_active",
    )

    list_filter = (
        "department",
        "is_active",
    )

    search_fields = (
        "employee_id",
        "first_name",
        "last_name",
        "email",
        "job_title",
    )

    ordering = ("employee_id",)


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = (
        "company_name",
        "contact_name",
        "email",
        "region",
        "plan_tier",
        "nps_score",
        "is_active",
        "created_at",
    )

    list_filter = (
        "plan_tier",
        "region",
        "is_active",
    )

    search_fields = (
        "company_name",
        "contact_name",
        "email",
        "phone_number",
        "region",
    )

    ordering = ("company_name",)

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            "Customer Information",
            {
                "fields": (
                    "company_name",
                    "contact_name",
                    "email",
                    "phone_number",
                    "region",
                )
            },
        ),
        (
            "Subscription",
            {
                "fields": (
                    "plan_tier",
                    "contract_start_date",
                    "contract_end_date",
                )
            },
        ),
        (
            "Customer Analytics",
            {
                "fields": (
                    "nps_score",
                    "monthly_usage",
                    "device_count",
                    "support_ticket_count",
                )
            },
        ),
        (
            "Status & Notes",
            {
                "fields": (
                    "is_active",
                    "notes",
                )
            },
        ),
        (
            "System Information",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )