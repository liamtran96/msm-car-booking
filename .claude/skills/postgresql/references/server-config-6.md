# PostgreSQL - Server Config (Part 6)

## 19.18. Short Options #


**URL:** https://www.postgresql.org/docs/18/runtime-config-short.html

**Contents:**
- 19.18. Short Options #

For convenience there are also single letter command-line option switches available for some parameters. They are described in Table 19.5. Some of these options exist for historical reasons, and their presence as a single-letter option does not necessarily indicate an endorsement to use the option heavily.

Table 19.5. Short Option Key

**Examples:**

Example 1 (unknown):
```unknown
shared_buffers = x
```

Example 2 (unknown):
```unknown
log_min_messages = DEBUGx
```

Example 3 (unknown):
```unknown
datestyle = euro
```

Example 4 (unknown):
```unknown
enable_bitmapscan = off
```

---


---

## 19.6. Replication #


**URL:** https://www.postgresql.org/docs/18/runtime-config-replication.html

**Contents:**
- 19.6. Replication #
  - 19.6.1. Sending Servers #
  - 19.6.2. Primary Server #
  - Note
  - 19.6.3. Standby Servers #
  - Warning
  - 19.6.4. Subscribers #

These settings control the behavior of the built-in streaming replication feature (see Section 26.2.5), and the built-in logical replication feature (see Chapter 29).

For streaming replication, servers will be either a primary or a standby server. Primaries can send data, while standbys are always receivers of replicated data. When cascading replication (see Section 26.2.7) is used, standby servers can also be senders, as well as receivers. Parameters are mainly for sending and standby servers, though some parameters have meaning only on the primary server. Settings may vary across the cluster without problems if that is required.

For logical replication, publishers (servers that do CREATE PUBLICATION) replicate data to subscribers (servers that do CREATE SUBSCRIPTION). Servers can also be publishers and subscribers at the same time. Note, the following sections refer to publishers as "senders". For more details about logical replication configuration settings refer to Section 29.12.

These parameters can be set on any server that is to send replication data to one or more standby servers. The primary is always a sending server, so these parameters must always be set on the primary. The role and meaning of these parameters does not change after a standby becomes the primary.

Specifies the maximum number of concurrent connections from standby servers or streaming base backup clients (i.e., the maximum number of simultaneously running WAL sender processes). The default is 10. The value 0 means replication is disabled. Abrupt disconnection of a streaming client might leave an orphaned connection slot behind until a timeout is reached, so this parameter should be set slightly higher than the maximum number of expected clients so disconnected clients can immediately reconnect. This parameter can only be set at server start. Also, wal_level must be set to replica or higher to allow connections from standby servers.

When running a standby server, you must set this parameter to the same or higher value than on the primary server. Otherwise, queries will not be allowed in the standby server.

Specifies the maximum number of replication slots (see Section 26.2.6) that the server can support. The default is 10. This parameter can only be set at server start. Setting it to a lower value than the number of currently existing replication slots will prevent the server from starting. Also, wal_level must be set to replica or higher to allow replication slots to be used.

Specifies the minimum size of past WAL files kept in the pg_wal directory, in case a standby server needs to fetch them for streaming replication. If a standby server connected to the sending server falls behind by more than wal_keep_size megabytes, the sending server might remove a WAL segment still needed by the standby, in which case the replication connection will be terminated. Downstream connections will also eventually fail as a result. (However, the standby server can recover by fetching the segment from archive, if WAL archiving is in use.)

This sets only the minimum size of segments retained in pg_wal; the system might need to retain more segments for WAL archival or to recover from a checkpoint. If wal_keep_size is zero (the default), the system doesn't keep any extra segments for standby purposes, so the number of old WAL segments available to standby servers is a function of the location of the previous checkpoint and status of WAL archiving. If this value is specified without units, it is taken as megabytes. This parameter can only be set in the postgresql.conf file or on the server command line.

Specify the maximum size of WAL files that replication slots are allowed to retain in the pg_wal directory at checkpoint time. If max_slot_wal_keep_size is -1 (the default), replication slots may retain an unlimited amount of WAL files. Otherwise, if restart_lsn of a replication slot falls behind the current LSN by more than the given size, the standby using the slot may no longer be able to continue replication due to removal of required WAL files. You can see the WAL availability of replication slots in pg_replication_slots. If this value is specified without units, it is taken as megabytes. This parameter can only be set in the postgresql.conf file or on the server command line.

Invalidate replication slots that have remained inactive (not used by a replication connection) for longer than this duration. If this value is specified without units, it is taken as seconds. A value of zero (the default) disables the idle timeout invalidation mechanism. This parameter can only be set in the postgresql.conf file or on the server command line.

Slot invalidation due to idle timeout occurs during checkpoint. Because checkpoints happen at checkpoint_timeout intervals, there can be some lag between when the idle_replication_slot_timeout was exceeded and when the slot invalidation is triggered at the next checkpoint. To avoid such lags, users can force a checkpoint to promptly invalidate inactive slots. The duration of slot inactivity is calculated using the slot's pg_replication_slots.inactive_since value.

Note that the idle timeout invalidation mechanism is not applicable for slots that do not reserve WAL or for slots on the standby server that are being synced from the primary server (i.e., standby slots having pg_replication_slots.synced value true). Synced slots are always considered to be inactive because they don't perform logical decoding to produce changes.

Terminate replication connections that are inactive for longer than this amount of time. This is useful for the sending server to detect a standby crash or network outage. If this value is specified without units, it is taken as milliseconds. The default value is 60 seconds. A value of zero disables the timeout mechanism.

With a cluster distributed across multiple geographic locations, using different values per location brings more flexibility in the cluster management. A smaller value is useful for faster failure detection with a standby having a low-latency network connection, and a larger value helps in judging better the health of a standby if located on a remote location, with a high-latency network connection.

Record commit time of transactions. This parameter can only be set at server start. The default value is off.

A comma-separated list of streaming replication standby server slot names that logical WAL sender processes will wait for. Logical WAL sender processes will send decoded changes to plugins only after the specified replication slots confirm receiving WAL. This guarantees that logical replication failover slots do not consume changes until those changes are received and flushed to corresponding physical standbys. If a logical replication connection is meant to switch to a physical standby after the standby is promoted, the physical replication slot for the standby should be listed here. Note that logical replication will not proceed if the slots specified in the synchronized_standby_slots do not exist or are invalidated. Additionally, the replication management functions pg_replication_slot_advance, pg_logical_slot_get_changes, and pg_logical_slot_peek_changes, when used with logical failover slots, will block until all physical slots specified in synchronized_standby_slots have confirmed WAL receipt.

The standbys corresponding to the physical replication slots in synchronized_standby_slots must configure sync_replication_slots = true so they can receive logical failover slot changes from the primary.

These parameters can be set on the primary server that is to send replication data to one or more standby servers. Note that in addition to these parameters, wal_level must be set appropriately on the primary server, and optionally WAL archiving can be enabled as well (see Section 19.5.3). The values of these parameters on standby servers are irrelevant, although you may wish to set them there in preparation for the possibility of a standby becoming the primary.

Specifies a list of standby servers that can support synchronous replication, as described in Section 26.2.8. There will be one or more active synchronous standbys; transactions waiting for commit will be allowed to proceed after these standby servers confirm receipt of their data. The synchronous standbys will be those whose names appear in this list, and that are both currently connected and streaming data in real-time (as shown by a state of streaming in the pg_stat_replication view). Specifying more than one synchronous standby can allow for very high availability and protection against data loss.

The name of a standby server for this purpose is the application_name setting of the standby, as set in the standby's connection information. In case of a physical replication standby, this should be set in the primary_conninfo setting; the default is the setting of cluster_name if set, else walreceiver. For logical replication, this can be set in the connection information of the subscription, and it defaults to the subscription name. For other replication stream consumers, consult their documentation.

This parameter specifies a list of standby servers using either of the following syntaxes:

where num_sync is the number of synchronous standbys that transactions need to wait for replies from, and standby_name is the name of a standby server. num_sync must be an integer value greater than zero. FIRST and ANY specify the method to choose synchronous standbys from the listed servers.

The keyword FIRST, coupled with num_sync, specifies a priority-based synchronous replication and makes transaction commits wait until their WAL records are replicated to num_sync synchronous standbys chosen based on their priorities. For example, a setting of FIRST 3 (s1, s2, s3, s4) will cause each commit to wait for replies from three higher-priority standbys chosen from standby servers s1, s2, s3 and s4. The standbys whose names appear earlier in the list are given higher priority and will be considered as synchronous. Other standby servers appearing later in this list represent potential synchronous standbys. If any of the current synchronous standbys disconnects for whatever reason, it will be replaced immediately with the next-highest-priority standby. The keyword FIRST is optional.

The keyword ANY, coupled with num_sync, specifies a quorum-based synchronous replication and makes transaction commits wait until their WAL records are replicated to at least num_sync listed standbys. For example, a setting of ANY 3 (s1, s2, s3, s4) will cause each commit to proceed as soon as at least any three standbys of s1, s2, s3 and s4 reply.

FIRST and ANY are case-insensitive. If these keywords are used as the name of a standby server, its standby_name must be double-quoted.

The third syntax was used before PostgreSQL version 9.6 and is still supported. It's the same as the first syntax with FIRST and num_sync equal to 1. For example, FIRST 1 (s1, s2) and s1, s2 have the same meaning: either s1 or s2 is chosen as a synchronous standby.

The special entry * matches any standby name.

There is no mechanism to enforce uniqueness of standby names. In case of duplicates one of the matching standbys will be considered as higher priority, though exactly which one is indeterminate.

Each standby_name should have the form of a valid SQL identifier, unless it is *. You can use double-quoting if necessary. But note that standby_names are compared to standby application names case-insensitively, whether double-quoted or not.

If no synchronous standby names are specified here, then synchronous replication is not enabled and transaction commits will not wait for replication. This is the default configuration. Even when synchronous replication is enabled, individual transactions can be configured not to wait for replication by setting the synchronous_commit parameter to local or off.

This parameter can only be set in the postgresql.conf file or on the server command line.

These settings control the behavior of a standby server that is to receive replication data. Their values on the primary server are irrelevant.

Specifies a connection string to be used for the standby server to connect with a sending server. This string is in the format described in Section 32.1.1. If any option is unspecified in this string, then the corresponding environment variable (see Section 32.15) is checked. If the environment variable is not set either, then defaults are used.

The connection string should specify the host name (or address) of the sending server, as well as the port number if it is not the same as the standby server's default. Also specify a user name corresponding to a suitably-privileged role on the sending server (see Section 26.2.5.1). A password needs to be provided too, if the sender demands password authentication. It can be provided in the primary_conninfo string, or in a separate ~/.pgpass file on the standby server (use replication as the database name).

For replication slot synchronization (see Section 47.2.3), it is also necessary to specify a valid dbname in the primary_conninfo string. This will only be used for slot synchronization. It is ignored for streaming.

This parameter can only be set in the postgresql.conf file or on the server command line. If this parameter is changed while the WAL receiver process is running, that process is signaled to shut down and expected to restart with the new setting (except if primary_conninfo is an empty string). This setting has no effect if the server is not in standby mode.

Optionally specifies an existing replication slot to be used when connecting to the sending server via streaming replication to control resource removal on the upstream node (see Section 26.2.6). This parameter can only be set in the postgresql.conf file or on the server command line. If this parameter is changed while the WAL receiver process is running, that process is signaled to shut down and expected to restart with the new setting. This setting has no effect if primary_conninfo is not set or the server is not in standby mode.

Specifies whether or not you can connect and run queries during recovery, as described in Section 26.4. The default value is on. This parameter can only be set at server start. It only has effect during archive recovery or in standby mode.

When hot standby is active, this parameter determines how long the standby server should wait before canceling standby queries that conflict with about-to-be-applied WAL entries, as described in Section 26.4.2. max_standby_archive_delay applies when WAL data is being read from WAL archive (and is therefore not current). If this value is specified without units, it is taken as milliseconds. The default is 30 seconds. A value of -1 allows the standby to wait forever for conflicting queries to complete. This parameter can only be set in the postgresql.conf file or on the server command line.

Note that max_standby_archive_delay is not the same as the maximum length of time a query can run before cancellation; rather it is the maximum total time allowed to apply any one WAL segment's data. Thus, if one query has resulted in significant delay earlier in the WAL segment, subsequent conflicting queries will have much less grace time.

When hot standby is active, this parameter determines how long the standby server should wait before canceling standby queries that conflict with about-to-be-applied WAL entries, as described in Section 26.4.2. max_standby_streaming_delay applies when WAL data is being received via streaming replication. If this value is specified without units, it is taken as milliseconds. The default is 30 seconds. A value of -1 allows the standby to wait forever for conflicting queries to complete. This parameter can only be set in the postgresql.conf file or on the server command line.

Note that max_standby_streaming_delay is not the same as the maximum length of time a query can run before cancellation; rather it is the maximum total time allowed to apply WAL data once it has been received from the primary server. Thus, if one query has resulted in significant delay, subsequent conflicting queries will have much less grace time until the standby server has caught up again.

Specifies whether the WAL receiver process should create a temporary replication slot on the remote instance when no permanent replication slot to use has been configured (using primary_slot_name). The default is off. This parameter can only be set in the postgresql.conf file or on the server command line. If this parameter is changed while the WAL receiver process is running, that process is signaled to shut down and expected to restart with the new setting.

Specifies the minimum frequency for the WAL receiver process on the standby to send information about replication progress to the primary or upstream standby, where it can be seen using the pg_stat_replication view. The standby will report the last write-ahead log location it has written, the last position it has flushed to disk, and the last position it has applied. This parameter's value is the maximum amount of time between reports. Updates are sent each time the write or flush positions change, or as often as specified by this parameter if set to a non-zero value. There are additional cases where updates are sent while ignoring this parameter; for example, when processing of the existing WAL completes or when synchronous_commit is set to remote_apply. Thus, the apply position may lag slightly behind the true position. If this value is specified without units, it is taken as seconds. The default value is 10 seconds. This parameter can only be set in the postgresql.conf file or on the server command line.

Specifies whether or not a hot standby will send feedback to the primary or upstream standby about queries currently executing on the standby. This parameter can be used to eliminate query cancels caused by cleanup records, but can cause database bloat on the primary for some workloads. Feedback messages will not be sent more frequently than once per wal_receiver_status_interval. The default value is off. This parameter can only be set in the postgresql.conf file or on the server command line.

If cascaded replication is in use the feedback is passed upstream until it eventually reaches the primary. Standbys make no other use of feedback they receive other than to pass upstream.

Note that if the clock on standby is moved ahead or backward, the feedback message might not be sent at the required interval. In extreme cases, this can lead to a prolonged risk of not removing dead rows on the primary for extended periods, as the feedback mechanism is based on timestamps.

Terminate replication connections that are inactive for longer than this amount of time. This is useful for the receiving standby server to detect a primary node crash or network outage. If this value is specified without units, it is taken as milliseconds. The default value is 60 seconds. A value of zero disables the timeout mechanism. This parameter can only be set in the postgresql.conf file or on the server command line.

Specifies how long the standby server should wait when WAL data is not available from any sources (streaming replication, local pg_wal or WAL archive) before trying again to retrieve WAL data. If this value is specified without units, it is taken as milliseconds. The default value is 5 seconds. This parameter can only be set in the postgresql.conf file or on the server command line.

This parameter is useful in configurations where a node in recovery needs to control the amount of time to wait for new WAL data to be available. For example, in archive recovery, it is possible to make the recovery more responsive in the detection of a new WAL file by reducing the value of this parameter. On a system with low WAL activity, increasing it reduces the amount of requests necessary to access WAL archives, something useful for example in cloud environments where the number of times an infrastructure is accessed is taken into account.

In logical replication, this parameter also limits how often a failing replication apply worker or table synchronization worker will be respawned.

By default, a standby server restores WAL records from the sending server as soon as possible. It may be useful to have a time-delayed copy of the data, offering opportunities to correct data loss errors. This parameter allows you to delay recovery by a specified amount of time. For example, if you set this parameter to 5min, the standby will replay each transaction commit only when the system time on the standby is at least five minutes past the commit time reported by the primary. If this value is specified without units, it is taken as milliseconds. The default is zero, adding no delay.

It is possible that the replication delay between servers exceeds the value of this parameter, in which case no delay is added. Note that the delay is calculated between the WAL time stamp as written on primary and the current time on the standby. Delays in transfer because of network lag or cascading replication configurations may reduce the actual wait time significantly. If the system clocks on primary and standby are not synchronized, this may lead to recovery applying records earlier than expected; but that is not a major issue because useful settings of this parameter are much larger than typical time deviations between servers.

The delay occurs only on WAL records for transaction commits. Other records are replayed as quickly as possible, which is not a problem because MVCC visibility rules ensure their effects are not visible until the corresponding commit record is applied.

The delay occurs once the database in recovery has reached a consistent state, until the standby is promoted or triggered. After that the standby will end recovery without further waiting.

WAL records must be kept on the standby until they are ready to be applied. Therefore, longer delays will result in a greater accumulation of WAL files, increasing disk space requirements for the standby's pg_wal directory.

This parameter is intended for use with streaming replication deployments; however, if the parameter is specified it will be honored in all cases except crash recovery. hot_standby_feedback will be delayed by use of this feature which could lead to bloat on the primary; use both together with care.

Synchronous replication is affected by this setting when synchronous_commit is set to remote_apply; every COMMIT will need to wait to be applied.

This parameter can only be set in the postgresql.conf file or on the server command line.

It enables a physical standby to synchronize logical failover slots from the primary server so that logical subscribers can resume replication from the new primary server after failover.

It is disabled by default. This parameter can only be set in the postgresql.conf file or on the server command line.

These settings control the behavior of a logical replication subscriber. Their values on the publisher are irrelevant. See Section 29.12 for more details.

Specifies how many replication origins (see Chapter 48) can be tracked simultaneously, effectively limiting how many logical replication subscriptions can be created on the server. Setting it to a lower value than the current number of tracked replication origins (reflected in pg_replication_origin_status) will prevent the server from starting. It defaults to 10. This parameter can only be set at server start. max_active_replication_origins must be set to at least the number of subscriptions that will be added to the subscriber, plus some reserve for table synchronization.

Specifies maximum number of logical replication workers. This includes leader apply workers, parallel apply workers, and table synchronization workers.

Logical replication workers are taken from the pool defined by max_worker_processes.

The default value is 4. This parameter can only be set at server start.

Maximum number of synchronization workers per subscription. This parameter controls the amount of parallelism of the initial data copy during the subscription initialization or when new tables are added.

Currently, there can be only one synchronization worker per table.

The synchronization workers are taken from the pool defined by max_logical_replication_workers.

The default value is 2. This parameter can only be set in the postgresql.conf file or on the server command line.

Maximum number of parallel apply workers per subscription. This parameter controls the amount of parallelism for streaming of in-progress transactions with subscription parameter streaming = parallel.

The parallel apply workers are taken from the pool defined by max_logical_replication_workers.

The default value is 2. This parameter can only be set in the postgresql.conf file or on the server command line.

**Examples:**

Example 1 (unknown):
```unknown
CREATE PUBLICATION
```

Example 2 (unknown):
```unknown
CREATE SUBSCRIPTION
```

Example 3 (unknown):
```unknown
max_wal_senders
```

Example 4 (unknown):
```unknown
max_replication_slots
```

---


---

