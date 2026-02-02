# This file was auto-generated, do not edit it directly.
# Instead run bin/update_build_scripts from
# https://github.com/overleaf/internal/

FROM node:22.18.0 AS base

WORKDIR /overleaf/services/references

# Google Cloud Storage needs a writable $HOME/.config for resumable uploads
# (see https://googleapis.dev/nodejs/storage/latest/File.html#createWriteStream)
RUN mkdir /home/node/.config && chown node:node /home/node/.config

FROM base AS app

COPY package.json package-lock.json /overleaf/
COPY libraries/logger/package.json /overleaf/libraries/logger/package.json
COPY libraries/metrics/package.json /overleaf/libraries/metrics/package.json
COPY libraries/settings/package.json /overleaf/libraries/settings/package.json
COPY services/references/package.json /overleaf/services/references/package.json
COPY patches/ /overleaf/patches/

RUN cd /overleaf && npm ci --quiet
COPY libraries/logger/ /overleaf/libraries/logger/
COPY libraries/metrics/ /overleaf/libraries/metrics/
COPY libraries/settings/ /overleaf/libraries/settings/
COPY services/references/ /overleaf/services/references/

FROM app
USER node

CMD ["node", "--expose-gc", "app.js"]
