# ---- Build stage: compile the static site with Vite ----
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies against the lockfile for reproducible builds.
COPY package*.json ./
RUN npm ci

# --- Optional real-API config (BUILD-TIME ONLY) ------------------------------
# Vite inlines VITE_* vars into the bundle at build time. With none set, the
# app builds and runs entirely in mock mode (no keys required). These default
# to empty so NO secret is ever baked into the image unless YOU pass one at
# build time, e.g.:
#   docker build --build-arg VITE_EVENTS_ADAPTER=ticketmaster \
#                --build-arg VITE_TICKETMASTER_API_KEY=xxxx -t concertmatch .
# Never commit real keys; treat any image built with them as sensitive.
ARG VITE_MUSIC_ADAPTER=mock
ARG VITE_EVENTS_ADAPTER=mock
ARG VITE_SPOTIFY_CLIENT_ID=
ARG VITE_SPOTIFY_REDIRECT_URI=
ARG VITE_YTMUSIC_CLIENT_ID=
ARG VITE_YTMUSIC_REDIRECT_URI=
ARG VITE_TICKETMASTER_API_KEY=
ENV VITE_MUSIC_ADAPTER=$VITE_MUSIC_ADAPTER \
    VITE_EVENTS_ADAPTER=$VITE_EVENTS_ADAPTER \
    VITE_SPOTIFY_CLIENT_ID=$VITE_SPOTIFY_CLIENT_ID \
    VITE_SPOTIFY_REDIRECT_URI=$VITE_SPOTIFY_REDIRECT_URI \
    VITE_YTMUSIC_CLIENT_ID=$VITE_YTMUSIC_CLIENT_ID \
    VITE_YTMUSIC_REDIRECT_URI=$VITE_YTMUSIC_REDIRECT_URI \
    VITE_TICKETMASTER_API_KEY=$VITE_TICKETMASTER_API_KEY

# Build the app -> /app/dist
COPY . .
RUN npm run build

# ---- Serve stage: tiny nginx serving the static dist/ ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
