from django.db import migrations, models
import django.db.models.deletion


def copy_departments_forward(apps, schema_editor):
    Department = apps.get_model("nexora_api", "Department")
    Employee = apps.get_model("nexora_api", "Employee")

    for employee in Employee.objects.all():
        value = (employee.department or "").strip()

        if not value:
            continue

        code = "".join(
            character
            for character in value.upper()
            if character.isalnum()
        )[:20]

        if not code:
            code = "DEPT"

        department, _ = Department.objects.get_or_create(
            name=value,
            defaults={"code": code},
        )

        employee.department_fk = department
        employee.save(update_fields=["department_fk"])


def copy_departments_reverse(apps, schema_editor):
    Department = apps.get_model("nexora_api", "Department")
    Employee = apps.get_model("nexora_api", "Employee")

    for employee in Employee.objects.all():
        if employee.department_fk:
            employee.department = employee.department_fk.name
            employee.save(update_fields=["department"])


class Migration(migrations.Migration):

    dependencies = [
        ("nexora_api", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="employee",
            name="department_fk",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="employees_temp",
                to="nexora_api.department",
            ),
        ),
        migrations.RunPython(
            copy_departments_forward,
            copy_departments_reverse,
        ),
        migrations.RemoveField(
            model_name="employee",
            name="department",
        ),
        migrations.RenameField(
            model_name="employee",
            old_name="department_fk",
            new_name="department",
        ),
        migrations.AlterField(
            model_name="employee",
            name="department",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="employees",
                to="nexora_api.department",
            ),
        ),
    ]
