# PostgreSQL - Client Apps (Part 10)

## 


**URL:** https://www.postgresql.org/docs/18/app-pgrewind.html

**Contents:**
- pg_rewind
- Synopsis
- Description
  - Warning: Failures While Rewinding
- Options
- Environment
- Notes
  - How It Works

pg_rewind — synchronize a PostgreSQL data directory with another data directory that was forked from it

pg_rewind [option...] { -D | --target-pgdata } directory { --source-pgdata=directory | --source-server=connstr }

pg_rewind is a tool for synchronizing a PostgreSQL cluster with another copy of the same cluster, after the clusters' timelines have diverged. A typical scenario is to bring an old primary server back online after failover as a standby that follows the new primary.

After a successful rewind, the state of the target data directory is analogous to a base backup of the source data directory. Unlike taking a new base backup or using a tool like rsync, pg_rewind does not require comparing or copying unchanged relation blocks in the cluster. Only changed blocks from existing relation files are copied; all other files, including new relation files, configuration files, and WAL segments, are copied in full. As such the rewind operation is significantly faster than other approaches when the database is large and only a small fraction of blocks differ between the clusters.

pg_rewind examines the timeline histories of the source and target clusters to determine the point where they diverged, and expects to find WAL in the target cluster's pg_wal directory reaching all the way back to the point of divergence. The point of divergence can be found either on the target timeline, the source timeline, or their common ancestor. In the typical failover scenario where the target cluster was shut down soon after the divergence, this is not a problem, but if the target cluster ran for a long time after the divergence, its old WAL files might no longer be present. In this case, you can manually copy them from the WAL archive to the pg_wal directory, or run pg_rewind with the -c option to automatically retrieve them from the WAL archive. The use of pg_rewind is not limited to failover, e.g., a standby server can be promoted, run some write transactions, and then rewound to become a standby again.

After running pg_rewind, WAL replay needs to complete for the data directory to be in a consistent state. When the target server is started again it will enter archive recovery and replay all WAL generated in the source server from the last checkpoint before the point of divergence. If some of the WAL was no longer available in the source server when pg_rewind was run, and therefore could not be copied by the pg_rewind session, it must be made available when the target server is started. This can be done by creating a recovery.signal file in the target data directory and by configuring a suitable restore_command in postgresql.conf.

pg_rewind requires that the target server either has the wal_log_hints option enabled in postgresql.conf or data checksums enabled when the cluster was initialized with initdb. Neither of these are currently on by default. full_page_writes must also be set to on, but is enabled by default.

If pg_rewind fails while processing, then the data folder of the target is likely not in a state that can be recovered. In such a case, taking a new fresh backup is recommended.

As pg_rewind copies configuration files entirely from the source, it may be required to correct the configuration used for recovery before restarting the target server, especially if the target is reintroduced as a standby of the source. If you restart the server after the rewind operation has finished but without configuring recovery, the target may again diverge from the primary.

pg_rewind will fail immediately if it finds files it cannot write directly to. This can happen for example when the source and the target server use the same file mapping for read-only SSL keys and certificates. If such files are present on the target server it is recommended to remove them before running pg_rewind. After doing the rewind, some of those files may have been copied from the source, in which case it may be necessary to remove the data copied and restore back the set of links used before the rewind.

pg_rewind accepts the following command-line arguments:

This option specifies the target data directory that is synchronized with the source. The target server must be shut down cleanly before running pg_rewind

Specifies the file system path to the data directory of the source server to synchronize the target with. This option requires the source server to be cleanly shut down.

Specifies a libpq connection string to connect to the source PostgreSQL server to synchronize the target with. The connection must be a normal (non-replication) connection with a role having sufficient permissions to execute the functions used by pg_rewind on the source server (see Notes section for details) or a superuser role. This option requires the source server to be running and accepting connections.

Create standby.signal and append connection settings to postgresql.auto.conf in the output directory. The dbname will be recorded only if the dbname was specified explicitly in the connection string or environment variable. --source-server is mandatory with this option.

Do everything except actually modifying the target directory.

By default, pg_rewind will wait for all files to be written safely to disk. This option causes pg_rewind to return without waiting, which is faster, but means that a subsequent operating system crash can leave the data directory corrupt. Generally, this option is useful for testing but should not be used on a production installation.

Enables progress reporting. Turning this on will deliver an approximate progress report while copying data from the source cluster.

Use restore_command defined in the target cluster configuration to retrieve WAL files from the WAL archive if these files are no longer available in the pg_wal directory.

Use the specified main server configuration file for the target cluster. This affects pg_rewind when it uses internally the postgres command for the rewind operation on this cluster (when retrieving restore_command with the option -c/--restore-target-wal and when forcing a completion of crash recovery).

Print verbose debugging output that is mostly useful for developers debugging pg_rewind.

pg_rewind requires that the target server is cleanly shut down before rewinding. By default, if the target server is not shut down cleanly, pg_rewind starts the target server in single-user mode to complete crash recovery first, and stops it. By passing this option, pg_rewind skips this and errors out immediately if the server is not cleanly shut down. Users are expected to handle the situation themselves in that case.

When set to fsync, which is the default, pg_rewind will recursively open and synchronize all files in the data directory. The search for files will follow symbolic links for the WAL directory and each configured tablespace.

On Linux, syncfs may be used instead to ask the operating system to synchronize the whole file systems that contain the data directory, the WAL files, and each tablespace. See recovery_init_sync_method for information about the caveats to be aware of when using syncfs.

This option has no effect when --no-sync is used.

Display version information, then exit.

Show help, then exit.

When --source-server option is used, pg_rewind also uses the environment variables supported by libpq (see Section 32.15).

The environment variable PG_COLOR specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

When executing pg_rewind using an online cluster as source, a role having sufficient permissions to execute the functions used by pg_rewind on the source cluster can be used instead of a superuser. Here is how to create such a role, named rewind_user here:

The basic idea is to copy all file system-level changes from the source cluster to the target cluster:

Scan the WAL log of the target cluster, starting from the last checkpoint before the point where the source cluster's timeline history forked off from the target cluster. For each WAL record, record each data block that was touched. This yields a list of all the data blocks that were changed in the target cluster, after the source cluster forked off. If some of the WAL files are no longer available, try re-running pg_rewind with the -c option to search for the missing files in the WAL archive.

Copy all those changed blocks from the source cluster to the target cluster, either using direct file system access (--source-pgdata) or SQL (--source-server). Relation files are now in a state equivalent to the moment of the last completed checkpoint prior to the point at which the WAL timelines of the source and target diverged plus the current state on the source of any blocks changed on the target after that divergence.

Copy all other files, including new relation files, WAL segments, pg_xact, and configuration files from the source cluster to the target cluster. Similarly to base backups, the contents of the directories pg_dynshmem/, pg_notify/, pg_replslot/, pg_serial/, pg_snapshots/, pg_stat_tmp/, and pg_subtrans/ are omitted from the data copied from the source cluster. The files backup_label, tablespace_map, pg_internal.init, postmaster.opts, postmaster.pid and .DS_Store as well as any file or directory beginning with pgsql_tmp, are omitted.

Create a backup_label file to begin WAL replay at the checkpoint created at failover and configure the pg_control file with a minimum consistency LSN defined as the result of pg_current_wal_insert_lsn() when rewinding from a live source or the last checkpoint LSN when rewinding from a stopped source.

When starting the target, PostgreSQL replays all the required WAL, resulting in a data directory in a consistent state.

**Examples:**

Example 1 (powershell):
```powershell
--target-pgdata
```

Example 2 (unknown):
```unknown
--source-pgdata=directory
```

Example 3 (unknown):
```unknown
--source-server=connstr
```

Example 4 (unknown):
```unknown
recovery.signal
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/app-pgchecksums.html

**Contents:**
- pg_checksums
- Synopsis
- Description
- Options
- Environment
- Notes

pg_checksums — enable, disable or check data checksums in a PostgreSQL database cluster

pg_checksums [option...] [[ -D | --pgdata ]datadir]

pg_checksums checks, enables or disables data checksums in a PostgreSQL cluster. The server must be shut down cleanly before running pg_checksums. When verifying checksums, the exit status is zero if there are no checksum errors, and nonzero if at least one checksum failure is detected. When enabling or disabling checksums, the exit status is nonzero if the operation failed.

When verifying checksums, every file in the cluster is scanned. When enabling checksums, each relation file block with a changed checksum is rewritten in-place. Disabling checksums only updates the file pg_control.

The following command-line options are available:

Specifies the directory where the database cluster is stored.

Checks checksums. This is the default mode if nothing else is specified.

Only validate checksums in the relation with filenode filenode.

By default, pg_checksums will wait for all files to be written safely to disk. This option causes pg_checksums to return without waiting, which is faster, but means that a subsequent operating system crash can leave the updated data directory corrupt. Generally, this option is useful for testing but should not be used on a production installation. This option has no effect when using --check.

Enable progress reporting. Turning this on will deliver a progress report while checking or enabling checksums.

When set to fsync, which is the default, pg_checksums will recursively open and synchronize all files in the data directory. The search for files will follow symbolic links for the WAL directory and each configured tablespace.

On Linux, syncfs may be used instead to ask the operating system to synchronize the whole file systems that contain the data directory, the WAL files, and each tablespace. See recovery_init_sync_method for information about the caveats to be aware of when using syncfs.

This option has no effect when --no-sync is used.

Enable verbose output. Lists all checked files.

Print the pg_checksums version and exit.

Show help about pg_checksums command line arguments, and exit.

Specifies the directory where the database cluster is stored; can be overridden using the -D option.

Specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

Enabling checksums in a large cluster can potentially take a long time. During this operation, the cluster or other programs that write to the data directory must not be started or else data loss may occur.

When using a replication setup with tools which perform direct copies of relation file blocks (for example pg_rewind), enabling or disabling checksums can lead to page corruptions in the shape of incorrect checksums if the operation is not done consistently across all nodes. When enabling or disabling checksums in a replication setup, it is thus recommended to stop all the clusters before switching them all consistently. Destroying all standbys, performing the operation on the primary and finally recreating the standbys from scratch is also safe.

If pg_checksums is aborted or killed while enabling or disabling checksums, the cluster's data checksum configuration remains unchanged, and pg_checksums can be re-run to perform the same operation.

**Examples:**

Example 1 (unknown):
```unknown
pg_checksums
```

Example 2 (unknown):
```unknown
-D directory
```

Example 3 (unknown):
```unknown
--pgdata=directory
```

Example 4 (unknown):
```unknown
-f filenode
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/app-pgcombinebackup.html

**Contents:**
- pg_combinebackup
- Synopsis
- Description
- Options
- Limitations
- Environment
- See Also

pg_combinebackup — reconstruct a full backup from an incremental backup and dependent backups

pg_combinebackup [option...] [backup_directory...]

pg_combinebackup is used to reconstruct a synthetic full backup from an incremental backup and the earlier backups upon which it depends.

Specify all of the required backups on the command line from oldest to newest. That is, the first backup directory should be the path to the full backup, and the last should be the path to the final incremental backup that you wish to restore. The reconstructed backup will be written to the output directory specified by the -o option.

pg_combinebackup will attempt to verify that the backups you specify form a legal backup chain from which a correct full backup can be reconstructed. However, it is not designed to help you keep track of which backups depend on which other backups. If you remove one or more of the previous backups upon which your incremental backup relies, you will not be able to restore it. Moreover, pg_combinebackup only attempts to verify that the backups have the correct relationship to each other, not that each individual backup is intact; for that, use pg_verifybackup.

Since the output of pg_combinebackup is a synthetic full backup, it can be used as an input to a future invocation of pg_combinebackup. The synthetic full backup would be specified on the command line in lieu of the chain of backups from which it was reconstructed.

Print lots of debug logging output on stderr.

Use hard links instead of copying files to the synthetic backup. Reconstruction of the synthetic backup might be faster (no file copying) and use less disk space, but care must be taken when using the output directory, because any modifications to that directory (for example, starting the server) can also affect the input directories. Likewise, changes to the input directories (for example, starting the server on the full backup) could affect the output directory. Thus, this option is best used when the input directories are only copies that will be removed after pg_combinebackup has completed.

Requires that the input backups and the output directory are in the same file system.

If a backup manifest is not available or does not contain checksum of the right type, hard links will still be created, but the file will be also read block-by-block for the checksum calculation.

The -n/--dry-run option instructs pg_combinebackup to figure out what would be done without actually creating the target directory or any output files. It is particularly useful in combination with --debug.

By default, pg_combinebackup will wait for all files to be written safely to disk. This option causes pg_combinebackup to return without waiting, which is faster, but means that a subsequent operating system crash can leave the output backup corrupt. Generally, this option is useful for testing but should not be used when creating a production installation.

Specifies the output directory to which the synthetic full backup should be written. Currently, this argument is required.

Relocates the tablespace in directory olddir to newdir during the backup. olddir is the absolute path of the tablespace as it exists in the final backup specified on the command line, and newdir is the absolute path to use for the tablespace in the reconstructed backup. If either path needs to contain an equal sign (=), precede that with a backslash. This option can be specified multiple times for multiple tablespaces.

Use efficient file cloning (also known as “reflinks” on some systems) instead of copying files to the new data directory, which can result in near-instantaneous copying of the data files.

If a backup manifest is not available or does not contain checksum of the right type, file cloning will be used to copy the file, but the file will be also read block-by-block for the checksum calculation.

File cloning is only supported on some operating systems and file systems. If it is selected but not supported, the pg_combinebackup run will error. At present, it is supported on Linux (kernel 4.5 or later) with Btrfs and XFS (on file systems created with reflink support), and on macOS with APFS.

Perform regular file copy. This is the default. (See also --copy-file-range, --clone, and -k/--link.)

Use the copy_file_range system call for efficient copying. On some file systems this gives results similar to --clone, sharing physical disk blocks, while on others it may still copy blocks, but do so via an optimized path. At present, it is supported on Linux and FreeBSD.

If a backup manifest is not available or does not contain checksum of the right type, copy_file_range will be used to copy the file, but the file will be also read block-by-block for the checksum calculation.

Like pg_basebackup, pg_combinebackup writes a backup manifest in the output directory. This option specifies the checksum algorithm that should be applied to each file included in the backup manifest. Currently, the available algorithms are NONE, CRC32C, SHA224, SHA256, SHA384, and SHA512. The default is CRC32C.

Disables generation of a backup manifest. If this option is not specified, a backup manifest for the reconstructed backup will be written to the output directory.

When set to fsync, which is the default, pg_combinebackup will recursively open and synchronize all files in the backup directory. When the plain format is used, the search for files will follow symbolic links for the WAL directory and each configured tablespace.

On Linux, syncfs may be used instead to ask the operating system to synchronize the whole file system that contains the backup directory. When the plain format is used, pg_combinebackup will also synchronize the file systems that contain the WAL files and each tablespace. See recovery_init_sync_method for information about the caveats to be aware of when using syncfs.

This option has no effect when --no-sync is used.

Prints the pg_combinebackup version and exits.

Shows help about pg_combinebackup command line arguments, and exits.

pg_combinebackup does not recompute page checksums when writing the output directory. Therefore, if any of the backups used for reconstruction were taken with checksums disabled, but the final backup was taken with checksums enabled, the resulting directory may contain pages with invalid checksums.

To avoid this problem, taking a new full backup after changing the checksum state of the cluster using pg_checksums is recommended. Otherwise, you can disable and then optionally reenable checksums on the directory produced by pg_combinebackup in order to correct the problem.

This utility, like most other PostgreSQL utilities, uses the environment variables supported by libpq (see Section 32.15).

The environment variable PG_COLOR specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

**Examples:**

Example 1 (unknown):
```unknown
pg_combinebackup
```

Example 2 (unknown):
```unknown
backup_directory
```

Example 3 (unknown):
```unknown
pg_combinebackup
```

Example 4 (unknown):
```unknown
pg_combinebackup
```

---


---

