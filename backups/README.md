# Backup System

This directory contains backups of the application's data.

## Creating a Backup

To create a new backup, run the following command from the root of the project:

```bash
./scripts/backup.sh
```

## Restoring from a Backup

To restore from a backup, first choose the backup file you want to restore from. Then, run the following command, replacing `<backup-file>` with the name of the backup file:

```bash
tar -xzf <backup-file> -C .
```

For example:

```bash
tar -xzf backups/backup-20250714175854.tar.gz -C .
```
