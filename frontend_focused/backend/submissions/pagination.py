from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Page-number pagination that lets clients pick a bounded page size."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100
