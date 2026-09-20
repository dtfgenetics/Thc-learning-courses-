# Technician II Raster Visual Release Policy

Status: controlled production rule

Technician II learner visuals must be released as reviewed high-resolution raster assets. PNG and WebP are preferred; JPEG/JPG may be used when photographic content makes lossy compression appropriate. SVG is not an approved production format for this program.

## Legacy candidate rule

The existing 36 outcome-aligned SVG files remain internal `review-candidate` artifacts only so lesson placement, captions, alternative text, references, and visual-concept IDs remain testable while replacements are produced. Their presence does not constitute release approval.

An SVG candidate may not be promoted to `approved` or `produced`. Replacement requires a raster source at the same governed course/outcome location, preservation or deliberate revision of the concept metadata, visual QA, accessibility text/caption review, evidence/reference review, and lesson-placement verification.

## Production quality

Raster replacements should be purpose-built for the learning outcome rather than file-format conversions of low-quality SVG artwork. Use photorealistic educational imagery where real plant, equipment, symptom, root-zone, propagation, harvest, or process appearance is instructionally important. Use branded raster charts or diagrams where relationships, measurements, workflows, comparisons, or decision logic must be taught clearly.

Do not promote an image merely because it is visually attractive. The image must match the mapped learning outcome, remain scientifically defensible, avoid unsupported universal targets, include a meaningful text alternative and caption, and preserve the course's authority and safety boundaries.

## Runtime and QA

The Academy runtime accepts `.png`, `.webp`, `.jpg`, `.jpeg`, and the legacy `.svg` candidate format in Technician II asset directories. Deterministic QA verifies that released assets use the allowed raster extensions, source files exist, lesson mappings match, text alternatives/captions/references are present, and runtime MIME types match the file format. Unsupported formats and out-of-range course directories return 404.
