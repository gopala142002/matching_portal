from rest_framework import serializers
from papers.models import Paper, PaperMetadata


class PaperMetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaperMetadata
        fields = ["author_names", "paper_affiliations"]


class PaperSerializer(serializers.ModelSerializer):
    metadata = PaperMetadataSerializer(read_only=True)

    class Meta:
        model = Paper
        fields = [
            "id",
            "title",
            "abstract",
            "keywords",
            "subject_area",
            "pdf_url",
            "status",
            "created_at",
            "metadata",
        ]


class AuthorInputSerializer(serializers.Serializer):
    name = serializers.CharField()
    institute = serializers.CharField(required=False)


class PaperCreateSerializer(serializers.ModelSerializer):
    authors = AuthorInputSerializer(many=True,write_only=True)

    class Meta:
        model = Paper
        fields = [
            "title",
            "abstract",
            "keywords",
            "subject_area",
            "pdf_url",
            "authors",
        ]

    def validate_keywords(self, value):
        if isinstance(value, str):
            value = value.split(",")

        return list(set([v.strip().lower() for v in value if v.strip()]))

    def validate_subject_area(self, value):
        if isinstance(value, str):
            value = value.split(",")

        return list(set([v.strip().title() for v in value if v.strip()]))
    
    def create(self, validated_data):
        request = self.context["request"]
        authors_data = validated_data.pop("authors")

        author_names = []
        manual_affiliations = set()

        for author in authors_data:
            author_names.append(author["name"].strip())

            if author.get("institute"):
                manual_affiliations.add(author["institute"].strip())

        paper = Paper.objects.create(
            author=request.user,
            **validated_data
        )
        
        PaperMetadata.objects.create(
            paper=paper,
            author_names=list(set(author_names)),
            paper_affiliations=list(manual_affiliations)
        )

        return paper
