from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from papers.models import Paper
from papers.serializers import PaperSerializer, PaperCreateSerializer
from papers.openalex import fetch_affiliations


# 📄 Create Paper
class PaperCreateView(generics.CreateAPIView):
    serializer_class = PaperCreateSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        paper = serializer.save()

        # 🔥 Enrich metadata with OpenAlex
        metadata = getattr(paper, "metadata", None)

        if metadata:
            all_affiliations = set(metadata.paper_affiliations or [])

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
            status=status.HTTP_201_CREATED
        )


# 📄 List Papers
class PaperListView(generics.ListAPIView):
    serializer_class = PaperSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Paper.objects.filter(author=self.request.user)

        domain = self.request.query_params.get("domain")
        keyword = self.request.query_params.get("keyword")
        status_param = self.request.query_params.get("status")

        if domain:
            queryset = queryset.filter(research_domain__icontains=domain)

        if keyword:
            queryset = queryset.filter(keywords__icontains=keyword)

        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        serializer = self.get_serializer(queryset, many=True)

        return Response({
            "papers": serializer.data,
            "counts": {
                "submitted": queryset.count(),
                "under_review": queryset.filter(status="under_review").count(),
                "accepted": queryset.filter(status="accepted").count(),
                "rejected": queryset.filter(status="rejected").count(),
            }
        })


# 📄 Paper Detail
class PaperDetailView(generics.RetrieveAPIView):
    serializer_class = PaperSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Paper.objects.filter(author=self.request.user)