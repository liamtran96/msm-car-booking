# PostgreSQL - Replication (Part 3)

## 26.4. Hot Standby #


**URL:** https://www.postgresql.org/docs/18/hot-standby.html

**Contents:**
- 26.4. Hot Standby #
  - 26.4.1. User's Overview #
  - 26.4.2. Handling Query Conflicts #
  - 26.4.3. Administrator's Overview #
  - 26.4.4. Hot Standby Parameter Reference #
  - 26.4.5. Caveats #

Hot standby is the term used to describe the ability to connect to the server and run read-only queries while the server is in archive recovery or standby mode. This is useful both for replication purposes and for restoring a backup to a desired state with great precision. The term hot standby also refers to the ability of the server to move from recovery through to normal operation while users continue running queries and/or keep their connections open.

Running queries in hot standby mode is similar to normal query operation, though there are several usage and administrative differences explained below.

When the hot_standby parameter is set to true on a standby server, it will begin accepting connections once the recovery has brought the system to a consistent state and be ready for hot standby. All such connections are strictly read-only; not even temporary tables may be written.

The data on the standby takes some time to arrive from the primary server so there will be a measurable delay between primary and standby. Running the same query nearly simultaneously on both primary and standby might therefore return differing results. We say that data on the standby is eventually consistent with the primary. Once the commit record for a transaction is replayed on the standby, the changes made by that transaction will be visible to any new snapshots taken on the standby. Snapshots may be taken at the start of each query or at the start of each transaction, depending on the current transaction isolation level. For more details, see Section 13.2.

Transactions started during hot standby may issue the following commands:

Query access: SELECT, COPY TO

Cursor commands: DECLARE, FETCH, CLOSE

Settings: SHOW, SET, RESET

Transaction management commands:

BEGIN, END, ABORT, START TRANSACTION

SAVEPOINT, RELEASE, ROLLBACK TO SAVEPOINT

EXCEPTION blocks and other internal subtransactions

LOCK TABLE, though only when explicitly in one of these modes: ACCESS SHARE, ROW SHARE or ROW EXCLUSIVE.

Plans and resources: PREPARE, EXECUTE, DEALLOCATE, DISCARD

Plugins and extensions: LOAD

Transactions started during hot standby will never be assigned a transaction ID and cannot write to the system write-ahead log. Therefore, the following actions will produce error messages:

Data Manipulation Language (DML): INSERT, UPDATE, DELETE, MERGE, COPY FROM, TRUNCATE. Note that there are no allowed actions that result in a trigger being executed during recovery. This restriction applies even to temporary tables, because table rows cannot be read or written without assigning a transaction ID, which is currently not possible in a hot standby environment.

Data Definition Language (DDL): CREATE, DROP, ALTER, COMMENT. This restriction applies even to temporary tables, because carrying out these operations would require updating the system catalog tables.

SELECT ... FOR SHARE | UPDATE, because row locks cannot be taken without updating the underlying data files.

Rules on SELECT statements that generate DML commands.

LOCK that explicitly requests a mode higher than ROW EXCLUSIVE MODE.

LOCK in short default form, since it requests ACCESS EXCLUSIVE MODE.

Transaction management commands that explicitly set non-read-only state:

BEGIN READ WRITE, START TRANSACTION READ WRITE

SET TRANSACTION READ WRITE, SET SESSION CHARACTERISTICS AS TRANSACTION READ WRITE

SET transaction_read_only = off

Two-phase commit commands: PREPARE TRANSACTION, COMMIT PREPARED, ROLLBACK PREPARED because even read-only transactions need to write WAL in the prepare phase (the first phase of two phase commit).

Sequence updates: nextval(), setval()

In normal operation, “read-only” transactions are allowed to use LISTEN and NOTIFY, so hot standby sessions operate under slightly tighter restrictions than ordinary read-only sessions. It is possible that some of these restrictions might be loosened in a future release.

During hot standby, the parameter transaction_read_only is always true and may not be changed. But as long as no attempt is made to modify the database, connections during hot standby will act much like any other database connection. If failover or switchover occurs, the database will switch to normal processing mode. Sessions will remain connected while the server changes mode. Once hot standby finishes, it will be possible to initiate read-write transactions (even from a session begun during hot standby).

Users can determine whether hot standby is currently active for their session by issuing SHOW in_hot_standby. (In server versions before 14, the in_hot_standby parameter did not exist; a workable substitute method for older servers is SHOW transaction_read_only.) In addition, a set of functions (Table 9.98) allow users to access information about the standby server. These allow you to write programs that are aware of the current state of the database. These can be used to monitor the progress of recovery, or to allow you to write complex programs that restore the database to particular states.

The primary and standby servers are in many ways loosely connected. Actions on the primary will have an effect on the standby. As a result, there is potential for negative interactions or conflicts between them. The easiest conflict to understand is performance: if a huge data load is taking place on the primary then this will generate a similar stream of WAL records on the standby, so standby queries may contend for system resources, such as I/O.

There are also additional types of conflict that can occur with hot standby. These conflicts are hard conflicts in the sense that queries might need to be canceled and, in some cases, sessions disconnected to resolve them. The user is provided with several ways to handle these conflicts. Conflict cases include:

Access Exclusive locks taken on the primary server, including both explicit LOCK commands and various DDL actions, conflict with table accesses in standby queries.

Dropping a tablespace on the primary conflicts with standby queries using that tablespace for temporary work files.

Dropping a database on the primary conflicts with sessions connected to that database on the standby.

Application of a vacuum cleanup record from WAL conflicts with standby transactions whose snapshots can still “see” any of the rows to be removed.

Application of a vacuum cleanup record from WAL conflicts with queries accessing the target page on the standby, whether or not the data to be removed is visible.

On the primary server, these cases simply result in waiting; and the user might choose to cancel either of the conflicting actions. However, on the standby there is no choice: the WAL-logged action already occurred on the primary so the standby must not fail to apply it. Furthermore, allowing WAL application to wait indefinitely may be very undesirable, because the standby's state will become increasingly far behind the primary's. Therefore, a mechanism is provided to forcibly cancel standby queries that conflict with to-be-applied WAL records.

An example of the problem situation is an administrator on the primary server running DROP TABLE on a table that is currently being queried on the standby server. Clearly the standby query cannot continue if the DROP TABLE is applied on the standby. If this situation occurred on the primary, the DROP TABLE would wait until the other query had finished. But when DROP TABLE is run on the primary, the primary doesn't have information about what queries are running on the standby, so it will not wait for any such standby queries. The WAL change records come through to the standby while the standby query is still running, causing a conflict. The standby server must either delay application of the WAL records (and everything after them, too) or else cancel the conflicting query so that the DROP TABLE can be applied.

When a conflicting query is short, it's typically desirable to allow it to complete by delaying WAL application for a little bit; but a long delay in WAL application is usually not desirable. So the cancel mechanism has parameters, max_standby_archive_delay and max_standby_streaming_delay, that define the maximum allowed delay in WAL application. Conflicting queries will be canceled once it has taken longer than the relevant delay setting to apply any newly-received WAL data. There are two parameters so that different delay values can be specified for the case of reading WAL data from an archive (i.e., initial recovery from a base backup or “catching up” a standby server that has fallen far behind) versus reading WAL data via streaming replication.

In a standby server that exists primarily for high availability, it's best to set the delay parameters relatively short, so that the server cannot fall far behind the primary due to delays caused by standby queries. However, if the standby server is meant for executing long-running queries, then a high or even infinite delay value may be preferable. Keep in mind however that a long-running query could cause other sessions on the standby server to not see recent changes on the primary, if it delays application of WAL records.

Once the delay specified by max_standby_archive_delay or max_standby_streaming_delay has been exceeded, conflicting queries will be canceled. This usually results just in a cancellation error, although in the case of replaying a DROP DATABASE the entire conflicting session will be terminated. Also, if the conflict is over a lock held by an idle transaction, the conflicting session is terminated (this behavior might change in the future).

Canceled queries may be retried immediately (after beginning a new transaction, of course). Since query cancellation depends on the nature of the WAL records being replayed, a query that was canceled may well succeed if it is executed again.

Keep in mind that the delay parameters are compared to the elapsed time since the WAL data was received by the standby server. Thus, the grace period allowed to any one query on the standby is never more than the delay parameter, and could be considerably less if the standby has already fallen behind as a result of waiting for previous queries to complete, or as a result of being unable to keep up with a heavy update load.

The most common reason for conflict between standby queries and WAL replay is “early cleanup”. Normally, PostgreSQL allows cleanup of old row versions when there are no transactions that need to see them to ensure correct visibility of data according to MVCC rules. However, this rule can only be applied for transactions executing on the primary. So it is possible that cleanup on the primary will remove row versions that are still visible to a transaction on the standby.

Row version cleanup isn't the only potential cause of conflicts with standby queries. All index-only scans (including those that run on standbys) must use an MVCC snapshot that “agrees” with the visibility map. Conflicts are therefore required whenever VACUUM sets a page as all-visible in the visibility map containing one or more rows not visible to all standby queries. So even running VACUUM against a table with no updated or deleted rows requiring cleanup might lead to conflicts.

Users should be clear that tables that are regularly and heavily updated on the primary server will quickly cause cancellation of longer running queries on the standby. In such cases the setting of a finite value for max_standby_archive_delay or max_standby_streaming_delay can be considered similar to setting statement_timeout.

Remedial possibilities exist if the number of standby-query cancellations is found to be unacceptable. The first option is to set the parameter hot_standby_feedback, which prevents VACUUM from removing recently-dead rows and so cleanup conflicts do not occur. If you do this, you should note that this will delay cleanup of dead rows on the primary, which may result in undesirable table bloat. However, the cleanup situation will be no worse than if the standby queries were running directly on the primary server, and you are still getting the benefit of off-loading execution onto the standby. If standby servers connect and disconnect frequently, you might want to make adjustments to handle the period when hot_standby_feedback feedback is not being provided. For example, consider increasing max_standby_archive_delay so that queries are not rapidly canceled by conflicts in WAL archive files during disconnected periods. You should also consider increasing max_standby_streaming_delay to avoid rapid cancellations by newly-arrived streaming WAL entries after reconnection.

The number of query cancels and the reason for them can be viewed using the pg_stat_database_conflicts system view on the standby server. The pg_stat_database system view also contains summary information.

Users can control whether a log message is produced when WAL replay is waiting longer than deadlock_timeout for conflicts. This is controlled by the log_recovery_conflict_waits parameter.

If hot_standby is on in postgresql.conf (the default value) and there is a standby.signal file present, the server will run in hot standby mode. However, it may take some time for hot standby connections to be allowed, because the server will not accept connections until it has completed sufficient recovery to provide a consistent state against which queries can run. During this period, clients that attempt to connect will be refused with an error message. To confirm the server has come up, either loop trying to connect from the application, or look for these messages in the server logs:

Consistency information is recorded once per checkpoint on the primary. It is not possible to enable hot standby when reading WAL written during a period when wal_level was not set to replica or logical on the primary. Even after reaching a consistent state, the recovery snapshot may not be ready for hot standby if both of the following conditions are met, delaying accepting read-only connections. To enable hot standby, long-lived write transactions with more than 64 subtransactions need to be closed on the primary.

A write transaction has more than 64 subtransactions

Very long-lived write transactions

If you are running file-based log shipping ("warm standby"), you might need to wait until the next WAL file arrives, which could be as long as the archive_timeout setting on the primary.

The settings of some parameters determine the size of shared memory for tracking transaction IDs, locks, and prepared transactions. These shared memory structures must be no smaller on a standby than on the primary in order to ensure that the standby does not run out of shared memory during recovery. For example, if the primary had used a prepared transaction but the standby had not allocated any shared memory for tracking prepared transactions, then recovery could not continue until the standby's configuration is changed. The parameters affected are:

max_prepared_transactions

max_locks_per_transaction

The easiest way to ensure this does not become a problem is to have these parameters set on the standbys to values equal to or greater than on the primary. Therefore, if you want to increase these values, you should do so on all standby servers first, before applying the changes to the primary server. Conversely, if you want to decrease these values, you should do so on the primary server first, before applying the changes to all standby servers. Keep in mind that when a standby is promoted, it becomes the new reference for the required parameter settings for the standbys that follow it. Therefore, to avoid this becoming a problem during a switchover or failover, it is recommended to keep these settings the same on all standby servers.

The WAL tracks changes to these parameters on the primary. If a hot standby processes WAL that indicates that the current value on the primary is higher than its own value, it will log a warning and pause recovery, for example:

At that point, the settings on the standby need to be updated and the instance restarted before recovery can continue. If the standby is not a hot standby, then when it encounters the incompatible parameter change, it will shut down immediately without pausing, since there is then no value in keeping it up.

It is important that the administrator select appropriate settings for max_standby_archive_delay and max_standby_streaming_delay. The best choices vary depending on business priorities. For example if the server is primarily tasked as a High Availability server, then you will want low delay settings, perhaps even zero, though that is a very aggressive setting. If the standby server is tasked as an additional server for decision support queries then it might be acceptable to set the maximum delay values to many hours, or even -1 which means wait forever for queries to complete.

Transaction status "hint bits" written on the primary are not WAL-logged, so data on the standby will likely re-write the hints again on the standby. Thus, the standby server will still perform disk writes even though all users are read-only; no changes occur to the data values themselves. Users will still write large sort temporary files and re-generate relcache info files, so no part of the database is truly read-only during hot standby mode. Note also that writes to remote databases using dblink module, and other operations outside the database using PL functions will still be possible, even though the transaction is read-only locally.

The following types of administration commands are not accepted during recovery mode:

Data Definition Language (DDL): e.g., CREATE INDEX

Privilege and Ownership: GRANT, REVOKE, REASSIGN

Maintenance commands: ANALYZE, VACUUM, CLUSTER, REINDEX

Again, note that some of these commands are actually allowed during "read only" mode transactions on the primary.

As a result, you cannot create additional indexes that exist solely on the standby, nor statistics that exist solely on the standby. If these administration commands are needed, they should be executed on the primary, and eventually those changes will propagate to the standby.

pg_cancel_backend() and pg_terminate_backend() will work on user backends, but not the startup process, which performs recovery. pg_stat_activity does not show recovering transactions as active. As a result, pg_prepared_xacts is always empty during recovery. If you wish to resolve in-doubt prepared transactions, view pg_prepared_xacts on the primary and issue commands to resolve transactions there or resolve them after the end of recovery.

pg_locks will show locks held by backends, as normal. pg_locks also shows a virtual transaction managed by the startup process that owns all AccessExclusiveLocks held by transactions being replayed by recovery. Note that the startup process does not acquire locks to make database changes, and thus locks other than AccessExclusiveLocks do not show in pg_locks for the Startup process; they are just presumed to exist.

The Nagios plugin check_pgsql will work, because the simple information it checks for exists. The check_postgres monitoring script will also work, though some reported values could give different or confusing results. For example, last vacuum time will not be maintained, since no vacuum occurs on the standby. Vacuums running on the primary do still send their changes to the standby.

WAL file control commands will not work during recovery, e.g., pg_backup_start, pg_switch_wal etc.

Dynamically loadable modules work, including pg_stat_statements.

Advisory locks work normally in recovery, including deadlock detection. Note that advisory locks are never WAL logged, so it is impossible for an advisory lock on either the primary or the standby to conflict with WAL replay. Nor is it possible to acquire an advisory lock on the primary and have it initiate a similar advisory lock on the standby. Advisory locks relate only to the server on which they are acquired.

Trigger-based replication systems such as Slony, Londiste and Bucardo won't run on the standby at all, though they will run happily on the primary server as long as the changes are not sent to standby servers to be applied. WAL replay is not trigger-based so you cannot relay from the standby to any system that requires additional database writes or relies on the use of triggers.

New OIDs cannot be assigned, though some UUID generators may still work as long as they do not rely on writing new status to the database.

Currently, temporary table creation is not allowed during read-only transactions, so in some cases existing scripts will not run correctly. This restriction might be relaxed in a later release. This is both an SQL standard compliance issue and a technical issue.

DROP TABLESPACE can only succeed if the tablespace is empty. Some standby users may be actively using the tablespace via their temp_tablespaces parameter. If there are temporary files in the tablespace, all active queries are canceled to ensure that temporary files are removed, so the tablespace can be removed and WAL replay can continue.

Running DROP DATABASE or ALTER DATABASE ... SET TABLESPACE on the primary will generate a WAL entry that will cause all users connected to that database on the standby to be forcibly disconnected. This action occurs immediately, whatever the setting of max_standby_streaming_delay. Note that ALTER DATABASE ... RENAME does not disconnect users, which in most cases will go unnoticed, though might in some cases cause a program confusion if it depends in some way upon database name.

In normal (non-recovery) mode, if you issue DROP USER or DROP ROLE for a role with login capability while that user is still connected then nothing happens to the connected user — they remain connected. The user cannot reconnect however. This behavior applies in recovery also, so a DROP USER on the primary does not disconnect that user on the standby.

The cumulative statistics system is active during recovery. All scans, reads, blocks, index usage, etc., will be recorded normally on the standby. However, WAL replay will not increment relation and database specific counters. I.e. replay will not increment pg_stat_all_tables columns (like n_tup_ins), nor will reads or writes performed by the startup process be tracked in the pg_statio_ views, nor will associated pg_stat_database columns be incremented.

Autovacuum is not active during recovery. It will start normally at the end of recovery.

The checkpointer process and the background writer process are active during recovery. The checkpointer process will perform restartpoints (similar to checkpoints on the primary) and the background writer process will perform normal block cleaning activities. This can include updates of the hint bit information stored on the standby server. The CHECKPOINT command is accepted during recovery, though it performs a restartpoint rather than a new checkpoint.

Various parameters have been mentioned above in Section 26.4.2 and Section 26.4.3.

On the primary, the wal_level parameter can be used. max_standby_archive_delay and max_standby_streaming_delay have no effect if set on the primary.

On the standby, parameters hot_standby, max_standby_archive_delay and max_standby_streaming_delay can be used.

There are several limitations of hot standby. These can and probably will be fixed in future releases:

Full knowledge of running transactions is required before snapshots can be taken. Transactions that use large numbers of subtransactions (currently greater than 64) will delay the start of read-only connections until the completion of the longest running write transaction. If this situation occurs, explanatory messages will be sent to the server log.

Valid starting points for standby queries are generated at each checkpoint on the primary. If the standby is shut down while the primary is in a shutdown state, it might not be possible to re-enter hot standby until the primary is started up, so that it generates further starting points in the WAL logs. This situation isn't a problem in the most common situations where it might happen. Generally, if the primary is shut down and not available anymore, that's likely due to a serious failure that requires the standby being converted to operate as the new primary anyway. And in situations where the primary is being intentionally taken down, coordinating to make sure the standby becomes the new primary smoothly is also standard procedure.

At the end of recovery, AccessExclusiveLocks held by prepared transactions will require twice the normal number of lock table entries. If you plan on running either a large number of concurrent prepared transactions that normally take AccessExclusiveLocks, or you plan on having one large transaction that takes many AccessExclusiveLocks, you are advised to select a larger value of max_locks_per_transaction, perhaps as much as twice the value of the parameter on the primary server. You need not consider this at all if your setting of max_prepared_transactions is 0.

The Serializable transaction isolation level is not yet available in hot standby. (See Section 13.2.3 and Section 13.4.1 for details.) An attempt to set a transaction to the serializable isolation level in hot standby mode will generate an error.

**Examples:**

Example 1 (unknown):
```unknown
START TRANSACTION
```

Example 2 (unknown):
```unknown
ROLLBACK TO SAVEPOINT
```

Example 3 (unknown):
```unknown
ACCESS SHARE
```

Example 4 (unknown):
```unknown
ROW EXCLUSIVE
```

---


---

## 29.14. Quick Setup #


**URL:** https://www.postgresql.org/docs/18/logical-replication-quick-setup.html

**Contents:**
- 29.14. Quick Setup #

First set the configuration options in postgresql.conf:

The other required settings have default values that are sufficient for a basic setup.

pg_hba.conf needs to be adjusted to allow replication (the values here depend on your actual network configuration and user you want to use for connecting):

Then on the publisher database:

And on the subscriber database:

The above will start the replication process, which synchronizes the initial table contents of the tables users and departments and then starts replicating incremental changes to those tables.

**Examples:**

Example 1 (unknown):
```unknown
postgresql.conf
```

Example 2 (unknown):
```unknown
wal_level = logical
```

Example 3 (unknown):
```unknown
pg_hba.conf
```

Example 4 (unknown):
```unknown
host     all     repuser     0.0.0.0/0     md5
```

---


---

## 29.7. Conflicts #


**URL:** https://www.postgresql.org/docs/18/logical-replication-conflicts.html

**Contents:**
- 29.7. Conflicts #

Logical replication behaves similarly to normal DML operations in that the data will be updated even if it was changed locally on the subscriber node. If incoming data violates any constraints the replication will stop. This is referred to as a conflict. When replicating UPDATE or DELETE operations, missing data is also considered as a conflict, but does not result in an error and such operations will simply be skipped.

Additional logging is triggered, and the conflict statistics are collected (displayed in the pg_stat_subscription_stats view) in the following conflict cases:

Inserting a row that violates a NOT DEFERRABLE unique constraint. Note that to log the origin and commit timestamp details of the conflicting key, track_commit_timestamp should be enabled on the subscriber. In this case, an error will be raised until the conflict is resolved manually.

Updating a row that was previously modified by another origin. Note that this conflict can only be detected when track_commit_timestamp is enabled on the subscriber. Currently, the update is always applied regardless of the origin of the local row.

The updated value of a row violates a NOT DEFERRABLE unique constraint. Note that to log the origin and commit timestamp details of the conflicting key, track_commit_timestamp should be enabled on the subscriber. In this case, an error will be raised until the conflict is resolved manually. Note that when updating a partitioned table, if the updated row value satisfies another partition constraint resulting in the row being inserted into a new partition, the insert_exists conflict may arise if the new row violates a NOT DEFERRABLE unique constraint.

The row to be updated was not found. The update will simply be skipped in this scenario.

Deleting a row that was previously modified by another origin. Note that this conflict can only be detected when track_commit_timestamp is enabled on the subscriber. Currently, the delete is always applied regardless of the origin of the local row.

The row to be deleted was not found. The delete will simply be skipped in this scenario.

Inserting or updating a row violates multiple NOT DEFERRABLE unique constraints. Note that to log the origin and commit timestamp details of conflicting keys, ensure that track_commit_timestamp is enabled on the subscriber. In this case, an error will be raised until the conflict is resolved manually.

Note that there are other conflict scenarios, such as exclusion constraint violations. Currently, we do not provide additional details for them in the log.

The log format for logical replication conflicts is as follows:

The log provides the following information:

schemaname.tablename identifies the local relation involved in the conflict.

conflict_type is the type of conflict that occurred (e.g., insert_exists, update_exists).

detailed_explanation includes the origin, transaction ID, and commit timestamp of the transaction that modified the existing local row, if available.

The Key section includes the key values of the local row that violated a unique constraint for insert_exists, update_exists or multiple_unique_conflicts conflicts.

The existing local row section includes the local row if its origin differs from the remote row for update_origin_differs or delete_origin_differs conflicts, or if the key value conflicts with the remote row for insert_exists, update_exists or multiple_unique_conflicts conflicts.

The remote row section includes the new row from the remote insert or update operation that caused the conflict. Note that for an update operation, the column value of the new row will be null if the value is unchanged and toasted.

The replica identity section includes the replica identity key values that were used to search for the existing local row to be updated or deleted. This may include the full row value if the local relation is marked with REPLICA IDENTITY FULL.

column_name is the column name. For existing local row, remote row, and replica identity full cases, column names are logged only if the user lacks the privilege to access all columns of the table. If column names are present, they appear in the same order as the corresponding column values.

column_value is the column value. The large column values are truncated to 64 bytes.

Note that in case of multiple_unique_conflicts conflict, multiple detailed_explanation and detail_values lines will be generated, each detailing the conflict information associated with distinct unique constraints.

Logical replication operations are performed with the privileges of the role which owns the subscription. Permissions failures on target tables will cause replication conflicts, as will enabled row-level security on target tables that the subscription owner is subject to, without regard to whether any policy would ordinarily reject the INSERT, UPDATE, DELETE or TRUNCATE which is being replicated. This restriction on row-level security may be lifted in a future version of PostgreSQL.

A conflict that produces an error will stop the replication; it must be resolved manually by the user. Details about the conflict can be found in the subscriber's server log.

The resolution can be done either by changing data or permissions on the subscriber so that it does not conflict with the incoming change or by skipping the transaction that conflicts with the existing data. When a conflict produces an error, the replication won't proceed, and the logical replication worker will emit the following kind of message to the subscriber's server log:

The LSN of the transaction that contains the change violating the constraint and the replication origin name can be found from the server log (LSN 0/14C0378 and replication origin pg_16395 in the above case). The transaction that produced the conflict can be skipped by using ALTER SUBSCRIPTION ... SKIP with the finish LSN (i.e., LSN 0/14C0378). The finish LSN could be an LSN at which the transaction is committed or prepared on the publisher. Alternatively, the transaction can also be skipped by calling the pg_replication_origin_advance() function. Before using this function, the subscription needs to be disabled temporarily either by ALTER SUBSCRIPTION ... DISABLE or, the subscription can be used with the disable_on_error option. Then, you can use pg_replication_origin_advance() function with the node_name (i.e., pg_16395) and the next LSN of the finish LSN (i.e., 0/14C0379). The current position of origins can be seen in the pg_replication_origin_status system view. Please note that skipping the whole transaction includes skipping changes that might not violate any constraint. This can easily make the subscriber inconsistent. The additional details regarding conflicting rows, such as their origin and commit timestamp can be seen in the DETAIL line of the log. But note that this information is only available when track_commit_timestamp is enabled on the subscriber. Users can use this information to decide whether to retain the local change or adopt the remote alteration. For instance, the DETAIL line in the above log indicates that the existing row was modified locally. Users can manually perform a remote-change-win.

When the streaming mode is parallel, the finish LSN of failed transactions may not be logged. In that case, it may be necessary to change the streaming mode to on or off and cause the same conflicts again so the finish LSN of the failed transaction will be written to the server log. For the usage of finish LSN, please refer to ALTER SUBSCRIPTION ... SKIP.

**Examples:**

Example 1 (unknown):
```unknown
pg_stat_subscription_stats
```

Example 2 (unknown):
```unknown
insert_exists
```

Example 3 (unknown):
```unknown
NOT DEFERRABLE
```

Example 4 (unknown):
```unknown
track_commit_timestamp
```

---


---

