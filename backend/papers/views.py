from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from papers.models import Paper
from papers.serializers import PaperSerializer, PaperCreateSerializer

# ➕ Create View
class PaperCreateView(generics.CreateAPIView):
    serializer_class = PaperCreateSerializer
    permission_classes = [IsAuthenticated]

# 📋 List View (With filtering and counts)
class PaperListView(generics.ListAPIView):
    serializer_class = PaperSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Paper.objects.filter(author=self.request.user)
        keyword = self.request.query_params.get("keyword")

        if keyword:
            queryset = queryset.filter(keywords__contains=[keyword.lower()])
            
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            "status": True,
            "papers": serializer.data,
            "counts": {
                "total": queryset.count(),
                "submitted": queryset.filter(status="submitted").count(),
                "accepted": queryset.filter(status="accepted").count(),
                "rejected": queryset.filter(status="rejected").count(),
            }
        })

# 🔍 Detail View
class PaperDetailView(generics.RetrieveAPIView):
    serializer_class = PaperSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Paper.objects.filter(author=self.request.user)