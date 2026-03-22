from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Institute, Keyword, ResearchDomain


class MetadataAPIView(APIView):
    def get(self, request):
        return Response({
            "institutes": list(Institute.objects.values_list("name", flat=True)),
            "keywords": list(Keyword.objects.values_list("name", flat=True)),
            "research_domains": list(ResearchDomain.objects.values_list("name", flat=True)),
        })