from django.urls import path

from .views import (
    CustomerDetailView,
    CustomerListCreateView,
    DepartmentDetailView,
    DepartmentListCreateView,
    EmployeeDetailView,
    EmployeeListCreateView,
    HealthView,
    ProjectDetailView,
    ProjectListCreateView,
    SupportTicketDetailView,
    SupportTicketListCreateView,
    TaskDetailView,
    TaskListCreateView,
    DocumentDetailView,
    DocumentListCreateView,
)


urlpatterns = [
    # Health
    path(
        "health/",
        HealthView.as_view(),
        name="health",
    ),

    # Employees
    path(
        "employees/",
        EmployeeListCreateView.as_view(),
        name="employee-list-create",
    ),
    path(
        "employees/<int:pk>/",
        EmployeeDetailView.as_view(),
        name="employee-detail",
    ),

    # Departments
    path(
        "departments/",
        DepartmentListCreateView.as_view(),
        name="department-list-create",
    ),
    path(
        "departments/<int:pk>/",
        DepartmentDetailView.as_view(),
        name="department-detail",
    ),

    # Customers
    path(
        "customers/",
        CustomerListCreateView.as_view(),
        name="customer-list-create",
    ),
    path(
        "customers/<int:pk>/",
        CustomerDetailView.as_view(),
        name="customer-detail",
    ),

    # Support Tickets
    path(
        "support-tickets/",
        SupportTicketListCreateView.as_view(),
        name="support-ticket-list-create",
    ),
    path(
        "support-tickets/<int:pk>/",
        SupportTicketDetailView.as_view(),
        name="support-ticket-detail",
    ),

    # Projects
    path(
        "projects/",
        ProjectListCreateView.as_view(),
        name="project-list-create",
    ),
    path(
        "projects/<int:pk>/",
        ProjectDetailView.as_view(),
        name="project-detail",
    ),

    # Tasks
    path(
        "tasks/",
        TaskListCreateView.as_view(),
        name="task-list-create",
    ),
    path(
        "tasks/<int:pk>/",
        TaskDetailView.as_view(),
        name="task-detail",
    ),
    path(
    "documents/",
    DocumentListCreateView.as_view(),
    name="document-list-create",
),

path(
    "documents/<int:pk>/",
    DocumentDetailView.as_view(),
    name="document-detail",
),
]