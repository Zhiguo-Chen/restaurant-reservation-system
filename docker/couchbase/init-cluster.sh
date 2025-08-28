#!/bin/bash

set -e

COUCHBASE_HOST="restaurant-couchbase"
COUCHBASE_PORT="8091"
ADMIN_USER="admin"
ADMIN_PASS="password123"
BUCKET_NAME="restaurant-reservations"

echo "Waiting for Couchbase to be ready..."

# Wait for Couchbase to be accessible
until curl -f http://${COUCHBASE_HOST}:${COUCHBASE_PORT}/pools > /dev/null 2>&1; do
  echo "Waiting for Couchbase server to start..."
  sleep 5
done

echo "Couchbase server is ready!"

# Check if cluster is already initialized
if curl -f http://${COUCHBASE_HOST}:${COUCHBASE_PORT}/pools/default > /dev/null 2>&1; then
  echo "Cluster already initialized, skipping cluster setup..."
else
  echo "Initializing Couchbase cluster..."
  couchbase-cli cluster-init \
    --cluster ${COUCHBASE_HOST}:${COUCHBASE_PORT} \
    --cluster-username ${ADMIN_USER} \
    --cluster-password ${ADMIN_PASS} \
    --cluster-name restaurant-cluster \
    --cluster-ramsize 256 \
    --cluster-index-ramsize 256 \
    --services data,index,query \
    --cluster-fts-ramsize 256
  
  echo "Cluster initialized successfully!"
fi

# Wait a bit for cluster to be fully ready
sleep 5

# Check if bucket already exists
if couchbase-cli bucket-list \
  --cluster ${COUCHBASE_HOST}:${COUCHBASE_PORT} \
  --username ${ADMIN_USER} \
  --password ${ADMIN_PASS} | grep -q ${BUCKET_NAME}; then
  echo "Bucket ${BUCKET_NAME} already exists, skipping bucket creation..."
else
  echo "Creating ${BUCKET_NAME} bucket..."
  couchbase-cli bucket-create \
    --cluster ${COUCHBASE_HOST}:${COUCHBASE_PORT} \
    --username ${ADMIN_USER} \
    --password ${ADMIN_PASS} \
    --bucket ${BUCKET_NAME} \
    --bucket-type couchbase \
    --bucket-ramsize 128 \
    --bucket-replica 0 \
    --wait
  
  echo "Bucket created successfully!"
fi

# Wait for bucket to be ready
echo "Waiting for bucket to be ready..."
sleep 8

# Create primary index
echo "Creating primary index..."
cbq -e http://${COUCHBASE_HOST}:8093 -u ${ADMIN_USER} -p ${ADMIN_PASS} \
  --script="CREATE PRIMARY INDEX ON \`${BUCKET_NAME}\`" || echo "Primary index may already exist"

# Create secondary indexes
echo "Creating secondary indexes..."

# User indexes
cbq -e http://${COUCHBASE_HOST}:8093 -u ${ADMIN_USER} -p ${ADMIN_PASS} \
  --script="CREATE INDEX idx_user_username ON \`${BUCKET_NAME}\`(username) WHERE type = 'user'" || echo "User username index may already exist"

# Reservation indexes
cbq -e http://${COUCHBASE_HOST}:8093 -u ${ADMIN_USER} -p ${ADMIN_PASS} \
  --script="CREATE INDEX idx_reservation_arrival_time ON \`${BUCKET_NAME}\`(arrivalTime) WHERE type = 'reservation'" || echo "Reservation arrival time index may already exist"

cbq -e http://${COUCHBASE_HOST}:8093 -u ${ADMIN_USER} -p ${ADMIN_PASS} \
  --script="CREATE INDEX idx_reservation_status ON \`${BUCKET_NAME}\`(status) WHERE type = 'reservation'" || echo "Reservation status index may already exist"

cbq -e http://${COUCHBASE_HOST}:8093 -u ${ADMIN_USER} -p ${ADMIN_PASS} \
  --script="CREATE INDEX idx_reservation_guest_email ON \`${BUCKET_NAME}\`(guestEmail) WHERE type = 'reservation'" || echo "Reservation guest email index may already exist"

echo "Couchbase initialization completed successfully!"
echo "Web Console available at: http://localhost:8091"
echo "Username: ${ADMIN_USER}"
echo "Password: ${ADMIN_PASS}"