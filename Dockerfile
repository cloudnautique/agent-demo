FROM cgr.dev/chainguard/wolfi-base AS base

WORKDIR /app
RUN apk add --no-cache python-3.13 py3.13-pip npm tini

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . .
RUN chmod +x start.sh

RUN cd agent-frontend && \
    npm install --include dev && \
    npm run build && \
    cd ..

RUN cd frontend && \
    npm install --include dev  && \
    npm run build && \
    cd ..

VOLUME /app/uploads
VOLUME /app/frontend/uploads
VOLUME /app/data

ENV UPLOAD_FOLDER /app/uploads

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["./start.sh"]
