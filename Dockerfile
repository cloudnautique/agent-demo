FROM cgr.dev/chainguard/node:latest-dev AS base

WORKDIR /app
COPY . .
USER root
RUN apk add --no-cache pnpm

FROM base AS agent-frontend
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    cd agent-frontend && \
    pnpm install && \
    npm run build && \
    cd ..

FROM base AS frontend
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    cd frontend && \
    pnpm install && \
    npm run build && \
    cd ..

FROM cgr.dev/chainguard/wolfi-base AS final
WORKDIR /app
COPY --from=frontend /app/frontend ./frontend
COPY --from=agent-frontend /app/agent-frontend ./agent-frontend

RUN apk add --no-cache python-3.13 \
    py3.13-pip \
    tini \
    nodejs-22 \
    pnpm

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . .
RUN chmod +x start.sh

VOLUME /app/uploads
VOLUME /app/frontend/uploads
VOLUME /app/data

ENV UPLOAD_FOLDER /app/uploads

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["./start.sh"]
