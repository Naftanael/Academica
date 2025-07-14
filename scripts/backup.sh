#!/bin/bash
set -e

# Define the directory to be backed up
SOURCE_DIR="src/data"

# Define the directory where the backups will be stored
BACKUP_DIR="backups"

# Create the backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create a timestamp for the backup file
TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# Define the name of the backup file
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.tar.gz"

# Create the compressed backup file
tar -czf "$BACKUP_FILE" "$SOURCE_DIR"

echo "Backup created successfully: $BACKUP_FILE"
