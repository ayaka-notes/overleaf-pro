# Custom Pandoc image for clsi sandboxed conversions
# (import/export: docx / markdown / html, via ENABLE_PANDOC_CONVERSIONS).
#
# Why this exists:
#   The official quay.io/sharelatex/pandoc:3.9 image is private (401, can't pull).
#   clsi invokes pandoc generically (no custom templates/filters/reference-doc), so a
#   stock pandoc image works — it just needs three runtime essentials that clsi assumes:
#
#   1. No `pandoc` ENTRYPOINT — clsi runs Cmd ["pandoc", ...]; with the default
#      entrypoint that would become `pandoc pandoc ...`.
#   2. `zip` — the import conversion's second step runs `zip -r` to package the output.
#   3. a `tex` user at UID 1000 — clsi runs every conversion container as User=tex;
#      UID 1000 matches the host user so bind-mounted files keep the right permissions.
#
# Build (tag must match PANDOC_IMAGE in develop/dev.env):
#   docker build -t overleaf-pandoc:local develop/pandoc
#
# Note: pinned to `latest` (pandoc 3.10 at time of writing). Pin to a specific
# pandoc/core tag for fully reproducible builds.
FROM pandoc/core:latest

ENTRYPOINT []

RUN apk add --no-cache zip \
 && adduser -D -u 1000 tex
