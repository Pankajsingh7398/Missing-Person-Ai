from pathlib import Path

import cv2
import numpy as np

from app.services.face_engine import face_engine


# ---------------------------------------------------------
# DEFAULT REFERENCE DIRECTORY
# ---------------------------------------------------------
# Kept for backward compatibility with the existing
# test_reference_profile.py and old reference workflow.
#
# Case-based workflows can pass their own directory.
# ---------------------------------------------------------

REFERENCE_DIR = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "reference"
)


ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}


# ---------------------------------------------------------
# LOAD REFERENCE IMAGES
# ---------------------------------------------------------

def load_reference_images(
    reference_directory=None,
):
    """
    Load reference images from a directory.

    If no directory is supplied, the old default
    data/reference directory is used.
    """

    if reference_directory is None:
        reference_directory = REFERENCE_DIR

    reference_directory = Path(
        reference_directory
    )

    if not reference_directory.exists():
        raise FileNotFoundError(
            f"Reference directory not found: "
            f"{reference_directory}"
        )

    if not reference_directory.is_dir():
        raise RuntimeError(
            f"Reference path is not a directory: "
            f"{reference_directory}"
        )

    image_files = sorted(
        [
            path
            for path in reference_directory.iterdir()
            if path.is_file()
            and path.suffix.lower()
            in ALLOWED_EXTENSIONS
        ]
    )

    if not image_files:
        raise RuntimeError(
            f"No reference images found in: "
            f"{reference_directory}"
        )

    return image_files


# ---------------------------------------------------------
# EXTRACT EMBEDDING
# ---------------------------------------------------------

def extract_reference_embedding(
    image_path,
):
    """
    Read one reference image, detect faces,
    select the largest face and generate
    its face embedding.
    """

    image_path = Path(
        image_path
    )

    image = cv2.imread(
        str(image_path)
    )

    if image is None:
        raise RuntimeError(
            f"Could not read image: "
            f"{image_path}"
        )

    faces = face_engine.detect_faces(
        image
    )

    if faces is None or len(faces) == 0:
        raise RuntimeError(
            f"No face detected: "
            f"{image_path.name}"
        )

    # -----------------------------------------------------
    # Select largest detected face
    # -----------------------------------------------------

    face = max(
        faces,
        key=lambda item: (
            float(item[2])
            * float(item[3])
        ),
    )

    embedding = face_engine.get_embedding(
        image,
        face,
    )

    if embedding is None:
        raise RuntimeError(
            f"Could not generate embedding: "
            f"{image_path.name}"
        )

    embedding = np.asarray(
        embedding,
        dtype=np.float32,
    )

    if embedding.size == 0:
        raise RuntimeError(
            f"Empty embedding generated: "
            f"{image_path.name}"
        )

    return embedding


# ---------------------------------------------------------
# BUILD REFERENCE PROFILE
# ---------------------------------------------------------

def build_reference_profile(
    reference_directory=None,
):
    """
    Build a reference profile from all images
    inside the supplied directory.

    The returned profile contains:

        embedding
            Average normalized embedding.

        embeddings
            Individual embeddings.

        total_images
            Number of images found.

        successful_images
            Images successfully processed.

        failed_images
            Images that failed.
    """

    image_paths = load_reference_images(
        reference_directory
    )

    embeddings = []

    successful_files = []

    failed_files = []

    # -----------------------------------------------------
    # Process every reference image
    # -----------------------------------------------------

    for image_path in image_paths:

        try:

            embedding = (
                extract_reference_embedding(
                    image_path
                )
            )

            embeddings.append(
                embedding.astype(
                    np.float32
                )
            )

            successful_files.append(
                image_path.name
            )

            print(
                f"Reference OK: "
                f"{image_path.name}"
            )

        except Exception as error:

            failed_files.append(
                {
                    "file": image_path.name,
                    "error": str(error),
                }
            )

            print(
                f"Reference FAILED: "
                f"{image_path.name} | "
                f"{error}"
            )

    # -----------------------------------------------------
    # Make sure at least one face was found
    # -----------------------------------------------------

    if not embeddings:
        raise RuntimeError(
            "No valid reference faces found."
        )

    # -----------------------------------------------------
    # Average embedding
    # -----------------------------------------------------

    embedding_matrix = np.vstack(
        embeddings
    )

    profile = np.mean(
        embedding_matrix,
        axis=0,
        keepdims=True,
    )

    # -----------------------------------------------------
    # Normalize average embedding
    # -----------------------------------------------------

    norm = np.linalg.norm(
        profile
    )

    if norm == 0:
        raise RuntimeError(
            "Reference profile normalization failed."
        )

    profile = (
        profile / norm
    )

    # -----------------------------------------------------
    # Return profile
    # -----------------------------------------------------

    return {
        "embedding": profile.astype(
            np.float32
        ),

        # Keep individual embeddings.
        # CCTV matching currently uses these.
        "embeddings": embeddings,

        "total_images": len(
            image_paths
        ),

        "successful_images":
            successful_files,

        "failed_images":
            failed_files,
    }


# ---------------------------------------------------------
# SAVE REFERENCE PROFILE
# ---------------------------------------------------------

def save_reference_profile(
    profile,
    output_path,
):
    """
    Save a case-specific reference profile.

    NumPy .npz is used because face embeddings
    cannot safely be stored directly in JSON.
    """

    output_path = Path(
        output_path
    )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    embeddings = np.vstack(
        profile["embeddings"]
    ).astype(
        np.float32
    )

    embedding = np.asarray(
        profile["embedding"],
        dtype=np.float32,
    )

    np.savez_compressed(
        output_path,
        embedding=embedding,
        embeddings=embeddings,
    )

    return output_path


# ---------------------------------------------------------
# LOAD SAVED REFERENCE PROFILE
# ---------------------------------------------------------

def load_reference_profile(
    profile_path,
):
    """
    Load a previously saved case reference profile.
    """

    profile_path = Path(
        profile_path
    )

    if not profile_path.exists():
        raise FileNotFoundError(
            f"Reference profile not found: "
            f"{profile_path}"
        )

    data = np.load(
        profile_path,
    )

    embedding = data[
        "embedding"
    ]

    embeddings_array = data[
        "embeddings"
    ]

    embeddings = [
        row.astype(
            np.float32
        )
        for row in embeddings_array
    ]

    return {
        "embedding": embedding.astype(
            np.float32
        ),

        "embeddings": embeddings,

        "total_images": len(
            embeddings
        ),
    }