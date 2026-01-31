# PostgreSQL - System Views (Part 3)

## 53.20. pg_replication_slots #


**URL:** https://www.postgresql.org/docs/18/view-pg-replication-slots.html

**Contents:**
- 53.20. pg_replication_slots #

The pg_replication_slots view provides a listing of all replication slots that currently exist on the database cluster, along with their current state.

For more on replication slots, see Section 26.2.6 and Chapter 47.

Table 53.20. pg_replication_slots Columns

A unique, cluster-wide identifier for the replication slot

The base name of the shared object containing the output plugin this logical slot is using, or null for physical slots.

The slot type: physical or logical

datoid oid (references pg_database.oid)

The OID of the database this slot is associated with, or null. Only logical slots have an associated database.

database name (references pg_database.datname)

The name of the database this slot is associated with, or null. Only logical slots have an associated database.

True if this is a temporary replication slot. Temporary slots are not saved to disk and are automatically dropped on error or when the session has finished.

True if this slot is currently being streamed

The process ID of the session streaming data for this slot. NULL if inactive.

The oldest transaction that this slot needs the database to retain. VACUUM cannot remove tuples deleted by any later transaction.

The oldest transaction affecting the system catalogs that this slot needs the database to retain. VACUUM cannot remove catalog tuples deleted by any later transaction.

The address (LSN) of oldest WAL which still might be required by the consumer of this slot and thus won't be automatically removed during checkpoints unless this LSN gets behind more than max_slot_wal_keep_size from the current LSN. NULL if the LSN of this slot has never been reserved.

confirmed_flush_lsn pg_lsn

The address (LSN) up to which the logical slot's consumer has confirmed receiving data. Data corresponding to the transactions committed before this LSN is not available anymore. NULL for physical slots.

Availability of WAL files claimed by this slot. Possible values are:

reserved means that the claimed files are within max_wal_size.

extended means that max_wal_size is exceeded but the files are still retained, either by the replication slot or by wal_keep_size.

unreserved means that the slot no longer retains the required WAL files and some of them are to be removed at the next checkpoint. This typically occurs when max_slot_wal_keep_size is set to a non-negative value. This state can return to reserved or extended.

lost means that this slot is no longer usable.

The number of bytes that can be written to WAL such that this slot is not in danger of getting in state "lost". It is NULL for lost slots, as well as if max_slot_wal_keep_size is -1.

True if the slot is enabled for decoding prepared transactions. Always false for physical slots.

The address (LSN) from which the decoding of prepared transactions is enabled. NULL for logical slots where two_phase is false and for physical slots.

inactive_since timestamptz

The time when the slot became inactive. NULL if the slot is currently being streamed. If the slot becomes invalid, this value will never be updated. For standby slots that are being synced from a primary server (whose synced field is true), the inactive_since indicates the time when slot synchronization (see Section 47.2.3) was most recently stopped. NULL if the slot has always been synchronized. This helps standby slots track when synchronization was interrupted.

True if this logical slot conflicted with recovery (and so is now invalidated). When this column is true, check invalidation_reason column for the conflict reason. Always NULL for physical slots.

invalidation_reason text

The reason for the slot's invalidation. It is set for both logical and physical slots. NULL if the slot is not invalidated. Possible values are:

wal_removed means that the required WAL has been removed.

rows_removed means that the required rows have been removed. It is set only for logical slots.

wal_level_insufficient means that the primary doesn't have a wal_level sufficient to perform logical decoding. It is set only for logical slots.

idle_timeout means that the slot has remained inactive longer than the configured idle_replication_slot_timeout duration.

True if this is a logical slot enabled to be synced to the standbys so that logical replication can be resumed from the new primary after failover. Always false for physical slots.

True if this is a logical slot that was synced from a primary server. On a hot standby, the slots with the synced column marked as true can neither be used for logical decoding nor dropped manually. The value of this column has no meaning on the primary server; the column value on the primary is default false for all slots but may (if leftover from a promoted standby) also be true.

**Examples:**

Example 1 (unknown):
```unknown
pg_replication_slots
```

Example 2 (unknown):
```unknown
pg_replication_slots
```

Example 3 (unknown):
```unknown
pg_replication_slots
```

Example 4 (unknown):
```unknown
pg_replication_slots
```

---


---

## 53.8. pg_file_settings #


**URL:** https://www.postgresql.org/docs/18/view-pg-file-settings.html

**Contents:**
- 53.8. pg_file_settings #

The view pg_file_settings provides a summary of the contents of the server's configuration file(s). A row appears in this view for each “name = value” entry appearing in the files, with annotations indicating whether the value could be applied successfully. Additional row(s) may appear for problems not linked to a “name = value” entry, such as syntax errors in the files.

This view is helpful for checking whether planned changes in the configuration files will work, or for diagnosing a previous failure. Note that this view reports on the current contents of the files, not on what was last applied by the server. (The pg_settings view is usually sufficient to determine that.)

By default, the pg_file_settings view can be read only by superusers.

Table 53.8. pg_file_settings Columns

Full path name of the configuration file

Line number within the configuration file where the entry appears

Order in which the entries are processed (1..n)

Configuration parameter name

Value to be assigned to the parameter

True if the value can be applied successfully

If not null, an error message indicating why this entry could not be applied

If the configuration file contains syntax errors or invalid parameter names, the server will not attempt to apply any settings from it, and therefore all the applied fields will read as false. In such a case there will be one or more rows with non-null error fields indicating the problem(s). Otherwise, individual settings will be applied if possible. If an individual setting cannot be applied (e.g., invalid value, or the setting cannot be changed after server start) it will have an appropriate message in the error field. Another way that an entry might have applied = false is that it is overridden by a later entry for the same parameter name; this case is not considered an error so nothing appears in the error field.

See Section 19.1 for more information about the various ways to change run-time parameters.

**Examples:**

Example 1 (unknown):
```unknown
pg_file_settings
```

Example 2 (unknown):
```unknown
pg_file_settings
```

Example 3 (unknown):
```unknown
pg_file_settings
```

Example 4 (unknown):
```unknown
pg_settings
```

---


---

## 53.35. pg_user #


**URL:** https://www.postgresql.org/docs/18/view-pg-user.html

**Contents:**
- 53.35. pg_user #

The view pg_user provides access to information about database users. This is simply a publicly readable view of pg_shadow that blanks out the password field.

Table 53.35. pg_user Columns

User can create databases

User can initiate streaming replication and put the system in and out of backup mode.

User bypasses every row-level security policy, see Section 5.9 for more information.

Not the password (always reads as ********)

Password expiry time (only used for password authentication)

Session defaults for run-time configuration variables

**Examples:**

Example 1 (unknown):
```unknown
usecreatedb
```

Example 2 (unknown):
```unknown
usebypassrls
```

Example 3 (unknown):
```unknown
timestamptz
```

Example 4 (unknown):
```unknown
pg_timezone_names
```

---


---

## 53.13. pg_locks #


**URL:** https://www.postgresql.org/docs/18/view-pg-locks.html

**Contents:**
- 53.13. pg_locks #

The view pg_locks provides access to information about the locks held by active processes within the database server. See Chapter 13 for more discussion of locking.

pg_locks contains one row per active lockable object, requested lock mode, and relevant process. Thus, the same lockable object might appear many times, if multiple processes are holding or waiting for locks on it. However, an object that currently has no locks on it will not appear at all.

There are several distinct types of lockable objects: whole relations (e.g., tables), individual pages of relations, individual tuples of relations, transaction IDs (both virtual and permanent IDs), and general database objects (identified by class OID and object OID, in the same way as in pg_description or pg_depend). Also, the right to extend a relation is represented as a separate lockable object, as is the right to update pg_database.datfrozenxid. Also, “advisory” locks can be taken on numbers that have user-defined meanings.

Table 53.13. pg_locks Columns

Type of the lockable object: relation, extend, frozenid, page, tuple, transactionid, virtualxid, spectoken, object, userlock, advisory, or applytransaction. (See also Table 27.11.)

database oid (references pg_database.oid)

OID of the database in which the lock target exists, or zero if the target is a shared object, or null if the target is a transaction ID

relation oid (references pg_class.oid)

OID of the relation targeted by the lock, or null if the target is not a relation or part of a relation

Page number targeted by the lock within the relation, or null if the target is not a relation page or tuple

Tuple number targeted by the lock within the page, or null if the target is not a tuple

Virtual ID of the transaction targeted by the lock, or null if the target is not a virtual transaction ID; see Chapter 67

ID of the transaction targeted by the lock, or null if the target is not a transaction ID; Chapter 67

classid oid (references pg_class.oid)

OID of the system catalog containing the lock target, or null if the target is not a general database object

objid oid (references any OID column)

OID of the lock target within its system catalog, or null if the target is not a general database object

Column number targeted by the lock (the classid and objid refer to the table itself), or zero if the target is some other general database object, or null if the target is not a general database object

virtualtransaction text

Virtual ID of the transaction that is holding or awaiting this lock

Process ID of the server process holding or awaiting this lock, or null if the lock is held by a prepared transaction

Name of the lock mode held or desired by this process (see Section 13.3.1 and Section 13.2.3)

True if lock is held, false if lock is awaited

True if lock was taken via fast path, false if taken via main lock table

waitstart timestamptz

Time when the server process started waiting for this lock, or null if the lock is held. Note that this can be null for a very short period of time after the wait started even though granted is false.

granted is true in a row representing a lock held by the indicated process. False indicates that this process is currently waiting to acquire this lock, which implies that at least one other process is holding or waiting for a conflicting lock mode on the same lockable object. The waiting process will sleep until the other lock is released (or a deadlock situation is detected). A single process can be waiting to acquire at most one lock at a time.

Throughout running a transaction, a server process holds an exclusive lock on the transaction's virtual transaction ID. If a permanent ID is assigned to the transaction (which normally happens only if the transaction changes the state of the database), it also holds an exclusive lock on the transaction's permanent transaction ID until it ends. When a process finds it necessary to wait specifically for another transaction to end, it does so by attempting to acquire share lock on the other transaction's ID (either virtual or permanent ID depending on the situation). That will succeed only when the other transaction terminates and releases its locks.

Although tuples are a lockable type of object, information about row-level locks is stored on disk, not in memory, and therefore row-level locks normally do not appear in this view. If a process is waiting for a row-level lock, it will usually appear in the view as waiting for the permanent transaction ID of the current holder of that row lock.

A speculative insertion lock consists of a transaction ID and a speculative insertion token. The speculative insertion token is displayed in the objid column.

Advisory locks can be acquired on keys consisting of either a single bigint value or two integer values. A bigint key is displayed with its high-order half in the classid column, its low-order half in the objid column, and objsubid equal to 1. The original bigint value can be reassembled with the expression (classid::bigint << 32) | objid::bigint. Integer keys are displayed with the first key in the classid column, the second key in the objid column, and objsubid equal to 2. The actual meaning of the keys is up to the user. Advisory locks are local to each database, so the database column is meaningful for an advisory lock.

Apply transaction locks are used in parallel mode to apply the transaction in logical replication. The remote transaction ID is displayed in the transactionid column. The objsubid displays the lock subtype which is 0 for the lock used to synchronize the set of changes, and 1 for the lock used to wait for the transaction to finish to ensure commit order.

pg_locks provides a global view of all locks in the database cluster, not only those relevant to the current database. Although its relation column can be joined against pg_class.oid to identify locked relations, this will only work correctly for relations in the current database (those for which the database column is either the current database's OID or zero).

The pid column can be joined to the pid column of the pg_stat_activity view to get more information on the session holding or awaiting each lock, for example

Also, if you are using prepared transactions, the virtualtransaction column can be joined to the transaction column of the pg_prepared_xacts view to get more information on prepared transactions that hold locks. (A prepared transaction can never be waiting for a lock, but it continues to hold the locks it acquired while running.) For example:

While it is possible to obtain information about which processes block which other processes by joining pg_locks against itself, this is very difficult to get right in detail. Such a query would have to encode knowledge about which lock modes conflict with which others. Worse, the pg_locks view does not expose information about which processes are ahead of which others in lock wait queues, nor information about which processes are parallel workers running on behalf of which other client sessions. It is better to use the pg_blocking_pids() function (see Table 9.71) to identify which process(es) a waiting process is blocked behind.

The pg_locks view displays data from both the regular lock manager and the predicate lock manager, which are separate systems; in addition, the regular lock manager subdivides its locks into regular and fast-path locks. This data is not guaranteed to be entirely consistent. When the view is queried, data on fast-path locks (with fastpath = true) is gathered from each backend one at a time, without freezing the state of the entire lock manager, so it is possible for locks to be taken or released while information is gathered. Note, however, that these locks are known not to conflict with any other lock currently in place. After all backends have been queried for fast-path locks, the remainder of the regular lock manager is locked as a unit, and a consistent snapshot of all remaining locks is collected as an atomic action. After unlocking the regular lock manager, the predicate lock manager is similarly locked and all predicate locks are collected as an atomic action. Thus, with the exception of fast-path locks, each lock manager will deliver a consistent set of results, but as we do not lock both lock managers simultaneously, it is possible for locks to be taken or released after we interrogate the regular lock manager and before we interrogate the predicate lock manager.

Locking the regular and/or predicate lock manager could have some impact on database performance if this view is very frequently accessed. The locks are held only for the minimum amount of time necessary to obtain data from the lock managers, but this does not completely eliminate the possibility of a performance impact.

**Examples:**

Example 1 (unknown):
```unknown
pg_description
```

Example 2 (unknown):
```unknown
pg_database
```

Example 3 (unknown):
```unknown
datfrozenxid
```

Example 4 (unknown):
```unknown
transactionid
```

---


---

