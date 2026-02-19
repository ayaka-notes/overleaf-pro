#!/bin/bash

set -e

sed -i -E \
  -e 's/(<policy[^>]*domain="resource"[^>]*name="memory"[^>]*value=")[^"]*(")/\12GiB\2/' \
  -e 's/(<policy[^>]*domain="resource"[^>]*name="map"[^>]*value=")[^"]*(")/\14GiB\2/' \
  -e 's/(<policy[^>]*domain="resource"[^>]*name="area"[^>]*value=")[^"]*(")/\14GP\2/' \
  -e 's/(<policy[^>]*domain="resource"[^>]*name="disk"[^>]*value=")[^"]*(")/\11GiB\2/' \
  /etc/ImageMagick-6/policy.xml
