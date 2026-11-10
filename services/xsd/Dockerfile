# Microservice de validation XSD (xmllint/libxml2) pour FactuCheck.
# Récupère les XSD officiels (UBL OASIS + CII Factur-X EN16931) et expose
# server.mjs sur :8084.
#
# À builder depuis la RACINE du repo (le script de fetch vit dans scripts/) :
#   docker build -f services/xsd/Dockerfile -t factucheck-xsd .
FROM node:20-bookworm-slim

# xmllint (libxml2) + outils de récupération des schémas
RUN apt-get update \
 && apt-get install -y --no-install-recommends libxml2-utils curl ca-certificates unzip \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY services/xsd/server.mjs .
COPY scripts/fetch-xsd.mjs .

# Récupère les schémas dans ./schemas (SCHEMAS_DIR par défaut du serveur).
RUN node fetch-xsd.mjs \
 && test -f services/xsd/schemas/cii/Factur-X_EN16931.xsd \
 && test -f services/xsd/schemas/ubl/maindoc/UBL-Invoice-2.1.xsd \
 && mv services/xsd/schemas ./schemas \
 && rm -rf services

ENV SCHEMAS_DIR=/app/schemas PORT=8084
EXPOSE 8084
HEALTHCHECK --interval=30s --timeout=5s CMD curl -fsS http://localhost:8084/health || exit 1
CMD ["node", "server.mjs"]
