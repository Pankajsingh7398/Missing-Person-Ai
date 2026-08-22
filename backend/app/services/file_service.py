from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile


BASE_DIR = Path(__file__).resolve().parents[2]

UPLOAD_DIR = BASE_DIR / "data" / "missing_persons"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)


ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}


async def save_person_photo(
    case_id: int,
    file: UploadFile,
) -> str:

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported image format: {extension}"
        )

    case_directory = UPLOAD_DIR / str(case_id)

    case_directory.mkdir(
        parents=True,
        exist_ok=True
    )

    filename = f"{uuid4().hex}{extension}"

    file_path = case_directory / filename

    contents = await file.read()

    file_path.write_bytes(contents)

    return str(file_path)

from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile


VIDEO_EXTENSIONS = {
    ".mp4",
    ".mov",
    ".avi",
    ".mkv",
    ".webm",
}


async def save_cctv_video(
    case_id: int,
    file: UploadFile,
) -> str:

    extension = Path(file.filename).suffix.lower()

    if extension not in VIDEO_EXTENSIONS:
        raise ValueError(
            f"Unsupported video format: {extension}"
        )

    case_directory = (
        UPLOAD_DIR / str(case_id) / "videos"
    )

    case_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    filename = (
        f"{uuid4().hex}{extension}"
    )

    file_path = case_directory / filename

    with file_path.open("wb") as output:

        while True:

            chunk = await file.read(1024 * 1024)

            if not chunk:
                break

            output.write(chunk)

    return str(file_path)