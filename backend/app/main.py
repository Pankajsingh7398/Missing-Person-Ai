from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.videos import router as videos_router


from fastapi.openapi.utils import get_openapi

from app.api.cases import router as cases_router

from app.database import Base, engine
from app.models.case import (
    MissingPersonCase,
    CCTVVideo,
    CCTVAnalysis,
)



# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Missing Person AI",
    description="AI-powered missing person detection system",
    version="1.0.0",
)

def custom_openapi():

    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    schema = (
        openapi_schema
        .get("components", {})
        .get("schemas", {})
        .get(
            "Body_upload_reference_images_api_cases__case_id__references_post"
        )
    )

    if schema:

        files_schema = (
            schema
            .get("properties", {})
            .get("files")
        )

        if files_schema:

            items = files_schema.get("items")

            if items:

                items.pop(
                    "contentMediaType",
                    None,
                )

                items["format"] = "binary"

    app.openapi_schema = openapi_schema

    return app.openapi_schema


app.openapi = custom_openapi

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Static uploaded files
app.mount(
    "/uploads",
    StaticFiles(directory="data"),
    name="uploads",
)


# API routes
app.include_router(cases_router)
app.include_router(videos_router)

@app.get("/")
def root():

    return {
        "message": "Missing Person AI API is running"
    }


@app.get("/api/health")
def health():

    return {
        "status": "healthy"
    }