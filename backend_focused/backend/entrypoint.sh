#!/bin/sh
set -e

attempts=0
until python manage.py shell -c "from django.db import connection; connection.ensure_connection()" >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 30 ]; then
        echo "Database is unavailable, giving up." >&2
        exit 1
    fi
    echo "Waiting for database..."
    sleep 1
done

python manage.py migrate --noinput

exec "$@"
