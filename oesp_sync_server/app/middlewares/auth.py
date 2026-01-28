from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from ..settings import settings

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip auth for docs
        if request.url.path in ["/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        device_did = request.headers.get("X-OESP-DEVICE")
        if not device_did:
            raise HTTPException(status_code=401, detail={"error": {"code": "UNAUTHORIZED", "message": "X-OESP-DEVICE header missing"}})

        if settings.API_KEY_REQUIRED:
            api_key = request.headers.get("X-OESP-APIKEY")
            if not api_key or api_key != settings.GLOBAL_API_KEY:
                raise HTTPException(status_code=401, detail={"error": {"code": "UNAUTHORIZED", "message": "Invalid or missing X-OESP-APIKEY"}})

        # Attach device_did to request state for routes to use
        request.state.device_did = device_did
        
        response = await call_next(request)
        return response
