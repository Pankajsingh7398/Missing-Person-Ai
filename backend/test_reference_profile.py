from app.services.reference_service import (
    build_reference_profile,
)


profile = build_reference_profile()


print()
print("==============================")
print("REFERENCE PROFILE")
print("==============================")

print(
    "Total images:",
    profile["total_images"]
)

print(
    "Successful:",
    len(profile["successful_images"])
)

print(
    "Successful files:",
    profile["successful_images"]
)

print(
    "Failed:",
    profile["failed_images"]
)

print(
    "Embedding shape:",
    profile["embedding"].shape
)

print("==============================")