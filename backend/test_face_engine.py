import cv2

from app.services.face_engine import face_engine


IMAGE_1 = "data/test_reference.jpg"
IMAGE_2 = "data/test_reference_2.jpg"


def load_image(path):
    image = cv2.imread(path)

    if image is None:
        raise RuntimeError(
            f"Could not read image: {path}"
        )

    return image


def get_embedding(image, path):

    faces = face_engine.detect_faces(image)

    print(f"{path}: {len(faces)} face(s) detected")

    if len(faces) == 0:
        raise RuntimeError(
            f"No face detected in {path}"
        )

    # If multiple faces exist, use the largest face.
    face = max(
        faces,
        key=lambda item: item[2] * item[3]
    )

    print(
        f"Selected face confidence: "
        f"{face[-1]:.3f}"
    )

    embedding = face_engine.get_embedding(
        image,
        face
    )

    return embedding


# -------------------------
# Load images
# -------------------------

image1 = load_image(IMAGE_1)
image2 = load_image(IMAGE_2)


# -------------------------
# Generate embeddings
# -------------------------

print("\nGenerating embeddings...\n")

embedding1 = get_embedding(
    image1,
    IMAGE_1
)

embedding2 = get_embedding(
    image2,
    IMAGE_2
)


# -------------------------
# Compare
# -------------------------

score = face_engine.compare(
    embedding1,
    embedding2
)


print("\n==============================")
print("FACE MATCH RESULT")
print("==============================")

print(
    f"Cosine similarity: {score:.4f}"
)

print("==============================")