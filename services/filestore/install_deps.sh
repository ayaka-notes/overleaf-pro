#!/bin/sh

set -ex

apt-get update

apt-get install ghostscript imagemagick optipng iproute2 poppler-utils --yes

rm -rf /var/lib/apt/lists/*

# Allow ImageMagick to process PDF files. Filestore does pdf to image
# conversion for the templates service.
patch /etc/ImageMagick-6/policy.xml <<EOF
--- old.xml	2022-03-23 09:16:03.985433900 -0400
+++ new.xml	2022-03-23 09:16:18.625471992 -0400
@@ -91,6 +91,5 @@
   <policy domain="coder" rights="none" pattern="PS2" />
   <policy domain="coder" rights="none" pattern="PS3" />
   <policy domain="coder" rights="none" pattern="EPS" />
-  <policy domain="coder" rights="none" pattern="PDF" />
   <policy domain="coder" rights="none" pattern="XPS" />
 </policymap>
EOF

# Add resource limits for ImageMagick, For Large PDF.
sed -i -E \
  -e 's/(<policy[^>]*domain="resource"[^>]*name="memory"[^>]*value=")[^"]*(")/\12GiB\2/' \
  -e 's/(<policy[^>]*domain="resource"[^>]*name="map"[^>]*value=")[^"]*(")/\14GiB\2/' \
  -e 's/(<policy[^>]*domain="resource"[^>]*name="area"[^>]*value=")[^"]*(")/\14GP\2/' \
  -e 's/(<policy[^>]*domain="resource"[^>]*name="disk"[^>]*value=")[^"]*(")/\11GiB\2/' \
  /etc/ImageMagick-6/policy.xml
