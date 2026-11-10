# Microservice de validation PDF/A-3 (veraPDF) pour FactuCheck.
# Installe veraPDF (headless) et expose server.mjs sur :8083.
FROM eclipse-temurin:21-jre-jammy

ARG VERAPDF_VERSION=1.30.4
ENV VERAPDF_CLI=/opt/verapdf/verapdf \
    PORT=8083 \
    NODE_VERSION=20

# Node.js (pour le serveur) + utilitaires
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates unzip \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && rm -rf /var/lib/apt/lists/*

# Installation headless de veraPDF via l'auto-installer IzPack
RUN set -eux; \
    cd /tmp; \
    curl -fsSL -o verapdf.zip https://software.verapdf.org/releases/verapdf-installer.zip; \
    unzip -q verapdf.zip; \
    DIR="$(find . -maxdepth 1 -type d -name 'verapdf-greenfield-*' | head -n1)"; \
    JAR="$(find "$DIR" -name 'verapdf-izpack-installer-*.jar' | head -n1)"; \
    printf '%s\n' \
      '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' \
      '<AutomatedInstallation langpack="eng">' \
      '  <com.izforge.izpack.panels.htmlhello.HTMLHelloPanel id="welcome"/>' \
      '  <com.izforge.izpack.panels.target.TargetPanel id="install_dir">' \
      '    <installpath>/opt/verapdf</installpath>' \
      '  </com.izforge.izpack.panels.target.TargetPanel>' \
      '  <com.izforge.izpack.panels.packs.PacksPanel id="sdk_pack_select">' \
      '    <pack index="0" name="veraPDF Mac and *nix Scripts" selected="true"/>' \
      '    <pack index="1" name="veraPDF GUI" selected="true"/>' \
      '    <pack index="2" name="veraPDF Validation model" selected="true"/>' \
      '    <pack index="3" name="veraPDF Documentation" selected="false"/>' \
      '    <pack index="4" name="veraPDF Sample Files" selected="false"/>' \
      '  </com.izforge.izpack.panels.packs.PacksPanel>' \
      '  <com.izforge.izpack.panels.install.InstallPanel id="install"/>' \
      '  <com.izforge.izpack.panels.finish.FinishPanel id="finish"/>' \
      '</AutomatedInstallation>' > auto.xml; \
    java -jar "$JAR" auto.xml; \
    test -x /opt/verapdf/verapdf; \
    rm -rf /tmp/verapdf.zip "$DIR" auto.xml

WORKDIR /app
# Contexte de build = racine du repo (voir services/docker-compose.yml).
COPY services/verapdf/server.mjs .

EXPOSE 8083
HEALTHCHECK --interval=30s --timeout=5s CMD curl -fsS http://localhost:8083/health || exit 1
CMD ["node", "server.mjs"]
