#!/usr/bin/env bash
# Starts eglesson as a standalone app (embedded Tomcat) with settings from eglesson.env next to this script.
# Variables already set in the environment win over the file.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${ENV_FILE:-$DIR/eglesson.env}"
while IFS= read -r line || [ -n "$line" ]; do
  [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue
  key="${BASH_REMATCH[1]}"
  [ -n "${!key+x}" ] || export "$key=${BASH_REMATCH[2]}"
done < "$ENV_FILE"
JAR="${JAR:-$DIR/eglesson.war}"
[ -f "$JAR" ] || JAR="$DIR/../target/eglesson.war"
mkdir -p "$APP_UPLOAD_DIR"
exec "${JAVA_HOME:+$JAVA_HOME/bin/}java" ${JAVA_OPTS:--Xmx512m} -jar "$JAR"
