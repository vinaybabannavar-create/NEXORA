from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name="User",
                    fields=[
                        (
                            "password",
                            models.CharField(
                                max_length=128,
                                verbose_name="password",
                            ),
                        ),
                        (
                            "last_login",
                            models.DateTimeField(
                                blank=True,
                                null=True,
                                verbose_name="last login",
                            ),
                        ),
                        (
                            "is_superuser",
                            models.BooleanField(
                                default=False,
                                help_text="Designates that this user has all permissions without explicitly assigning them.",
                                verbose_name="superuser status",
                            ),
                        ),
                        (
                            "id",
                            models.UUIDField(
                                default=uuid.uuid4,
                                editable=False,
                                primary_key=True,
                                serialize=False,
                            ),
                        ),
                        (
                            "email",
                            models.EmailField(
                                db_index=True,
                                max_length=254,
                                unique=True,
                            ),
                        ),
                        (
                            "employee_id",
                            models.CharField(
                                blank=True,
                                db_index=True,
                                max_length=50,
                                null=True,
                                unique=True,
                            ),
                        ),
                        (
                            "first_name",
                            models.CharField(max_length=100),
                        ),
                        (
                            "last_name",
                            models.CharField(max_length=100),
                        ),
                        (
                            "role",
                            models.CharField(
                                choices=[
                                    ("EMPLOYEE", "Employee"),
                                    ("MANAGER", "Manager"),
                                    ("ADMIN", "Administrator"),
                                ],
                                db_index=True,
                                default="EMPLOYEE",
                                max_length=20,
                            ),
                        ),
                        (
                            "department",
                            models.CharField(
                                blank=True,
                                db_index=True,
                                default="",
                                max_length=100,
                            ),
                        ),
                        (
                            "job_title",
                            models.CharField(
                                blank=True,
                                default="",
                                max_length=100,
                            ),
                        ),
                        (
                            "phone_number",
                            models.CharField(
                                blank=True,
                                default="",
                                max_length=20,
                            ),
                        ),
                        (
                            "is_active",
                            models.BooleanField(default=True),
                        ),
                        (
                            "is_staff",
                            models.BooleanField(default=False),
                        ),
                        (
                            "date_joined",
                            models.DateTimeField(auto_now_add=True),
                        ),
                        (
                            "updated_at",
                            models.DateTimeField(auto_now=True),
                        ),
                        (
                            "groups",
                            models.ManyToManyField(
                                blank=True,
                                help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.",
                                related_name="user_set",
                                related_query_name="user",
                                to="auth.group",
                                verbose_name="groups",
                            ),
                        ),
                        (
                            "user_permissions",
                            models.ManyToManyField(
                                blank=True,
                                help_text="Specific permissions for this user.",
                                related_name="user_set",
                                related_query_name="user",
                                to="auth.permission",
                                verbose_name="user permissions",
                            ),
                        ),
                    ],
                    options={
                        "db_table": "users",
                        "ordering": ["-date_joined"],
                        "indexes": [
                            models.Index(
                                fields=["role", "is_active"],
                                name="users_role_is_active_idx",
                            ),
                            models.Index(
                                fields=["department", "is_active"],
                                name="users_department_is_active_idx",
                            ),
                        ],
                    },
                ),
            ],
        ),
    ]
