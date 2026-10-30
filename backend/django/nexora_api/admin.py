from django.contrib import admin
from unfold.admin import ModelAdmin
from unfold.decorators import display

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
class DepartmentAdmin(ModelAdmin):
    list_display = (
        "display_name",
        "code",
        "department_head",
        "display_active",
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

    @display(description="Department", header=True)
    def display_name(self, instance: Department):
        initials = instance.code[:2].upper() if instance.code else instance.name[:2].upper()
        return [instance.name, instance.code or "", initials]

    @display(description="Active", boolean=True)
    def display_active(self, instance: Department):
        return instance.is_active

    def employee_count(self, obj):
        return obj.employees.count()

    employee_count.short_description = "Employees"


@admin.register(Employee)
class EmployeeAdmin(ModelAdmin):
    list_display = (
        "employee_id",
        "display_name",
        "email",
        "department",
        "job_title",
        "display_active",
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

    @display(description="Name", header=True)
    def display_name(self, instance: Employee):
        name = f"{instance.first_name} {instance.last_name}".strip()
        initials = f"{instance.first_name[:1]}{instance.last_name[:1]}".upper() if instance.first_name else "--"
        return [name, instance.email or instance.employee_id or "", initials]

    @display(description="Active", boolean=True)
    def display_active(self, instance: Employee):
        return instance.is_active


@admin.register(Customer)
class CustomerAdmin(ModelAdmin):
    list_display = (
        "display_company",
        "contact_name",
        "email",
        "display_region",
        "display_plan_tier",
        "display_nps",
        "display_active",
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

    @display(description="Company", header=True)
    def display_company(self, instance: Customer):
        initials = instance.company_name[:2].upper() if instance.company_name else "--"
        return [instance.company_name, instance.contact_name or "", initials]

    @display(
        description="Plan Tier",
        label={
            Customer.PLAN_ENTERPRISE: "danger",
            Customer.PLAN_PREMIUM: "warning",
            Customer.PLAN_STANDARD: "info",
            Customer.PLAN_BASIC: "default",
        },
    )
    def display_plan_tier(self, instance: Customer):
        return instance.plan_tier

    @display(description="Active", boolean=True)
    def display_active(self, instance: Customer):
        return instance.is_active

    @display(description="Region")
    def display_region(self, instance: Customer):
        return instance.region or "-"

    @display(description="NPS Score")
    def display_nps(self, instance: Customer):
        return instance.nps_score if instance.nps_score is not None else "-"

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