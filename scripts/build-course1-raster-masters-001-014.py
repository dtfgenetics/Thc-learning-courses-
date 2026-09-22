#!/usr/bin/env python3
"""Build Course 1 governed raster replacement candidates 001-014.

Pure raster renderer: Pillow only. No SVG source or SVG output is created.
The copy source is visuals/COURSE1-RASTER-COPY-LOCK-001-014.json.
These are review candidates, not learner-facing release assets.
"""

from __future__ import annotations

import hashlib
import json
import math
import os
import random
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SPEC_PATH = ROOT / "visuals" / "COURSE1-RASTER-COPY-LOCK-001-014.json"
OUT_DIR = ROOT / "visuals" / "review-candidates" / "course1" / "production-masters"

W, H = 2400, 3200

COLORS = {
    "ink": "#173F32",
    "ink2": "#244E40",
    "cream": "#F7F2E7",
    "paper": "#FCFAF4",
    "gold": "#D4AD3D",
    "gold2": "#EADFB9",
    "purple": "#6F2C91",
    "green": "#4F8B67",
    "sage": "#DDE9E1",
    "muted": "#5E6C65",
    "white": "#FFFFFF",
    "red": "#A84136",
    "line": "#9FB5A9",
}

FONT_REGULAR_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
]
FONT_BOLD_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
]


def first_existing(paths: Iterable[str]) -> str:
    for p in paths:
        if os.path.exists(p):
            return p
    raise RuntimeError(f"No supported font found: {list(paths)}")


FONT_REGULAR = first_existing(FONT_REGULAR_CANDIDATES)
FONT_BOLD = first_existing(FONT_BOLD_CANDIDATES)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REGULAR, size=size)


def text_width(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> float:
    return draw.textlength(text, font=fnt)


def wrap_px(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    if not words:
        return [""]
    lines: list[str] = []
    line = words[0]
    for word in words[1:]:
        trial = f"{line} {word}"
        if text_width(draw, trial, fnt) <= max_width:
            line = trial
        else:
            lines.append(line)
            line = word
    lines.append(line)
    return lines


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    fnt: ImageFont.FreeTypeFont,
    fill: str,
    max_width: int,
    line_gap: int = 12,
    max_lines: int | None = None,
) -> int:
    x, y = xy
    lines = wrap_px(draw, text, fnt, max_width)
    if max_lines is not None and len(lines) > max_lines:
        lines = lines[:max_lines]
        while lines and text_width(draw, lines[-1] + "…", fnt) > max_width:
            words = lines[-1].split()
            if len(words) <= 1:
                break
            lines[-1] = " ".join(words[:-1])
        if lines:
            lines[-1] = lines[-1].rstrip(".,;:") + "…"
    bbox = draw.textbbox((0, 0), "Ag", font=fnt)
    line_h = bbox[3] - bbox[1] + line_gap
    for i, line in enumerate(lines):
        draw.text((x, y + i * line_h), line, font=fnt, fill=fill)
    return len(lines) * line_h


def leaf_mark(draw: ImageDraw.ImageDraw, cx: int, cy: int, scale: float, fill: str) -> None:
    # Simple three-leaf academy mark; intentionally generic and raster-drawn.
    def ellipse_at(dx: float, dy: float, rx: float, ry: float, angle: float):
        box = Image.new("RGBA", (int(rx * 2 + 20), int(ry * 2 + 20)), (0, 0, 0, 0))
        bd = ImageDraw.Draw(box)
        bd.ellipse((10, 10, 10 + rx * 2, 10 + ry * 2), fill=fill)
        rot = box.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
        img.alpha_composite(rot, (int(cx + dx - rot.width / 2), int(cy + dy - rot.height / 2)))

    # Access the current image through closure set by render_asset.
    global img
    ellipse_at(0 * scale, -30 * scale, 30 * scale, 72 * scale, 0)
    ellipse_at(-52 * scale, 5 * scale, 27 * scale, 62 * scale, 38)
    ellipse_at(52 * scale, 5 * scale, 27 * scale, 62 * scale, -38)
    draw.line((cx, cy + 8 * scale, cx, cy + 105 * scale), fill=fill, width=max(6, int(12 * scale)))


def add_paper_texture(image: Image.Image, seed: str) -> None:
    # Very subtle deterministic grain prevents sterile flat output without obscuring copy.
    rng = random.Random(int(hashlib.sha256(seed.encode("utf-8")).hexdigest()[:16], 16))
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for _ in range(9000):
        x = rng.randrange(W)
        y = rng.randrange(H)
        a = rng.randrange(2, 8)
        tone = 90 if rng.random() < 0.5 else 230
        od.point((x, y), fill=(tone, tone, tone, a))
    image.alpha_composite(overlay)


def render_asset(asset: dict, output_dir: Path) -> Path:
    global img
    img = Image.new("RGBA", (W, H), COLORS["cream"])
    draw = ImageDraw.Draw(img)

    add_paper_texture(img, asset["assetId"])

    # Header
    draw.rectangle((0, 0, W, 420), fill=COLORS["ink"])
    draw.rectangle((0, 390, W, 420), fill=COLORS["gold"])
    leaf_mark(draw, 180, 165, 1.0, COLORS["white"])
    draw.text((320, 78), "THC ACADEMY", font=font(78, True), fill=COLORS["white"])
    draw.text((320, 175), f"COURSE 1 • MODULE {asset['module']}", font=font(42, True), fill=COLORS["gold2"])
    draw.text((320, 245), "TEACHING HEALTHY CULTIVATION", font=font(35, False), fill=COLORS["white"])

    # Asset control pill
    pill = asset["assetId"].replace("VIS-LH-TECH1-", "")
    pw = int(text_width(draw, pill, font(31, True)) + 80)
    draw.rounded_rectangle((W - pw - 120, 92, W - 120, 158), radius=28, fill=COLORS["purple"])
    draw.text((W - pw - 80, 108), pill, font=font(31, True), fill=COLORS["white"])

    # Title zone
    draw.rectangle((0, 420, W, 930), fill=COLORS["gold2"])
    draw.text((150, 500), asset["kicker"], font=font(34, True), fill=COLORS["purple"])
    title_f = font(73, True)
    title_lines = wrap_px(draw, asset["title"], title_f, 2050)
    ty = 585
    for line in title_lines[:3]:
        draw.text((150, ty), line, font=title_f, fill=COLORS["ink"])
        ty += 92
    draw.line((150, 870, 2250, 870), fill=COLORS["gold"], width=14)

    # Main cards
    cards = asset["panels"]
    card_top = 1020
    card_gap = 26
    card_h = 320 if len(cards) == 5 else int((1740 - card_gap * (len(cards) - 1)) / len(cards))
    x0, x1 = 150, 2250
    body_font = font(36, False)
    head_font = font(43, True)

    accent_cycle = [COLORS["purple"], COLORS["green"], COLORS["gold"], COLORS["ink2"], COLORS["purple"]]

    for i, (heading, body) in enumerate(cards):
        y0 = card_top + i * (card_h + card_gap)
        y1 = y0 + card_h
        draw.rounded_rectangle((x0, y0, x1, y1), radius=48, fill=COLORS["paper"], outline=COLORS["line"], width=6)
        accent = accent_cycle[i % len(accent_cycle)]
        draw.rounded_rectangle((x0, y0, x0 + 250, y1), radius=48, fill=accent)
        # square off the inner half of the accent strip for cleaner card geometry
        draw.rectangle((x0 + 125, y0, x0 + 250, y1), fill=accent)
        draw.ellipse((x0 + 63, y0 + card_h // 2 - 64, x0 + 191, y0 + card_h // 2 + 64), fill=COLORS["white"])
        draw.text((x0 + 100, y0 + card_h // 2 - 43), str(i + 1), font=font(58, True), fill=accent, anchor="ma")

        tx = x0 + 320
        draw.text((tx, y0 + 54), heading, font=head_font, fill=COLORS["ink"])
        draw_wrapped(draw, (tx, y0 + 128), body, body_font, COLORS["muted"], 1760, line_gap=10, max_lines=4)

    # Boundary / rule box
    boundary_y = 2745
    draw.rounded_rectangle((150, boundary_y, 2250, 3070), radius=52, fill=COLORS["ink"])
    draw.text((230, boundary_y + 60), "CONTROL BOUNDARY", font=font(38, True), fill=COLORS["gold2"])
    draw_wrapped(draw, (230, boundary_y + 120), asset["boundary"], font(37, False), COLORS["white"], 1940, line_gap=12, max_lines=4)

    # Footer
    footer = "Academic learning visual • Follow current controlled procedures and authorized role boundaries."
    draw.text((150, 3135), footer, font=font(27, False), fill=COLORS["muted"])
    draw.text((2250, 3135), "DTF GENETICS", font=font(27, True), fill=COLORS["ink"], anchor="ra")

    # Output
    output_dir.mkdir(parents=True, exist_ok=True)
    out = output_dir / f"{asset['assetId']}-{asset['slug']}-master-v1.png"
    rgb = Image.new("RGB", img.size, COLORS["cream"])
    rgb.paste(img, mask=img.getchannel("A"))
    rgb.save(out, format="PNG", dpi=(300, 300), optimize=True)

    with Image.open(out) as check:
        if check.size != (W, H):
            raise RuntimeError(f"{out.name}: wrong dimensions {check.size}")
        if check.format != "PNG":
            raise RuntimeError(f"{out.name}: wrong format {check.format}")
    if out.stat().st_size < 100_000:
        raise RuntimeError(f"{out.name}: unexpectedly small ({out.stat().st_size} bytes)")

    return out


def main() -> None:
    spec = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
    if spec["production"]["format"].lower() != "png":
        raise RuntimeError("Course 1 remaining raster build must target PNG.")
    if spec["production"].get("svgOutputAllowed") is not False:
        raise RuntimeError("svgOutputAllowed must remain false.")
    assets = spec.get("assets", [])
    if len(assets) != 14:
        raise RuntimeError(f"Expected 14 governed replacement candidates, found {len(assets)}")

    outputs = [render_asset(asset, OUT_DIR) for asset in assets]

    manifest = {
        "schemaVersion": 1,
        "buildId": spec["id"],
        "builtFrom": str(SPEC_PATH.relative_to(ROOT)),
        "releaseApproved": False,
        "assets": [],
    }
    for asset, out in zip(assets, outputs):
        data = out.read_bytes()
        manifest["assets"].append({
            "assetId": asset["assetId"],
            "file": str(out.relative_to(ROOT)),
            "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
            "pixelDimensions": {"width": W, "height": H},
            "encoding": "png",
            "sourceLessonPaths": asset["sourceLessonPaths"],
            "sourceBaseline": asset["sourceBaseline"],
            "releaseApproved": False,
        })

    manifest_path = ROOT / "visuals" / "COURSE1-RASTER-BUILD-MANIFEST-001-014.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    for row in manifest["assets"]:
        print(f"{row['assetId']} {row['pixelDimensions']['width']}x{row['pixelDimensions']['height']} {row['bytes']} bytes {row['sha256'][:12]}")


if __name__ == "__main__":
    main()
