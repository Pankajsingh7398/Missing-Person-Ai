"""
Clerk authentication dependency for FastAPI.
Placed in the services directory.

Verifies the Clerk session token from the Authorization header
using the official clerk-backend-api SDK. Returns the verified
payload on success, raises HTTP 401 on failure.
"""

import os
from typing import Any, Dict

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions


# =========================================================
# CLERK CLIENT (singleton, reads CLERK_SECRET_KEY from env)
# =========================================================

_clerk = Clerk(
    bearer_auth=os.environ.get("CLERK_SECRET_KEY", "")
)


# =========================================================
# HTTP BEARER SCHEME
# =========================================================

_bearer_scheme = HTTPBearer(auto_error=False)


# =========================================================
# MINIMAL REQUEST ADAPTER
# Clerk's authenticate_request() needs an object whose
# .headers property returns a mapping of header names to
# values. We build one from the raw Authorization value.
# =========================================================

class _HeadersAdapter:
    """Wraps a single header dict to satisfy the Requestish protocol."""

    def __init__(self, authorization: str) -> None:
        self._headers: Dict[str, str] = {
            "authorization": authorization
        }

    @property
    def headers(self) -> Dict[str, str]:
        return self._headers


# =========================================================
# DEPENDENCY
# =========================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        _bearer_scheme
    ),
) -> Dict[str, Any]:
    """
    FastAPI dependency that verifies a Clerk Bearer token.

    Returns the verified JWT payload dict (contains 'sub' = Clerk user ID).
    Raises HTTP 401 if the token is missing, invalid, or expired.
    """

    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    request_adapter = _HeadersAdapter(
        authorization=f"Bearer {token}"
    )

    request_state = _clerk.authenticate_request(
        request_adapter,
        AuthenticateRequestOptions(
            secret_key=os.environ.get("CLERK_SECRET_KEY", ""),
            authorized_parties=["http://localhost:5173", "http://localhost:5174"],
        ),
    )

    if not request_state.is_signed_in:
        message = (
            request_state.message
            or "Invalid authentication token"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message,
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Return the verified JWT payload; payload["sub"] is the Clerk user ID
    return request_state.payload  # type: ignore[return-value]
