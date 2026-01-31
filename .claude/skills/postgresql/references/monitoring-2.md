# PostgreSQL - Monitoring (Part 2)

## 27.2. The Cumulative Statistics System #


**URL:** https://www.postgresql.org/docs/18/monitoring-stats.html

**Contents:**
- 27.2. The Cumulative Statistics System #
  - 27.2.1. Statistics Collection Configuration #
  - 27.2.2. Viewing Statistics #
  - 27.2.3. pg_stat_activity #
  - Note
  - Note
  - 27.2.4. pg_stat_replication #
  - Note
  - 27.2.5. pg_stat_replication_slots #
  - 27.2.6. pg_stat_wal_receiver #

PostgreSQL's cumulative statistics system supports collection and reporting of information about server activity. Presently, accesses to tables and indexes in both disk-block and individual-row terms are counted. The total number of rows in each table, and information about vacuum and analyze actions for each table are also counted. If enabled, calls to user-defined functions and the total time spent in each one are counted as well.

PostgreSQL also supports reporting dynamic information about exactly what is going on in the system right now, such as the exact command currently being executed by other server processes, and which other connections exist in the system. This facility is independent of the cumulative statistics system.

Since collection of statistics adds some overhead to query execution, the system can be configured to collect or not collect information. This is controlled by configuration parameters that are normally set in postgresql.conf. (See Chapter 19 for details about setting configuration parameters.)

The parameter track_activities enables monitoring of the current command being executed by any server process.

The parameter track_cost_delay_timing enables monitoring of cost-based vacuum delay.

The parameter track_counts controls whether cumulative statistics are collected about table and index accesses.

The parameter track_functions enables tracking of usage of user-defined functions.

The parameter track_io_timing enables monitoring of block read, write, extend, and fsync times.

The parameter track_wal_io_timing enables monitoring of WAL read, write and fsync times.

Normally these parameters are set in postgresql.conf so that they apply to all server processes, but it is possible to turn them on or off in individual sessions using the SET command. (To prevent ordinary users from hiding their activity from the administrator, only superusers are allowed to change these parameters with SET.)

Cumulative statistics are collected in shared memory. Every PostgreSQL process collects statistics locally, then updates the shared data at appropriate intervals. When a server, including a physical replica, shuts down cleanly, a permanent copy of the statistics data is stored in the pg_stat subdirectory, so that statistics can be retained across server restarts. In contrast, when starting from an unclean shutdown (e.g., after an immediate shutdown, a server crash, starting from a base backup, and point-in-time recovery), all statistics counters are reset.

Several predefined views, listed in Table 27.1, are available to show the current state of the system. There are also several other views, listed in Table 27.2, available to show the accumulated statistics. Alternatively, one can build custom views using the underlying cumulative statistics functions, as discussed in Section 27.2.26.

When using the cumulative statistics views and functions to monitor collected data, it is important to realize that the information does not update instantaneously. Each individual server process flushes out accumulated statistics to shared memory just before going idle, but not more frequently than once per PGSTAT_MIN_INTERVAL milliseconds (1 second unless altered while building the server); so a query or transaction still in progress does not affect the displayed totals and the displayed information lags behind actual activity. However, current-query information collected by track_activities is always up-to-date.

Another important point is that when a server process is asked to display any of the accumulated statistics, accessed values are cached until the end of its current transaction in the default configuration. So the statistics will show static information as long as you continue the current transaction. Similarly, information about the current queries of all sessions is collected when any such information is first requested within a transaction, and the same information will be displayed throughout the transaction. This is a feature, not a bug, because it allows you to perform several queries on the statistics and correlate the results without worrying that the numbers are changing underneath you. When analyzing statistics interactively, or with expensive queries, the time delta between accesses to individual statistics can lead to significant skew in the cached statistics. To minimize skew, stats_fetch_consistency can be set to snapshot, at the price of increased memory usage for caching not-needed statistics data. Conversely, if it's known that statistics are only accessed once, caching accessed statistics is unnecessary and can be avoided by setting stats_fetch_consistency to none. You can invoke pg_stat_clear_snapshot() to discard the current transaction's statistics snapshot or cached values (if any). The next use of statistical information will (when in snapshot mode) cause a new snapshot to be built or (when in cache mode) accessed statistics to be cached.

A transaction can also see its own statistics (not yet flushed out to the shared memory statistics) in the views pg_stat_xact_all_tables, pg_stat_xact_sys_tables, pg_stat_xact_user_tables, and pg_stat_xact_user_functions. These numbers do not act as stated above; instead they update continuously throughout the transaction.

Some of the information in the dynamic statistics views shown in Table 27.1 is security restricted. Ordinary users can only see all the information about their own sessions (sessions belonging to a role that they are a member of). In rows about other sessions, many columns will be null. Note, however, that the existence of a session and its general properties such as its sessions user and database are visible to all users. Superusers and roles with privileges of built-in role pg_read_all_stats can see all the information about all sessions.

Table 27.1. Dynamic Statistics Views

Table 27.2. Collected Statistics Views

The per-index statistics are particularly useful to determine which indexes are being used and how effective they are.

The pg_stat_io and pg_statio_ set of views are useful for determining the effectiveness of the buffer cache. They can be used to calculate a cache hit ratio. Note that while PostgreSQL's I/O statistics capture most instances in which the kernel was invoked in order to perform I/O, they do not differentiate between data which had to be fetched from disk and that which already resided in the kernel page cache. Users are advised to use the PostgreSQL statistics views in combination with operating system utilities for a more complete picture of their database's I/O performance.

The pg_stat_activity view will have one row per server process, showing information related to the current activity of that process.

Table 27.3. pg_stat_activity View

OID of the database this backend is connected to

Name of the database this backend is connected to

Process ID of this backend

Process ID of the parallel group leader if this process is a parallel query worker, or process ID of the leader apply worker if this process is a parallel apply worker. NULL indicates that this process is a parallel group leader or leader apply worker, or does not participate in any parallel operation.

OID of the user logged into this backend

Name of the user logged into this backend

application_name text

Name of the application that is connected to this backend

IP address of the client connected to this backend. If this field is null, it indicates either that the client is connected via a Unix socket on the server machine or that this is an internal process such as autovacuum.

Host name of the connected client, as reported by a reverse DNS lookup of client_addr. This field will only be non-null for IP connections, and only when log_hostname is enabled.

TCP port number that the client is using for communication with this backend, or -1 if a Unix socket is used. If this field is null, it indicates that this is an internal server process.

backend_start timestamp with time zone

Time when this process was started. For client backends, this is the time the client connected to the server.

xact_start timestamp with time zone

Time when this process' current transaction was started, or null if no transaction is active. If the current query is the first of its transaction, this column is equal to the query_start column.

query_start timestamp with time zone

Time when the currently active query was started, or if state is not active, when the last query was started

state_change timestamp with time zone

Time when the state was last changed

The type of event for which the backend is waiting, if any; otherwise NULL. See Table 27.4.

Wait event name if backend is currently waiting, otherwise NULL. See Table 27.5 through Table 27.13.

Current overall state of this backend. Possible values are:

starting: The backend is in initial startup. Client authentication is performed during this phase.

active: The backend is executing a query.

idle: The backend is waiting for a new client command.

idle in transaction: The backend is in a transaction, but is not currently executing a query.

idle in transaction (aborted): This state is similar to idle in transaction, except one of the statements in the transaction caused an error.

fastpath function call: The backend is executing a fast-path function.

disabled: This state is reported if track_activities is disabled in this backend.

Top-level transaction identifier of this backend, if any; see Section 67.1.

The current backend's xmin horizon.

Identifier of this backend's most recent query. If state is active this field shows the identifier of the currently executing query. In all other states, it shows the identifier of last query that was executed. Query identifiers are not computed by default so this field will be null unless compute_query_id parameter is enabled or a third-party module that computes query identifiers is configured.

Text of this backend's most recent query. If state is active this field shows the currently executing query. In all other states, it shows the last query that was executed. By default the query text is truncated at 1024 bytes; this value can be changed via the parameter track_activity_query_size.

Type of current backend. Possible types are autovacuum launcher, autovacuum worker, logical replication launcher, logical replication worker, parallel worker, background writer, client backend, checkpointer, archiver, standalone backend, startup, walreceiver, walsender, walwriter and walsummarizer. In addition, background workers registered by extensions may have additional types.

The wait_event and state columns are independent. If a backend is in the active state, it may or may not be waiting on some event. If the state is active and wait_event is non-null, it means that a query is being executed, but is being blocked somewhere in the system. To keep the reporting overhead low, the system does not attempt to synchronize different aspects of activity data for a backend. As a result, ephemeral discrepancies may exist between the view's columns.

Table 27.4. Wait Event Types

Table 27.5. Wait Events of Type Activity

Table 27.6. Wait Events of Type Bufferpin

Table 27.7. Wait Events of Type Client

Table 27.8. Wait Events of Type Extension

Table 27.9. Wait Events of Type Io

Table 27.10. Wait Events of Type Ipc

Table 27.11. Wait Events of Type Lock

Table 27.12. Wait Events of Type Lwlock

Table 27.13. Wait Events of Type Timeout

Here are examples of how wait events can be viewed:

Extensions can add Extension, InjectionPoint, and LWLock events to the lists shown in Table 27.8 and Table 27.12. In some cases, the name of an LWLock assigned by an extension will not be available in all server processes. It might be reported as just “extension” rather than the extension-assigned name.

The pg_stat_replication view will contain one row per WAL sender process, showing statistics about replication to that sender's connected standby server. Only directly connected standbys are listed; no information is available about downstream standby servers.

Table 27.14. pg_stat_replication View

Process ID of a WAL sender process

OID of the user logged into this WAL sender process

Name of the user logged into this WAL sender process

application_name text

Name of the application that is connected to this WAL sender

IP address of the client connected to this WAL sender. If this field is null, it indicates that the client is connected via a Unix socket on the server machine.

Host name of the connected client, as reported by a reverse DNS lookup of client_addr. This field will only be non-null for IP connections, and only when log_hostname is enabled.

TCP port number that the client is using for communication with this WAL sender, or -1 if a Unix socket is used

backend_start timestamp with time zone

Time when this process was started, i.e., when the client connected to this WAL sender

This standby's xmin horizon reported by hot_standby_feedback.

Current WAL sender state. Possible values are:

startup: This WAL sender is starting up.

catchup: This WAL sender's connected standby is catching up with the primary.

streaming: This WAL sender is streaming changes after its connected standby server has caught up with the primary.

backup: This WAL sender is sending a backup.

stopping: This WAL sender is stopping.

Last write-ahead log location sent on this connection

Last write-ahead log location written to disk by this standby server

Last write-ahead log location flushed to disk by this standby server

Last write-ahead log location replayed into the database on this standby server

Time elapsed between flushing recent WAL locally and receiving notification that this standby server has written it (but not yet flushed it or applied it). This can be used to gauge the delay that synchronous_commit level remote_write incurred while committing if this server was configured as a synchronous standby.

Time elapsed between flushing recent WAL locally and receiving notification that this standby server has written and flushed it (but not yet applied it). This can be used to gauge the delay that synchronous_commit level on incurred while committing if this server was configured as a synchronous standby.

Time elapsed between flushing recent WAL locally and receiving notification that this standby server has written, flushed and applied it. This can be used to gauge the delay that synchronous_commit level remote_apply incurred while committing if this server was configured as a synchronous standby.

sync_priority integer

Priority of this standby server for being chosen as the synchronous standby in a priority-based synchronous replication. This has no effect in a quorum-based synchronous replication.

Synchronous state of this standby server. Possible values are:

async: This standby server is asynchronous.

potential: This standby server is now asynchronous, but can potentially become synchronous if one of current synchronous ones fails.

sync: This standby server is synchronous.

quorum: This standby server is considered as a candidate for quorum standbys.

reply_time timestamp with time zone

Send time of last reply message received from standby server

The lag times reported in the pg_stat_replication view are measurements of the time taken for recent WAL to be written, flushed and replayed and for the sender to know about it. These times represent the commit delay that was (or would have been) introduced by each synchronous commit level, if the remote server was configured as a synchronous standby. For an asynchronous standby, the replay_lag column approximates the delay before recent transactions became visible to queries. If the standby server has entirely caught up with the sending server and there is no more WAL activity, the most recently measured lag times will continue to be displayed for a short time and then show NULL.

Lag times work automatically for physical replication. Logical decoding plugins may optionally emit tracking messages; if they do not, the tracking mechanism will simply display NULL lag.

The reported lag times are not predictions of how long it will take for the standby to catch up with the sending server assuming the current rate of replay. Such a system would show similar times while new WAL is being generated, but would differ when the sender becomes idle. In particular, when the standby has caught up completely, pg_stat_replication shows the time taken to write, flush and replay the most recent reported WAL location rather than zero as some users might expect. This is consistent with the goal of measuring synchronous commit and transaction visibility delays for recent write transactions. To reduce confusion for users expecting a different model of lag, the lag columns revert to NULL after a short time on a fully replayed idle system. Monitoring systems should choose whether to represent this as missing data, zero or continue to display the last known value.

The pg_stat_replication_slots view will contain one row per logical replication slot, showing statistics about its usage.

Table 27.15. pg_stat_replication_slots View

A unique, cluster-wide identifier for the replication slot

Number of transactions spilled to disk once the memory used by logical decoding to decode changes from WAL has exceeded logical_decoding_work_mem. The counter gets incremented for both top-level transactions and subtransactions.

Number of times transactions were spilled to disk while decoding changes from WAL for this slot. This counter is incremented each time a transaction is spilled, and the same transaction may be spilled multiple times.

Amount of decoded transaction data spilled to disk while performing decoding of changes from WAL for this slot. This and other spill counters can be used to gauge the I/O which occurred during logical decoding and allow tuning logical_decoding_work_mem.

Number of in-progress transactions streamed to the decoding output plugin after the memory used by logical decoding to decode changes from WAL for this slot has exceeded logical_decoding_work_mem. Streaming only works with top-level transactions (subtransactions can't be streamed independently), so the counter is not incremented for subtransactions.

Number of times in-progress transactions were streamed to the decoding output plugin while decoding changes from WAL for this slot. This counter is incremented each time a transaction is streamed, and the same transaction may be streamed multiple times.

Amount of transaction data decoded for streaming in-progress transactions to the decoding output plugin while decoding changes from WAL for this slot. This and other streaming counters for this slot can be used to tune logical_decoding_work_mem.

Number of decoded transactions sent to the decoding output plugin for this slot. This counts top-level transactions only, and is not incremented for subtransactions. Note that this includes the transactions that are streamed and/or spilled.

Amount of transaction data decoded for sending transactions to the decoding output plugin while decoding changes from WAL for this slot. Note that this includes data that is streamed and/or spilled.

stats_reset timestamp with time zone

Time at which these statistics were last reset

The pg_stat_wal_receiver view will contain only one row, showing statistics about the WAL receiver from that receiver's connected server.

Table 27.16. pg_stat_wal_receiver View

Process ID of the WAL receiver process

Activity status of the WAL receiver process

receive_start_lsn pg_lsn

First write-ahead log location used when WAL receiver is started

receive_start_tli integer

First timeline number used when WAL receiver is started

Last write-ahead log location already received and written to disk, but not flushed. This should not be used for data integrity checks.

Last write-ahead log location already received and flushed to disk, the initial value of this field being the first log location used when WAL receiver is started

Timeline number of last write-ahead log location received and flushed to disk, the initial value of this field being the timeline number of the first log location used when WAL receiver is started

last_msg_send_time timestamp with time zone

Send time of last message received from origin WAL sender

last_msg_receipt_time timestamp with time zone

Receipt time of last message received from origin WAL sender

latest_end_lsn pg_lsn

Last write-ahead log location reported to origin WAL sender

latest_end_time timestamp with time zone

Time of last write-ahead log location reported to origin WAL sender

Replication slot name used by this WAL receiver

Host of the PostgreSQL instance this WAL receiver is connected to. This can be a host name, an IP address, or a directory path if the connection is via Unix socket. (The path case can be distinguished because it will always be an absolute path, beginning with /.)

Port number of the PostgreSQL instance this WAL receiver is connected to.

Connection string used by this WAL receiver, with security-sensitive fields obfuscated.

The pg_stat_recovery_prefetch view will contain only one row. The columns wal_distance, block_distance and io_depth show current values, and the other columns show cumulative counters that can be reset with the pg_stat_reset_shared function.

Table 27.17. pg_stat_recovery_prefetch View

stats_reset timestamp with time zone

Time at which these statistics were last reset

Number of blocks prefetched because they were not in the buffer pool

Number of blocks not prefetched because they were already in the buffer pool

Number of blocks not prefetched because they would be zero-initialized

Number of blocks not prefetched because they didn't exist yet

Number of blocks not prefetched because a full page image was included in the WAL

Number of blocks not prefetched because they were already recently prefetched

How many bytes ahead the prefetcher is looking

How many blocks ahead the prefetcher is looking

How many prefetches have been initiated but are not yet known to have completed

Table 27.18. pg_stat_subscription View

OID of the subscription

Name of the subscription

Type of the subscription worker process. Possible types are apply, parallel apply, and table synchronization.

Process ID of the subscription worker process

Process ID of the leader apply worker if this process is a parallel apply worker; NULL if this process is a leader apply worker or a table synchronization worker

OID of the relation that the worker is synchronizing; NULL for the leader apply worker and parallel apply workers

Last write-ahead log location received, the initial value of this field being 0; NULL for parallel apply workers

last_msg_send_time timestamp with time zone

Send time of last message received from origin WAL sender; NULL for parallel apply workers

last_msg_receipt_time timestamp with time zone

Receipt time of last message received from origin WAL sender; NULL for parallel apply workers

latest_end_lsn pg_lsn

Last write-ahead log location reported to origin WAL sender; NULL for parallel apply workers

latest_end_time timestamp with time zone

Time of last write-ahead log location reported to origin WAL sender; NULL for parallel apply workers

The pg_stat_subscription_stats view will contain one row per subscription.

Table 27.19. pg_stat_subscription_stats View

OID of the subscription

Name of the subscription

apply_error_count bigint

Number of times an error occurred while applying changes. Note that any conflict resulting in an apply error will be counted in both apply_error_count and the corresponding conflict count (e.g., confl_*).

sync_error_count bigint


*(continued...)*
---

