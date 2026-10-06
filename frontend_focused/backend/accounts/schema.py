from drf_spectacular.extensions import OpenApiAuthenticationExtension

from accounts.authentication import ACCESS_TOKEN_COOKIE


class JWTCookieAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "accounts.authentication.JWTCookieAuthentication"
    name = "jwtCookieAuth"

    def get_security_definition(self, auto_schema):
        return {"type": "apiKey", "in": "cookie", "name": ACCESS_TOKEN_COOKIE}
