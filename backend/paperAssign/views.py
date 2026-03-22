from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import run_assignment_algorithm

@api_view(["POST"])
def run_assignment(request):
    msg = run_assignment_algorithm()
    return Response({"message": msg})
