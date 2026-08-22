from pathlib import Path

from app.services.auth import get_current_user
from datetime import datetime
from typing import Optional

import shutil

from fastapi import (
    APIRouter,
    HTTPException,
    UploadFile,
    File,
    Depends,
)

from pydantic import BaseModel

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.case import (
    MissingPersonCase,
)

from app.services.reference_service import (
    build_reference_profile,
    save_reference_profile,
)
from fastapi.responses import FileResponse

# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/cases",
    tags=["Cases"],
)


# =========================================================
# CASE CREATE MODEL
# =========================================================

class CaseCreate(BaseModel):

    name: str

    age: Optional[int] = None

    gender: Optional[str] = None

    last_seen_location: Optional[str] = None

    last_seen_date: Optional[str] = None

    description: Optional[str] = None


# =========================================================
# CREATE CASE
# =========================================================

@router.post("")
def create_case(
    case: CaseCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Create a missing-person case
    in the SQLite database.
    """

    db_case = MissingPersonCase(

        name=case.name,

        age=case.age,

        gender=case.gender,

        last_seen_location=(
            case.last_seen_location
        ),

        last_seen_date=(
            case.last_seen_date
        ),

        description=(
            case.description
        ),
    )

    db.add(db_case)

    db.commit()

    db.refresh(db_case)

    return {

        "success": True,

        "case": {

            "id": db_case.id,

            "name": db_case.name,

            "age": db_case.age,

            "gender": db_case.gender,

            "last_seen_location":
                db_case.last_seen_location,

            "last_seen_date":
                db_case.last_seen_date,

            "description":
                db_case.description,

            "created_at":
                db_case.created_at,

            "status":
                "created",

            "reference_images":
                [],

            "reference_profile":
                None,
        },
    }


# =========================================================
# GET ALL CASES
# =========================================================

@router.get("")
def get_cases(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Return all missing-person cases
    from SQLite.
    """

    db_cases = (
        db.query(
            MissingPersonCase
        )
        .order_by(
            MissingPersonCase.created_at.desc()
        )
        .all()
    )

    cases = []

    for case in db_cases:

        reference_directory = (
            Path("data")
            / "missing_persons"
            / str(case.id)
            / "references"
        )

        profile_path = (
            reference_directory
            / "reference_profile.npz"
        )

        reference_images = []

        if reference_directory.exists():

            reference_images = [

                str(path)

                for path in
                sorted(
                    reference_directory.iterdir()
                )

                if path.is_file()
                and path.suffix.lower()
                in {
                    ".jpg",
                    ".jpeg",
                    ".png",
                    ".webp",
                }
            ]

        cases.append({

            "id": case.id,

            "name": case.name,

            "age": case.age,

            "gender": case.gender,

            "last_seen_location":
                case.last_seen_location,

            "last_seen_date":
                case.last_seen_date,

            "description":
                case.description,

            "created_at":
                case.created_at,

            "status": (
                "ready"
                if profile_path.exists()
                else "created"
            ),

            "reference_images":
                reference_images,

            "reference_profile": (
                str(profile_path)
                if profile_path.exists()
                else None
            ),
        })

    return {

        "success": True,

        "cases": cases,

    }


# =========================================================
# GET SINGLE CASE
# =========================================================

@router.get(
    "/{case_id}"
)
def get_case(
    case_id: int,

    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Return one case from SQLite.
    """

    case = (
        db.query(
            MissingPersonCase
        )
        .filter(
            MissingPersonCase.id
            == case_id
        )
        .first()
    )

    if case is None:

        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )

    reference_directory = (
        Path("data")
        / "missing_persons"
        / str(case.id)
        / "references"
    )

    profile_path = (
        reference_directory
        / "reference_profile.npz"
    )

    reference_images = []

    if reference_directory.exists():

        reference_images = [

            str(path)

            for path in
            sorted(
                reference_directory.iterdir()
            )

            if path.is_file()
            and path.suffix.lower()
            in {
                ".jpg",
                ".jpeg",
                ".png",
                ".webp",
            }
        ]

    return {

        "success": True,

        "case": {

            "id": case.id,

            "name": case.name,

            "age": case.age,

            "gender": case.gender,

            "last_seen_location":
                case.last_seen_location,

            "last_seen_date":
                case.last_seen_date,

            "description":
                case.description,

            "created_at":
                case.created_at,

            "status": (
                "ready"
                if profile_path.exists()
                else "created"
            ),

            "reference_images":
                reference_images,

            "reference_profile": (
                str(profile_path)
                if profile_path.exists()
                else None
            ),
        },
    }

# =========================================================
# GET REFERENCE IMAGE
# =========================================================

@router.get(
    "/{case_id}/references/{filename}"
)
def get_reference_image(
    case_id: int,
    filename: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Return an actual reference image belonging
    to a specific missing-person case.
    """

    # =====================================================
    # 1. CHECK CASE
    # =====================================================

    case = (
        db.query(
            MissingPersonCase
        )
        .filter(
            MissingPersonCase.id == case_id
        )
        .first()
    )

    if case is None:

        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )

    # =====================================================
    # 2. SANITIZE FILENAME
    # =====================================================

    safe_filename = Path(
        filename
    ).name

    # =====================================================
    # 3. REFERENCE DIRECTORY
    # =====================================================

    reference_directory = (
        Path("data")
        / "missing_persons"
        / str(case_id)
        / "references"
    )

    image_path = (
        reference_directory
        / safe_filename
    )

    # =====================================================
    # 4. SECURITY CHECK
    # =====================================================

    try:

        image_path.resolve().relative_to(
            reference_directory.resolve()
        )

    except ValueError:

        raise HTTPException(
            status_code=403,
            detail="Invalid file path",
        )

    # =====================================================
    # 5. CHECK FILE
    # =====================================================

    if not image_path.exists():

        raise HTTPException(
            status_code=404,
            detail="Reference image not found",
        )

    if not image_path.is_file():

        raise HTTPException(
            status_code=404,
            detail="Reference image not found",
        )

    # =====================================================
    # 6. VALIDATE IMAGE EXTENSION
    # =====================================================

    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }

    if (
        image_path.suffix.lower()
        not in allowed_extensions
    ):

        raise HTTPException(
            status_code=400,
            detail="Invalid reference image type",
        )

    # =====================================================
    # 7. RETURN IMAGE
    # =====================================================

    return FileResponse(
        path=image_path
    )











# =========================================================
# UPLOAD REFERENCE IMAGES
# =========================================================

@router.post(
    "/{case_id}/references"
)
async def upload_reference_images(

    case_id: int,

    files: list[
        UploadFile
    ] = File(
        ...,
        description=(
            "Upload one or more "
            "reference images"
        ),
    ),

    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload reference images for a
    database-backed missing-person case.
    """

    # =====================================================
    # 1. FIND CASE
    # =====================================================

    case = (
        db.query(
            MissingPersonCase
        )
        .filter(
            MissingPersonCase.id
            == case_id
        )
        .first()
    )

    if case is None:

        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )

    # =====================================================
    # 2. VALIDATE FILES
    # =====================================================

    if not files:

        raise HTTPException(
            status_code=400,
            detail=(
                "No reference images provided"
            ),
        )

    # =====================================================
    # 3. REFERENCE DIRECTORY
    # =====================================================

    reference_directory = (
        Path("data")
        / "missing_persons"
        / str(case_id)
        / "references"
    )

    reference_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    # =====================================================
    # 4. ALLOWED TYPES
    # =====================================================

    allowed_extensions = {

        ".jpg",

        ".jpeg",

        ".png",

        ".webp",
    }

    saved_files = []

    # =====================================================
    # 5. SAVE FILES
    # =====================================================

    for file in files:

        if not file.filename:
            continue

        original_name = (
            Path(
                file.filename
            ).name
        )

        extension = (
            Path(
                original_name
            )
            .suffix
            .lower()
        )

        if extension not in allowed_extensions:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported image type: "
                    f"{original_name}"
                ),
            )

        output_path = (
            reference_directory
            / original_name
        )

        # -------------------------------------------------
        # Avoid overwrite
        # -------------------------------------------------

        if output_path.exists():

            stem = output_path.stem

            suffix = output_path.suffix

            counter = 1

            while output_path.exists():

                output_path = (
                    reference_directory
                    / (
                        f"{stem}_"
                        f"{counter}"
                        f"{suffix}"
                    )
                )

                counter += 1

        # -------------------------------------------------
        # Write file
        # -------------------------------------------------

        try:

            with output_path.open(
                "wb"
            ) as buffer:

                shutil.copyfileobj(
                    file.file,
                    buffer,
                )

        finally:

            await file.close()

        saved_files.append(
            str(output_path)
        )

    # =====================================================
    # 6. MAKE SURE FILES EXIST
    # =====================================================

    if not saved_files:

        raise HTTPException(
            status_code=400,
            detail=(
                "No valid reference images "
                "were uploaded"
            ),
        )

    # =====================================================
    # 7. BUILD PROFILE
    # =====================================================

    try:

        print()
        print("=" * 60)

        print(
            "BUILDING REFERENCE PROFILE"
        )

        print("=" * 60)

        print(
            f"Case ID: {case_id}"
        )

        print(
            f"Case: {case.name}"
        )

        print(
            f"Reference directory: "
            f"{reference_directory}"
        )

        reference_profile = (
            build_reference_profile(
                reference_directory
            )
        )

        # -------------------------------------------------
        # Save profile
        # -------------------------------------------------

        profile_path = (
            reference_directory
            / "reference_profile.npz"
        )

        save_reference_profile(
            reference_profile,
            profile_path,
        )

        print(
            "REFERENCE PROFILE READY"
        )

        print(
            f"Successful images: "
            f"{len(reference_profile['successful_images'])}"
        )

        print(
            f"Failed images: "
            f"{len(reference_profile['failed_images'])}"
        )

        print(
            f"Profile: {profile_path}"
        )

        print("=" * 60)

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=(
                "Reference profile "
                "could not be built: "
                f"{error}"
            ),
        )

    # =====================================================
    # 8. RESPONSE
    # =====================================================

    return {

        "success": True,

        "case_id": case_id,

        "case_name": case.name,

        "reference_images":
            saved_files,

        "count":
            len(saved_files),

        "status":
            "ready",

        "reference_profile":
            str(profile_path),

        "reference_profile_info": {

            "total_images":
                reference_profile[
                    "total_images"
                ],

            "successful_images":
                reference_profile[
                    "successful_images"
                ],

            "failed_images":
                reference_profile[
                    "failed_images"
                ],
        },
    }