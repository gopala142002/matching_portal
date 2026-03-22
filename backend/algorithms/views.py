from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .services.ILP import main as run_ilp
from .services.paper_reviewer_edge import main as run_similarity


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_matching(request):
    return Response(run_ilp())


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_similarity_api(request):
    return Response(run_similarity())