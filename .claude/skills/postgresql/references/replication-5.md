# PostgreSQL - Replication (Part 5)

## 29.1. Publication #


**URL:** https://www.postgresql.org/docs/18/logical-replication-publication.html

**Contents:**
- 29.1. Publication #
  - 29.1.1. Replica Identity #

A publication can be defined on any physical replication primary. The node where a publication is defined is referred to as publisher. A publication is a set of changes generated from a table or a group of tables, and might also be described as a change set or replication set. Each publication exists in only one database.

Publications are different from schemas and do not affect how the table is accessed. Each table can be added to multiple publications if needed. Publications may currently only contain tables and all tables in schema. Objects must be added explicitly, except when a publication is created for ALL TABLES.

Publications can choose to limit the changes they produce to any combination of INSERT, UPDATE, DELETE, and TRUNCATE, similar to how triggers are fired by particular event types. By default, all operation types are replicated. These publication specifications apply only for DML operations; they do not affect the initial data synchronization copy. (Row filters have no effect for TRUNCATE. See Section 29.4).

Every publication can have multiple subscribers.

A publication is created using the CREATE PUBLICATION command and may later be altered or dropped using corresponding commands.

The individual tables can be added and removed dynamically using ALTER PUBLICATION. Both the ADD TABLE and DROP TABLE operations are transactional, so the table will start or stop replicating at the correct snapshot once the transaction has committed.

A published table must have a replica identity configured in order to be able to replicate UPDATE and DELETE operations, so that appropriate rows to update or delete can be identified on the subscriber side.

By default, this is the primary key, if there is one. Another unique index (with certain additional requirements) can also be set to be the replica identity. If the table does not have any suitable key, then it can be set to replica identity FULL, which means the entire row becomes the key. When replica identity FULL is specified, indexes can be used on the subscriber side for searching the rows. Candidate indexes must be btree or hash, non-partial, and the leftmost index field must be a column (not an expression) that references the published table column. These restrictions on the non-unique index properties adhere to some of the restrictions that are enforced for primary keys. If there are no such suitable indexes, the search on the subscriber side can be very inefficient, therefore replica identity FULL should only be used as a fallback if no other solution is possible.

If a replica identity other than FULL is set on the publisher side, a replica identity comprising the same or fewer columns must also be set on the subscriber side.

Tables with a replica identity defined as NOTHING, DEFAULT without a primary key, or USING INDEX with a dropped index, cannot support UPDATE or DELETE operations when included in a publication replicating these actions. Attempting such operations will result in an error on the publisher.

INSERT operations can proceed regardless of any replica identity.

See ALTER TABLE...REPLICA IDENTITY for details on how to set the replica identity.

**Examples:**

Example 1 (unknown):
```unknown
CREATE PUBLICATION
```

Example 2 (unknown):
```unknown
ALTER PUBLICATION
```

Example 3 (julia):
```julia
USING INDEX
```

Example 4 (unknown):
```unknown
ALTER TABLE...REPLICA IDENTITY
```

---


---

## 29.12. Configuration Settings #


**URL:** https://www.postgresql.org/docs/18/logical-replication-config.html

**Contents:**
- 29.12. Configuration Settings #
  - 29.12.1. Publishers #
  - 29.12.2. Subscribers #

Logical replication requires several configuration options to be set. These options are relevant only on one side of the replication.

wal_level must be set to logical.

max_replication_slots must be set to at least the number of subscriptions expected to connect, plus some reserve for table synchronization.

Logical replication slots are also affected by idle_replication_slot_timeout.

max_wal_senders should be set to at least the same as max_replication_slots, plus the number of physical replicas that are connected at the same time.

Logical replication walsender is also affected by wal_sender_timeout.

max_active_replication_origins must be set to at least the number of subscriptions that will be added to the subscriber, plus some reserve for table synchronization.

max_logical_replication_workers must be set to at least the number of subscriptions (for leader apply workers), plus some reserve for the table synchronization workers and parallel apply workers.

max_worker_processes may need to be adjusted to accommodate for replication workers, at least (max_logical_replication_workers + 1). Note, some extensions and parallel queries also take worker slots from max_worker_processes.

max_sync_workers_per_subscription controls the amount of parallelism of the initial data copy during the subscription initialization or when new tables are added.

max_parallel_apply_workers_per_subscription controls the amount of parallelism for streaming of in-progress transactions with subscription parameter streaming = parallel.

Logical replication workers are also affected by wal_receiver_timeout, wal_receiver_status_interval and wal_retrieve_retry_interval.

**Examples:**

Example 1 (unknown):
```unknown
max_replication_slots
```

Example 2 (unknown):
```unknown
idle_replication_slot_timeout
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

## 26.3. Failover #


**URL:** https://www.postgresql.org/docs/18/warm-standby-failover.html

**Contents:**
- 26.3. Failover #

If the primary server fails then the standby server should begin failover procedures.

If the standby server fails then no failover need take place. If the standby server can be restarted, even some time later, then the recovery process can also be restarted immediately, taking advantage of restartable recovery. If the standby server cannot be restarted, then a full new standby server instance should be created.

If the primary server fails and the standby server becomes the new primary, and then the old primary restarts, you must have a mechanism for informing the old primary that it is no longer the primary. This is sometimes known as STONITH (Shoot The Other Node In The Head), which is necessary to avoid situations where both systems think they are the primary, which will lead to confusion and ultimately data loss.

Many failover systems use just two systems, the primary and the standby, connected by some kind of heartbeat mechanism to continually verify the connectivity between the two and the viability of the primary. It is also possible to use a third system (called a witness server) to prevent some cases of inappropriate failover, but the additional complexity might not be worthwhile unless it is set up with sufficient care and rigorous testing.

PostgreSQL does not provide the system software required to identify a failure on the primary and notify the standby database server. Many such tools exist and are well integrated with the operating system facilities required for successful failover, such as IP address migration.

Once failover to the standby occurs, there is only a single server in operation. This is known as a degenerate state. The former standby is now the primary, but the former primary is down and might stay down. To return to normal operation, a standby server must be recreated, either on the former primary system when it comes up, or on a third, possibly new, system. The pg_rewind utility can be used to speed up this process on large clusters. Once complete, the primary and standby can be considered to have switched roles. Some people choose to use a third server to provide backup for the new primary until the new standby server is recreated, though clearly this complicates the system configuration and operational processes.

So, switching from primary to standby server can be fast but requires some time to re-prepare the failover cluster. Regular switching from primary to standby is useful, since it allows regular downtime on each system for maintenance. This also serves as a test of the failover mechanism to ensure that it will really work when you need it. Written administration procedures are advised.

If you have opted for logical replication slot synchronization (see Section 47.2.3), then before switching to the standby server, it is recommended to check if the logical slots synchronized on the standby server are ready for failover. This can be done by following the steps described in Section 29.3.

To trigger failover of a log-shipping standby server, run pg_ctl promote or call pg_promote(). If you're setting up reporting servers that are only used to offload read-only queries from the primary, not for high availability purposes, you don't need to promote.

**Examples:**

Example 1 (unknown):
```unknown
pg_ctl promote
```

Example 2 (unknown):
```unknown
pg_promote()
```

---


---

## 29.6. Generated Column Replication #


**URL:** https://www.postgresql.org/docs/18/logical-replication-gencols.html

**Contents:**
- 29.6. Generated Column Replication #
  - Tip
  - Note
  - Warning
  - Note

Typically, a table at the subscriber will be defined the same as the publisher table, so if the publisher table has a GENERATED column then the subscriber table will have a matching generated column. In this case, it is always the subscriber table generated column value that is used.

For example, note below that subscriber table generated column value comes from the subscriber column's calculation.

In fact, prior to version 18.0, logical replication does not publish GENERATED columns at all.

But, replicating a generated column to a regular column can sometimes be desirable.

This feature may be useful when replicating data to a non-PostgreSQL database via output plugin, especially if the target database does not support generated columns.

Generated columns are not published by default, but users can opt to publish stored generated columns just like regular ones.

There are two ways to do this:

Set the PUBLICATION parameter publish_generated_columns to stored. This instructs PostgreSQL logical replication to publish current and future stored generated columns of the publication's tables.

Specify a table column list to explicitly nominate which stored generated columns will be published.

When determining which table columns will be published, a column list takes precedence, overriding the effect of the publish_generated_columns parameter.

The following table summarizes behavior when there are generated columns involved in the logical replication. Results are shown for when publishing generated columns is not enabled, and for when it is enabled.

Table 29.2. Replication Result Summary

There's currently no support for subscriptions comprising several publications where the same table has been published with different column lists. See Section 29.5.

This same situation can occur if one publication is publishing generated columns, while another publication in the same subscription is not publishing generated columns for the same table.

If the subscriber is from a release prior to 18, then initial table synchronization won't copy generated columns even if they are defined in the publisher.

**Examples:**

Example 1 (unknown):
```unknown
GENERATED column
```

Example 2 (sql):
```sql
/* pub # */ CREATE TABLE tab_gen_to_gen (a int, b int GENERATED ALWAYS AS (a + 1) STORED);
/* pub # */ INSERT INTO tab_gen_to_gen VALUES (1),(2),(3);
/* pub # */ CREATE PUBLICATION pub1 FOR TABLE tab_gen_to_gen;
/* pub # */ SELECT * FROM tab_gen_to_gen;
 a | b
---+---
 1 | 2
 2 | 3
 3 | 4
(3 rows)

/* sub # */ CREATE TABLE tab_gen_to_gen (a int, b int GENERATED ALWAYS AS (a * 100) STORED);
/* sub # */ CREATE SUBSCRIPTION sub1 CONNECTION 'dbname=test_pub' PUBLICATION pub1;
/* sub # */ SELECT * from tab_gen_to_gen;
 a | b
---+----
 1 | 100
 2 | 200
 3 | 300
(3 rows)
```

Example 3 (unknown):
```unknown
PUBLICATION
```

Example 4 (unknown):
```unknown
publish_generated_columns
```

---


---

## 29.9. Architecture #


**URL:** https://www.postgresql.org/docs/18/logical-replication-architecture.html

**Contents:**
- 29.9. Architecture #
  - 29.9.1. Initial Snapshot #
  - Note
  - Note

Logical replication is built with an architecture similar to physical streaming replication (see Section 26.2.5). It is implemented by walsender and apply processes. The walsender process starts logical decoding (described in Chapter 47) of the WAL and loads the standard logical decoding output plugin (pgoutput). The plugin transforms the changes read from WAL to the logical replication protocol (see Section 54.5) and filters the data according to the publication specification. The data is then continuously transferred using the streaming replication protocol to the apply worker, which maps the data to local tables and applies the individual changes as they are received, in correct transactional order.

The apply process on the subscriber database always runs with session_replication_role set to replica. This means that, by default, triggers and rules will not fire on a subscriber. Users can optionally choose to enable triggers and rules on a table using the ALTER TABLE command and the ENABLE TRIGGER and ENABLE RULE clauses.

The logical replication apply process currently only fires row triggers, not statement triggers. The initial table synchronization, however, is implemented like a COPY command and thus fires both row and statement triggers for INSERT.

The initial data in existing subscribed tables are snapshotted and copied in parallel instances of a special kind of apply process. These special apply processes are dedicated table synchronization workers, spawned for each table to be synchronized. Each table synchronization process will create its own replication slot and copy the existing data. As soon as the copy is finished the table contents will become visible to other backends. Once existing data is copied, the worker enters synchronization mode, which ensures that the table is brought up to a synchronized state with the main apply process by streaming any changes that happened during the initial data copy using standard logical replication. During this synchronization phase, the changes are applied and committed in the same order as they happened on the publisher. Once synchronization is done, control of the replication of the table is given back to the main apply process where replication continues as normal.

The publication publish parameter only affects what DML operations will be replicated. The initial data synchronization does not take this parameter into account when copying the existing table data.

If a table synchronization worker fails during copy, the apply worker detects the failure and respawns the table synchronization worker to continue the synchronization process. This behaviour ensures that transient errors do not permanently disrupt the replication setup. See also wal_retrieve_retry_interval.

**Examples:**

Example 1 (unknown):
```unknown
session_replication_role
```

Example 2 (unknown):
```unknown
ALTER TABLE
```

Example 3 (unknown):
```unknown
ENABLE TRIGGER
```

Example 4 (unknown):
```unknown
ENABLE RULE
```

---


---

## 29.10. Monitoring #


**URL:** https://www.postgresql.org/docs/18/logical-replication-monitoring.html

**Contents:**
- 29.10. Monitoring #

Because logical replication is based on a similar architecture as physical streaming replication, the monitoring on a publication node is similar to monitoring of a physical replication primary (see Section 26.2.5.2).

The monitoring information about subscription is visible in pg_stat_subscription. This view contains one row for every subscription worker. A subscription can have zero or more active subscription workers depending on its state.

Normally, there is a single apply process running for an enabled subscription. A disabled subscription or a crashed subscription will have zero rows in this view. If the initial data synchronization of any table is in progress, there will be additional workers for the tables being synchronized. Moreover, if the streaming transaction is applied in parallel, there may be additional parallel apply workers.

**Examples:**

Example 1 (unknown):
```unknown
pg_stat_subscription
```

---


---

