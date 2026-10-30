# -*- coding: utf-8 -*-
"""
Setup SQLite database for local development.
Creates tables that couldn't be created via migrations (SeparateDatabaseAndState)
and seeds sample data.
"""
import os
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
os.environ["USE_SQLITE"] = "True"
django.setup()

from django.db import connection

# Step 1: Create the employee table that was skipped in 0001 (SeparateDatabaseAndState)
with connection.schema_editor() as schema_editor:
    from nexora_api.models import Employee
    try:
        schema_editor.create_model(Employee)
        print("✓ Created nexora_api_employee table")
    except Exception as e:
        print(f"  Employee table: {e}")

# Step 2: Fake remaining migrations
from django.core.management import call_command

print("\n→ Faking remaining nexora_api migrations...")
for m in ["0002_department_conversion", "0003_customer", "0004_supportticket", "0005_project_task", "0006_document"]:
    try:
        call_command("migrate", "nexora_api", m, fake=True, verbosity=0)
        print(f"  Faked nexora_api.{m}")
    except Exception as e:
        print(f"  Skip {m}: {e}")

print("\n→ Applying remaining migrations...")
try:
    call_command("migrate", verbosity=1)
except Exception as e:
    print(f"  migrate error: {e}")

# Step 3: Create models that may still be missing
models_to_create = []
try:
    from nexora_api.models import Customer, SupportTicket, Project, Task, Document
    models_to_create = [Customer, SupportTicket, Project, Task, Document]
except ImportError as e:
    print(f"Import error: {e}")

with connection.schema_editor() as schema_editor:
    for Model in models_to_create:
        try:
            schema_editor.create_model(Model)
            print(f"✓ Created {Model._meta.db_table}")
        except Exception as e:
            print(f"  {Model.__name__}: {e}")

print("\n→ Running final migrate to catch anything remaining...")
try:
    call_command("migrate", verbosity=1, fake=True)
except Exception as e:
    print(f"  Final migrate: {e}")

# Step 4: Create superuser
from django.contrib.auth import get_user_model
User = get_user_model()

if not User.objects.filter(email="admin@nexora.com").exists():
    User.objects.create_superuser(
        email="admin@nexora.com",
        password="admin123",
        first_name="Admin",
        last_name="Nexora",
    )
    print("\n✓ Superuser created: admin@nexora.com / admin123")
else:
    print("\n  Superuser already exists")

# Step 5: Seed sample data
from nexora_api.models import Department, Employee

# Departments
dept_data = [
    {"name": "Engineering", "code": "ENG", "department_head": "Alice Morgan", "is_active": True},
    {"name": "Sales", "code": "SALES", "department_head": "Bob Chen", "is_active": True},
    {"name": "Customer Success", "code": "CS", "department_head": "Carol White", "is_active": True},
    {"name": "Product", "code": "PROD", "department_head": "David Kim", "is_active": True},
    {"name": "HR", "code": "HR", "department_head": "Eva Singh", "is_active": True},
]

depts = {}
for d in dept_data:
    obj, created = Department.objects.get_or_create(code=d["code"], defaults=d)
    depts[d["code"]] = obj
    if created:
        print(f"  ✓ Dept: {d['name']}")

# Employees
emp_data = [
    {"employee_id": "EMP001", "first_name": "Alice", "last_name": "Morgan", "email": "alice@nexora.com", "department": depts["ENG"], "job_title": "Lead Engineer", "is_active": True},
    {"employee_id": "EMP002", "first_name": "Bob", "last_name": "Chen", "email": "bob@nexora.com", "department": depts["SALES"], "job_title": "Sales Manager", "is_active": True},
    {"employee_id": "EMP003", "first_name": "Carol", "last_name": "White", "email": "carol@nexora.com", "department": depts["CS"], "job_title": "CS Lead", "is_active": True},
    {"employee_id": "EMP004", "first_name": "David", "last_name": "Kim", "email": "david@nexora.com", "department": depts["PROD"], "job_title": "Product Manager", "is_active": True},
    {"employee_id": "EMP005", "first_name": "Eva", "last_name": "Singh", "email": "eva@nexora.com", "department": depts["HR"], "job_title": "HR Director", "is_active": False},
]

for e in emp_data:
    _, created = Employee.objects.get_or_create(employee_id=e["employee_id"], defaults=e)
    if created:
        print(f"  ✓ Employee: {e['first_name']} {e['last_name']}")

# Customers
try:
    from nexora_api.models import Customer
    customer_data = [
        {"company_name": "Acme Corp", "contact_name": "John Smith", "email": "john@acme.com", "plan_tier": Customer.PLAN_ENTERPRISE, "region": "North America", "nps_score": 9, "is_active": True},
        {"company_name": "TechFlow Inc", "contact_name": "Sara Lee", "email": "sara@techflow.com", "plan_tier": Customer.PLAN_PREMIUM, "region": "Europe", "nps_score": 8, "is_active": True},
        {"company_name": "BuildRight Ltd", "contact_name": "Mike Torres", "email": "mike@buildright.com", "plan_tier": Customer.PLAN_STANDARD, "region": "Asia", "nps_score": 7, "is_active": True},
        {"company_name": "StartUp Co", "contact_name": "Lisa Park", "email": "lisa@startup.co", "plan_tier": Customer.PLAN_BASIC, "region": "South America", "nps_score": 6, "is_active": True},
        {"company_name": "Legacy Systems", "contact_name": "Fred Black", "email": "fred@legacy.com", "plan_tier": Customer.PLAN_STANDARD, "region": "Africa", "nps_score": 4, "is_active": False},
    ]
    for c in customer_data:
        _, created = Customer.objects.get_or_create(email=c["email"], defaults=c)
        if created:
            print(f"  ✓ Customer: {c['company_name']}")
except Exception as e:
    print(f"  Customer seeding: {e}")

# Create admin user accounts
user_data = [
    {"email": "alice@nexora.com", "first_name": "Alice", "last_name": "Morgan", "role": "EMPLOYEE", "is_active": True, "employee_id": "EMP001"},
    {"email": "bob@nexora.com", "first_name": "Bob", "last_name": "Chen", "role": "MANAGER", "is_active": True, "employee_id": "EMP002"},
    {"email": "carol@nexora.com", "first_name": "Carol", "last_name": "White", "role": "EMPLOYEE", "is_active": True, "employee_id": "EMP003"},
]

for u in user_data:
    if not User.objects.filter(email=u["email"]).exists():
        User.objects.create_user(password="pass123", **u)
        print(f"  ✓ User: {u['email']}")

print("\n✅ Setup complete! Visit http://127.0.0.1:8000/admin/ with admin@nexora.com / admin123")
