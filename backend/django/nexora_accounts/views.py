from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User
from .permissions import IsAdminRole, IsManagerOrAdmin
from .serializers import UserSerializer, RegisterSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class AdminOnlyView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response(
            {
                "message": "Admin access granted.",
                "user": request.user.email,
                "role": request.user.role,
            }
        )


class ManagerOrAdminView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def get(self, request):
        return Response(
            {
                "message": "Manager or Admin access granted.",
                "user": request.user.email,
                "role": request.user.role,
            }
        )


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=400,
            )

        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            return Response(
                {"detail": "Invalid refresh token."},
                status=400,
            )

        return Response({"detail": "Successfully logged out."})


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()

        if not email:
            return Response(
                {"detail": "Email is required."},
                status=400,
            )

        try:
            user = User.objects.get(
                email__iexact=email,
                is_active=True,
            )
        except User.DoesNotExist:
            return Response(
                {
                    "detail": (
                        "If an account exists with this email, "
                        "a password reset link has been sent."
                    )
                }
            )

        uid = urlsafe_base64_encode(force_bytes(user.pk))

        token = default_token_generator.make_token(user)

        reset_link = f"http://localhost:3000/reset-password/" f"{uid}/{token}/"

        send_mail(
            subject="NEXORA Password Reset",
            message=(
                "You requested a password reset for your NEXORA account.\n\n"
                f"Use the following link to reset your password:\n\n"
                f"{reset_link}\n\n"
                "If you did not request this, you can safely ignore this email."
            ),
            from_email="noreply@nexora.com",
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(
            {
                "detail": (
                    "If an account exists with this email, "
                    "a password reset link has been sent."
                )
            }
        )


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not uid or not token or not new_password:
            return Response(
                {"detail": ("uid, token and new_password " "are required.")},
                status=400,
            )

        if len(new_password) < 8:
            return Response(
                {"detail": ("Password must contain at least " "8 characters.")},
                status=400,
            )

        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)

        except (
            ValueError,
            TypeError,
            OverflowError,
            User.DoesNotExist,
        ):
            return Response(
                {"detail": "Invalid password reset link."},
                status=400,
            )

        if not default_token_generator.check_token(
            user,
            token,
        ):
            return Response(
                {"detail": ("Invalid or expired password " "reset link.")},
                status=400,
            )

        user.set_password(new_password)

        user.save(update_fields=["password"])

        return Response({"detail": "Password has been reset successfully."})
