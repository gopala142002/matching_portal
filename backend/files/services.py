import time
import uuid
import hmac
import hashlib
from django.conf import settings


def generate_upload_auth():

    token = str(uuid.uuid4())
    expire = int(time.time()) + 600  

    message = f"{token}{expire}".encode()

    signature = hmac.new(
        settings.IMAGEKIT_PRIVATE_KEY.encode(),
        message,
        hashlib.sha1
    ).hexdigest()

    return {
        "token": token,
        "expire": expire,
        "signature": signature,
        "publicKey": settings.IMAGEKIT_PUBLIC_KEY,
    }
