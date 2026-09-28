import uvicorn
from config import settings

if __name__ == "__main__":
    print("=" * 60)
    print(f" Starting {settings.PROJECT_NAME} in Python (FastAPI)")
    print(f" Port:      {settings.PORT}")
    print(f" API Base:  http://localhost:{settings.PORT}/api/v1")
    print(f" Frontend:  http://localhost:{settings.PORT}/")
    print(f" Health:    http://localhost:{settings.PORT}/health")
    print("=" * 60)
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=False)
