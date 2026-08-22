from pathlib import Path
from datetime import datetime
import json

import cv2
import numpy as np

from app.services.face_engine import face_engine
from app.services.reference_service import (
    build_reference_profile,
    load_reference_profile,
)


# =========================================================
# MATCHING CONFIGURATION
# =========================================================

MATCH_THRESHOLD = 0.70

MIN_CONFIRMATIONS = 3

CONFIRMATION_WINDOW = 4


# =========================================================
# EMBEDDING HELPERS
# =========================================================

def prepare_embedding(embedding):
    """
    Convert a face embedding into a consistent
    1-D float32 normalized vector.

    This prevents shape errors such as:

        (512,)
        (1, 512)
        (512, 1)

    """

    if embedding is None:

        raise ValueError(
            "Face embedding is None."
        )

    embedding = np.asarray(
        embedding,
        dtype=np.float32,
    )

    # Flatten everything to:
    #
    # (512,)
    #
    embedding = embedding.reshape(-1)

    if embedding.size == 0:

        raise ValueError(
            "Face embedding is empty."
        )

    norm = np.linalg.norm(
        embedding
    )

    if norm == 0:

        raise ValueError(
            "Face embedding has zero magnitude."
        )

    embedding = (
        embedding / norm
    )

    return embedding.astype(
        np.float32
    )


def cosine_similarity(
    embedding_a,
    embedding_b,
):
    """
    Calculate cosine similarity between
    two face embeddings.

    Both embeddings are normalized before
    comparison.
    """

    a = prepare_embedding(
        embedding_a
    )

    b = prepare_embedding(
        embedding_b
    )

    if a.shape != b.shape:

        raise ValueError(
            "Embedding shape mismatch: "
            f"{a.shape} vs {b.shape}"
        )

    similarity = float(
        np.dot(a, b)
    )

    return similarity


# =========================================================
# MATCH FACE
# =========================================================

def match_face(
    face_embedding,
    reference_embeddings,
):
    """
    Compare one CCTV face embedding against
    all reference embeddings.

    Returns:

        best_score
        best_reference_index
    """

    face_embedding = prepare_embedding(
        face_embedding
    )

    best_score = -1.0

    best_reference_index = -1

    for index, reference_embedding in enumerate(
        reference_embeddings
    ):

        reference_embedding = (
            prepare_embedding(
                reference_embedding
            )
        )

        score = cosine_similarity(
            face_embedding,
            reference_embedding,
        )

        if score > best_score:

            best_score = score

            best_reference_index = (
                index
            )

    return (
        best_score,
        best_reference_index,
    )


# =========================================================
# GROUP AND CONFIRM MATCHES
# =========================================================

def group_and_confirm_matches(
    matches,
    min_confirmations=MIN_CONFIRMATIONS,
    confirmation_window=CONFIRMATION_WINDOW,
):
    """
    Convert individual frame matches into
    confirmed sightings.

    A sighting is confirmed when:

    1. At least min_confirmations matches occur.
    2. Consecutive processed samples are within
       confirmation_window samples.

    The window is measured in processed samples
    (not raw video frames) so the tolerance
    remains consistent regardless of frame_skip.
    """

    if not matches:

        return []

    # -----------------------------------------------------
    # SORT MATCHES BY PROCESSED INDEX
    # -----------------------------------------------------

    sorted_matches = sorted(
        matches,
        key=lambda item: item.get(
            "processed_index",
            item["frame"],
        ),
    )

    # -----------------------------------------------------
    # CREATE GROUPS
    # -----------------------------------------------------

    groups = []

    current_group = [
        sorted_matches[0]
    ]

    for match in sorted_matches[1:]:

        previous = (
            current_group[-1]
        )

        frame_gap = (
            match.get(
                "processed_index",
                match["frame"],
            )
            - previous.get(
                "processed_index",
                previous["frame"],
            )
        )

        if (
            frame_gap
            <= confirmation_window
        ):

            current_group.append(
                match
            )

        else:

            groups.append(
                current_group
            )

            current_group = [
                match
            ]

    # Add final group

    groups.append(
        current_group
    )

    # -----------------------------------------------------
    # CONFIRM GROUPS
    # -----------------------------------------------------

    confirmed_sightings = []

    for group in groups:

        if (
            len(group)
            < min_confirmations
        ):

            continue

        # Best match in this group

        best_match = max(
            group,
            key=lambda item: item[
                "similarity"
            ],
        )

        first_match = group[0]

        last_match = group[-1]

        sighting = {

            "sighting_id":
                len(
                    confirmed_sightings
                ) + 1,

            "start_frame":
                first_match[
                    "frame"
                ],

            "end_frame":
                last_match[
                    "frame"
                ],

            "start_timestamp":
                first_match[
                    "timestamp"
                ],

            "end_timestamp":
                last_match[
                    "timestamp"
                ],

            "duration_seconds":
                round(
                    last_match[
                        "timestamp"
                    ]
                    - first_match[
                        "timestamp"
                    ],
                    2,
                ),

            "confirmation_count":
                len(group),

            "best_similarity":
                best_match[
                    "similarity"
                ],

            "reference_index":
                best_match[
                    "reference_index"
                ],

            "best_frame":
                best_match[
                    "frame"
                ],

            "evidence_image":
                best_match[
                    "evidence_image"
                ],

            "bounding_box":
                best_match[
                    "bounding_box"
                ],
        }

        confirmed_sightings.append(
            sighting
        )

    return confirmed_sightings


# =========================================================
# ANALYZE CCTV VIDEO
# =========================================================

def analyze_cctv_video(
    video_path,
    output_directory,
    frame_skip=5,
    reference_profile_path=None,
):
    """
    Analyze CCTV video against a reference
    face profile.

    Supports:

    - Case-specific reference profile
    - Default reference profile
    - Face detection
    - Face embedding
    - Cosine similarity
    - Potential matches
    - Confirmed sightings
    - Evidence images
    - results.json
    """

    # =====================================================
    # PATHS
    # =====================================================

    video_path = Path(
        video_path
    )

    output_directory = Path(
        output_directory
    )

    if not video_path.exists():

        raise FileNotFoundError(
            f"Video not found: {video_path}"
        )

    # =====================================================
    # CREATE ANALYSIS ID
    # =====================================================

    analysis_id = (
        datetime.now().strftime(
            "%Y%m%d_%H%M%S_%f"
        )
    )

    analysis_directory = (
        output_directory
        / analysis_id
    )

    analysis_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    # =====================================================
    # RESULT FILE
    # =====================================================

    result_file = (
        analysis_directory
        / "results.json"
    )

    # =====================================================
    # START LOG
    # =====================================================

    print()

    print(
        "=" * 60
    )

    print(
        "STARTING CCTV ANALYSIS"
    )

    print(
        "=" * 60
    )

    print(
        f"Analysis ID: {analysis_id}"
    )

    print(
        f"Video: {video_path}"
    )

    # =====================================================
    # LOAD REFERENCE PROFILE
    # =====================================================

    if reference_profile_path is not None:

        reference_profile_path = Path(
            reference_profile_path
        )

        print()

        print(
            "Loading case-specific reference profile..."
        )

        print(
            f"Profile: "
            f"{reference_profile_path}"
        )

        if not reference_profile_path.exists():

            raise FileNotFoundError(
                "Reference profile not found: "
                f"{reference_profile_path}"
            )

        reference_profile = (
            load_reference_profile(
                reference_profile_path
            )
        )

    else:

        print()

        print(
            "No case-specific profile supplied."
        )

        print(
            "Building default reference profile..."
        )

        reference_profile = (
            build_reference_profile()
        )

    # =====================================================
    # GET REFERENCE EMBEDDINGS
    # =====================================================

    if not isinstance(
        reference_profile,
        dict,
    ):

        raise RuntimeError(
            "Invalid reference profile. "
            "Expected a dictionary."
        )

    if (
        "embeddings"
        not in reference_profile
    ):

        raise RuntimeError(
            "Reference profile does not contain "
            "'embeddings'."
        )

    reference_embeddings = (
        reference_profile[
            "embeddings"
        ]
    )

    if not reference_embeddings:

        raise RuntimeError(
            "Reference profile contains "
            "no embeddings."
        )

    # =====================================================
    # NORMALIZE REFERENCE EMBEDDINGS
    # =====================================================

    normalized_reference_embeddings = []

    for index, embedding in enumerate(
        reference_embeddings
    ):

        try:

            normalized = (
                prepare_embedding(
                    embedding
                )
            )

            normalized_reference_embeddings.append(
                normalized
            )

            print(
                f"Reference embedding "
                f"{index + 1}: "
                f"shape={normalized.shape}, "
                f"dtype={normalized.dtype}"
            )

        except Exception as exc:

            raise RuntimeError(
                "Could not prepare reference "
                f"embedding {index + 1}: "
                f"{exc}"
            )

    reference_embeddings = (
        normalized_reference_embeddings
    )

    print()

    print(
        f"Reference embeddings loaded: "
        f"{len(reference_embeddings)}"
    )

    # =====================================================
    # REFERENCE EMBEDDING DIMENSION
    # =====================================================

    reference_dimension = (
        reference_embeddings[0].shape
    )

    print(
        f"Reference embedding shape: "
        f"{reference_dimension}"
    )

    # =====================================================
    # OPEN VIDEO
    # =====================================================

    capture = cv2.VideoCapture(
        str(video_path)
    )

    if not capture.isOpened():

        raise RuntimeError(
            f"Could not open video: "
            f"{video_path}"
        )

    # =====================================================
    # VIDEO INFORMATION
    # =====================================================

    fps = capture.get(
        cv2.CAP_PROP_FPS
    )

    if fps <= 0:

        fps = 30.0

    total_frames = int(
        capture.get(
            cv2.CAP_PROP_FRAME_COUNT
        )
    )

    duration_seconds = (
        total_frames / fps
    )

    print()

    print(
        f"Video FPS: {fps:.2f}"
    )

    print(
        f"Total frames: {total_frames}"
    )

    print(
        f"Duration: "
        f"{duration_seconds:.2f}s"
    )

    print(
        f"Frame skip: {frame_skip}"
    )

    # =====================================================
    # ANALYSIS VARIABLES
    # =====================================================

    matches = []

    frame_number = 0

    evidence_counter = 0

    processed_frames = 0

    # =====================================================
    # PROCESS VIDEO
    # =====================================================

    try:

        while True:

            success, frame = (
                capture.read()
            )

            if not success:

                break

            frame_number += 1

            # ---------------------------------------------
            # FRAME SKIP
            # ---------------------------------------------

            if (
                frame_number
                % frame_skip
                != 0
            ):

                continue

            processed_frames += 1

            timestamp = (
                frame_number / fps
            )

            # ---------------------------------------------
            # DETECT FACES
            # ---------------------------------------------

            faces = (
                face_engine.detect_faces(
                    frame
                )
            )

            face_count = (
                0
                if faces is None
                else len(faces)
            )

            face_sizes = ""

            if faces is not None and len(faces) > 0:

                face_sizes = " | Sizes: " + ", ".join(
                    f"{int(f[2])}x{int(f[3])}"
                    for f in faces
                )

            print(
                f"Frame {frame_number} | "
                f"Time {timestamp:.2f}s | "
                f"Faces detected: "
                f"{face_count}"
                f"{face_sizes}"
            )

            if (
                faces is None
                or len(faces) == 0
            ):

                continue

            # ---------------------------------------------
            # PROCESS EACH FACE
            # ---------------------------------------------

            for face_index, face in enumerate(
                faces
            ):

                try:

                    embedding = (
                        face_engine.get_embedding(
                            frame,
                            face,
                        )
                    )

                    # -------------------------------------
                    # NORMALIZE CCTV EMBEDDING
                    # -------------------------------------

                    embedding = (
                        prepare_embedding(
                            embedding
                        )
                    )

                    print(
                        f"  CCTV embedding: "
                        f"shape={embedding.shape}"
                    )

                    # -------------------------------------
                    # CHECK DIMENSION
                    # -------------------------------------

                    if (
                        embedding.shape
                        != reference_dimension
                    ):

                        raise ValueError(
                            "CCTV embedding dimension "
                            "does not match reference "
                            "embedding: "
                            f"{embedding.shape} "
                            f"vs "
                            f"{reference_dimension}"
                        )

                    # -------------------------------------
                    # MATCH
                    # -------------------------------------

                    score, reference_index = (
                        match_face(
                            embedding,
                            reference_embeddings,
                        )
                    )

                    x, y, w, h = map(
                        int,
                        face[:4]
                    )

                    print(
                        f"  Face "
                        f"{face_index + 1} | "
                        f"Score: "
                        f"{score:.4f}"
                    )

                    # -------------------------------------
                    # POTENTIAL MATCH
                    # -------------------------------------

                    if (
                        score
                        >= MATCH_THRESHOLD
                    ):

                        evidence_counter += 1

                        evidence_filename = (
                            f"match_"
                            f"{evidence_counter:04d}"
                            f".jpg"
                        )

                        evidence_path = (
                            analysis_directory
                            / evidence_filename
                        )

                        # ---------------------------------
                        # COPY FRAME
                        # ---------------------------------

                        evidence_frame = (
                            frame.copy()
                        )

                        # ---------------------------------
                        # DRAW BOX
                        # ---------------------------------

                        cv2.rectangle(
                            evidence_frame,
                            (x, y),
                            (
                                x + w,
                                y + h,
                            ),
                            (0, 255, 0),
                            3,
                        )

                        label = (
                            f"Potential Match "
                            f"{score:.2f}"
                        )

                        cv2.putText(
                            evidence_frame,
                            label,
                            (
                                x,
                                max(
                                    y - 10,
                                    20,
                                ),
                            ),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.7,
                            (0, 255, 0),
                            2,
                        )

                        # ---------------------------------
                        # SAVE EVIDENCE
                        # ---------------------------------

                        cv2.imwrite(
                            str(
                                evidence_path
                            ),
                            evidence_frame,
                        )

                        # ---------------------------------
                        # STORE MATCH
                        # ---------------------------------

                        match = {

                            "frame":
                                frame_number,

                            "processed_index":
                                processed_frames,

                            "timestamp":
                                round(
                                    timestamp,
                                    2,
                                ),

                            "face_index":
                                face_index,

                            "similarity":
                                round(
                                    float(
                                        score
                                    ),
                                    4,
                                ),

                            "reference_index":
                                reference_index,

                            "bounding_box": {

                                "x": x,

                                "y": y,

                                "width": w,

                                "height": h,

                            },

                            "evidence_image":
                                evidence_filename,
                        }

                        matches.append(
                            match
                        )

                except Exception as face_error:

                    print(
                        f"  Face "
                        f"{face_index + 1} "
                        f"processing error: "
                        f"{face_error}"
                    )

                    # Continue processing
                    # other faces.

                    continue

    finally:

        capture.release()

    # =====================================================
    # CONFIRM POTENTIAL MATCHES
    # =====================================================

    confirmed_sightings = (
        group_and_confirm_matches(
            matches,
            min_confirmations=(
                MIN_CONFIRMATIONS
            ),
            confirmation_window=(
                CONFIRMATION_WINDOW
            ),
        )
    )

    # =====================================================
    # MATCH CONFIRMATION LOG
    # =====================================================

    print()

    print(
        "=" * 60
    )

    print(
        "MATCH CONFIRMATION"
    )

    print(
        "=" * 60
    )

    print(
        f"Raw potential matches: "
        f"{len(matches)}"
    )

    print(
        f"Confirmed sightings: "
        f"{len(confirmed_sightings)}"
    )

    for sighting in (
        confirmed_sightings
    ):

        print()

        print(
            f"Sighting "
            f"#{sighting['sighting_id']}"
        )

        print(
            f"  Time: "
            f"{sighting['start_timestamp']:.2f}s "
            f"→ "
            f"{sighting['end_timestamp']:.2f}s"
        )

        print(
            f"  Confirmations: "
            f"{sighting['confirmation_count']}"
        )

        print(
            f"  Best similarity: "
            f"{sighting['best_similarity']:.4f}"
        )

        print(
            f"  Evidence: "
            f"{sighting['evidence_image']}"
        )

    # =====================================================
    # BUILD RESULT
    # =====================================================

    result = {

        "success": True,

        "analysis_id":
            analysis_id,

        "video":
            str(video_path),

        "video_name":
            video_path.name,

        "fps":
            round(
                float(fps),
                2,
            ),

        "total_frames":
            total_frames,

        "processed_frames":
            processed_frames,

        "duration_seconds":
            round(
                float(
                    duration_seconds
                ),
                2,
            ),

        "frame_skip":
            frame_skip,

        "reference_images":
            len(
                reference_embeddings
            ),

        "match_threshold":
            MATCH_THRESHOLD,

        "min_confirmations":
            MIN_CONFIRMATIONS,

        "confirmation_window":
            CONFIRMATION_WINDOW,

        "potential_matches":
            len(matches),

        "confirmed_sightings":
            len(
                confirmed_sightings
            ),

        "matches":
            matches,

        "sightings":
            confirmed_sightings,

        "result_directory":
            str(
                analysis_directory
            ),

        "results_file":
            str(
                result_file
            ),
    }

    # =====================================================
    # SAVE RESULTS.JSON
    # =====================================================

    try:

        with result_file.open(
            "w",
            encoding="utf-8",
        ) as json_file:

            json.dump(
                result,
                json_file,
                indent=4,
                ensure_ascii=False,
            )

    except Exception as exc:

        raise RuntimeError(
            "Could not save results.json: "
            f"{exc}"
        )

    # =====================================================
    # FINAL LOG
    # =====================================================

    print()

    print(
        "=" * 60
    )

    print(
        "CCTV ANALYSIS COMPLETE"
    )

    print(
        "=" * 60
    )

    print(
        f"Total frames: "
        f"{total_frames}"
    )

    print(
        f"Processed frames: "
        f"{processed_frames}"
    )

    print(
        f"Raw potential matches: "
        f"{len(matches)}"
    )

    print(
        f"Confirmed sightings: "
        f"{len(confirmed_sightings)}"
    )

    print(
        f"Evidence images: "
        f"{evidence_counter}"
    )

    print()

    if confirmed_sightings:

        print(
            "CONFIRMED SIGHTINGS"
        )

        print(
            "-" * 60
        )

        for sighting in (
            confirmed_sightings
        ):

            print(
                f"Sighting "
                f"#{sighting['sighting_id']} | "
                f"{sighting['start_timestamp']:.2f}s "
                f"→ "
                f"{sighting['end_timestamp']:.2f}s | "
                f"Confirmations: "
                f"{sighting['confirmation_count']} | "
                f"Best score: "
                f"{sighting['best_similarity']:.4f}"
            )

    else:

        print(
            "No confirmed sightings found."
        )

    print()

    print(
        "Results saved to:"
    )

    print(
        result_file
    )

    print(
        "=" * 60
    )

    return result