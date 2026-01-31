# PostgreSQL - Logical Decoding

## 49.1. Initialization Functions #


**URL:** https://www.postgresql.org/docs/18/archive-module-init.html

**Contents:**
- 49.1. Initialization Functions #

An archive library is loaded by dynamically loading a shared library with the archive_library's name as the library base name. The normal library search path is used to locate the library. To provide the required archive module callbacks and to indicate that the library is actually an archive module, it needs to provide a function named _PG_archive_module_init. The result of the function must be a pointer to a struct of type ArchiveModuleCallbacks, which contains everything that the core code needs to know to make use of the archive module. The return value needs to be of server lifetime, which is typically achieved by defining it as a static const variable in global scope.

Only the archive_file_cb callback is required. The others are optional.

**Examples:**

Example 1 (unknown):
```unknown
_PG_archive_module_init
```

Example 2 (unknown):
```unknown
ArchiveModuleCallbacks
```

Example 3 (unknown):
```unknown
static const
```

Example 4 (swift):
```swift
typedef struct ArchiveModuleCallbacks
{
    ArchiveStartupCB startup_cb;
    ArchiveCheckConfiguredCB check_configured_cb;
    ArchiveFileCB archive_file_cb;
    ArchiveShutdownCB shutdown_cb;
} ArchiveModuleCallbacks;
typedef const ArchiveModuleCallbacks *(*ArchiveModuleInit) (void);
```

---


---

## 47.10. Two-phase Commit Support for Logical Decoding #


**URL:** https://www.postgresql.org/docs/18/logicaldecoding-two-phase-commits.html

**Contents:**
- 47.10. Two-phase Commit Support for Logical Decoding #

With the basic output plugin callbacks (eg., begin_cb, change_cb, commit_cb and message_cb) two-phase commit commands like PREPARE TRANSACTION, COMMIT PREPARED and ROLLBACK PREPARED are not decoded. While the PREPARE TRANSACTION is ignored, COMMIT PREPARED is decoded as a COMMIT and ROLLBACK PREPARED is decoded as a ROLLBACK.

To support the streaming of two-phase commands, an output plugin needs to provide additional callbacks. There are multiple two-phase commit callbacks that are required, (begin_prepare_cb, prepare_cb, commit_prepared_cb, rollback_prepared_cb and stream_prepare_cb) and an optional callback (filter_prepare_cb).

If the output plugin callbacks for decoding two-phase commit commands are provided, then on PREPARE TRANSACTION, the changes of that transaction are decoded, passed to the output plugin, and the prepare_cb callback is invoked. This differs from the basic decoding setup where changes are only passed to the output plugin when a transaction is committed. The start of a prepared transaction is indicated by the begin_prepare_cb callback.

When a prepared transaction is rolled back using the ROLLBACK PREPARED, then the rollback_prepared_cb callback is invoked and when the prepared transaction is committed using COMMIT PREPARED, then the commit_prepared_cb callback is invoked.

Optionally the output plugin can define filtering rules via filter_prepare_cb to decode only specific transaction in two phases. This can be achieved by pattern matching on the gid or via lookups using the xid.

The users that want to decode prepared transactions need to be careful about below mentioned points:

If the prepared transaction has locked [user] catalog tables exclusively then decoding prepare can block till the main transaction is committed.

The logical replication solution that builds distributed two phase commit using this feature can deadlock if the prepared transaction has locked [user] catalog tables exclusively. To avoid this users must refrain from having locks on catalog tables (e.g. explicit LOCK command) in such transactions. See Section 47.8.2 for the details.

**Examples:**

Example 1 (unknown):
```unknown
PREPARE TRANSACTION
```

Example 2 (unknown):
```unknown
COMMIT PREPARED
```

Example 3 (unknown):
```unknown
ROLLBACK PREPARED
```

Example 4 (unknown):
```unknown
PREPARE TRANSACTION
```

---


---

## 47.2. Logical Decoding Concepts #


**URL:** https://www.postgresql.org/docs/18/logicaldecoding-explanation.html

**Contents:**
- 47.2. Logical Decoding Concepts #
  - 47.2.1. Logical Decoding #
  - 47.2.2. Replication Slots #
  - Note
  - Caution
  - 47.2.3. Replication Slot Synchronization #
  - Note
  - Caution
  - 47.2.4. Output Plugins #
  - 47.2.5. Exported Snapshots #

Logical decoding is the process of extracting all persistent changes to a database's tables into a coherent, easy to understand format which can be interpreted without detailed knowledge of the database's internal state.

In PostgreSQL, logical decoding is implemented by decoding the contents of the write-ahead log, which describe changes on a storage level, into an application-specific form such as a stream of tuples or SQL statements.

In the context of logical replication, a slot represents a stream of changes that can be replayed to a client in the order they were made on the origin server. Each slot streams a sequence of changes from a single database.

PostgreSQL also has streaming replication slots (see Section 26.2.5), but they are used somewhat differently there.

A replication slot has an identifier that is unique across all databases in a PostgreSQL cluster. Slots persist independently of the connection using them and are crash-safe.

A logical slot will emit each change just once in normal operation. The current position of each slot is persisted only at checkpoint, so in the case of a crash the slot might return to an earlier LSN, which will then cause recent changes to be sent again when the server restarts. Logical decoding clients are responsible for avoiding ill effects from handling the same message more than once. Clients may wish to record the last LSN they saw when decoding and skip over any repeated data or (when using the replication protocol) request that decoding start from that LSN rather than letting the server determine the start point. The Replication Progress Tracking feature is designed for this purpose, refer to replication origins.

Multiple independent slots may exist for a single database. Each slot has its own state, allowing different consumers to receive changes from different points in the database change stream. For most applications, a separate slot will be required for each consumer.

A logical replication slot knows nothing about the state of the receiver(s). It's even possible to have multiple different receivers using the same slot at different times; they'll just get the changes following on from when the last receiver stopped consuming them. Only one receiver may consume changes from a slot at any given time.

A logical replication slot can also be created on a hot standby. To prevent VACUUM from removing required rows from the system catalogs, hot_standby_feedback should be set on the standby. In spite of that, if any required rows get removed, the slot gets invalidated. It's highly recommended to use a physical slot between the primary and the standby. Otherwise, hot_standby_feedback will work but only while the connection is alive (for example a node restart would break it). Then, the primary may delete system catalog rows that could be needed by the logical decoding on the standby (as it does not know about the catalog_xmin on the standby). Existing logical slots on standby also get invalidated if wal_level on the primary is reduced to less than logical. This is done as soon as the standby detects such a change in the WAL stream. It means that, for walsenders that are lagging (if any), some WAL records up to the wal_level parameter change on the primary won't be decoded.

Creation of a logical slot requires information about all the currently running transactions. On the primary, this information is available directly, but on a standby, this information has to be obtained from primary. Thus, slot creation may need to wait for some activity to happen on the primary. If the primary is idle, creating a logical slot on standby may take noticeable time. This can be sped up by calling the pg_log_standby_snapshot function on the primary.

Replication slots persist across crashes and know nothing about the state of their consumer(s). They will prevent removal of required resources even when there is no connection using them. This consumes storage because neither required WAL nor required rows from the system catalogs can be removed by VACUUM as long as they are required by a replication slot. In extreme cases this could cause the database to shut down to prevent transaction ID wraparound (see Section 24.1.5). So if a slot is no longer required it should be dropped.

The logical replication slots on the primary can be synchronized to the hot standby by using the failover parameter of pg_create_logical_replication_slot, or by using the failover option of CREATE SUBSCRIPTION during slot creation. Additionally, enabling sync_replication_slots on the standby is required. By enabling sync_replication_slots on the standby, the failover slots can be synchronized periodically in the slotsync worker. For the synchronization to work, it is mandatory to have a physical replication slot between the primary and the standby (i.e., primary_slot_name should be configured on the standby), and hot_standby_feedback must be enabled on the standby. It is also necessary to specify a valid dbname in the primary_conninfo. It's highly recommended that the said physical replication slot is named in synchronized_standby_slots list on the primary, to prevent the subscriber from consuming changes faster than the hot standby. Even when correctly configured, some latency is expected when sending changes to logical subscribers due to the waiting on slots named in synchronized_standby_slots. When synchronized_standby_slots is utilized, the primary server will not completely shut down until the corresponding standbys, associated with the physical replication slots specified in synchronized_standby_slots, have confirmed receiving the WAL up to the latest flushed position on the primary server.

While enabling sync_replication_slots allows for automatic periodic synchronization of failover slots, they can also be manually synchronized using the pg_sync_replication_slots function on the standby. However, this function is primarily intended for testing and debugging and should be used with caution. Unlike automatic synchronization, it does not include cyclic retries, making it more prone to synchronization failures, particularly during initial sync scenarios where the required WAL files or catalog rows for the slot might have already been removed or are at risk of being removed on the standby. In contrast, automatic synchronization via sync_replication_slots provides continuous slot updates, enabling seamless failover and supporting high availability. Therefore, it is the recommended method for synchronizing slots.

When slot synchronization is configured as recommended, and the initial synchronization is performed either automatically or manually via pg_sync_replication_slots, the standby can persist the synchronized slot only if the following condition is met: The logical replication slot on the primary must retain WALs and system catalog rows that are still available on the standby. This ensures data integrity and allows logical replication to continue smoothly after promotion. If the required WALs or catalog rows have already been purged from the standby, the slot will not be persisted to avoid data loss. In such cases, the following log message may appear:

If the logical replication slot is actively used by a consumer, no manual intervention is needed; the slot will advance automatically, and synchronization will resume in the next cycle. However, if no consumer is configured, it is advisable to manually advance the slot on the primary using pg_logical_slot_get_changes or pg_logical_slot_get_binary_changes, allowing synchronization to proceed.

The ability to resume logical replication after failover depends upon the pg_replication_slots.synced value for the synchronized slots on the standby at the time of failover. Only persistent slots that have attained synced state as true on the standby before failover can be used for logical replication after failover. Temporary synced slots cannot be used for logical decoding, therefore logical replication for those slots cannot be resumed. For example, if the synchronized slot could not become persistent on the standby due to a disabled subscription, then the subscription cannot be resumed after failover even when it is enabled.

To resume logical replication after failover from the synced logical slots, the subscription's 'conninfo' must be altered to point to the new primary server. This is done using ALTER SUBSCRIPTION ... CONNECTION. It is recommended that subscriptions are first disabled before promoting the standby and are re-enabled after altering the connection string.

There is a chance that the old primary is up again during the promotion and if subscriptions are not disabled, the logical subscribers may continue to receive data from the old primary server even after promotion until the connection string is altered. This might result in data inconsistency issues, preventing the logical subscribers from being able to continue replication from the new primary server.

Output plugins transform the data from the write-ahead log's internal representation into the format the consumer of a replication slot desires.

When a new replication slot is created using the streaming replication interface (see CREATE_REPLICATION_SLOT), a snapshot is exported (see Section 9.28.5), which will show exactly the state of the database after which all changes will be included in the change stream. This can be used to create a new replica by using SET TRANSACTION SNAPSHOT to read the state of the database at the moment the slot was created. This transaction can then be used to dump the database's state at that point in time, which afterwards can be updated using the slot's contents without losing any changes.

Applications that do not require snapshot export may suppress it with the SNAPSHOT 'nothing' option.

**Examples:**

Example 1 (unknown):
```unknown
hot_standby_feedback
```

Example 2 (unknown):
```unknown
hot_standby_feedback
```

Example 3 (unknown):
```unknown
catalog_xmin
```

Example 4 (unknown):
```unknown
pg_log_standby_snapshot
```

---


---

## 47.9. Streaming of Large Transactions for Logical Decoding #


**URL:** https://www.postgresql.org/docs/18/logicaldecoding-streaming.html

**Contents:**
- 47.9. Streaming of Large Transactions for Logical Decoding #

The basic output plugin callbacks (e.g., begin_cb, change_cb, commit_cb and message_cb) are only invoked when the transaction actually commits. The changes are still decoded from the transaction log, but are only passed to the output plugin at commit (and discarded if the transaction aborts).

This means that while the decoding happens incrementally, and may spill to disk to keep memory usage under control, all the decoded changes have to be transmitted when the transaction finally commits (or more precisely, when the commit is decoded from the transaction log). Depending on the size of the transaction and network bandwidth, the transfer time may significantly increase the apply lag.

To reduce the apply lag caused by large transactions, an output plugin may provide additional callback to support incremental streaming of in-progress transactions. There are multiple required streaming callbacks (stream_start_cb, stream_stop_cb, stream_abort_cb, stream_commit_cb and stream_change_cb) and two optional callbacks (stream_message_cb and stream_truncate_cb). Also, if streaming of two-phase commands is to be supported, then additional callbacks must be provided. (See Section 47.10 for details).

When streaming an in-progress transaction, the changes (and messages) are streamed in blocks demarcated by stream_start_cb and stream_stop_cb callbacks. Once all the decoded changes are transmitted, the transaction can be committed using the stream_commit_cb callback (or possibly aborted using the stream_abort_cb callback). If two-phase commits are supported, the transaction can be prepared using the stream_prepare_cb callback, COMMIT PREPARED using the commit_prepared_cb callback or aborted using the rollback_prepared_cb.

One example sequence of streaming callback calls for one transaction may look like this:

The actual sequence of callback calls may be more complicated, of course. There may be blocks for multiple streamed transactions, some of the transactions may get aborted, etc.

Similar to spill-to-disk behavior, streaming is triggered when the total amount of changes decoded from the WAL (for all in-progress transactions) exceeds the limit defined by logical_decoding_work_mem setting. At that point, the largest top-level transaction (measured by the amount of memory currently used for decoded changes) is selected and streamed. However, in some cases we still have to spill to disk even if streaming is enabled because we exceed the memory threshold but still have not decoded the complete tuple e.g., only decoded toast table insert but not the main table insert.

Even when streaming large transactions, the changes are still applied in commit order, preserving the same guarantees as the non-streaming mode.

**Examples:**

Example 1 (unknown):
```unknown
stream_start_cb
```

Example 2 (unknown):
```unknown
stream_stop_cb
```

Example 3 (unknown):
```unknown
stream_abort_cb
```

Example 4 (unknown):
```unknown
stream_commit_cb
```

---


---

## Chapter 48. Replication Progress Tracking


**URL:** https://www.postgresql.org/docs/18/replication-origins.html

**Contents:**
- Chapter 48. Replication Progress Tracking

Replication origins are intended to make it easier to implement logical replication solutions on top of logical decoding. They provide a solution to two common problems:

How to safely keep track of replication progress

How to change replication behavior based on the origin of a row; for example, to prevent loops in bi-directional replication setups

Replication origins have just two properties, a name and an ID. The name, which is what should be used to refer to the origin across systems, is free-form text. It should be used in a way that makes conflicts between replication origins created by different replication solutions unlikely; e.g., by prefixing the replication solution's name to it. The ID is used only to avoid having to store the long version in situations where space efficiency is important. It should never be shared across systems.

Replication origins can be created using the function pg_replication_origin_create(); dropped using pg_replication_origin_drop(); and seen in the pg_replication_origin system catalog.

One nontrivial part of building a replication solution is to keep track of replay progress in a safe manner. When the applying process, or the whole cluster, dies, it needs to be possible to find out up to where data has successfully been replicated. Naive solutions to this, such as updating a row in a table for every replayed transaction, have problems like run-time overhead and database bloat.

Using the replication origin infrastructure a session can be marked as replaying from a remote node (using the pg_replication_origin_session_setup() function). Additionally the LSN and commit time stamp of every source transaction can be configured on a per transaction basis using pg_replication_origin_xact_setup(). If that's done replication progress will persist in a crash safe manner. Replay progress for all replication origins can be seen in the pg_replication_origin_status view. An individual origin's progress, e.g., when resuming replication, can be acquired using pg_replication_origin_progress() for any origin or pg_replication_origin_session_progress() for the origin configured in the current session.

In replication topologies more complex than replication from exactly one system to one other system, another problem can be that it is hard to avoid replicating replayed rows again. That can lead both to cycles in the replication and inefficiencies. Replication origins provide an optional mechanism to recognize and prevent that. When configured using the functions referenced in the previous paragraph, every change and transaction passed to output plugin callbacks (see Section 47.6) generated by the session is tagged with the replication origin of the generating session. This allows treating them differently in the output plugin, e.g., ignoring all but locally-originating rows. Additionally the filter_by_origin_cb callback can be used to filter the logical decoding change stream based on the source. While less flexible, filtering via that callback is considerably more efficient than doing it in the output plugin.

**Examples:**

Example 1 (unknown):
```unknown
pg_replication_origin_create()
```

Example 2 (unknown):
```unknown
pg_replication_origin_drop()
```

Example 3 (unknown):
```unknown
pg_replication_origin
```

Example 4 (unknown):
```unknown
pg_replication_origin_session_setup()
```

---


---

## 49.2. Archive Module Callbacks #


**URL:** https://www.postgresql.org/docs/18/archive-module-callbacks.html

**Contents:**
- 49.2. Archive Module Callbacks #
  - 49.2.1. Startup Callback #
  - 49.2.2. Check Callback #
  - Note
  - 49.2.3. Archive Callback #
  - Note
  - 49.2.4. Shutdown Callback #

The archive callbacks define the actual archiving behavior of the module. The server will call them as required to process each individual WAL file.

The startup_cb callback is called shortly after the module is loaded. This callback can be used to perform any additional initialization required. If the archive module has any state, it can use state->private_data to store it.

The check_configured_cb callback is called to determine whether the module is fully configured and ready to accept WAL files (e.g., its configuration parameters are set to valid values). If no check_configured_cb is defined, the server always assumes the module is configured.

If true is returned, the server will proceed with archiving the file by calling the archive_file_cb callback. If false is returned, archiving will not proceed, and the archiver will emit the following message to the server log:

In the latter case, the server will periodically call this function, and archiving will proceed only when it returns true.

When returning false, it may be useful to append some additional information to the generic warning message. To do that, provide a message to the arch_module_check_errdetail macro before returning false. Like errdetail(), this macro accepts a format string followed by an optional list of arguments. The resulting string will be emitted as the DETAIL line of the warning message.

The archive_file_cb callback is called to archive a single WAL file.

If true is returned, the server proceeds as if the file was successfully archived, which may include recycling or removing the original WAL file. If false is returned or an error is thrown, the server will keep the original WAL file and retry archiving later. file will contain just the file name of the WAL file to archive, while path contains the full path of the WAL file (including the file name).

The archive_file_cb callback is called in a short-lived memory context that will be reset between invocations. If you need longer-lived storage, create a memory context in the module's startup_cb callback.

The shutdown_cb callback is called when the archiver process exits (e.g., after an error) or the value of archive_library changes. If no shutdown_cb is defined, no special action is taken in these situations. If the archive module has any state, this callback should free it to avoid leaks.

**Examples:**

Example 1 (php):
```php
state->private_data
```

Example 2 (unknown):
```unknown
typedef void (*ArchiveStartupCB) (ArchiveModuleState *state);
```

Example 3 (unknown):
```unknown
check_configured_cb
```

Example 4 (unknown):
```unknown
check_configured_cb
```

---


---

## Chapter 47. Logical Decoding


**URL:** https://www.postgresql.org/docs/18/logicaldecoding.html

**Contents:**
- Chapter 47. Logical Decoding

PostgreSQL provides infrastructure to stream the modifications performed via SQL to external consumers. This functionality can be used for a variety of purposes, including replication solutions and auditing.

Changes are sent out in streams identified by logical replication slots.

The format in which those changes are streamed is determined by the output plugin used. An example plugin is provided in the PostgreSQL distribution. Additional plugins can be written to extend the choice of available formats without modifying any core code. Every output plugin has access to each individual new row produced by INSERT and the new row version created by UPDATE. Availability of old row versions for UPDATE and DELETE depends on the configured replica identity (see REPLICA IDENTITY).

Changes can be consumed either using the streaming replication protocol (see Section 54.4 and Section 47.3), or by calling functions via SQL (see Section 47.4). It is also possible to write additional methods of consuming the output of a replication slot without modifying core code (see Section 47.7).

**Examples:**

Example 1 (unknown):
```unknown
REPLICA IDENTITY
```

---


---

