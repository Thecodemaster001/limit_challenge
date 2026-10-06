from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    """
    Limits sign-in attempts per username rather than per IP address. Requests reach Django
    through the Next.js proxy, so every user shares the proxy's address; keying on the
    username still stops password guessing against any single account.
    """

    scope = "login"

    def get_cache_key(self, request, view):
        username = str(request.data.get("username", "")).strip().lower()
        if not username:
            return None
        return self.cache_format % {"scope": self.scope, "ident": username}
