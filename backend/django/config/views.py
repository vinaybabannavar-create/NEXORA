
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Count
from django.shortcuts import render

from nexora_accounts.models import User
from nexora_api.models import (
    Customer,
    Department,
    Employee,
    Project,
    Document,
    SupportTicket,
)


@staff_member_required
def admin_dashboard(request):
    context = {
        "total_users": User.objects.count(),
        "active_users": User.objects.filter(is_active=True).count(),
        "total_customers": Customer.objects.count(),
        "total_departments": Department.objects.count(),
        "total_employees": Employee.objects.count(),
        "active_employees": Employee.objects.filter(is_active=True).count(),
        "total_projects": Project.objects.count(),
        "total_documents": Document.objects.count(),
        "total_support_tickets": SupportTicket.objects.count(),
    }

    context["department_stats"] = Department.objects.annotate(
        staff_count=Count("employees")
    ).order_by("-staff_count")[:5]

    return render(request, "admin_dashboard.html", context)
