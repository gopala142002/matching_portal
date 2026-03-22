from django.http import JsonResponse
from .services.ILP import main as run_ilp
from .services.similarity_service import main as run_similarity


def run_matching(request):
    return JsonResponse(run_ilp())


def run_similarity_api(request):
    return JsonResponse(run_similarity())