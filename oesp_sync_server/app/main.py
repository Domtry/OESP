from fastapi import FastAPI
from .routes import sync
from .middlewares.auth import AuthMiddleware
from .settings import settings

app = FastAPI(title=settings.PROJECT_NAME)

# Add Auth Middleware
app.add_middleware(AuthMiddleware)

# Include Routes
app.include_router(sync.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
