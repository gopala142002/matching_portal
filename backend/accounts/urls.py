from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import register, profile, logout_view, login_view, verify_token,update_reviewer_status

urlpatterns = [
    path("register/", register, name="register"),
    path("verify_token/", verify_token, name="verify_token"),
    path("login/", login_view, name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", profile,name="profile"),
    path("logout/", logout_view, name="logout"),
    path("update-reviewer-status/", update_reviewer_status)
]
