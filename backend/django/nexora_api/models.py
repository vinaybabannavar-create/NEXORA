from django.db import models


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    department_head = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.code} - {self.name}"


class Employee(models.Model):
    employee_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(unique=True)

    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
    )

    job_title = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["employee_id"]

    def __str__(self):
        return (
            f"{self.employee_id} - "
            f"{self.first_name} {self.last_name}"
        ).strip()


class Customer(models.Model):
    PLAN_BASIC = "BASIC"
    PLAN_STANDARD = "STANDARD"
    PLAN_PREMIUM = "PREMIUM"
    PLAN_ENTERPRISE = "ENTERPRISE"

    PLAN_CHOICES = [
        (PLAN_BASIC, "Basic"),
        (PLAN_STANDARD, "Standard"),
        (PLAN_PREMIUM, "Premium"),
        (PLAN_ENTERPRISE, "Enterprise"),
    ]

    company_name = models.CharField(max_length=200)
    contact_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone_number = models.CharField(max_length=20, blank=True)

    region = models.CharField(max_length=100)

    plan_tier = models.CharField(
        max_length=20,
        choices=PLAN_CHOICES,
        default=PLAN_BASIC,
    )

    contract_start_date = models.DateField(
        null=True,
        blank=True,
    )

    contract_end_date = models.DateField(
        null=True,
        blank=True,
    )

    nps_score = models.IntegerField(
        null=True,
        blank=True,
    )

    monthly_usage = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    device_count = models.PositiveIntegerField(default=0)

    support_ticket_count = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["company_name"]

    def __str__(self):
        return f"{self.company_name} - {self.contact_name}"


class SupportTicket(models.Model):
    PRIORITY_LOW = "LOW"
    PRIORITY_MEDIUM = "MEDIUM"
    PRIORITY_HIGH = "HIGH"
    PRIORITY_CRITICAL = "CRITICAL"

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, "Low"),
        (PRIORITY_MEDIUM, "Medium"),
        (PRIORITY_HIGH, "High"),
        (PRIORITY_CRITICAL, "Critical"),
    ]

    STATUS_OPEN = "OPEN"
    STATUS_IN_PROGRESS = "IN_PROGRESS"
    STATUS_WAITING = "WAITING"
    STATUS_RESOLVED = "RESOLVED"
    STATUS_CLOSED = "CLOSED"

    STATUS_CHOICES = [
        (STATUS_OPEN, "Open"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_WAITING, "Waiting"),
        (STATUS_RESOLVED, "Resolved"),
        (STATUS_CLOSED, "Closed"),
    ]

    CATEGORY_TECHNICAL = "TECHNICAL"
    CATEGORY_BILLING = "BILLING"
    CATEGORY_ACCOUNT = "ACCOUNT"
    CATEGORY_FEATURE = "FEATURE_REQUEST"
    CATEGORY_BUG = "BUG"
    CATEGORY_OTHER = "OTHER"

    CATEGORY_CHOICES = [
        (CATEGORY_TECHNICAL, "Technical"),
        (CATEGORY_BILLING, "Billing"),
        (CATEGORY_ACCOUNT, "Account"),
        (CATEGORY_FEATURE, "Feature Request"),
        (CATEGORY_BUG, "Bug Report"),
        (CATEGORY_OTHER, "Other"),
    ]

    ticket_number = models.CharField(
        max_length=30,
        unique=True,
        editable=False,
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="support_tickets",
    )

    subject = models.CharField(max_length=255)

    description = models.TextField()

    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
        default=CATEGORY_TECHNICAL,
    )

    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default=PRIORITY_MEDIUM,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_OPEN,
    )

    assigned_employee = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tickets",
    )

    due_date = models.DateField(
        null=True,
        blank=True,
    )

    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    customer_satisfaction = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    internal_notes = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            last_ticket = (
                SupportTicket.objects
                .order_by("-id")
                .first()
            )

            next_number = (
                last_ticket.id + 1
                if last_ticket
                else 1
            )

            self.ticket_number = f"TKT-{next_number:05d}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticket_number} - {self.subject}"


class Project(models.Model):
    STATUS_PLANNING = "PLANNING"
    STATUS_ACTIVE = "ACTIVE"
    STATUS_ON_HOLD = "ON_HOLD"
    STATUS_COMPLETED = "COMPLETED"
    STATUS_CANCELLED = "CANCELLED"

    STATUS_CHOICES = [
        (STATUS_PLANNING, "Planning"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_ON_HOLD, "On Hold"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    PRIORITY_LOW = "LOW"
    PRIORITY_MEDIUM = "MEDIUM"
    PRIORITY_HIGH = "HIGH"
    PRIORITY_CRITICAL = "CRITICAL"

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, "Low"),
        (PRIORITY_MEDIUM, "Medium"),
        (PRIORITY_HIGH, "High"),
        (PRIORITY_CRITICAL, "Critical"),
    ]

    project_code = models.CharField(
        max_length=50,
        unique=True,
    )

    name = models.CharField(
        max_length=200,
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="projects",
    )

    project_manager = models.ForeignKey(
        "nexora_accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_projects",
    )

    description = models.TextField(
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PLANNING,
    )

    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default=PRIORITY_MEDIUM,
    )

    start_date = models.DateField(
        null=True,
        blank=True,
    )

    end_date = models.DateField(
        null=True,
        blank=True,
    )

    budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
    )

    progress = models.PositiveIntegerField(
        default=0,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.project_code} - {self.name}"


class Task(models.Model):
    STATUS_TODO = "TODO"
    STATUS_IN_PROGRESS = "IN_PROGRESS"
    STATUS_REVIEW = "REVIEW"
    STATUS_COMPLETED = "COMPLETED"
    STATUS_BLOCKED = "BLOCKED"

    STATUS_CHOICES = [
        (STATUS_TODO, "To Do"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_REVIEW, "Review"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_BLOCKED, "Blocked"),
    ]

    PRIORITY_LOW = "LOW"
    PRIORITY_MEDIUM = "MEDIUM"
    PRIORITY_HIGH = "HIGH"
    PRIORITY_CRITICAL = "CRITICAL"

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, "Low"),
        (PRIORITY_MEDIUM, "Medium"),
        (PRIORITY_HIGH, "High"),
        (PRIORITY_CRITICAL, "Critical"),
    ]

    task_code = models.CharField(
        max_length=50,
        unique=True,
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="tasks",
    )

    title = models.CharField(
        max_length=250,
    )

    description = models.TextField(
        blank=True,
    )

    assigned_to = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_TODO,
    )

    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default=PRIORITY_MEDIUM,
    )

    due_date = models.DateField(
        null=True,
        blank=True,
    )

    estimated_hours = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
    )

    actual_hours = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.task_code} - {self.title}"


class Document(models.Model):
    TYPE_POLICY = "POLICY"
    TYPE_CONTRACT = "CONTRACT"
    TYPE_REPORT = "REPORT"
    TYPE_INVOICE = "INVOICE"
    TYPE_PROPOSAL = "PROPOSAL"
    TYPE_MANUAL = "MANUAL"
    TYPE_TECHNICAL = "TECHNICAL"
    TYPE_OTHER = "OTHER"

    DOCUMENT_TYPE_CHOICES = [
        (TYPE_POLICY, "Policy"),
        (TYPE_CONTRACT, "Contract"),
        (TYPE_REPORT, "Report"),
        (TYPE_INVOICE, "Invoice"),
        (TYPE_PROPOSAL, "Proposal"),
        (TYPE_MANUAL, "Manual"),
        (TYPE_TECHNICAL, "Technical"),
        (TYPE_OTHER, "Other"),
    ]

    CATEGORY_BUSINESS = "BUSINESS"
    CATEGORY_FINANCE = "FINANCE"
    CATEGORY_HR = "HR"
    CATEGORY_LEGAL = "LEGAL"
    CATEGORY_TECHNOLOGY = "TECHNOLOGY"
    CATEGORY_OPERATIONS = "OPERATIONS"
    CATEGORY_PROJECT = "PROJECT"
    CATEGORY_OTHER = "OTHER"

    CATEGORY_CHOICES = [
        (CATEGORY_BUSINESS, "Business"),
        (CATEGORY_FINANCE, "Finance"),
        (CATEGORY_HR, "HR"),
        (CATEGORY_LEGAL, "Legal"),
        (CATEGORY_TECHNOLOGY, "Technology"),
        (CATEGORY_OPERATIONS, "Operations"),
        (CATEGORY_PROJECT, "Project"),
        (CATEGORY_OTHER, "Other"),
    ]

    document_code = models.CharField(
        max_length=50,
        unique=True,
    )

    title = models.CharField(
        max_length=250,
    )

    description = models.TextField(
        blank=True,
    )

    file = models.FileField(
        upload_to="documents/%Y/%m/",
    )

    document_type = models.CharField(
        max_length=30,
        choices=DOCUMENT_TYPE_CHOICES,
        default=TYPE_OTHER,
    )

    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
        default=CATEGORY_OTHER,
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )

    uploaded_by = models.ForeignKey(
        "nexora_accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_documents",
    )

    file_size = models.PositiveBigIntegerField(
        default=0,
    )

    file_extension = models.CharField(
        max_length=20,
        blank=True,
    )

    version = models.PositiveIntegerField(
        default=1,
    )

    is_public = models.BooleanField(
        default=False,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size

            filename = self.file.name

            if "." in filename:
                self.file_extension = (
                    filename.rsplit(".", 1)[-1]
                    .lower()
                )

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.document_code} - {self.title}"