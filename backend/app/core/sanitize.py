import re
from typing import Optional

import bleach

_INJECTION_PATTERN = re.compile(
    r"(--|\bDROP\b|\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bxp_)",
    re.IGNORECASE,
)


def sanitize_string(value: Optional[str], max_length: int = 500) -> Optional[str]:
    """
    Basic hardening for user-provided strings:
    - trim whitespace
    - strip null bytes and control characters
    - enforce a maximum length
    - reject obvious SQL-injection style patterns
    """
    if value is None:
        return None

    # Normalize and trim
    cleaned = "".join(ch for ch in value if ch >= " ")
    cleaned = cleaned.strip()

    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length]

    # Block obvious SQL injection patterns
    if _INJECTION_PATTERN.search(cleaned):
        raise ValueError("Input contains disallowed patterns")

    return cleaned or None


def sanitize_html(value: Optional[str], max_length: int = 500) -> Optional[str]:
    """
    Strip HTML tags from user-provided strings to mitigate XSS.
    """
    if value is None:
        return None

    cleaned = bleach.clean(value, tags=[], attributes={}, strip=True)
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    return cleaned or None

