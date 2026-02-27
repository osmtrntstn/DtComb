#!/bin/bash
# Clean application logs
rm -f logs/*.log
echo "Application logs cleaned."

# Clean Supervisor logs
if [ -f /var/log/redis.err.log ]; then
    truncate -s 0 /var/log/redis.err.log
fi
if [ -f /var/log/redis.out.log ]; then
    truncate -s 0 /var/log/redis.out.log
fi

echo "Supervisor logs truncated."

