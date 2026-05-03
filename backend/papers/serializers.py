from rest_framework import serializers
from papers.models import Paper





# 📄 Read Serializer
class PaperSerializer(serializers.ModelSerializer):

    class Meta:
        model = Paper
        fields = [
            "id",
            "title",
            "abstract",
            "keywords",
            "research_domain",
            "pdf_url",
            "status",
            "created_at",
            "metadata",
        ]


# 👤 Author Input
class AuthorInputSerializer(serializers.Serializer):
    name = serializers.CharField()
    institute = serializers.CharField(required=False)


# 📄 Create Serializer
class PaperCreateSerializer(serializers.ModelSerializer):
    authors = AuthorInputSerializer(many=True, write_only=True)

    class Meta:
        model = Paper
        fields = [
            "title",
            "abstract",
            "keywords",
            "research_domain",
            "pdf_url",
            "authors",
        ]

    # 🔹 Clean keywords
    def validate_keywords(self, value):
        if isinstance(value, str):
            value = value.split(",")

        return list(set([v.strip().lower() for v in value if v.strip()]))

    # 🔹 Clean domain
    def validate_research_domain(self, value):
        if isinstance(value, str):
            value = value.split(",")

        return list(set([v.strip().title() for v in value if v.strip()]))

    # 🔹 Create Paper + Metadata
    def create(self, validated_data):
        request = self.context["request"]
        authors_data = validated_data.pop("authors")

        author_names = []
        affiliations = set()

        for author in authors_data:
            author_names.append(author["name"].strip())

            if author.get("institute"):
                affiliations.add(author["institute"].strip())

        paper = Paper.objects.create(
            author=request.user,
            **validated_data
        )


        return paper