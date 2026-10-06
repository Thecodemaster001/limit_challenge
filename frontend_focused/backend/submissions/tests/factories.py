import factory
from factory.django import DjangoModelFactory

from submissions import models


class BrokerFactory(DjangoModelFactory):
    class Meta:
        model = models.Broker

    name = factory.Sequence(lambda number: f"Broker {number}")
    primary_contact_email = factory.Sequence(lambda number: f"broker{number}@example.com")


class CompanyFactory(DjangoModelFactory):
    class Meta:
        model = models.Company

    legal_name = factory.Sequence(lambda number: f"Company {number}")
    industry = "Manufacturing"
    headquarters_city = "Chicago"


class TeamMemberFactory(DjangoModelFactory):
    class Meta:
        model = models.TeamMember

    full_name = factory.Sequence(lambda number: f"Underwriter {number}")
    email = factory.Sequence(lambda number: f"underwriter{number}@example.com")


class SubmissionFactory(DjangoModelFactory):
    class Meta:
        model = models.Submission

    company = factory.SubFactory(CompanyFactory)
    broker = factory.SubFactory(BrokerFactory)
    owner = factory.SubFactory(TeamMemberFactory)
    summary = "General Liability renewal."


class ContactFactory(DjangoModelFactory):
    class Meta:
        model = models.Contact

    submission = factory.SubFactory(SubmissionFactory)
    name = factory.Sequence(lambda number: f"Contact {number}")
    role = "Risk Manager"
    email = factory.Sequence(lambda number: f"contact{number}@example.com")
    phone = "(312) 555-0100"


class DocumentFactory(DjangoModelFactory):
    class Meta:
        model = models.Document

    submission = factory.SubFactory(SubmissionFactory)
    title = "Loss runs"
    doc_type = "Spreadsheet"
    file_url = "https://files.example.com/loss-runs.xlsx"


class NoteFactory(DjangoModelFactory):
    class Meta:
        model = models.Note

    submission = factory.SubFactory(SubmissionFactory)
    author_name = "Underwriter"
    body = "Requested loss runs from the broker."
