from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Paper
from .serializers import PaperSerializer, PaperCreateSerializer
# Assuming Researcher is in an app named 'accounts' - adjust if different
from accounts.models import Researcher 

class PaperCreateView(generics.CreateAPIView):
    serializer_class = PaperCreateSerializer
    permission_classes = [IsAuthenticated]

class PaperListView(generics.ListAPIView):
    serializer_class = PaperSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Admins see all papers; regular users see only their own
        if user.is_staff:
            return Paper.objects.all()
        return Paper.objects.filter(author=user)

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            
            # Count from the Researcher table where is_reviewer is True
            reviewer_count = Researcher.objects.filter(is_reviewer=True).count()
            
            return Response({
                "status": True,
                "papers": serializer.data,
                "counts": {
                    "total": queryset.count(),
                    "submitted": queryset.filter(status="submitted").count(),
                    "assigned": queryset.filter(status="assigned").count(),
                    "reviewers": reviewer_count,
                }
            })
        except Exception as e:
            # Helps debug if there is a table name mismatch
            return Response({
                "status": False, 
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PaperDetailView(generics.RetrieveAPIView):
    serializer_class = PaperSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Paper.objects.all()
        return Paper.objects.filter(author=self.request.user)