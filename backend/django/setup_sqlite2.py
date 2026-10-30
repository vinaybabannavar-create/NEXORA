# -*- coding: utf-8 -*-
"""
Phase 2: Create users table and seed all data
"""
import os
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
os.environ["USE_SQLITE"] = "True"

import django
django.setup()

from django.db import connection

# Create users table
with connection.schema_editor() as schema_editor:
    from nexora_accounts.models import User
    try:
        schema_editor.create_model(User)
        print("Created users table")
    except Exception as e:
        print(f"Users table: {e}")

# Create superuser
from django.contrib.auth import get_user_model
User = get_user_model()

try:
    if not User.objects.filter(email="admin@nexora.com").exists():
        User.objects.create_superuser(
            email="admin@nexora.com",
            password="admin123",
            first_name="Admin",
            last_name="Nexora",
        )
        print("Superuser created: admin@nexora.com / admin123")
    else:
        print("Superuser already exists")
except Exception as e:
    print(f"Superuser error: {e}")

# Seed departments
from nexora_api.models import Department, Employee

dept_data = [
    {"name": "Engineering", "code": "ENG", "department_head": "Alice Morgan", "is_active": True, "description": "Software development team"},
    {"name": "Sales", "code": "SALES", "department_head": "Bob Chen", "is_active": True, "description": "Sales and partnerships"},
    {"name": "Customer Success", "code": "CS", "department_head": "Carol White", "is_active": True, "description": "Client onboarding and support"},
    {"name": "Product", "code": "PROD", "department_head": "David Kim", "is_active": True, "description": "Product strategy and design"},
    {"name": "Human Resources", "code": "HR", "department_head": "Eva Singh", "is_active": True, "description": "People operations"},
]

depts = {}
for d in dept_data:
    obj, created = Department.objects.get_or_create(code=d["code"], defaults=d)
    depts[d["code"]] = obj
    if created:
        print(f"  Dept: {d['name']}")

# Seed employees
emp_data = [
    {"employee_id": "EMP001", "first_name": "Alice", "last_name": "Morgan", "email": "alice.morgan@nexora.com", "department": depts["ENG"], "job_title": "Lead Engineer", "is_active": True},
    {"employee_id": "EMP002", "first_name": "Bob", "last_name": "Chen", "email": "bob.chen@nexora.com", "department": depts["SALES"], "job_title": "Sales Manager", "is_active": True},
    {"employee_id": "EMP003", "first_name": "Carol", "last_name": "White", "email": "carol.white@nexora.com", "department": depts["CS"], "job_title": "CS Lead", "is_active": True},
    {"employee_id": "EMP004", "first_name": "David", "last_name": "Kim", "email": "david.kim@nexora.com", "department": depts["PROD"], "job_title": "Product Manager", "is_active": True},
    {"employee_id": "EMP005", "first_name": "Eva", "last_name": "Singh", "email": "eva.singh@nexora.com", "department": depts["HR"], "job_title": "HR Director", "is_active": False},
    {"employee_id": "EMP006", "first_name": "James", "last_name": "Wilson", "email": "james.wilson@nexora.com", "department": depts["ENG"], "job_title": "Backend Engineer", "is_active": True},
    {"employee_id": "EMP007", "first_name": "Sophie", "last_name": "Turner", "email": "sophie.turner@nexora.com", "department": depts["SALES"], "job_title": "Account Executive", "is_active": True},
]

for e in emp_data:
    _, created = Employee.objects.get_or_create(employee_id=e["employee_id"], defaults=e)
    if created:
        print(f"  Employee: {e['first_name']} {e['last_name']}")

# Seed customers
try:
    from nexora_api.models import Customer
    customer_data = [
        {"company_name": "Acme Corporation", "contact_name": "John Smith", "email": "john.smith@acme.com", "phone_number": "+1 555-0101", "plan_tier": Customer.PLAN_ENTERPRISE, "region": "North America", "nps_score": 9, "monthly_usage": 94500.00, "device_count": 250, "support_ticket_count": 12, "is_active": True},
        {"company_name": "TechFlow Inc", "contact_name": "Sara Lee", "email": "sara.lee@techflow.com", "phone_number": "+44 20 7946 0958", "plan_tier": Customer.PLAN_PREMIUM, "region": "Europe", "nps_score": 8, "monthly_usage": 42000.00, "device_count": 120, "support_ticket_count": 5, "is_active": True},
        {"company_name": "BuildRight Ltd", "contact_name": "Mike Torres", "email": "mike.torres@buildright.com", "phone_number": "+61 2 9000 1234", "plan_tier": Customer.PLAN_STANDARD, "region": "Asia Pacific", "nps_score": 7, "monthly_usage": 18000.00, "device_count": 60, "support_ticket_count": 3, "is_active": True},
        {"company_name": "StartUp Ventures", "contact_name": "Lisa Park", "email": "lisa.park@startup.io", "phone_number": "+55 11 98765-4321", "plan_tier": Customer.PLAN_BASIC, "region": "South America", "nps_score": 6, "monthly_usage": 4200.00, "device_count": 15, "support_ticket_count": 1, "is_active": True},
        {"company_name": "Legacy Systems Corp", "contact_name": "Fred Black", "email": "fred.black@legacy.com", "phone_number": "+27 11 000 0000", "plan_tier": Customer.PLAN_STANDARD, "region": "Africa", "nps_score": 4, "monthly_usage": 0.00, "device_count": 0, "support_ticket_count": 8, "is_active": False},
        {"company_name": "DataDriven Co", "contact_name": "Priya Nair", "email": "priya.nair@datadriven.com", "phone_number": "+91 98765 43210", "plan_tier": Customer.PLAN_PREMIUM, "region": "Asia Pacific", "nps_score": 9, "monthly_usage": 38000.00, "device_count": 100, "support_ticket_count": 2, "is_active": True},
    ]
    for c in customer_data:
        _, created = Customer.objects.get_or_create(email=c["email"], defaults=c)
        if created:
            print(f"  Customer: {c['company_name']}")
except Exception as e:
    print(f"Customer seeding error: {e}")

# Seed some extra user accounts
user_data = [
    {"email": "alice.morgan@nexora.com", "first_name": "Alice", "last_name": "Morgan", "employee_id": "EMP001", "is_active": True},
    {"email": "bob.chen@nexora.com", "first_name": "Bob", "last_name": "Chen", "employee_id": "EMP002", "is_active": True},
    {"email": "carol.white@nexora.com", "first_name": "Carol", "last_name": "White", "employee_id": "EMP003", "is_active": True},
]

for u in user_data:
    if not User.objects.filter(email=u["email"]).exists():
        try:
            User.objects.create_user(password="pass123", **u)
            print(f"  User: {u['email']}")
        except Exception as e:
            print(f"  User {u['email']} error: {e}")

print("\nSetup complete! Visit http://127.0.0.1:8000/admin/")
print("Login: admin@nexora.com / admin123")
