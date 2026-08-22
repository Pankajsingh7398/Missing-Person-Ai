import cv2
from pathlib import Path


# OpenCV includes this Haar Cascade with the package.
FACE_CASCADE_PATH = (
    cv2.data.haarcascades
    + "haarcascade_frontalface_default.xml"
)


face_detector = cv2.CascadeClassifier(
    FACE_CASCADE_PATH
)


def process_cctv_video(
    video_path: str,
    output_directory: str,
):
    """
    Process a CCTV video and detect faces.

    This is the first computer-vision stage.
    It does NOT identify the person yet.
    """

    video_path = Path(video_path)
    output_directory = Path(output_directory)

    output_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    if not video_path.exists():
        raise FileNotFoundError(
            f"Video not found: {video_path}"
        )

    if face_detector.empty():
        raise RuntimeError(
            "OpenCV face detector failed to load."
        )

    capture = cv2.VideoCapture(
        str(video_path)
    )

    if not capture.isOpened():
        raise RuntimeError(
            "Unable to open CCTV video."
        )

    fps = capture.get(
        cv2.CAP_PROP_FPS
    )

    total_frames = int(
        capture.get(
            cv2.CAP_PROP_FRAME_COUNT
        )
    )

    if fps <= 0:
        fps = 25

    duration = (
        total_frames / fps
        if total_frames > 0
        else 0
    )

    # Analyze approximately 5 frames per second.
    sample_every = max(
        1,
        int(fps / 5)
    )

    frame_number = 0
    analyzed_frames = 0
    detected_faces = 0

    results = []

    while True:

        success, frame = capture.read()

        if not success:
            break

        frame_number += 1

        # Skip frames to reduce processing load.
        if frame_number % sample_every != 0:
            continue

        analyzed_frames += 1

        # Resize large CCTV frames for faster detection.
        original_height, original_width = frame.shape[:2]

        max_width = 960

        if original_width > max_width:

            scale = (
                max_width /
                original_width
            )

            frame = cv2.resize(
                frame,
                (
                    int(original_width * scale),
                    int(original_height * scale),
                ),
            )

        gray = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2GRAY,
        )

        faces = face_detector.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(40, 40),
        )

        if len(faces) == 0:
            continue

        detected_faces += len(faces)

        timestamp = (
            frame_number / fps
        )

        for face_index, (
            x,
            y,
            width,
            height,
        ) in enumerate(faces):

            # Add some padding around the face.
            padding = int(
                max(width, height) * 0.25
            )

            x1 = max(
                0,
                x - padding
            )

            y1 = max(
                0,
                y - padding
            )

            x2 = min(
                frame.shape[1],
                x + width + padding
            )

            y2 = min(
                frame.shape[0],
                y + height + padding
            )

            face_crop = frame[
                y1:y2,
                x1:x2
            ]

            if face_crop.size == 0:
                continue

            filename = (
                f"frame_{frame_number:08d}"
                f"_face_{face_index + 1}.jpg"
            )

            output_path = (
                output_directory /
                filename
            )

            cv2.imwrite(
                str(output_path),
                face_crop,
            )

            results.append(
                {
                    "frame": frame_number,
                    "timestamp": round(
                        timestamp,
                        2,
                    ),
                    "face_index": (
                        face_index + 1
                    ),
                    "image": str(
                        output_path
                    ),
                    "bbox": {
                        "x": int(x),
                        "y": int(y),
                        "width": int(width),
                        "height": int(height),
                    },
                }
            )

    capture.release()

    return {
        "video": str(video_path),
        "fps": round(fps, 2),
        "total_frames": total_frames,
        "duration_seconds": round(
            duration,
            2,
        ),
        "analyzed_frames": analyzed_frames,
        "detected_faces": detected_faces,
        "results": results,
    }