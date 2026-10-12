from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "employee_id",
            "first_name",
            "last_name",
            "role",
            "department",
            "job_title",
            "phone_number",
            "is_active",
            "date_joined",
        )
        read_only_fields = ("id", "date_joined", "is_active")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "email",
            "password",
            "first_name",
            "last_name",
            "employee_id",
            "role",
            "department",
            "job_title",
            "phone_number",
        )

    def validate_role(self, value):
        # Public registration cannot create elevated accounts.
        if value != User.Role.EMPLOYEE:
            raise serializers.ValidationError(
                "Public registration is limited to EMPLOYEE."
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data["role"] = User.Role.EMPLOYEE
        return User.objects.create_user(password=password, **validated_data)
