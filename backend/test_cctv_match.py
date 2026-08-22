import json
import sys
from pathlib import Path

from app.services.cctv_matcher import (
    analyze_cctv_video,
)


if len(sys.argv) < 2:

    print(
        "Usage:"
    )

    print(
        "python test_cctv_match.py "
        "<video_path>"
    )

    sys.exit(1)


video_path = Path(
    sys.argv[1]
)


output_directory = (
    Path("data")
    / "cctv_results"
)


result = analyze_cctv_video(
    video_path,
    output_directory,
    frame_skip=5,
)


print()
print(
    "================================"
)

print(
    "CCTV ANALYSIS COMPLETE"
)

print(
    "================================"
)

print(
    "Total frames:",
    result["total_frames"]
)

print(
    "Processed frames:",
    result["processed_frames"]
)

print(
    "Potential matches:",
    len(result["matches"])
)


result_file = (
    output_directory
    / "results.json"
)


with open(
    result_file,
    "w",
    encoding="utf-8",
) as file:

    json.dump(
        result,
        file,
        indent=2,
    )


print()
print(
    "Results saved to:"
)

print(
    result_file
)