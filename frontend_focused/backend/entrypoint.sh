#!/bin/sh
set -e

python manage.py migrate --noinput

if [ "$SEED_DATA" = "true" ]; then
    python manage.py seed_submissions
fi

exec "$@"
