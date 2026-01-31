# PostgreSQL - Monitoring (Part 5)

## 27.2. The Cumulative Statistics System # (continued)
pg_stat_get_backend_start ( integer ) → timestamp with time zone

Returns the time when this process was started.

pg_stat_get_backend_subxact ( integer ) → record

Returns a record of information about the subtransactions of the backend with the specified ID. The fields returned are subxact_count, which is the number of subtransactions in the backend's subtransaction cache, and subxact_overflow, which indicates whether the backend's subtransaction cache is overflowed or not.

pg_stat_get_backend_userid ( integer ) → oid

Returns the OID of the user logged into this backend.

pg_stat_get_backend_wait_event ( integer ) → text

Returns the wait event name if this backend is currently waiting, otherwise NULL. See Table 27.5 through Table 27.13.

pg_stat_get_backend_wait_event_type ( integer ) → text

Returns the wait event type name if this backend is currently waiting, otherwise NULL. See Table 27.4 for details.

pg_stat_get_backend_xact_start ( integer ) → timestamp with time zone

Returns the time when the backend's current transaction was started.

**Examples:**

Example 1 (unknown):
```unknown
pg_stat_activity
```

Example 2 (unknown):
```unknown
pg_stat_replication
```

Example 3 (unknown):
```unknown
pg_stat_replication_slots
```

Example 4 (unknown):
```unknown
pg_stat_wal_receiver
```

---


---

## 27.4. Progress Reporting #


**URL:** https://www.postgresql.org/docs/18/progress-reporting.html

**Contents:**
- 27.4. Progress Reporting #
  - 27.4.1. ANALYZE Progress Reporting #
  - Note
  - 27.4.2. CLUSTER Progress Reporting #
  - 27.4.3. COPY Progress Reporting #
  - 27.4.4. CREATE INDEX Progress Reporting #
  - 27.4.5. VACUUM Progress Reporting #
  - 27.4.6. Base Backup Progress Reporting #

PostgreSQL has the ability to report the progress of certain commands during command execution. Currently, the only commands which support progress reporting are ANALYZE, CLUSTER, CREATE INDEX, VACUUM, COPY, and BASE_BACKUP (i.e., replication command that pg_basebackup issues to take a base backup). This may be expanded in the future.

Whenever ANALYZE is running, the pg_stat_progress_analyze view will contain a row for each backend that is currently running that command. The tables below describe the information that will be reported and provide information about how to interpret it.

Table 27.38. pg_stat_progress_analyze View

Process ID of backend.

OID of the database to which this backend is connected.

Name of the database to which this backend is connected.

OID of the table being analyzed.

Current processing phase. See Table 27.39.

sample_blks_total bigint

Total number of heap blocks that will be sampled.

sample_blks_scanned bigint

Number of heap blocks scanned.

ext_stats_total bigint

Number of extended statistics.

ext_stats_computed bigint

Number of extended statistics computed. This counter only advances when the phase is computing extended statistics.

child_tables_total bigint

Number of child tables.

child_tables_done bigint

Number of child tables scanned. This counter only advances when the phase is acquiring inherited sample rows.

current_child_table_relid oid

OID of the child table currently being scanned. This field is only valid when the phase is acquiring inherited sample rows.

delay_time double precision

Total time spent sleeping due to cost-based delay (see Section 19.10.2), in milliseconds (if track_cost_delay_timing is enabled, otherwise zero).

Table 27.39. ANALYZE Phases

Note that when ANALYZE is run on a partitioned table without the ONLY keyword, all of its partitions are also recursively analyzed. In that case, ANALYZE progress is reported first for the parent table, whereby its inheritance statistics are collected, followed by that for each partition.

Whenever CLUSTER or VACUUM FULL is running, the pg_stat_progress_cluster view will contain a row for each backend that is currently running either command. The tables below describe the information that will be reported and provide information about how to interpret it.

Table 27.40. pg_stat_progress_cluster View

Process ID of backend.

OID of the database to which this backend is connected.

Name of the database to which this backend is connected.

OID of the table being clustered.

The command that is running. Either CLUSTER or VACUUM FULL.

Current processing phase. See Table 27.41.

cluster_index_relid oid

If the table is being scanned using an index, this is the OID of the index being used; otherwise, it is zero.

heap_tuples_scanned bigint

Number of heap tuples scanned. This counter only advances when the phase is seq scanning heap, index scanning heap or writing new heap.

heap_tuples_written bigint

Number of heap tuples written. This counter only advances when the phase is seq scanning heap, index scanning heap or writing new heap.

heap_blks_total bigint

Total number of heap blocks in the table. This number is reported as of the beginning of seq scanning heap.

heap_blks_scanned bigint

Number of heap blocks scanned. This counter only advances when the phase is seq scanning heap.

index_rebuild_count bigint

Number of indexes rebuilt. This counter only advances when the phase is rebuilding index.

Table 27.41. CLUSTER and VACUUM FULL Phases

Whenever COPY is running, the pg_stat_progress_copy view will contain one row for each backend that is currently running a COPY command. The table below describes the information that will be reported and provides information about how to interpret it.

Table 27.42. pg_stat_progress_copy View

Process ID of backend.

OID of the database to which this backend is connected.

Name of the database to which this backend is connected.

OID of the table on which the COPY command is executed. It is set to 0 if copying from a SELECT query.

The command that is running: COPY FROM, or COPY TO.

The I/O type that the data is read from or written to: FILE, PROGRAM, PIPE (for COPY FROM STDIN and COPY TO STDOUT), or CALLBACK (used for example during the initial table synchronization in logical replication).

bytes_processed bigint

Number of bytes already processed by COPY command.

Size of source file for COPY FROM command in bytes. It is set to 0 if not available.

tuples_processed bigint

Number of tuples already processed by COPY command.

tuples_excluded bigint

Number of tuples not processed because they were excluded by the WHERE clause of the COPY command.

tuples_skipped bigint

Number of tuples skipped because they contain malformed data. This counter only advances when a value other than stop is specified to the ON_ERROR option.

Whenever CREATE INDEX or REINDEX is running, the pg_stat_progress_create_index view will contain one row for each backend that is currently creating indexes. The tables below describe the information that will be reported and provide information about how to interpret it.

Table 27.43. pg_stat_progress_create_index View

Process ID of the backend creating indexes.

OID of the database to which this backend is connected.

Name of the database to which this backend is connected.

OID of the table on which the index is being created.

OID of the index being created or reindexed. During a non-concurrent CREATE INDEX, this is 0.

Specific command type: CREATE INDEX, CREATE INDEX CONCURRENTLY, REINDEX, or REINDEX CONCURRENTLY.

Current processing phase of index creation. See Table 27.44.

Total number of lockers to wait for, when applicable.

Number of lockers already waited for.

current_locker_pid bigint

Process ID of the locker currently being waited for.

Total number of blocks to be processed in the current phase.

Number of blocks already processed in the current phase.

Total number of tuples to be processed in the current phase.

Number of tuples already processed in the current phase.

partitions_total bigint

Total number of partitions on which the index is to be created or attached, including both direct and indirect partitions. 0 during a REINDEX, or when the index is not partitioned.

partitions_done bigint

Number of partitions on which the index has already been created or attached, including both direct and indirect partitions. 0 during a REINDEX, or when the index is not partitioned.

Table 27.44. CREATE INDEX Phases

Whenever VACUUM is running, the pg_stat_progress_vacuum view will contain one row for each backend (including autovacuum worker processes) that is currently vacuuming. The tables below describe the information that will be reported and provide information about how to interpret it. Progress for VACUUM FULL commands is reported via pg_stat_progress_cluster because both VACUUM FULL and CLUSTER rewrite the table, while regular VACUUM only modifies it in place. See Section 27.4.2.

Table 27.45. pg_stat_progress_vacuum View

Process ID of backend.

OID of the database to which this backend is connected.

Name of the database to which this backend is connected.

OID of the table being vacuumed.

Current processing phase of vacuum. See Table 27.46.

heap_blks_total bigint

Total number of heap blocks in the table. This number is reported as of the beginning of the scan; blocks added later will not be (and need not be) visited by this VACUUM.

heap_blks_scanned bigint

Number of heap blocks scanned. Because the visibility map is used to optimize scans, some blocks will be skipped without inspection; skipped blocks are included in this total, so that this number will eventually become equal to heap_blks_total when the vacuum is complete. This counter only advances when the phase is scanning heap.

heap_blks_vacuumed bigint

Number of heap blocks vacuumed. Unless the table has no indexes, this counter only advances when the phase is vacuuming heap. Blocks that contain no dead tuples are skipped, so the counter may sometimes skip forward in large increments.

index_vacuum_count bigint

Number of completed index vacuum cycles.

max_dead_tuple_bytes bigint

Amount of dead tuple data that we can store before needing to perform an index vacuum cycle, based on maintenance_work_mem.

dead_tuple_bytes bigint

Amount of dead tuple data collected since the last index vacuum cycle.

num_dead_item_ids bigint

Number of dead item identifiers collected since the last index vacuum cycle.

Total number of indexes that will be vacuumed or cleaned up. This number is reported at the beginning of the vacuuming indexes phase or the cleaning up indexes phase.

indexes_processed bigint

Number of indexes processed. This counter only advances when the phase is vacuuming indexes or cleaning up indexes.

delay_time double precision

Total time spent sleeping due to cost-based delay (see Section 19.10.2), in milliseconds (if track_cost_delay_timing is enabled, otherwise zero). This includes the time that any associated parallel workers have slept. However, parallel workers report their sleep time no more frequently than once per second, so the reported value may be slightly stale.

Table 27.46. VACUUM Phases

Whenever an application like pg_basebackup is taking a base backup, the pg_stat_progress_basebackup view will contain a row for each WAL sender process that is currently running the BASE_BACKUP replication command and streaming the backup. The tables below describe the information that will be reported and provide information about how to interpret it.

Table 27.47. pg_stat_progress_basebackup View

Process ID of a WAL sender process.

Current processing phase. See Table 27.48.

Total amount of data that will be streamed. This is estimated and reported as of the beginning of streaming database files phase. Note that this is only an approximation since the database may change during streaming database files phase and WAL log may be included in the backup later. This is always the same value as backup_streamed once the amount of data streamed exceeds the estimated total size. If the estimation is disabled in pg_basebackup (i.e., --no-estimate-size option is specified), this is NULL.

backup_streamed bigint

Amount of data streamed. This counter only advances when the phase is streaming database files or transferring wal files.

tablespaces_total bigint

Total number of tablespaces that will be streamed.

tablespaces_streamed bigint

Number of tablespaces streamed. This counter only advances when the phase is streaming database files.

Table 27.48. Base Backup Phases

**Examples:**

Example 1 (unknown):
```unknown
CREATE INDEX
```

Example 2 (unknown):
```unknown
pg_stat_progress_analyze
```

Example 3 (unknown):
```unknown
pg_stat_progress_analyze
```

Example 4 (unknown):
```unknown
sample_blks_total
```

---


---

## 27.3. Viewing Locks #


**URL:** https://www.postgresql.org/docs/18/monitoring-locks.html

**Contents:**
- 27.3. Viewing Locks #

Another useful tool for monitoring database activity is the pg_locks system table. It allows the database administrator to view information about the outstanding locks in the lock manager. For example, this capability can be used to:

View all the locks currently outstanding, all the locks on relations in a particular database, all the locks on a particular relation, or all the locks held by a particular PostgreSQL session.

Determine the relation in the current database with the most ungranted locks (which might be a source of contention among database clients).

Determine the effect of lock contention on overall database performance, as well as the extent to which contention varies with overall database traffic.

Details of the pg_locks view appear in Section 53.13. For more information on locking and managing concurrency with PostgreSQL, refer to Chapter 13.

---


---

