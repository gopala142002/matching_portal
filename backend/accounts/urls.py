from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import (
    register,
    profile,
    logout_view,
    login_view,
    verify_token,
    update_reviewer_status,
    run_matching_algorithm
)

urlpatterns = [
    path("register/", register, name="register"),
    path("login/", login_view, name="login"),
    path("verify-token/", verify_token, name="verify_token"),
    path("profile/", profile, name="profile"),
    path("logout/", logout_view, name="logout"),
    path("update-reviewer-status/", update_reviewer_status, name="update_reviewer_status"),
    path("run-matching/", run_matching_algorithm, name="run_matching"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]