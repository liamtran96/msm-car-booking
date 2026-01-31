# PostgreSQL - Functions (Part 24)

## 9.28. System Administration Functions #


**URL:** https://www.postgresql.org/docs/18/functions-admin.html

**Contents:**
- 9.28. System Administration Functions #
  - 9.28.1. Configuration Settings Functions #
  - 9.28.2. Server Signaling Functions #
  - 9.28.3. Backup Control Functions #
  - 9.28.4. Recovery Control Functions #
  - 9.28.5. Snapshot Synchronization Functions #
  - 9.28.6. Replication Management Functions #
  - Caution
  - 9.28.7. Database Object Management Functions #
  - Warning

The functions described in this section are used to control and monitor a PostgreSQL installation.

Table 9.95 shows the functions available to query and alter run-time configuration parameters.

Table 9.95. Configuration Settings Functions

current_setting ( setting_name text [, missing_ok boolean ] ) → text

Returns the current value of the setting setting_name. If there is no such setting, current_setting throws an error unless missing_ok is supplied and is true (in which case NULL is returned). This function corresponds to the SQL command SHOW.

current_setting('datestyle') → ISO, MDY

set_config ( setting_name text, new_value text, is_local boolean ) → text

Sets the parameter setting_name to new_value, and returns that value. If is_local is true, the new value will only apply during the current transaction. If you want the new value to apply for the rest of the current session, use false instead. This function corresponds to the SQL command SET.

set_config accepts the NULL value for new_value, but as settings cannot be null, it is interpreted as a request to reset the setting to its default value.

set_config('log_statement_stats', 'off', false) → off

The functions shown in Table 9.96 send control signals to other server processes. Use of these functions is restricted to superusers by default but access may be granted to others using GRANT, with noted exceptions.

Each of these functions returns true if the signal was successfully sent and false if sending the signal failed.

Table 9.96. Server Signaling Functions

pg_cancel_backend ( pid integer ) → boolean

Cancels the current query of the session whose backend process has the specified process ID. This is also allowed if the calling role is a member of the role whose backend is being canceled or the calling role has privileges of pg_signal_backend, however only superusers can cancel superuser backends. As an exception, roles with privileges of pg_signal_autovacuum_worker are permitted to cancel autovacuum worker processes, which are otherwise considered superuser backends.

pg_log_backend_memory_contexts ( pid integer ) → boolean

Requests to log the memory contexts of the backend with the specified process ID. This function can send the request to backends and auxiliary processes except logger. These memory contexts will be logged at LOG message level. They will appear in the server log based on the log configuration set (see Section 19.8 for more information), but will not be sent to the client regardless of client_min_messages.

pg_reload_conf () → boolean

Causes all processes of the PostgreSQL server to reload their configuration files. (This is initiated by sending a SIGHUP signal to the postmaster process, which in turn sends SIGHUP to each of its children.) You can use the pg_file_settings, pg_hba_file_rules and pg_ident_file_mappings views to check the configuration files for possible errors, before reloading.

pg_rotate_logfile () → boolean

Signals the log-file manager to switch to a new output file immediately. This works only when the built-in log collector is running, since otherwise there is no log-file manager subprocess.

pg_terminate_backend ( pid integer, timeout bigint DEFAULT 0 ) → boolean

Terminates the session whose backend process has the specified process ID. This is also allowed if the calling role is a member of the role whose backend is being terminated or the calling role has privileges of pg_signal_backend, however only superusers can terminate superuser backends. As an exception, roles with privileges of pg_signal_autovacuum_worker are permitted to terminate autovacuum worker processes, which are otherwise considered superuser backends.

If timeout is not specified or zero, this function returns true whether the process actually terminates or not, indicating only that the sending of the signal was successful. If the timeout is specified (in milliseconds) and greater than zero, the function waits until the process is actually terminated or until the given time has passed. If the process is terminated, the function returns true. On timeout, a warning is emitted and false is returned.

pg_cancel_backend and pg_terminate_backend send signals (SIGINT or SIGTERM respectively) to backend processes identified by process ID. The process ID of an active backend can be found from the pid column of the pg_stat_activity view, or by listing the postgres processes on the server (using ps on Unix or the Task Manager on Windows). The role of an active backend can be found from the usename column of the pg_stat_activity view.

pg_log_backend_memory_contexts can be used to log the memory contexts of a backend process. For example:

One message for each memory context will be logged. For example:

If there are more than 100 child contexts under the same parent, the first 100 child contexts are logged, along with a summary of the remaining contexts. Note that frequent calls to this function could incur significant overhead, because it may generate a large number of log messages.

The functions shown in Table 9.97 assist in making on-line backups. These functions cannot be executed during recovery (except pg_backup_start, pg_backup_stop, and pg_wal_lsn_diff).

For details about proper usage of these functions, see Section 25.3.

Table 9.97. Backup Control Functions

pg_create_restore_point ( name text ) → pg_lsn

Creates a named marker record in the write-ahead log that can later be used as a recovery target, and returns the corresponding write-ahead log location. The given name can then be used with recovery_target_name to specify the point up to which recovery will proceed. Avoid creating multiple restore points with the same name, since recovery will stop at the first one whose name matches the recovery target.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

pg_current_wal_flush_lsn () → pg_lsn

Returns the current write-ahead log flush location (see notes below).

pg_current_wal_insert_lsn () → pg_lsn

Returns the current write-ahead log insert location (see notes below).

pg_current_wal_lsn () → pg_lsn

Returns the current write-ahead log write location (see notes below).

pg_backup_start ( label text [, fast boolean ] ) → pg_lsn

Prepares the server to begin an on-line backup. The only required parameter is an arbitrary user-defined label for the backup. (Typically this would be the name under which the backup dump file will be stored.) If the optional second parameter is given as true, it specifies executing pg_backup_start as quickly as possible. This forces an immediate checkpoint which will cause a spike in I/O operations, slowing any concurrently executing queries.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

pg_backup_stop ( [wait_for_archive boolean ] ) → record ( lsn pg_lsn, labelfile text, spcmapfile text )

Finishes performing an on-line backup. The desired contents of the backup label file and the tablespace map file are returned as part of the result of the function and must be written to files in the backup area. These files must not be written to the live data directory (doing so will cause PostgreSQL to fail to restart in the event of a crash).

There is an optional parameter of type boolean. If false, the function will return immediately after the backup is completed, without waiting for WAL to be archived. This behavior is only useful with backup software that independently monitors WAL archiving. Otherwise, WAL required to make the backup consistent might be missing and make the backup useless. By default or when this parameter is true, pg_backup_stop will wait for WAL to be archived when archiving is enabled. (On a standby, this means that it will wait only when archive_mode = always. If write activity on the primary is low, it may be useful to run pg_switch_wal on the primary in order to trigger an immediate segment switch.)

When executed on a primary, this function also creates a backup history file in the write-ahead log archive area. The history file includes the label given to pg_backup_start, the starting and ending write-ahead log locations for the backup, and the starting and ending times of the backup. After recording the ending location, the current write-ahead log insertion point is automatically advanced to the next write-ahead log file, so that the ending write-ahead log file can be archived immediately to complete the backup.

The result of the function is a single record. The lsn column holds the backup's ending write-ahead log location (which again can be ignored). The second column returns the contents of the backup label file, and the third column returns the contents of the tablespace map file. These must be stored as part of the backup and are required as part of the restore process.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

pg_switch_wal () → pg_lsn

Forces the server to switch to a new write-ahead log file, which allows the current file to be archived (assuming you are using continuous archiving). The result is the ending write-ahead log location plus 1 within the just-completed write-ahead log file. If there has been no write-ahead log activity since the last write-ahead log switch, pg_switch_wal does nothing and returns the start location of the write-ahead log file currently in use.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

pg_walfile_name ( lsn pg_lsn ) → text

Converts a write-ahead log location to the name of the WAL file holding that location.

pg_walfile_name_offset ( lsn pg_lsn ) → record ( file_name text, file_offset integer )

Converts a write-ahead log location to a WAL file name and byte offset within that file.

pg_split_walfile_name ( file_name text ) → record ( segment_number numeric, timeline_id bigint )

Extracts the sequence number and timeline ID from a WAL file name.

pg_wal_lsn_diff ( lsn1 pg_lsn, lsn2 pg_lsn ) → numeric

Calculates the difference in bytes (lsn1 - lsn2) between two write-ahead log locations. This can be used with pg_stat_replication or some of the functions shown in Table 9.97 to get the replication lag.

pg_current_wal_lsn displays the current write-ahead log write location in the same format used by the above functions. Similarly, pg_current_wal_insert_lsn displays the current write-ahead log insertion location and pg_current_wal_flush_lsn displays the current write-ahead log flush location. The insertion location is the “logical” end of the write-ahead log at any instant, while the write location is the end of what has actually been written out from the server's internal buffers, and the flush location is the last location known to be written to durable storage. The write location is the end of what can be examined from outside the server, and is usually what you want if you are interested in archiving partially-complete write-ahead log files. The insertion and flush locations are made available primarily for server debugging purposes. These are all read-only operations and do not require superuser permissions.

You can use pg_walfile_name_offset to extract the corresponding write-ahead log file name and byte offset from a pg_lsn value. For example:

Similarly, pg_walfile_name extracts just the write-ahead log file name.

pg_split_walfile_name is useful to compute a LSN from a file offset and WAL file name, for example:

The functions shown in Table 9.98 provide information about the current status of a standby server. These functions may be executed both during recovery and in normal running.

Table 9.98. Recovery Information Functions

pg_is_in_recovery () → boolean

Returns true if recovery is still in progress.

pg_last_wal_receive_lsn () → pg_lsn

Returns the last write-ahead log location that has been received and synced to disk by streaming replication. While streaming replication is in progress this will increase monotonically. If recovery has completed then this will remain static at the location of the last WAL record received and synced to disk during recovery. If streaming replication is disabled, or if it has not yet started, the function returns NULL.

pg_last_wal_replay_lsn () → pg_lsn

Returns the last write-ahead log location that has been replayed during recovery. If recovery is still in progress this will increase monotonically. If recovery has completed then this will remain static at the location of the last WAL record applied during recovery. When the server has been started normally without recovery, the function returns NULL.

pg_last_xact_replay_timestamp () → timestamp with time zone

Returns the time stamp of the last transaction replayed during recovery. This is the time at which the commit or abort WAL record for that transaction was generated on the primary. If no transactions have been replayed during recovery, the function returns NULL. Otherwise, if recovery is still in progress this will increase monotonically. If recovery has completed then this will remain static at the time of the last transaction applied during recovery. When the server has been started normally without recovery, the function returns NULL.

pg_get_wal_resource_managers () → setof record ( rm_id integer, rm_name text, rm_builtin boolean )

Returns the currently-loaded WAL resource managers in the system. The column rm_builtin indicates whether it's a built-in resource manager, or a custom resource manager loaded by an extension.

The functions shown in Table 9.99 control the progress of recovery. These functions may be executed only during recovery.

Table 9.99. Recovery Control Functions

pg_is_wal_replay_paused () → boolean

Returns true if recovery pause is requested.

pg_get_wal_replay_pause_state () → text

Returns recovery pause state. The return values are not paused if pause is not requested, pause requested if pause is requested but recovery is not yet paused, and paused if the recovery is actually paused.

pg_promote ( wait boolean DEFAULT true, wait_seconds integer DEFAULT 60 ) → boolean

Promotes a standby server to primary status. With wait set to true (the default), the function waits until promotion is completed or wait_seconds seconds have passed, and returns true if promotion is successful and false otherwise. If wait is set to false, the function returns true immediately after sending a SIGUSR1 signal to the postmaster to trigger promotion.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

pg_wal_replay_pause () → void

Request to pause recovery. A request doesn't mean that recovery stops right away. If you want a guarantee that recovery is actually paused, you need to check for the recovery pause state returned by pg_get_wal_replay_pause_state(). Note that pg_is_wal_replay_paused() returns whether a request is made. While recovery is paused, no further database changes are applied. If hot standby is active, all new queries will see the same consistent snapshot of the database, and no further query conflicts will be generated until recovery is resumed.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

pg_wal_replay_resume () → void

Restarts recovery if it was paused.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

pg_wal_replay_pause and pg_wal_replay_resume cannot be executed while a promotion is ongoing. If a promotion is triggered while recovery is paused, the paused state ends and promotion continues.

If streaming replication is disabled, the paused state may continue indefinitely without a problem. If streaming replication is in progress then WAL records will continue to be received, which will eventually fill available disk space, depending upon the duration of the pause, the rate of WAL generation and available disk space.

PostgreSQL allows database sessions to synchronize their snapshots. A snapshot determines which data is visible to the transaction that is using the snapshot. Synchronized snapshots are necessary when two or more sessions need to see identical content in the database. If two sessions just start their transactions independently, there is always a possibility that some third transaction commits between the executions of the two START TRANSACTION commands, so that one session sees the effects of that transaction and the other does not.

To solve this problem, PostgreSQL allows a transaction to export the snapshot it is using. As long as the exporting transaction remains open, other transactions can import its snapshot, and thereby be guaranteed that they see exactly the same view of the database that the first transaction sees. But note that any database changes made by any one of these transactions remain invisible to the other transactions, as is usual for changes made by uncommitted transactions. So the transactions are synchronized with respect to pre-existing data, but act normally for changes they make themselves.

Snapshots are exported with the pg_export_snapshot function, shown in Table 9.100, and imported with the SET TRANSACTION command.

Table 9.100. Snapshot Synchronization Functions

pg_export_snapshot () → text

Saves the transaction's current snapshot and returns a text string identifying the snapshot. This string must be passed (outside the database) to clients that want to import the snapshot. The snapshot is available for import only until the end of the transaction that exported it.

A transaction can export more than one snapshot, if needed. Note that doing so is only useful in READ COMMITTED transactions, since in REPEATABLE READ and higher isolation levels, transactions use the same snapshot throughout their lifetime. Once a transaction has exported any snapshots, it cannot be prepared with PREPARE TRANSACTION.

pg_log_standby_snapshot () → pg_lsn

Take a snapshot of running transactions and write it to WAL, without having to wait for bgwriter or checkpointer to log one. This is useful for logical decoding on standby, as logical slot creation has to wait until such a record is replayed on the standby.

The functions shown in Table 9.101 are for controlling and interacting with replication features. See Section 26.2.5, Section 26.2.6, and Chapter 48 for information about the underlying features. Use of functions for replication origin is only allowed to the superuser by default, but may be allowed to other users by using the GRANT command. Use of functions for replication slots is restricted to superusers and users having REPLICATION privilege.

Many of these functions have equivalent commands in the replication protocol; see Section 54.4.

The functions described in Section 9.28.3, Section 9.28.4, and Section 9.28.5 are also relevant for replication.

Table 9.101. Replication Management Functions

pg_create_physical_replication_slot ( slot_name name [, immediately_reserve boolean, temporary boolean ] ) → record ( slot_name name, lsn pg_lsn )

Creates a new physical replication slot named slot_name. The optional second parameter, when true, specifies that the LSN for this replication slot be reserved immediately; otherwise the LSN is reserved on first connection from a streaming replication client. Streaming changes from a physical slot is only possible with the streaming-replication protocol — see Section 54.4. The optional third parameter, temporary, when set to true, specifies that the slot should not be permanently stored to disk and is only meant for use by the current session. Temporary slots are also released upon any error. This function corresponds to the replication protocol command CREATE_REPLICATION_SLOT ... PHYSICAL.

pg_drop_replication_slot ( slot_name name ) → void

Drops the physical or logical replication slot named slot_name. Same as replication protocol command DROP_REPLICATION_SLOT.

pg_create_logical_replication_slot ( slot_name name, plugin name [, temporary boolean, twophase boolean, failover boolean ] ) → record ( slot_name name, lsn pg_lsn )

Creates a new logical (decoding) replication slot named slot_name using the output plugin plugin. The optional third parameter, temporary, when set to true, specifies that the slot should not be permanently stored to disk and is only meant for use by the current session. Temporary slots are also released upon any error. The optional fourth parameter, twophase, when set to true, specifies that the decoding of prepared transactions is enabled for this slot. The optional fifth parameter, failover, when set to true, specifies that this slot is enabled to be synced to the standbys so that logical replication can be resumed after failover. A call to this function has the same effect as the replication protocol command CREATE_REPLICATION_SLOT ... LOGICAL.

pg_copy_physical_replication_slot ( src_slot_name name, dst_slot_name name [, temporary boolean ] ) → record ( slot_name name, lsn pg_lsn )

Copies an existing physical replication slot named src_slot_name to a physical replication slot named dst_slot_name. The copied physical slot starts to reserve WAL from the same LSN as the source slot. temporary is optional. If temporary is omitted, the same value as the source slot is used. Copy of an invalidated slot is not allowed.

pg_copy_logical_replication_slot ( src_slot_name name, dst_slot_name name [, temporary boolean [, plugin name ]] ) → record ( slot_name name, lsn pg_lsn )

Copies an existing logical replication slot named src_slot_name to a logical replication slot named dst_slot_name, optionally changing the output plugin and persistence. The copied logical slot starts from the same LSN as the source logical slot. Both temporary and plugin are optional; if they are omitted, the values of the source slot are used. The failover option of the source logical slot is not copied and is set to false by default. This is to avoid the risk of being unable to continue logical replication after failover to standby where the slot is being synchronized. Copy of an invalidated slot is not allowed.

pg_logical_slot_get_changes ( slot_name name, upto_lsn pg_lsn, upto_nchanges integer, VARIADIC options text[] ) → setof record ( lsn pg_lsn, xid xid, data text )

Returns changes in the slot slot_name, starting from the point from which changes have been consumed last. If upto_lsn and upto_nchanges are NULL, logical decoding will continue until end of WAL. If upto_lsn is non-NULL, decoding will include only those transactions which commit prior to the specified LSN. If upto_nchanges is non-NULL, decoding will stop when the number of rows produced by decoding exceeds the specified value. Note, however, that the actual number of rows returned may be larger, since this limit is only checked after adding the rows produced when decoding each new transaction commit. If the specified slot is a logical failover slot then the function will not return until all physical slots specified in synchronized_standby_slots have confirmed WAL receipt.

pg_logical_slot_peek_changes ( slot_name name, upto_lsn pg_lsn, upto_nchanges integer, VARIADIC options text[] ) → setof record ( lsn pg_lsn, xid xid, data text )

Behaves just like the pg_logical_slot_get_changes() function, except that changes are not consumed; that is, they will be returned again on future calls.

pg_logical_slot_get_binary_changes ( slot_name name, upto_lsn pg_lsn, upto_nchanges integer, VARIADIC options text[] ) → setof record ( lsn pg_lsn, xid xid, data bytea )

Behaves just like the pg_logical_slot_get_changes() function, except that changes are returned as bytea.

pg_logical_slot_peek_binary_changes ( slot_name name, upto_lsn pg_lsn, upto_nchanges integer, VARIADIC options text[] ) → setof record ( lsn pg_lsn, xid xid, data bytea )

Behaves just like the pg_logical_slot_peek_changes() function, except that changes are returned as bytea.

pg_replication_slot_advance ( slot_name name, upto_lsn pg_lsn ) → record ( slot_name name, end_lsn pg_lsn )

Advances the current confirmed position of a replication slot named slot_name. The slot will not be moved backwards, and it will not be moved beyond the current insert location. Returns the name of the slot and the actual position that it was advanced to. The updated slot position information is written out at the next checkpoint if any advancing is done. So in the event of a crash, the slot may return to an earlier position. If the specified slot is a logical failover slot then the function will not return until all physical slots specified in synchronized_standby_slots have confirmed WAL receipt.

pg_replication_origin_create ( node_name text ) → oid

Creates a replication origin with the given external name, and returns the internal ID assigned to it. The name must be no longer than 512 bytes.

pg_replication_origin_drop ( node_name text ) → void

Deletes a previously-created replication origin, including any associated replay progress.

pg_replication_origin_oid ( node_name text ) → oid

Looks up a replication origin by name and returns the internal ID. If no such replication origin is found, NULL is returned.

pg_replication_origin_session_setup ( node_name text ) → void

Marks the current session as replaying from the given origin, allowing replay progress to be tracked. Can only be used if no origin is currently selected. Use pg_replication_origin_session_reset to undo.

pg_replication_origin_session_reset () → void

Cancels the effects of pg_replication_origin_session_setup().

pg_replication_origin_session_is_setup () → boolean

Returns true if a replication origin has been selected in the current session.

pg_replication_origin_session_progress ( flush boolean ) → pg_lsn

Returns the replay location for the replication origin selected in the current session. The parameter flush determines whether the corresponding local transaction will be guaranteed to have been flushed to disk or not.

pg_replication_origin_xact_setup ( origin_lsn pg_lsn, origin_timestamp timestamp with time zone ) → void

Marks the current transaction as replaying a transaction that has committed at the given LSN and timestamp. Can only be called when a replication origin has been selected using pg_replication_origin_session_setup.

pg_replication_origin_xact_reset () → void

Cancels the effects of pg_replication_origin_xact_setup().

pg_replication_origin_advance ( node_name text, lsn pg_lsn ) → void

Sets replication progress for the given node to the given location. This is primarily useful for setting up the initial location, or setting a new location after configuration changes and similar. Be aware that careless use of this function can lead to inconsistently replicated data.

pg_replication_origin_progress ( node_name text, flush boolean ) → pg_lsn

Returns the replay location for the given replication origin. The parameter flush determines whether the corresponding local transaction will be guaranteed to have been flushed to disk or not.

pg_logical_emit_message ( transactional boolean, prefix text, content text [, flush boolean DEFAULT false] ) → pg_lsn

pg_logical_emit_message ( transactional boolean, prefix text, content bytea [, flush boolean DEFAULT false] ) → pg_lsn

Emits a logical decoding message. This can be used to pass generic messages to logical decoding plugins through WAL. The transactional parameter specifies if the message should be part of the current transaction, or if it should be written immediately and decoded as soon as the logical decoder reads the record. The prefix parameter is a textual prefix that can be used by logical decoding plugins to easily recognize messages that are interesting for them. The content parameter is the content of the message, given either in text or binary form. The flush parameter (default set to false) controls if the message is immediately flushed to WAL or not. flush has no effect with transactional, as the message's WAL record is flushed along with its transaction.

pg_sync_replication_slots () → void

Synchronize the logical failover replication slots from the primary server to the standby server. This function can only be executed on the standby server. Temporary synced slots, if any, cannot be used for logical decoding and must be dropped after promotion. See Section 47.2.3 for details. Note that this function is primarily intended for testing and debugging purposes and should be used with caution. Additionally, this function cannot be executed if sync_replication_slots is enabled and the slotsync worker is already running to perform the synchronization of slots.

If, after executing the function, hot_standby_feedback is disabled on the standby or the physical slot configured in primary_slot_name is removed, then it is possible that the necessary rows of the synchronized slot will be removed by the VACUUM process on the primary server, resulting in the synchronized slot becoming invalidated.

The functions shown in Table 9.102 calculate the disk space usage of database objects, or assist in presentation or understanding of usage results. bigint results are measured in bytes. If an OID that does not represent an existing object is passed to one of these functions, NULL is returned.

Table 9.102. Database Object Size Functions

pg_column_size ( "any" ) → integer

Shows the number of bytes used to store any individual data value. If applied directly to a table column value, this reflects any compression that was done.

pg_column_compression ( "any" ) → text

Shows the compression algorithm that was used to compress an individual variable-length value. Returns NULL if the value is not compressed.

pg_column_toast_chunk_id ( "any" ) → oid

Shows the chunk_id of an on-disk TOASTed value. Returns NULL if the value is un-TOASTed or not on-disk. See Section 66.2 for more information about TOAST.

pg_database_size ( name ) → bigint

pg_database_size ( oid ) → bigint

Computes the total disk space used by the database with the specified name or OID. To use this function, you must have CONNECT privilege on the specified database (which is granted by default) or have privileges of the pg_read_all_stats role.

pg_indexes_size ( regclass ) → bigint

Computes the total disk space used by indexes attached to the specified table.

pg_relation_size ( relation regclass [, fork text ] ) → bigint

Computes the disk space used by one “fork” of the specified relation. (Note that for most purposes it is more convenient to use the higher-level functions pg_total_relation_size or pg_table_size, which sum the sizes of all forks.) With one argument, this returns the size of the main data fork of the relation. The second argument can be provided to specify which fork to examine:

main returns the size of the main data fork of the relation.

fsm returns the size of the Free Space Map (see Section 66.3) associated with the relation.

vm returns the size of the Visibility Map (see Section 66.4) associated with the relation.

init returns the size of the initialization fork, if any, associated with the relation.

pg_size_bytes ( text ) → bigint

Converts a size in human-readable format (as returned by pg_size_pretty) into bytes. Valid units are bytes, B, kB, MB, GB, TB, and PB.

pg_size_pretty ( bigint ) → text

pg_size_pretty ( numeric ) → text

Converts a size in bytes into a more easily human-readable format with size units (bytes, kB, MB, GB, TB, or PB as appropriate). Note that the units are powers of 2 rather than powers of 10, so 1kB is 1024 bytes, 1MB is 10242 = 1048576 bytes, and so on.

pg_table_size ( regclass ) → bigint


*(continued...)*
---

