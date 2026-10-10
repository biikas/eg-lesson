#!/usr/bin/env bash
# Builds the Angular app and the Spring Boot WAR that serves it: backend/target/eglesson.war
set -euo pipefail
cd "$(dirname "$0")"
# Java 17 is required; the shell default on this Mac is Java 8.
export JAVA_HOME=${JAVA_HOME_17:-$(/usr/libexec/java_home -v 17 2>/dev/null || echo "${JAVA_HOME:-}")}
(cd frontend && npm ci --no-audit --no-fund && npx ng build --configuration production)
(cd backend && mvn -q -DskipTests package)
ls -lh backend/target/eglesson.war
