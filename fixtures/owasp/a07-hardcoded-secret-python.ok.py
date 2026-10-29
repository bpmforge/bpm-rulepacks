import os


class PaymentGatewayClient:
    def __init__(self):
        api_key = os.environ["STRIPE_API_KEY"]
        self.client = StripeClient(api_key)


# A constant NAMED after a credential whose VALUE is a label, an error code,
# a template name, a message or a dotted import path holds no secret.
# 48 of 48 saleor hits were this shape (account/error_codes.py, core/notify.py).
class AccountErrorCode:
    INVALID_PASSWORD = "invalid_password"
    JWT_INVALID_TOKEN = "invalid_token"


ACCOUNT_PASSWORD_RESET_DEFAULT_TEMPLATE = "password_reset.html"
INVALID_TOKEN = "Invalid or expired token."
PASSWORD_FIELD_LABEL = "SecretMultiline"
TOKEN_GENERATOR_CLASS = "django.contrib.auth.tokens.PasswordResetTokenGenerator"
JWT_REFRESH_TOKEN_COOKIE_NAME = "refreshToken"
