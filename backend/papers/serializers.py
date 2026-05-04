from rest_framework import serializers
from papers.models import Paper

# 📄 Full Paper Serializer (For Reading)
class PaperSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paper
        fields = "__all__"

# 👤 Author Input Helper
class AuthorInputSerializer(serializers.Serializer):
    name = serializers.CharField()
    institute = serializers.CharField(required=False, allow_blank=True)

# 📄 Create Paper Serializer (For Writing)
class PaperCreateSerializer(serializers.ModelSerializer):
    authors = AuthorInputSerializer(many=True, write_only=True)

    class Meta:
        model = Paper
        fields = [
            "title", 
            "abstract", 
            "keywords", 
            "pdf_url", 
            "authors"
        ]

    def validate_keywords(self, value):
        """Clean and normalize keywords into a lowercase list."""
        if isinstance(value, str):
            value = value.split(",")
        return list(set([v.strip().lower() for v in value if v.strip()]))

    def create(self, validated_data):
        """Map the 'authors' input into author_names and paper_affiliations."""
        authors_data = validated_data.pop("authors")
        request = self.context.get("request")

        # Split author details into the fields defined in your model
        names = [a["name"].strip() for a in authors_data]
        affiliations = list(set([a["institute"].strip() for a in authors_data if a.get("institute")]))

        paper = Paper.objects.create(
            author=request.user,
            author_names=names,
            paper_affiliations=affiliations,
            **validated_data
        )
        return paper