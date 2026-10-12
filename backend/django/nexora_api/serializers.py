from django.utils import timezone
from rest_framework import serializers

from .models import (
    Customer,
    Department,
    Document,
    Employee,
    Project,
    SupportTicket,
    Task,
)


class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
    )

    class Meta:
        model = Employee
        fields = [
            "id",
            "employee_id",
            "first_name",
            "last_name",
            "email",
            "department",
            "department_name",
            "job_title",
            "phone_number",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "department_name",
            "created_at",
            "updated_at",
        ]


class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.IntegerField(
        source="employees.count",
        read_only=True,
    )

    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "code",
            "description",
            "department_head",
            "is_active",
            "employee_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "employee_count",
            "created_at",
            "updated_at",
        ]


class CustomerSerializer(serializers.ModelSerializer):
    plan_tier_display = serializers.CharField(
        source="get_plan_tier_display",
        read_only=True,
    )

    class Meta:
        model = Customer
        fields = [
            "id",
            "company_name",
            "contact_name",
            "email",
            "phone_number",
            "region",
            "plan_tier",
            "plan_tier_display",
            "contract_start_date",
            "contract_end_date",
            "nps_score",
            "monthly_usage",
            "device_count",
            "support_ticket_count",
            "is_active",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "plan_tier_display",
            "created_at",
            "updated_at",
        ]

    def validate_nps_score(self, value):
        if value is not None and not 0 <= value <= 10:
            raise serializers.ValidationError(
                "NPS score must be between 0 and 10."
            )

        return value

    def validate_contract_end_date(self, value):
        start_date = self.initial_data.get("contract_start_date")

        if start_date and value:
            if str(value) < str(start_date):
                raise serializers.ValidationError(
                    "Contract end date cannot be before the start date."
                )

        return value


class SupportTicketSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.company_name",
        read_only=True,
    )

    assigned_employee_name = serializers.SerializerMethodField()

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    priority_display = serializers.CharField(
        source="get_priority_display",
        read_only=True,
    )

    category_display = serializers.CharField(
        source="get_category_display",
        read_only=True,
    )

    class Meta:
        model = SupportTicket

        fields = [
            "id",
            "ticket_number",
            "customer",
            "customer_name",
            "subject",
            "description",
            "category",
            "category_display",
            "priority",
            "priority_display",
            "status",
            "status_display",
            "assigned_employee",
            "assigned_employee_name",
            "due_date",
            "resolved_at",
            "customer_satisfaction",
            "internal_notes",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "ticket_number",
            "customer_name",
            "assigned_employee_name",
            "status_display",
            "priority_display",
            "category_display",
            "created_at",
            "updated_at",
        ]

    def get_assigned_employee_name(self, obj):
        if not obj.assigned_employee:
            return None

        employee = obj.assigned_employee

        return f"{employee.first_name} {employee.last_name}".strip()

    def validate_customer_satisfaction(self, value):
        if value is not None and not 1 <= value <= 5:
            raise serializers.ValidationError(
                "Customer satisfaction must be between 1 and 5."
            )

        return value

    def validate(self, attrs):
        due_date = attrs.get(
            "due_date",
            getattr(self.instance, "due_date", None),
        )

        status = attrs.get(
            "status",
            getattr(
                self.instance,
                "status",
                SupportTicket.STATUS_OPEN,
            ),
        )

        if status in [
            SupportTicket.STATUS_RESOLVED,
            SupportTicket.STATUS_CLOSED,
        ]:
            if not self.instance or not self.instance.resolved_at:
                attrs["resolved_at"] = timezone.now()

        if due_date and due_date < timezone.localdate():
            raise serializers.ValidationError(
                {
                    "due_date": "Due date cannot be in the past."
                }
            )

        return attrs


class ProjectSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.company_name",
        read_only=True,
    )

    project_manager_name = serializers.SerializerMethodField()

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    priority_display = serializers.CharField(
        source="get_priority_display",
        read_only=True,
    )

    task_count = serializers.IntegerField(
        source="tasks.count",
        read_only=True,
    )

    completed_task_count = serializers.SerializerMethodField()

    class Meta:
        model = Project

        fields = [
            "id",
            "project_code",
            "name",
            "customer",
            "customer_name",
            "project_manager",
            "project_manager_name",
            "description",
            "status",
            "status_display",
            "priority",
            "priority_display",
            "start_date",
            "end_date",
            "budget",
            "progress",
            "task_count",
            "completed_task_count",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "customer_name",
            "project_manager_name",
            "status_display",
            "priority_display",
            "task_count",
            "completed_task_count",
            "created_at",
            "updated_at",
        ]

    def get_project_manager_name(self, obj):
        if not obj.project_manager:
            return None

        manager = obj.project_manager

        full_name = f"{manager.first_name} {manager.last_name}".strip()

        if full_name:
            return full_name

        return manager.email

    def get_completed_task_count(self, obj):
        return obj.tasks.filter(
            status=Task.STATUS_COMPLETED
        ).count()

    def validate_project_code(self, value):
        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                "Project code cannot be empty."
            )

        return value

    def validate_progress(self, value):
        if not 0 <= value <= 100:
            raise serializers.ValidationError(
                "Progress must be between 0 and 100."
            )

        return value

    def validate_budget(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Budget cannot be negative."
            )

        return value

    def validate(self, attrs):
        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None),
        )

        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None),
        )

        status = attrs.get(
            "status",
            getattr(
                self.instance,
                "status",
                Project.STATUS_PLANNING,
            ),
        )

        progress = attrs.get(
            "progress",
            getattr(self.instance, "progress", 0),
        )

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {
                    "end_date": (
                        "Project end date cannot be "
                        "before the start date."
                    )
                }
            )

        if status == Project.STATUS_COMPLETED and progress < 100:
            raise serializers.ValidationError(
                {
                    "progress": (
                        "Completed projects must have "
                        "100% progress."
                    )
                }
            )

        return attrs


class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(
        source="project.name",
        read_only=True,
    )

    project_code = serializers.CharField(
        source="project.project_code",
        read_only=True,
    )

    assigned_employee_name = serializers.SerializerMethodField()

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    priority_display = serializers.CharField(
        source="get_priority_display",
        read_only=True,
    )

    class Meta:
        model = Task

        fields = [
            "id",
            "task_code",
            "project",
            "project_name",
            "project_code",
            "title",
            "description",
            "assigned_to",
            "assigned_employee_name",
            "status",
            "status_display",
            "priority",
            "priority_display",
            "due_date",
            "estimated_hours",
            "actual_hours",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "project_name",
            "project_code",
            "assigned_employee_name",
            "status_display",
            "priority_display",
            "created_at",
            "updated_at",
        ]

    def get_assigned_employee_name(self, obj):
        if not obj.assigned_to:
            return None

        employee = obj.assigned_to

        return f"{employee.first_name} {employee.last_name}".strip()

    def validate_task_code(self, value):
        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                "Task code cannot be empty."
            )

        return value

    def validate_estimated_hours(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Estimated hours cannot be negative."
            )

        return value

    def validate_actual_hours(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Actual hours cannot be negative."
            )

        return value

    def validate(self, attrs):
        due_date = attrs.get(
            "due_date",
            getattr(self.instance, "due_date", None),
        )

        project = attrs.get(
            "project",
            getattr(self.instance, "project", None),
        )

        if (
            due_date
            and project
            and project.end_date
            and due_date > project.end_date
        ):
            raise serializers.ValidationError(
                {
                    "due_date": (
                        "Task due date cannot be after "
                        "the project end date."
                    )
                }
            )

        return attrs

class DocumentSerializer(serializers.ModelSerializer):
    document_type_display = serializers.CharField(
        source="get_document_type_display",
        read_only=True,
    )

    category_display = serializers.CharField(
        source="get_category_display",
        read_only=True,
    )

    project_name = serializers.CharField(
        source="project.name",
        read_only=True,
    )

    customer_name = serializers.CharField(
        source="customer.company_name",
        read_only=True,
    )

    uploaded_by_name = serializers.SerializerMethodField()

    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document

        fields = [
            "id",
            "document_code",
            "title",
            "description",
            "file",
            "file_url",
            "document_type",
            "document_type_display",
            "category",
            "category_display",
            "project",
            "project_name",
            "customer",
            "customer_name",
            "uploaded_by",
            "uploaded_by_name",
            "file_size",
            "file_extension",
            "version",
            "is_public",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "file_url",
            "project_name",
            "customer_name",
            "uploaded_by_name",
            "file_size",
            "file_extension",
            "created_at",
            "updated_at",
        ]

    def get_uploaded_by_name(self, obj):
        if not obj.uploaded_by:
            return None

        user = obj.uploaded_by

        full_name = (
            f"{user.first_name} {user.last_name}"
        ).strip()

        return full_name or user.email

    def get_file_url(self, obj):
        if not obj.file:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(
                obj.file.url
            )

        return obj.file.url