from pathlib import Path
import os
from datetime import timedelta

from dotenv import load_dotenv


load_dotenv()


BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# SECURITY
# ============================================================

SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "nexora-development-secret-key-change-this-in-production-2026",
)

DEBUG = (
    os.getenv(
        "DJANGO_DEBUG",
        "True",
    ).lower()
    == "true"
)


ALLOWED_HOSTS = [
    x.strip()
    for x in os.getenv(
        "DJANGO_ALLOWED_HOSTS",
        "127.0.0.1,localhost",
    ).split(",")
    if x.strip()
]


# ============================================================
# APPLICATIONS
# ============================================================

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "corsheaders",
    "rest_framework_simplejwt.token_blacklist",

    "nexora_accounts",
    "nexora_api",
]


# ============================================================
# MIDDLEWARE
# ============================================================

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",

    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",

    "django.contrib.messages.middleware.MessageMiddleware",

    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ============================================================
# URL / SERVER
# ============================================================

ROOT_URLCONF = "config.urls"


TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"


# ============================================================
# DATABASE
# ============================================================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",

        "NAME": os.getenv(
            "POSTGRES_DB",
            "nexora",
        ),

        "USER": os.getenv(
            "POSTGRES_USER",
            "nexora_user",
        ),

        "PASSWORD": os.getenv(
            "POSTGRES_PASSWORD",
            "nexora_password",
        ),

        "HOST": os.getenv(
            "POSTGRES_HOST",
            "localhost",
        ),

        "PORT": os.getenv(
            "POSTGRES_PORT",
            "5432",
        ),
    }
}


# ============================================================
# PASSWORD VALIDATION
# ============================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        )
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        )
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        )
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        )
    },
]


# ============================================================
# INTERNATIONALIZATION
# ============================================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Asia/Kolkata"

USE_I18N = True

USE_TZ = True


# ============================================================
# STATIC
# ============================================================

STATIC_URL = "static/"


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ============================================================
# CUSTOM USER
# ============================================================

AUTH_USER_MODEL = "nexora_accounts.User"


# ============================================================
# DJANGO REST FRAMEWORK
# ============================================================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),

    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}


# ============================================================
# JWT CONFIGURATION
# ============================================================

SIMPLE_JWT = {
    # Access token now lasts 30 minutes
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=int(
            os.getenv(
                "JWT_ACCESS_MINUTES",
                "30",
            )
        )
    ),

    # Refresh token lasts 7 days
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=int(
            os.getenv(
                "JWT_REFRESH_DAYS",
                "7",
            )
        )
    ),

    "ROTATE_REFRESH_TOKENS": False,

    "BLACKLIST_AFTER_ROTATION": True,

    "AUTH_HEADER_TYPES": (
        "Bearer",
    ),
}


# ============================================================
# CORS
# ============================================================

CORS_ALLOWED_ORIGINS = [
    x.strip()
    for x in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if x.strip()
]


# ============================================================
# EMAIL
# ============================================================

EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.smtp.EmailBackend",
)


EMAIL_HOST = os.getenv(
    "EMAIL_HOST",
    "smtp.gmail.com",
)


EMAIL_PORT = int(
    os.getenv(
        "EMAIL_PORT",
        "587",
    )
)


EMAIL_USE_TLS = (
    os.getenv(
        "EMAIL_USE_TLS",
        "True",
    ).lower()
    == "true"
)


EMAIL_HOST_USER = os.getenv(
    "EMAIL_HOST_USER",
)


EMAIL_HOST_PASSWORD = os.getenv(
    "EMAIL_HOST_PASSWORD",
)


DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    EMAIL_HOST_USER,
)