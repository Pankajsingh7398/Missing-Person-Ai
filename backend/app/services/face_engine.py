from pathlib import Path

import cv2


BASE_DIR = Path(__file__).resolve().parents[2]

MODELS_DIR = BASE_DIR / "models"

YUNET_MODEL = (
    MODELS_DIR
    / "face_detection_yunet_2023mar.onnx"
)

SFACE_MODEL = (
    MODELS_DIR
    / "face_recognition_sface_2021dec.onnx"
)


class FaceEngine:

    def __init__(self):

        if not YUNET_MODEL.exists():
            raise FileNotFoundError(
                f"YuNet model not found: {YUNET_MODEL}"
            )

        if not SFACE_MODEL.exists():
            raise FileNotFoundError(
                f"SFace model not found: {SFACE_MODEL}"
            )

        self.detector = cv2.FaceDetectorYN.create(
            str(YUNET_MODEL),
            "",
            (320, 320),
            0.75,
            0.3,
            5000,
        )

        self.recognizer = (
            cv2.FaceRecognizerSF.create(
                str(SFACE_MODEL),
                "",
            )
        )

    def detect_faces(self, image):

        if image is None:
            return []

        height, width = image.shape[:2]

        self.detector.setInputSize(
            (width, height)
        )

        _, faces = self.detector.detect(
            image
        )

        if faces is None:
            return []

        return faces

    def get_embedding(
        self,
        image,
        face,
    ):

        aligned_face = (
            self.recognizer.alignCrop(
                image,
                face,
            )
        )

        feature = (
            self.recognizer.feature(
                aligned_face
            )
        )

        return feature

    def compare(
        self,
        embedding1,
        embedding2,
    ):

        return float(
            self.recognizer.match(
                embedding1,
                embedding2,
                cv2.FaceRecognizerSF_FR_COSINE,
            )
        )


face_engine = FaceEngine()