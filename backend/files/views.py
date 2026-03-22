from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .services import generate_upload_auth


class ImageKitAuthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(generate_upload_auth())
