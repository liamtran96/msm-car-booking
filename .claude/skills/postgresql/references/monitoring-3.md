# PostgreSQL - Monitoring (Part 3)

## 27.2. The Cumulative Statistics System # (continued)
Number of times an error occurred during the initial table synchronization

confl_insert_exists bigint

Number of times a row insertion violated a NOT DEFERRABLE unique constraint during the application of changes. See insert_exists for details about this conflict.

confl_update_origin_differs bigint

Number of times an update was applied to a row that had been previously modified by another source during the application of changes. See update_origin_differs for details about this conflict.

confl_update_exists bigint

Number of times that an updated row value violated a NOT DEFERRABLE unique constraint during the application of changes. See update_exists for details about this conflict.

confl_update_missing bigint

Number of times the tuple to be updated was not found during the application of changes. See update_missing for details about this conflict.

confl_delete_origin_differs bigint

Number of times a delete operation was applied to row that had been previously modified by another source during the application of changes. See delete_origin_differs for details about this conflict.

confl_delete_missing bigint

Number of times the tuple to be deleted was not found during the application of changes. See delete_missing for details about this conflict.

confl_multiple_unique_conflicts bigint

Number of times a row insertion or an updated row values violated multiple NOT DEFERRABLE unique constraints during the application of changes. See multiple_unique_conflicts for details about this conflict.

stats_reset timestamp with time zone

Time at which these statistics were last reset

The pg_stat_ssl view will contain one row per backend or WAL sender process, showing statistics about SSL usage on this connection. It can be joined to pg_stat_activity or pg_stat_replication on the pid column to get more details about the connection.

Table 27.20. pg_stat_ssl View

Process ID of a backend or WAL sender process

True if SSL is used on this connection

Version of SSL in use, or NULL if SSL is not in use on this connection

Name of SSL cipher in use, or NULL if SSL is not in use on this connection

Number of bits in the encryption algorithm used, or NULL if SSL is not used on this connection

Distinguished Name (DN) field from the client certificate used, or NULL if no client certificate was supplied or if SSL is not in use on this connection. This field is truncated if the DN field is longer than NAMEDATALEN (64 characters in a standard build).

client_serial numeric

Serial number of the client certificate, or NULL if no client certificate was supplied or if SSL is not in use on this connection. The combination of certificate serial number and certificate issuer uniquely identifies a certificate (unless the issuer erroneously reuses serial numbers).

DN of the issuer of the client certificate, or NULL if no client certificate was supplied or if SSL is not in use on this connection. This field is truncated like client_dn.

The pg_stat_gssapi view will contain one row per backend, showing information about GSSAPI usage on this connection. It can be joined to pg_stat_activity or pg_stat_replication on the pid column to get more details about the connection.

Table 27.21. pg_stat_gssapi View

Process ID of a backend

gss_authenticated boolean

True if GSSAPI authentication was used for this connection

Principal used to authenticate this connection, or NULL if GSSAPI was not used to authenticate this connection. This field is truncated if the principal is longer than NAMEDATALEN (64 characters in a standard build).

True if GSSAPI encryption is in use on this connection

credentials_delegated boolean

True if GSSAPI credentials were delegated on this connection.

The pg_stat_archiver view will always have a single row, containing data about the archiver process of the cluster.

Table 27.22. pg_stat_archiver View

archived_count bigint

Number of WAL files that have been successfully archived

last_archived_wal text

Name of the WAL file most recently successfully archived

last_archived_time timestamp with time zone

Time of the most recent successful archive operation

Number of failed attempts for archiving WAL files

Name of the WAL file of the most recent failed archival operation

last_failed_time timestamp with time zone

Time of the most recent failed archival operation

stats_reset timestamp with time zone

Time at which these statistics were last reset

Normally, WAL files are archived in order, oldest to newest, but that is not guaranteed, and does not hold under special circumstances like when promoting a standby or after crash recovery. Therefore it is not safe to assume that all files older than last_archived_wal have also been successfully archived.

The pg_stat_io view will contain one row for each combination of backend type, target I/O object, and I/O context, showing cluster-wide I/O statistics. Combinations which do not make sense are omitted.

Currently, I/O on relations (e.g. tables, indexes) and WAL activity are tracked. However, relation I/O which bypasses shared buffers (e.g. when moving a table from one tablespace to another) is currently not tracked.

Table 27.23. pg_stat_io View

Type of backend (e.g. background worker, autovacuum worker). See pg_stat_activity for more information on backend_types. Some backend_types do not accumulate I/O operation statistics and will not be included in the view.

Target object of an I/O operation. Possible values are:

relation: Permanent relations.

temp relation: Temporary relations.

wal: Write Ahead Logs.

The context of an I/O operation. Possible values are:

normal: The default or standard context for a type of I/O operation. For example, by default, relation data is read into and written out from shared buffers. Thus, reads and writes of relation data to and from shared buffers are tracked in context normal.

init: I/O operations performed while creating the WAL segments are tracked in context init.

vacuum: I/O operations performed outside of shared buffers while vacuuming and analyzing permanent relations. Temporary table vacuums use the same local buffer pool as other temporary table I/O operations and are tracked in context normal.

bulkread: Certain large read I/O operations done outside of shared buffers, for example, a sequential scan of a large table.

bulkwrite: Certain large write I/O operations done outside of shared buffers, such as COPY.

Number of read operations.

The total size of read operations in bytes.

read_time double precision

Time spent waiting for read operations in milliseconds (if track_io_timing is enabled and object is not wal, or if track_wal_io_timing is enabled and object is wal, otherwise zero)

Number of write operations.

The total size of write operations in bytes.

write_time double precision

Time spent waiting for write operations in milliseconds (if track_io_timing is enabled and object is not wal, or if track_wal_io_timing is enabled and object is wal, otherwise zero)

Number of units of size BLCKSZ (typically 8kB) which the process requested the kernel write out to permanent storage.

writeback_time double precision

Time spent waiting for writeback operations in milliseconds (if track_io_timing is enabled, otherwise zero). This includes the time spent queueing write-out requests and, potentially, the time spent to write out the dirty data.

Number of relation extend operations.

The total size of relation extend operations in bytes.

extend_time double precision

Time spent waiting for extend operations in milliseconds. (if track_io_timing is enabled and object is not wal, or if track_wal_io_timing is enabled and object is wal, otherwise zero)

The number of times a desired block was found in a shared buffer.

Number of times a block has been written out from a shared or local buffer in order to make it available for another use.

In context normal, this counts the number of times a block was evicted from a buffer and replaced with another block. In contexts bulkwrite, bulkread, and vacuum, this counts the number of times a block was evicted from shared buffers in order to add the shared buffer to a separate, size-limited ring buffer for use in a bulk I/O operation.

The number of times an existing buffer in a size-limited ring buffer outside of shared buffers was reused as part of an I/O operation in the bulkread, bulkwrite, or vacuum contexts.

Number of fsync calls. These are only tracked in context normal.

fsync_time double precision

Time spent waiting for fsync operations in milliseconds (if track_io_timing is enabled and object is not wal, or if track_wal_io_timing is enabled and object is wal, otherwise zero)

stats_reset timestamp with time zone

Time at which these statistics were last reset.

Some backend types never perform I/O operations on some I/O objects and/or in some I/O contexts. These rows are omitted from the view. For example, the checkpointer does not checkpoint temporary tables, so there will be no rows for backend_type checkpointer and object temp relation.

In addition, some I/O operations will never be performed either by certain backend types or on certain I/O objects and/or in certain I/O contexts. These cells will be NULL. For example, temporary tables are not fsynced, so fsyncs will be NULL for object temp relation. Also, the background writer does not perform reads, so reads will be NULL in rows for backend_type background writer.

For the object wal, fsyncs and fsync_time track the fsync activity of WAL files done in issue_xlog_fsync. writes and write_time track the write activity of WAL files done in XLogWrite. See Section 28.5 for more information.

pg_stat_io can be used to inform database tuning. For example:

A high evictions count can indicate that shared buffers should be increased.

Client backends rely on the checkpointer to ensure data is persisted to permanent storage. Large numbers of fsyncs by client backends could indicate a misconfiguration of shared buffers or of the checkpointer. More information on configuring the checkpointer can be found in Section 28.5.

Normally, client backends should be able to rely on auxiliary processes like the checkpointer and the background writer to write out dirty data as much as possible. Large numbers of writes by client backends could indicate a misconfiguration of shared buffers or of the checkpointer. More information on configuring the checkpointer can be found in Section 28.5.

Columns tracking I/O wait time will only be non-zero when track_io_timing is enabled. The user should be careful when referencing these columns in combination with their corresponding I/O operations in case track_io_timing was not enabled for the entire time since the last stats reset.

The pg_stat_bgwriter view will always have a single row, containing data about the background writer of the cluster.

Table 27.24. pg_stat_bgwriter View

Number of buffers written by the background writer

maxwritten_clean bigint

Number of times the background writer stopped a cleaning scan because it had written too many buffers

Number of buffers allocated

stats_reset timestamp with time zone

Time at which these statistics were last reset

The pg_stat_checkpointer view will always have a single row, containing data about the checkpointer process of the cluster.

Table 27.25. pg_stat_checkpointer View

Number of scheduled checkpoints due to timeout

Number of requested checkpoints

Number of checkpoints that have been performed

restartpoints_timed bigint

Number of scheduled restartpoints due to timeout or after a failed attempt to perform it

restartpoints_req bigint

Number of requested restartpoints

restartpoints_done bigint

Number of restartpoints that have been performed

write_time double precision

Total amount of time that has been spent in the portion of processing checkpoints and restartpoints where files are written to disk, in milliseconds

sync_time double precision

Total amount of time that has been spent in the portion of processing checkpoints and restartpoints where files are synchronized to disk, in milliseconds

buffers_written bigint

Number of shared buffers written during checkpoints and restartpoints

Number of SLRU buffers written during checkpoints and restartpoints

stats_reset timestamp with time zone

Time at which these statistics were last reset

Checkpoints may be skipped if the server has been idle since the last one. num_timed and num_requested count both completed and skipped checkpoints, while num_done tracks only the completed ones. Similarly, restartpoints may be skipped if the last replayed checkpoint record is already the last restartpoint. restartpoints_timed and restartpoints_req count both completed and skipped restartpoints, while restartpoints_done tracks only the completed ones.

The pg_stat_wal view will always have a single row, containing data about WAL activity of the cluster.

Table 27.26. pg_stat_wal View

Total number of WAL records generated

Total number of WAL full page images generated

Total amount of WAL generated in bytes

wal_buffers_full bigint

Number of times WAL data was written to disk because WAL buffers became full

stats_reset timestamp with time zone

Time at which these statistics were last reset

The pg_stat_database view will contain one row for each database in the cluster, plus one for shared objects, showing database-wide statistics.

Table 27.27. pg_stat_database View

OID of this database, or 0 for objects belonging to a shared relation

Name of this database, or NULL for shared objects.

Number of backends currently connected to this database, or NULL for shared objects. This is the only column in this view that returns a value reflecting current state; all other columns return the accumulated values since the last reset.

Number of transactions in this database that have been committed

Number of transactions in this database that have been rolled back

Number of disk blocks read in this database

Number of times disk blocks were found already in the buffer cache, so that a read was not necessary (this only includes hits in the PostgreSQL buffer cache, not the operating system's file system cache)

Number of live rows fetched by sequential scans and index entries returned by index scans in this database

Number of live rows fetched by index scans in this database

Number of rows inserted by queries in this database

Number of rows updated by queries in this database

Number of rows deleted by queries in this database

Number of queries canceled due to conflicts with recovery in this database. (Conflicts occur only on standby servers; see pg_stat_database_conflicts for details.)

Number of temporary files created by queries in this database. All temporary files are counted, regardless of why the temporary file was created (e.g., sorting or hashing), and regardless of the log_temp_files setting.

Total amount of data written to temporary files by queries in this database. All temporary files are counted, regardless of why the temporary file was created, and regardless of the log_temp_files setting.

Number of deadlocks detected in this database

checksum_failures bigint

Number of data page checksum failures detected in this database (or on a shared object), or NULL if data checksums are disabled.

checksum_last_failure timestamp with time zone

Time at which the last data page checksum failure was detected in this database (or on a shared object), or NULL if data checksums are disabled.

blk_read_time double precision

Time spent reading data file blocks by backends in this database, in milliseconds (if track_io_timing is enabled, otherwise zero)

blk_write_time double precision

Time spent writing data file blocks by backends in this database, in milliseconds (if track_io_timing is enabled, otherwise zero)

session_time double precision

Time spent by database sessions in this database, in milliseconds (note that statistics are only updated when the state of a session changes, so if sessions have been idle for a long time, this idle time won't be included)

active_time double precision

Time spent executing SQL statements in this database, in milliseconds (this corresponds to the states active and fastpath function call in pg_stat_activity)

idle_in_transaction_time double precision

Time spent idling while in a transaction in this database, in milliseconds (this corresponds to the states idle in transaction and idle in transaction (aborted) in pg_stat_activity)

Total number of sessions established to this database

sessions_abandoned bigint

Number of database sessions to this database that were terminated because connection to the client was lost

sessions_fatal bigint

Number of database sessions to this database that were terminated by fatal errors

sessions_killed bigint

Number of database sessions to this database that were terminated by operator intervention

parallel_workers_to_launch bigint

Number of parallel workers planned to be launched by queries on this database

parallel_workers_launched bigint

Number of parallel workers launched by queries on this database

stats_reset timestamp with time zone

Time at which these statistics were last reset

The pg_stat_database_conflicts view will contain one row per database, showing database-wide statistics about query cancels occurring due to conflicts with recovery on standby servers. This view will only contain information on standby servers, since conflicts do not occur on primary servers.

Table 27.28. pg_stat_database_conflicts View

Name of this database

confl_tablespace bigint

Number of queries in this database that have been canceled due to dropped tablespaces

Number of queries in this database that have been canceled due to lock timeouts


*(continued...)*
---

