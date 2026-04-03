import os
import sys
import django
import random
import json

from django.db import IntegrityError

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "matching_portal.settings")

django.setup()

from accounts.serializers import RegisterSerializer
from research_domain import cs_domains


with open("colleges.json") as f:
    colleges = json.load(f)

institutions = [i["name"] for i in colleges["institutes"]]
domains = list(cs_domains.keys())


first_names = [
"Andrew","Christopher","Michael","David","John","Robert","Daniel","James","William","Richard",
"Joseph","Thomas","Charles","Matthew","Anthony","Mark","Donald","Steven","Paul","Kevin",
"Brian","George","Edward","Ronald","Timothy","Jason","Jeffrey","Ryan","Jacob","Gary",
"Nicholas","Eric","Jonathan","Stephen","Larry","Justin","Scott","Brandon","Benjamin","Samuel"
]

last_names = [
"Ng","Manning","Jordan","Levine","Stoica","Abbeel","Koller","Bengio","Hinton","LeCun",
"Malik","Darrell","Patterson","Hennessy","Shenker","McKeown","Zaharia","Vardi","Roughgarden","Tardos",
"Kleinberg","Goldwasser","Micali","Rivest","Shamir","Diffie","Hellman","Lamport","Liskov","Tarjan"
]


def generate_name():
    return random.choice(first_names) + " " + random.choice(last_names)


def generate_email(name, i):
    username = name.lower().replace(" ", ".")
    return f"{username}{i}@university.edu"


positions = [
"Professor",
"Associate Professor",
"Assistant Professor",
"Research Scientist"
]


TOTAL_RESEARCHERS = 2000
REVIEWER_COUNT = 1000
COMMON_PASSWORD = "StrongPass123!"

# randomly choose 500 reviewers
reviewer_indices = set(random.sample(range(TOTAL_RESEARCHERS), REVIEWER_COUNT))


for i in range(TOTAL_RESEARCHERS):

    name = generate_name()
    domain = random.choice(domains)

    interests = cs_domains[domain]["research_interests"]
    keywords = cs_domains[domain]["keywords"]

    research_interests = random.sample(interests, min(3, len(interests)))
    selected_keywords = random.sample(keywords, min(5, len(keywords)))

    is_reviewer = i in reviewer_indices

    data = {
        "email": generate_email(name, i),
        "password": COMMON_PASSWORD,
        "name": name,
        "institutions": random.sample(institutions, random.randint(1, 3)),
        "department": domain,
        "academic_position": random.choice(positions),
        "research_interests": research_interests,
        "keywords": selected_keywords,
        "is_reviewer": is_reviewer
    }

    serializer = RegisterSerializer(data=data)

    if serializer.is_valid():
        try:
            serializer.save()

            if i % 50 == 0:
                print(f"{i} users created")

        except IntegrityError:
            print("Duplicate email skipped:", data["email"])

    else:
        print("Error:", serializer.errors)


print("Finished creating researchers")