import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from faker import Faker

from submissions import models

RANDOM_SEED = 2026
SUBMISSION_COUNT = 25
DEMO_USERNAME = "demo"
DEMO_PASSWORD = "demo-password"

INDUSTRIES = [
    "Construction",
    "Manufacturing",
    "Logistics",
    "Healthcare",
    "Hospitality",
    "Retail",
    "Technology",
    "Real Estate",
    "Food & Beverage",
    "Professional Services",
    "Energy",
    "Education",
]

CITIES = [
    "Chicago",
    "Denver",
    "Austin",
    "Charlotte",
    "Columbus",
    "Phoenix",
    "Nashville",
    "Minneapolis",
    "Pittsburgh",
    "Seattle",
    "Atlanta",
    "Boston",
]

LINES_OF_BUSINESS = [
    "General Liability",
    "Commercial Property",
    "Workers' Compensation",
    "Commercial Auto",
    "Cyber",
    "Directors & Officers",
    "Umbrella",
]

SUMMARY_TEMPLATES = [
    "New business {line} submission. Prior carrier is non-renewing after a rate increase; "
    "broker is targeting a {month} 1 effective date.",
    "Commercial Property renewal across {locations} locations, total insured values around "
    "${tiv}M. Loss history has been clean for five years.",
    "First time marketing {line}. Revenue is roughly ${revenue}M and the broker wants an "
    "indication within two weeks.",
    "Remarketing {line} after a large loss in {loss_year}. Insured is open to a higher "
    "retention to keep premium flat.",
    "Adding {line} to an existing account. ACORD applications are in; loss runs are still "
    "outstanding.",
    "Commercial Auto program with {units} power units across {states} states. Expiring premium is "
    "${premium}K.",
]

DOCUMENT_TEMPLATES = [
    ("Loss runs, last five years", "Spreadsheet", "xlsx"),
    ("Statement of values", "Spreadsheet", "xlsx"),
    ("Fleet schedule", "Spreadsheet", "xlsx"),
    ("ACORD 125 application", "Contract", "pdf"),
    ("Expiring policy", "Contract", "pdf"),
    ("Broker of record letter", "Contract", "pdf"),
    ("Broker submission letter", "Summary", "pdf"),
    ("Audited financial statements", "Summary", "pdf"),
    ("Underwriting presentation", "Presentation", "pptx"),
    ("Safety program overview", "Presentation", "pptx"),
]

PROGRESS_NOTE_BODIES = [
    "Requested five years of loss runs from the broker.",
    "Loss runs received. Two small property claims in 2023, both closed with no reserves.",
    "Called the broker to confirm the effective date. They want terms by the end of next week.",
    "Statement of values is missing construction details for two locations. Asked the broker "
    "to fill them in.",
    "Pricing looks tight against the expiring premium. Flagging for referral before we quote.",
    "Broker says the incumbent is offering a flat renewal, so we need to be sharp on retention.",
    "Sent the indication to the broker. Waiting on feedback from the insured.",
    "Insured turned down the higher deductible option. Revisiting terms.",
    "Financials look healthy; revenue is up about 12% year over year.",
    "Site inspection is booked for next Tuesday.",
    "Updated the subjectivities list and shared it with the broker.",
]

OUTCOME_NOTE_BODIES = {
    models.Submission.Status.CLOSED: [
        "Quote bound. Closing out the submission.",
        "Bound as quoted; policy documents sent to the broker.",
    ],
    models.Submission.Status.LOST: [
        "Lost to the incumbent on price.",
        "This class sits outside our appetite. Declined.",
    ],
}

CONTACT_ROLES = [
    "Chief Financial Officer",
    "Risk Manager",
    "Controller",
    "General Counsel",
    "Director of Operations",
    "Safety Manager",
]

STATUS_WEIGHTS = {
    models.Submission.Status.NEW: 30,
    models.Submission.Status.IN_REVIEW: 35,
    models.Submission.Status.CLOSED: 20,
    models.Submission.Status.LOST: 15,
}

PRIORITY_WEIGHTS = {
    models.Submission.Priority.HIGH: 25,
    models.Submission.Priority.MEDIUM: 45,
    models.Submission.Priority.LOW: 30,
}

SUBMISSIONS_PER_ONE_WITHOUT_DOCUMENTS = 5
SUBMISSIONS_PER_ONE_WITHOUT_NOTES = 6


def weighted_choice(random_generator, weights):
    return random_generator.choices(list(weights), weights=list(weights.values()))[0]


def plain_name(fake, unique=False):
    """A first and last name without Faker's titles and suffixes ("Dr.", "Jr.", "MD")."""
    source = fake.unique if unique else fake
    return f"{source.first_name()} {fake.last_name()}"


def email_from_name(full_name, domain):
    return f"{slugify(full_name).replace('-', '.')}@{domain}"


class Command(BaseCommand):
    help = "Seed a realistic, repeatable dataset for the Submission Tracker"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Clear existing submissions data before seeding",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if models.Submission.objects.exists():
            if not options["force"]:
                self.stdout.write(
                    self.style.WARNING(
                        "Submissions already exist; rerun with --force to rebuild seed data."
                    )
                )
                return
            self.stdout.write("Clearing existing submissions data...")
            models.Submission.objects.all().delete()
            models.Broker.objects.all().delete()
            models.Company.objects.all().delete()
            models.TeamMember.objects.all().delete()

        random_generator = random.Random(RANDOM_SEED)
        fake = Faker()
        fake.seed_instance(RANDOM_SEED)
        now = timezone.now()

        brokers = []
        for _ in range(5):
            name = f"{fake.unique.last_name()} & {fake.unique.last_name()} Insurance Brokers"
            brokers.append(
                models.Broker.objects.create(
                    name=name,
                    primary_contact_email=f"submissions@{slugify(name)}.example.com",
                )
            )

        companies = [
            models.Company.objects.create(
                legal_name=fake.unique.company(),
                industry=random_generator.choice(INDUSTRIES),
                headquarters_city=random_generator.choice(CITIES),
            )
            for _ in range(12)
        ]

        owners = []
        for _ in range(6):
            full_name = plain_name(fake, unique=True)
            owners.append(
                models.TeamMember.objects.create(
                    full_name=full_name,
                    email=email_from_name(full_name, "underwriting.example.com"),
                )
            )

        submissions = models.Submission.objects.bulk_create(
            models.Submission(
                company=random_generator.choice(companies),
                broker=random_generator.choice(brokers),
                owner=random_generator.choice(owners),
                status=weighted_choice(random_generator, STATUS_WEIGHTS),
                priority=weighted_choice(random_generator, PRIORITY_WEIGHTS),
                summary=self.build_summary(random_generator),
                created_at=now - timedelta(days=random_generator.randint(0, 60)),
            )
            for _ in range(SUBMISSION_COUNT)
        )

        contacts = []
        documents = []
        notes = []

        for index, submission in enumerate(submissions):
            company_domain = f"{slugify(submission.company.legal_name)}.example.com"
            for _ in range(random_generator.randint(1, 3)):
                name = plain_name(fake)
                contacts.append(
                    models.Contact(
                        submission=submission,
                        name=name,
                        role=random_generator.choice(CONTACT_ROLES),
                        email=email_from_name(name, company_domain),
                        phone=fake.numerify("(%##) %##-####"),
                    )
                )

            document_count = (
                0
                if index % SUBMISSIONS_PER_ONE_WITHOUT_DOCUMENTS == 1
                else random_generator.randint(1, 4)
            )
            for title, document_type, extension in random_generator.sample(
                DOCUMENT_TEMPLATES, document_count
            ):
                documents.append(
                    models.Document(
                        submission=submission,
                        title=title,
                        doc_type=document_type,
                        file_url=(
                            f"https://files.example.com/submissions/{submission.pk}/"
                            f"{slugify(title)}.{extension}"
                        ),
                        uploaded_at=min(
                            now,
                            submission.created_at
                            + timedelta(hours=random_generator.randint(1, 48)),
                        ),
                    )
                )

            note_count = (
                0
                if index % SUBMISSIONS_PER_ONE_WITHOUT_NOTES == 2
                else random_generator.randint(1, 5)
            )
            bodies = random_generator.sample(PROGRESS_NOTE_BODIES, note_count)
            outcome_bodies = OUTCOME_NOTE_BODIES.get(submission.status)
            if bodies and outcome_bodies:
                bodies[-1] = random_generator.choice(outcome_bodies)
            note_times = sorted(
                min(now, submission.created_at + timedelta(hours=random_generator.randint(2, 240)))
                for _ in bodies
            )
            for body, created_at in zip(bodies, note_times, strict=True):
                author = (
                    submission.owner
                    if random_generator.random() < 0.6
                    else random_generator.choice(owners)
                )
                notes.append(
                    models.Note(
                        submission=submission,
                        author_name=author.full_name,
                        body=body,
                        created_at=created_at,
                    )
                )

        models.Contact.objects.bulk_create(contacts)
        models.Document.objects.bulk_create(documents)
        models.Note.objects.bulk_create(notes)

        demo_user = self.link_demo_user(owners[0])

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed data created: {len(submissions)} submissions, "
                f"{len(contacts)} contacts, {len(documents)} documents, {len(notes)} notes."
            )
        )
        self.stdout.write(
            f"Sign in as '{demo_user.username}' / '{DEMO_PASSWORD}' "
            f"(team member {owners[0].full_name})."
        )

    def build_summary(self, random_generator):
        template = random_generator.choice(SUMMARY_TEMPLATES)
        return template.format(
            line=random_generator.choice(LINES_OF_BUSINESS),
            month=random_generator.choice(["January", "April", "July", "October"]),
            locations=random_generator.randint(2, 18),
            tiv=random_generator.randint(8, 240),
            revenue=random_generator.randint(5, 400),
            loss_year=random_generator.randint(2021, 2025),
            units=random_generator.randint(12, 180),
            states=random_generator.randint(2, 9),
            premium=random_generator.randint(45, 900),
        )

    def link_demo_user(self, team_member):
        first_name, _, last_name = team_member.full_name.partition(" ")
        demo_user, _ = get_user_model().objects.update_or_create(
            username=DEMO_USERNAME,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "email": team_member.email,
            },
        )
        demo_user.set_password(DEMO_PASSWORD)
        demo_user.save()
        team_member.user = demo_user
        team_member.save(update_fields=["user"])
        return demo_user
