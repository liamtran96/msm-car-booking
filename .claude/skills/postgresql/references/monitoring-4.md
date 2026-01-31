# PostgreSQL - Monitoring (Part 4)

## 27.2. The Cumulative Statistics System # (continued)
confl_snapshot bigint

Number of queries in this database that have been canceled due to old snapshots

confl_bufferpin bigint

Number of queries in this database that have been canceled due to pinned buffers

confl_deadlock bigint

Number of queries in this database that have been canceled due to deadlocks

confl_active_logicalslot bigint

Number of uses of logical slots in this database that have been canceled due to old snapshots or too low a wal_level on the primary

The pg_stat_all_tables view will contain one row for each table in the current database (including TOAST tables), showing statistics about accesses to that specific table. The pg_stat_user_tables and pg_stat_sys_tables views contain the same information, but filtered to only show user and system tables respectively.

Table 27.29. pg_stat_all_tables View

Name of the schema that this table is in

Number of sequential scans initiated on this table

last_seq_scan timestamp with time zone

The time of the last sequential scan on this table, based on the most recent transaction stop time

Number of live rows fetched by sequential scans

Number of index scans initiated on this table

last_idx_scan timestamp with time zone

The time of the last index scan on this table, based on the most recent transaction stop time

Number of live rows fetched by index scans

Total number of rows inserted

Total number of rows updated. (This includes row updates counted in n_tup_hot_upd and n_tup_newpage_upd, and remaining non-HOT updates.)

Total number of rows deleted

Number of rows HOT updated. These are updates where no successor versions are required in indexes.

n_tup_newpage_upd bigint

Number of rows updated where the successor version goes onto a new heap page, leaving behind an original version with a t_ctid field that points to a different heap page. These are always non-HOT updates.

Estimated number of live rows

Estimated number of dead rows

n_mod_since_analyze bigint

Estimated number of rows modified since this table was last analyzed

n_ins_since_vacuum bigint

Estimated number of rows inserted since this table was last vacuumed (not counting VACUUM FULL)

last_vacuum timestamp with time zone

Last time at which this table was manually vacuumed (not counting VACUUM FULL)

last_autovacuum timestamp with time zone

Last time at which this table was vacuumed by the autovacuum daemon

last_analyze timestamp with time zone

Last time at which this table was manually analyzed

last_autoanalyze timestamp with time zone

Last time at which this table was analyzed by the autovacuum daemon

Number of times this table has been manually vacuumed (not counting VACUUM FULL)

autovacuum_count bigint

Number of times this table has been vacuumed by the autovacuum daemon

Number of times this table has been manually analyzed

autoanalyze_count bigint

Number of times this table has been analyzed by the autovacuum daemon

total_vacuum_time double precision

Total time this table has been manually vacuumed, in milliseconds (not counting VACUUM FULL). (This includes the time spent sleeping due to cost-based delays.)

total_autovacuum_time double precision

Total time this table has been vacuumed by the autovacuum daemon, in milliseconds. (This includes the time spent sleeping due to cost-based delays.)

total_analyze_time double precision

Total time this table has been manually analyzed, in milliseconds. (This includes the time spent sleeping due to cost-based delays.)

total_autoanalyze_time double precision

Total time this table has been analyzed by the autovacuum daemon, in milliseconds. (This includes the time spent sleeping due to cost-based delays.)

The pg_stat_all_indexes view will contain one row for each index in the current database, showing statistics about accesses to that specific index. The pg_stat_user_indexes and pg_stat_sys_indexes views contain the same information, but filtered to only show user and system indexes respectively.

Table 27.30. pg_stat_all_indexes View

OID of the table for this index

Name of the schema this index is in

Name of the table for this index

Number of index scans initiated on this index

last_idx_scan timestamp with time zone

The time of the last scan on this index, based on the most recent transaction stop time

Number of index entries returned by scans on this index

Number of live table rows fetched by simple index scans using this index

Indexes can be used by simple index scans, “bitmap” index scans, and the optimizer. In a bitmap scan the output of several indexes can be combined via AND or OR rules, so it is difficult to associate individual heap row fetches with specific indexes when a bitmap scan is used. Therefore, a bitmap scan increments the pg_stat_all_indexes.idx_tup_read count(s) for the index(es) it uses, and it increments the pg_stat_all_tables.idx_tup_fetch count for the table, but it does not affect pg_stat_all_indexes.idx_tup_fetch. The optimizer also accesses indexes to check for supplied constants whose values are outside the recorded range of the optimizer statistics because the optimizer statistics might be stale.

The idx_tup_read and idx_tup_fetch counts can be different even without any use of bitmap scans, because idx_tup_read counts index entries retrieved from the index while idx_tup_fetch counts live rows fetched from the table. The latter will be less if any dead or not-yet-committed rows are fetched using the index, or if any heap fetches are avoided by means of an index-only scan.

Index scans may sometimes perform multiple index searches per execution. Each index search increments pg_stat_all_indexes.idx_scan, so it's possible for the count of index scans to significantly exceed the total number of index scan executor node executions.

This can happen with queries that use certain SQL constructs to search for rows matching any value out of a list or array of multiple scalar values (see Section 9.25). It can also happen to queries with a column_name = value1 OR column_name = value2 ... construct, though only when the optimizer transforms the construct into an equivalent multi-valued array representation. Similarly, when B-tree index scans use the skip scan optimization, an index search is performed each time the scan is repositioned to the next index leaf page that might have matching tuples (see Section 11.3).

EXPLAIN ANALYZE outputs the total number of index searches performed by each index scan node. See Section 14.1.2 for an example demonstrating how this works.

The pg_statio_all_tables view will contain one row for each table in the current database (including TOAST tables), showing statistics about I/O on that specific table. The pg_statio_user_tables and pg_statio_sys_tables views contain the same information, but filtered to only show user and system tables respectively.

Table 27.31. pg_statio_all_tables View

Name of the schema that this table is in

heap_blks_read bigint

Number of disk blocks read from this table

Number of buffer hits in this table

Number of disk blocks read from all indexes on this table

Number of buffer hits in all indexes on this table

toast_blks_read bigint

Number of disk blocks read from this table's TOAST table (if any)

toast_blks_hit bigint

Number of buffer hits in this table's TOAST table (if any)

tidx_blks_read bigint

Number of disk blocks read from this table's TOAST table indexes (if any)

Number of buffer hits in this table's TOAST table indexes (if any)

The pg_statio_all_indexes view will contain one row for each index in the current database, showing statistics about I/O on that specific index. The pg_statio_user_indexes and pg_statio_sys_indexes views contain the same information, but filtered to only show user and system indexes respectively.

Table 27.32. pg_statio_all_indexes View

OID of the table for this index

Name of the schema this index is in

Name of the table for this index

Number of disk blocks read from this index

Number of buffer hits in this index

The pg_statio_all_sequences view will contain one row for each sequence in the current database, showing statistics about I/O on that specific sequence.

Table 27.33. pg_statio_all_sequences View

Name of the schema this sequence is in

Name of this sequence

Number of disk blocks read from this sequence

Number of buffer hits in this sequence

The pg_stat_user_functions view will contain one row for each tracked function, showing statistics about executions of that function. The track_functions parameter controls exactly which functions are tracked.

Table 27.34. pg_stat_user_functions View

Name of the schema this function is in

Name of this function

Number of times this function has been called

total_time double precision

Total time spent in this function and all other functions called by it, in milliseconds

self_time double precision

Total time spent in this function itself, not including other functions called by it, in milliseconds

PostgreSQL accesses certain on-disk information via SLRU (simple least-recently-used) caches. The pg_stat_slru view will contain one row for each tracked SLRU cache, showing statistics about access to cached pages.

For each SLRU cache that's part of the core server, there is a configuration parameter that controls its size, with the suffix _buffers appended.

Table 27.35. pg_stat_slru View

Number of blocks zeroed during initializations

Number of times disk blocks were found already in the SLRU, so that a read was not necessary (this only includes hits in the SLRU, not the operating system's file system cache)

Number of disk blocks read for this SLRU

Number of disk blocks written for this SLRU

Number of blocks checked for existence for this SLRU

Number of flushes of dirty data for this SLRU

Number of truncates for this SLRU

stats_reset timestamp with time zone

Time at which these statistics were last reset

Other ways of looking at the statistics can be set up by writing queries that use the same underlying statistics access functions used by the standard views shown above. For details such as the functions' names, consult the definitions of the standard views. (For example, in psql you could issue \d+ pg_stat_activity.) The access functions for per-database statistics take a database OID as an argument to identify which database to report on. The per-table and per-index functions take a table or index OID. The functions for per-function statistics take a function OID. Note that only tables, indexes, and functions in the current database can be seen with these functions.

Additional functions related to the cumulative statistics system are listed in Table 27.36.

Table 27.36. Additional Statistics Functions

pg_backend_pid () → integer

Returns the process ID of the server process attached to the current session.

pg_stat_get_backend_io ( integer ) → setof record

Returns I/O statistics about the backend with the specified process ID. The output fields are exactly the same as the ones in the pg_stat_io view.

The function does not return I/O statistics for the checkpointer, the background writer, the startup process and the autovacuum launcher as they are already visible in the pg_stat_io view and there is only one of each.

pg_stat_get_activity ( integer ) → setof record

Returns a record of information about the backend with the specified process ID, or one record for each active backend in the system if NULL is specified. The fields returned are a subset of those in the pg_stat_activity view.

pg_stat_get_backend_wal ( integer ) → record

Returns WAL statistics about the backend with the specified process ID. The output fields are exactly the same as the ones in the pg_stat_wal view.

The function does not return WAL statistics for the checkpointer, the background writer, the startup process and the autovacuum launcher.

pg_stat_get_snapshot_timestamp () → timestamp with time zone

Returns the timestamp of the current statistics snapshot, or NULL if no statistics snapshot has been taken. A snapshot is taken the first time cumulative statistics are accessed in a transaction if stats_fetch_consistency is set to snapshot

pg_stat_get_xact_blocks_fetched ( oid ) → bigint

Returns the number of block read requests for table or index, in the current transaction. This number minus pg_stat_get_xact_blocks_hit gives the number of kernel read() calls; the number of actual physical reads is usually lower due to kernel-level buffering.

pg_stat_get_xact_blocks_hit ( oid ) → bigint

Returns the number of block read requests for table or index, in the current transaction, found in cache (not triggering kernel read() calls).

pg_stat_clear_snapshot () → void

Discards the current statistics snapshot or cached information.

pg_stat_reset () → void

Resets all statistics counters for the current database to zero.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

pg_stat_reset_shared ( [ target text DEFAULT NULL ] ) → void

Resets some cluster-wide statistics counters to zero, depending on the argument. target can be:

archiver: Reset all the counters shown in the pg_stat_archiver view.

bgwriter: Reset all the counters shown in the pg_stat_bgwriter view.

checkpointer: Reset all the counters shown in the pg_stat_checkpointer view.

io: Reset all the counters shown in the pg_stat_io view.

recovery_prefetch: Reset all the counters shown in the pg_stat_recovery_prefetch view.

slru: Reset all the counters shown in the pg_stat_slru view.

wal: Reset all the counters shown in the pg_stat_wal view.

NULL or not specified: All the counters from the views listed above are reset.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

pg_stat_reset_single_table_counters ( oid ) → void

Resets statistics for a single table or index in the current database or shared across all databases in the cluster to zero.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

pg_stat_reset_backend_stats ( integer ) → void

Resets statistics for a single backend with the specified process ID to zero.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

pg_stat_reset_single_function_counters ( oid ) → void

Resets statistics for a single function in the current database to zero.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

pg_stat_reset_slru ( [ target text DEFAULT NULL ] ) → void

Resets statistics to zero for a single SLRU cache, or for all SLRUs in the cluster. If target is NULL or is not specified, all the counters shown in the pg_stat_slru view for all SLRU caches are reset. The argument can be one of commit_timestamp, multixact_member, multixact_offset, notify, serializable, subtransaction, or transaction to reset the counters for only that entry. If the argument is other (or indeed, any unrecognized name), then the counters for all other SLRU caches, such as extension-defined caches, are reset.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

pg_stat_reset_replication_slot ( text ) → void

Resets statistics of the replication slot defined by the argument. If the argument is NULL, resets statistics for all the replication slots.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

pg_stat_reset_subscription_stats ( oid ) → void

Resets statistics for a single subscription shown in the pg_stat_subscription_stats view to zero. If the argument is NULL, reset statistics for all subscriptions.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

Using pg_stat_reset() also resets counters that autovacuum uses to determine when to trigger a vacuum or an analyze. Resetting these counters can cause autovacuum to not perform necessary work, which can cause problems such as table bloat or out-dated table statistics. A database-wide ANALYZE is recommended after the statistics have been reset.

pg_stat_get_activity, the underlying function of the pg_stat_activity view, returns a set of records containing all the available information about each backend process. Sometimes it may be more convenient to obtain just a subset of this information. In such cases, another set of per-backend statistics access functions can be used; these are shown in Table 27.37. These access functions use the session's backend ID number, which is a small integer (>= 0) that is distinct from the backend ID of any concurrent session, although a session's ID can be recycled as soon as it exits. The backend ID is used, among other things, to identify the session's temporary schema if it has one. The function pg_stat_get_backend_idset provides a convenient way to list all the active backends' ID numbers for invoking these functions. For example, to show the PIDs and current queries of all backends:

Table 27.37. Per-Backend Statistics Functions

pg_stat_get_backend_activity ( integer ) → text

Returns the text of this backend's most recent query.

pg_stat_get_backend_activity_start ( integer ) → timestamp with time zone

Returns the time when the backend's most recent query was started.

pg_stat_get_backend_client_addr ( integer ) → inet

Returns the IP address of the client connected to this backend.

pg_stat_get_backend_client_port ( integer ) → integer

Returns the TCP port number that the client is using for communication.

pg_stat_get_backend_dbid ( integer ) → oid

Returns the OID of the database this backend is connected to.

pg_stat_get_backend_idset () → setof integer

Returns the set of currently active backend ID numbers.

pg_stat_get_backend_pid ( integer ) → integer

Returns the process ID of this backend.


*(continued...)*
---

