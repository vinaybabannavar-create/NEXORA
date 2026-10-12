from django.db import connection
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Customer,
    Department,
    Employee,
    Project,
    Document,
    SupportTicket,
    Task,
)

from .serializers import (
    CustomerSerializer,
    DepartmentSerializer,
    EmployeeSerializer,
    ProjectSerializer,
    DocumentSerializer,
    SupportTicketSerializer,
    TaskSerializer,
)


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        database = "ok"

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception:
            database = "error"

        return Response(
            {
                "service": "nexora-django",
                "status": (
                    "ok"
                    if database == "ok"
                    else "degraded"
                ),
                "database": database,
            }
        )


class EmployeeListCreateView(generics.ListCreateAPIView):
    queryset = Employee.objects.select_related(
        "department"
    ).all()

    serializer_class = EmployeeSerializer


class EmployeeDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = Employee.objects.select_related(
        "department"
    ).all()

    serializer_class = EmployeeSerializer


class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all()

    serializer_class = DepartmentSerializer


class DepartmentDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = Department.objects.all()

    serializer_class = DepartmentSerializer


class CustomerListCreateView(generics.ListCreateAPIView):
    queryset = Customer.objects.all()

    serializer_class = CustomerSerializer


class CustomerDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = Customer.objects.all()

    serializer_class = CustomerSerializer


class SupportTicketListCreateView(
    generics.ListCreateAPIView
):
    queryset = SupportTicket.objects.select_related(
        "customer",
        "assigned_employee",
    ).all()

    serializer_class = SupportTicketSerializer


class SupportTicketDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = SupportTicket.objects.select_related(
        "customer",
        "assigned_employee",
    ).all()

    serializer_class = SupportTicketSerializer


class ProjectListCreateView(generics.ListCreateAPIView):
    queryset = Project.objects.select_related(
        "customer",
        "project_manager",
    ).all()

    serializer_class = ProjectSerializer


class ProjectDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = Project.objects.select_related(
        "customer",
        "project_manager",
    ).all()

    serializer_class = ProjectSerializer


class TaskListCreateView(generics.ListCreateAPIView):
    queryset = Task.objects.select_related(
        "project",
        "assigned_to",
    ).all()

    serializer_class = TaskSerializer


class TaskDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = Task.objects.select_related(
        "project",
        "assigned_to",
    ).all()

    serializer_class = TaskSerializer

class DocumentListCreateView(generics.ListCreateAPIView):
    queryset = Document.objects.select_related(
        "project",
        "customer",
        "uploaded_by",
    ).all()

    serializer_class = DocumentSerializer

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Document.objects.select_related(
        "project",
        "customer",
        "uploaded_by",
    ).all()

    serializer_class = DocumentSerializer