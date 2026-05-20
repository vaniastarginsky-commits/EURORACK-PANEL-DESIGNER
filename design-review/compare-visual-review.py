#!/usr/bin/env python3

import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageStat


ROOT = Path(__file__).resolve().parents[1]
CURRENT_DIR = ROOT / "design-review" / "current"
REFERENCE_DIR = ROOT / "design-review" / "reference"
AFTER_DIR = ROOT / "design-review" / "after"
DIFF_DIR = AFTER_DIR / "diffs"
REPORT_PATH = AFTER_DIR / "visual-review-comparison.json"

PIXEL_THRESHOLD = 8
DIFF_PERCENT_REPORTING_THRESHOLD = 0.05


def main():
    DIFF_DIR.mkdir(parents=True, exist_ok=True)
    comparisons = []

    for after_path in sorted(AFTER_DIR.glob("*--*.png")):
        baseline_path = choose_baseline(after_path.name)
        if not baseline_path:
            comparisons.append(
                {
                    "file": after_path.name,
                    "baseline": None,
                    "status": "missing-baseline",
                }
            )
            continue

        result = compare_pair(baseline_path, after_path)
        comparisons.append(result)

    report = {
        "baselinePreference": "design-review/reference, falling back to design-review/current",
        "pixelThreshold": PIXEL_THRESHOLD,
        "diffPercentReportingThreshold": DIFF_PERCENT_REPORTING_THRESHOLD,
        "comparisons": comparisons,
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n")
    write_contact_sheet(AFTER_DIR / "contact-after.png", sorted(AFTER_DIR.glob("*--*.png")))
    write_diff_contact_sheet(AFTER_DIR / "contact-diffs.png", comparisons)

    changed = [item for item in comparisons if item.get("diffPercent", 0) >= DIFF_PERCENT_REPORTING_THRESHOLD]
    print(f"Compared {len(comparisons)} after screenshots.")
    if changed:
        print("Screenshots with visible pixel differences:")
        for item in changed:
            print(
                f"- {item['file']}: {item['diffPercent']:.3f}% pixels changed "
                f"(baseline: {item['baseline']})"
            )
    else:
        print("No visible pixel differences above threshold.")


def choose_baseline(filename):
    reference_path = REFERENCE_DIR / filename
    if reference_path.exists():
        return reference_path

    current_path = CURRENT_DIR / filename
    if current_path.exists():
        return current_path

    return None


def compare_pair(baseline_path, after_path):
    baseline = Image.open(baseline_path).convert("RGB")
    after = Image.open(after_path).convert("RGB")

    if baseline.size != after.size:
        return {
            "file": after_path.name,
            "baseline": str(baseline_path.relative_to(ROOT)),
            "status": "size-mismatch",
            "baselineSize": baseline.size,
            "afterSize": after.size,
        }

    raw_diff = ImageChops.difference(baseline, after)
    diff_mask = raw_diff.convert("L").point(lambda value: 255 if value > PIXEL_THRESHOLD else 0)
    changed_pixels = ImageStat.Stat(diff_mask).sum[0] / 255
    total_pixels = baseline.size[0] * baseline.size[1]
    diff_percent = changed_pixels / total_pixels * 100

    diff_path = None
    if diff_percent >= DIFF_PERCENT_REPORTING_THRESHOLD:
        highlighted = ImageEnhance.Brightness(raw_diff).enhance(6)
        diff_path = DIFF_DIR / after_path.name
        highlighted.save(diff_path)

    return {
        "file": after_path.name,
        "baseline": str(baseline_path.relative_to(ROOT)),
        "status": "changed" if diff_percent >= DIFF_PERCENT_REPORTING_THRESHOLD else "same",
        "changedPixels": int(changed_pixels),
        "diffPercent": round(diff_percent, 4),
        "diffImage": str(diff_path.relative_to(ROOT)) if diff_path else None,
    }


def write_contact_sheet(out_path, files):
    if not files:
        return

    thumbs = []
    for file_path in files:
        image = Image.open(file_path).convert("RGB")
        image.thumbnail((360, 225))
        thumbs.append((file_path.name, image.copy()))

    write_sheet(out_path, thumbs)


def write_diff_contact_sheet(out_path, comparisons):
    changed = [item for item in comparisons if item.get("diffImage")]
    if not changed:
        return

    thumbs = []
    for item in changed:
        image = Image.open(ROOT / item["diffImage"]).convert("RGB")
        image.thumbnail((360, 225))
        thumbs.append((f"{item['file']}\n{item['diffPercent']:.3f}% changed", image.copy()))

    write_sheet(out_path, thumbs)


def write_sheet(out_path, thumbs):
    cols = 3
    pad = 14
    thumb_w = 360
    thumb_h = 225
    label_h = 44
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new(
        "RGB",
        (cols * thumb_w + (cols + 1) * pad, rows * (thumb_h + label_h) + (rows + 1) * pad),
        (18, 18, 18),
    )
    draw = ImageDraw.Draw(sheet)

    for index, (label, image) in enumerate(thumbs):
        x = pad + (index % cols) * (thumb_w + pad)
        y = pad + (index // cols) * (thumb_h + label_h + pad)
        sheet.paste(image, (x, y))
        draw.text((x, y + thumb_h + 4), label, fill=(230, 220, 205))

    sheet.save(out_path)


if __name__ == "__main__":
    main()
