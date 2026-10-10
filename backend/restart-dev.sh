#!/usr/bin/env bash
# Developer helper: rebuilds and restarts the API on :8090 against local MySQL (schema eglesson_dev).
cd "$(dirname "$0")"
export JAVA_HOME=${JAVA_HOME_17:-$(/usr/libexec/java_home -v 17 2>/dev/null || echo "${JAVA_HOME:-}")}
pkill -f 'eglesson.*spring-boot:run' 2>/dev/null; pkill -f 'np.eglesson.EglessonApplication' 2>/dev/null; sleep 1
nohup mvn -q -o spring-boot:run > backend.log 2>&1 &
for i in $(seq 1 60); do sleep 2; grep -qE 'Started EglessonApplication|Application run failed' backend.log && break; done
grep -E 'Started|Application run failed|Caused by' backend.log | cut -c1-300 | head -5
