from rest_framework.response import Response
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from papers.models import Paper
from papers.serializers import PaperSerializer, PaperCreateSerializer
from papers.openalex import fetch_affiliations

class PaperCreateView(generics.CreateAPIView):
    serializer_class = PaperCreateSerializer
    permission_classes = [IsAuthenticated]
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        paper = serializer.save()
        metadata = paper.metadata
        all_affiliations = set(metadata.paper_affiliations)
        for author_name in metadata.author_names:
            try:
                openalex_affiliations = fetch_affiliations(author_name)
            except Exception:
                openalex_affiliations = []

            for aff in openalex_affiliations:
                inst_name = aff.get("name")
                if inst_name and inst_name.strip():
                    all_affiliations.add(inst_name.strip())

        metadata.paper_affiliations = sorted(all_affiliations)
        metadata.save()
        
        return Response(
            PaperSerializer(paper).data,
            status=201
        )

class PaperListView(generics.ListAPIView):
    serializer_class = PaperSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Paper.objects.filter(author=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        papers = serializer.data

        counts = {
            "submitted": queryset.count(),
            "under_review": queryset.filter(status="under_review").count(),
            "accepted": queryset.filter(status="accepted").count(),
            "rejected": queryset.filter(status="rejected").count(),
        }

        return Response({
            "papers": papers,
            "counts": counts
        })



class PaperDetailView(generics.RetrieveAPIView):
    serializer_class = PaperSerializer                                                                                                                                                                                                                                                                                                                      
    permission_classes = [IsAuthenticated]

    def get_queryset(self):                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
        return Paper.objects.filter(author=self.request.user)
