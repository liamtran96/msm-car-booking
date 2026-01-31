# PostgreSQL - Replication (Part 4)

## 26.2. Log-Shipping Standby Servers #


**URL:** https://www.postgresql.org/docs/18/warm-standby.html

**Contents:**
- 26.2. Log-Shipping Standby Servers #
  - 26.2.1. Planning #
  - 26.2.2. Standby Server Operation #
  - 26.2.3. Preparing the Primary for Standby Servers #
  - 26.2.4. Setting Up a Standby Server #
  - Note
  - 26.2.5. Streaming Replication #
    - 26.2.5.1. Authentication #
    - 26.2.5.2. Monitoring #
  - 26.2.6. Replication Slots #

Continuous archiving can be used to create a high availability (HA) cluster configuration with one or more standby servers ready to take over operations if the primary server fails. This capability is widely referred to as warm standby or log shipping.

The primary and standby server work together to provide this capability, though the servers are only loosely coupled. The primary server operates in continuous archiving mode, while each standby server operates in continuous recovery mode, reading the WAL files from the primary. No changes to the database tables are required to enable this capability, so it offers low administration overhead compared to some other replication solutions. This configuration also has relatively low performance impact on the primary server.

Directly moving WAL records from one database server to another is typically described as log shipping. PostgreSQL implements file-based log shipping by transferring WAL records one file (WAL segment) at a time. WAL files (16MB) can be shipped easily and cheaply over any distance, whether it be to an adjacent system, another system at the same site, or another system on the far side of the globe. The bandwidth required for this technique varies according to the transaction rate of the primary server. Record-based log shipping is more granular and streams WAL changes incrementally over a network connection (see Section 26.2.5).

It should be noted that log shipping is asynchronous, i.e., the WAL records are shipped after transaction commit. As a result, there is a window for data loss should the primary server suffer a catastrophic failure; transactions not yet shipped will be lost. The size of the data loss window in file-based log shipping can be limited by use of the archive_timeout parameter, which can be set as low as a few seconds. However such a low setting will substantially increase the bandwidth required for file shipping. Streaming replication (see Section 26.2.5) allows a much smaller window of data loss.

Recovery performance is sufficiently good that the standby will typically be only moments away from full availability once it has been activated. As a result, this is called a warm standby configuration which offers high availability. Restoring a server from an archived base backup and rollforward will take considerably longer, so that technique only offers a solution for disaster recovery, not high availability. A standby server can also be used for read-only queries, in which case it is called a hot standby server. See Section 26.4 for more information.

It is usually wise to create the primary and standby servers so that they are as similar as possible, at least from the perspective of the database server. In particular, the path names associated with tablespaces will be passed across unmodified, so both primary and standby servers must have the same mount paths for tablespaces if that feature is used. Keep in mind that if CREATE TABLESPACE is executed on the primary, any new mount point needed for it must be created on the primary and all standby servers before the command is executed. Hardware need not be exactly the same, but experience shows that maintaining two identical systems is easier than maintaining two dissimilar ones over the lifetime of the application and system. In any case the hardware architecture must be the same — shipping from, say, a 32-bit to a 64-bit system will not work.

In general, log shipping between servers running different major PostgreSQL release levels is not possible. It is the policy of the PostgreSQL Global Development Group not to make changes to disk formats during minor release upgrades, so it is likely that running different minor release levels on primary and standby servers will work successfully. However, no formal support for that is offered and you are advised to keep primary and standby servers at the same release level as much as possible. When updating to a new minor release, the safest policy is to update the standby servers first — a new minor release is more likely to be able to read WAL files from a previous minor release than vice versa.

A server enters standby mode if a standby.signal file exists in the data directory when the server is started.

In standby mode, the server continuously applies WAL received from the primary server. The standby server can read WAL from a WAL archive (see restore_command) or directly from the primary over a TCP connection (streaming replication). The standby server will also attempt to restore any WAL found in the standby cluster's pg_wal directory. That typically happens after a server restart, when the standby replays again WAL that was streamed from the primary before the restart, but you can also manually copy files to pg_wal at any time to have them replayed.

At startup, the standby begins by restoring all WAL available in the archive location, calling restore_command. Once it reaches the end of WAL available there and restore_command fails, it tries to restore any WAL available in the pg_wal directory. If that fails, and streaming replication has been configured, the standby tries to connect to the primary server and start streaming WAL from the last valid record found in archive or pg_wal. If that fails or streaming replication is not configured, or if the connection is later disconnected, the standby goes back to step 1 and tries to restore the file from the archive again. This loop of retries from the archive, pg_wal, and via streaming replication goes on until the server is stopped or is promoted.

Standby mode is exited and the server switches to normal operation when pg_ctl promote is run, or pg_promote() is called. Before failover, any WAL immediately available in the archive or in pg_wal will be restored, but no attempt is made to connect to the primary.

Set up continuous archiving on the primary to an archive directory accessible from the standby, as described in Section 25.3. The archive location should be accessible from the standby even when the primary is down, i.e., it should reside on the standby server itself or another trusted server, not on the primary server.

If you want to use streaming replication, set up authentication on the primary server to allow replication connections from the standby server(s); that is, create a role and provide a suitable entry or entries in pg_hba.conf with the database field set to replication. Also ensure max_wal_senders is set to a sufficiently large value in the configuration file of the primary server. If replication slots will be used, ensure that max_replication_slots is set sufficiently high as well.

Take a base backup as described in Section 25.3.2 to bootstrap the standby server.

To set up the standby server, restore the base backup taken from primary server (see Section 25.3.5). Create a file standby.signal in the standby's cluster data directory. Set restore_command to a simple command to copy files from the WAL archive. If you plan to have multiple standby servers for high availability purposes, make sure that recovery_target_timeline is set to latest (the default), to make the standby server follow the timeline change that occurs at failover to another standby.

restore_command should return immediately if the file does not exist; the server will retry the command again if necessary.

If you want to use streaming replication, fill in primary_conninfo with a libpq connection string, including the host name (or IP address) and any additional details needed to connect to the primary server. If the primary needs a password for authentication, the password needs to be specified in primary_conninfo as well.

If you're setting up the standby server for high availability purposes, set up WAL archiving, connections and authentication like the primary server, because the standby server will work as a primary server after failover.

If you're using a WAL archive, its size can be minimized using the archive_cleanup_command parameter to remove files that are no longer required by the standby server. The pg_archivecleanup utility is designed specifically to be used with archive_cleanup_command in typical single-standby configurations, see pg_archivecleanup. Note however, that if you're using the archive for backup purposes, you need to retain files needed to recover from at least the latest base backup, even if they're no longer needed by the standby.

A simple example of configuration is:

You can have any number of standby servers, but if you use streaming replication, make sure you set max_wal_senders high enough in the primary to allow them to be connected simultaneously.

Streaming replication allows a standby server to stay more up-to-date than is possible with file-based log shipping. The standby connects to the primary, which streams WAL records to the standby as they're generated, without waiting for the WAL file to be filled.

Streaming replication is asynchronous by default (see Section 26.2.8), in which case there is a small delay between committing a transaction in the primary and the changes becoming visible in the standby. This delay is however much smaller than with file-based log shipping, typically under one second assuming the standby is powerful enough to keep up with the load. With streaming replication, archive_timeout is not required to reduce the data loss window.

If you use streaming replication without file-based continuous archiving, the server might recycle old WAL segments before the standby has received them. If this occurs, the standby will need to be reinitialized from a new base backup. You can avoid this by setting wal_keep_size to a value large enough to ensure that WAL segments are not recycled too early, or by configuring a replication slot for the standby. If you set up a WAL archive that's accessible from the standby, these solutions are not required, since the standby can always use the archive to catch up provided it retains enough segments.

To use streaming replication, set up a file-based log-shipping standby server as described in Section 26.2. The step that turns a file-based log-shipping standby into streaming replication standby is setting the primary_conninfo setting to point to the primary server. Set listen_addresses and authentication options (see pg_hba.conf) on the primary so that the standby server can connect to the replication pseudo-database on the primary server (see Section 26.2.5.1).

On systems that support the keepalive socket option, setting tcp_keepalives_idle, tcp_keepalives_interval and tcp_keepalives_count helps the primary promptly notice a broken connection.

Set the maximum number of concurrent connections from the standby servers (see max_wal_senders for details).

When the standby is started and primary_conninfo is set correctly, the standby will connect to the primary after replaying all WAL files available in the archive. If the connection is established successfully, you will see a walreceiver in the standby, and a corresponding walsender process in the primary.

It is very important that the access privileges for replication be set up so that only trusted users can read the WAL stream, because it is easy to extract privileged information from it. Standby servers must authenticate to the primary as an account that has the REPLICATION privilege or a superuser. It is recommended to create a dedicated user account with REPLICATION and LOGIN privileges for replication. While REPLICATION privilege gives very high permissions, it does not allow the user to modify any data on the primary system, which the SUPERUSER privilege does.

Client authentication for replication is controlled by a pg_hba.conf record specifying replication in the database field. For example, if the standby is running on host IP 192.168.1.100 and the account name for replication is foo, the administrator can add the following line to the pg_hba.conf file on the primary:

The host name and port number of the primary, connection user name, and password are specified in the primary_conninfo. The password can also be set in the ~/.pgpass file on the standby (specify replication in the database field). For example, if the primary is running on host IP 192.168.1.50, port 5432, the account name for replication is foo, and the password is foopass, the administrator can add the following line to the postgresql.conf file on the standby:

An important health indicator of streaming replication is the amount of WAL records generated in the primary, but not yet applied in the standby. You can calculate this lag by comparing the current WAL write location on the primary with the last WAL location received by the standby. These locations can be retrieved using pg_current_wal_lsn on the primary and pg_last_wal_receive_lsn on the standby, respectively (see Table 9.97 and Table 9.98 for details). The last WAL receive location in the standby is also displayed in the process status of the WAL receiver process, displayed using the ps command (see Section 27.1 for details).

You can retrieve a list of WAL sender processes via the pg_stat_replication view. Large differences between pg_current_wal_lsn and the view's sent_lsn field might indicate that the primary server is under heavy load, while differences between sent_lsn and pg_last_wal_receive_lsn on the standby might indicate network delay, or that the standby is under heavy load.

On a hot standby, the status of the WAL receiver process can be retrieved via the pg_stat_wal_receiver view. A large difference between pg_last_wal_replay_lsn and the view's flushed_lsn indicates that WAL is being received faster than it can be replayed.

Replication slots provide an automated way to ensure that the primary server does not remove WAL segments until they have been received by all standbys, and that the primary does not remove rows which could cause a recovery conflict even when the standby is disconnected.

In lieu of using replication slots, it is possible to prevent the removal of old WAL segments using wal_keep_size, or by storing the segments in an archive using archive_command or archive_library. A disadvantage of these methods is that they often result in retaining more WAL segments than required, whereas replication slots retain only the number of segments known to be needed.

Similarly, hot_standby_feedback on its own, without also using a replication slot, provides protection against relevant rows being removed by vacuum, but provides no protection during any time period when the standby is not connected.

Beware that replication slots can cause the server to retain so many WAL segments that they fill up the space allocated for pg_wal. max_slot_wal_keep_size can be used to limit the size of WAL files retained by replication slots.

Each replication slot has a name, which can contain lower-case letters, numbers, and the underscore character.

Existing replication slots and their state can be seen in the pg_replication_slots view.

Slots can be created and dropped either via the streaming replication protocol (see Section 54.4) or via SQL functions (see Section 9.28.6).

You can create a replication slot like this:

To configure the standby to use this slot, primary_slot_name should be configured on the standby. Here is a simple example:

The cascading replication feature allows a standby server to accept replication connections and stream WAL records to other standbys, acting as a relay. This can be used to reduce the number of direct connections to the primary and also to minimize inter-site bandwidth overheads.

A standby acting as both a receiver and a sender is known as a cascading standby. Standbys that are more directly connected to the primary are known as upstream servers, while those standby servers further away are downstream servers. Cascading replication does not place limits on the number or arrangement of downstream servers, though each standby connects to only one upstream server which eventually links to a single primary server.

A cascading standby sends not only WAL records received from the primary but also those restored from the archive. So even if the replication connection in some upstream connection is terminated, streaming replication continues downstream for as long as new WAL records are available.

Cascading replication is currently asynchronous. Synchronous replication (see Section 26.2.8) settings have no effect on cascading replication at present.

Hot standby feedback propagates upstream, whatever the cascaded arrangement.

If an upstream standby server is promoted to become the new primary, downstream servers will continue to stream from the new primary if recovery_target_timeline is set to 'latest' (the default).

To use cascading replication, set up the cascading standby so that it can accept replication connections (that is, set max_wal_senders and hot_standby, and configure host-based authentication). You will also need to set primary_conninfo in the downstream standby to point to the cascading standby.

PostgreSQL streaming replication is asynchronous by default. If the primary server crashes then some transactions that were committed may not have been replicated to the standby server, causing data loss. The amount of data loss is proportional to the replication delay at the time of failover.

Synchronous replication offers the ability to confirm that all changes made by a transaction have been transferred to one or more synchronous standby servers. This extends that standard level of durability offered by a transaction commit. This level of protection is referred to as 2-safe replication in computer science theory, and group-1-safe (group-safe and 1-safe) when synchronous_commit is set to remote_write.

When requesting synchronous replication, each commit of a write transaction will wait until confirmation is received that the commit has been written to the write-ahead log on disk of both the primary and standby server. The only possibility that data can be lost is if both the primary and the standby suffer crashes at the same time. This can provide a much higher level of durability, though only if the sysadmin is cautious about the placement and management of the two servers. Waiting for confirmation increases the user's confidence that the changes will not be lost in the event of server crashes but it also necessarily increases the response time for the requesting transaction. The minimum wait time is the round-trip time between primary and standby.

Read-only transactions and transaction rollbacks need not wait for replies from standby servers. Subtransaction commits do not wait for responses from standby servers, only top-level commits. Long running actions such as data loading or index building do not wait until the very final commit message. All two-phase commit actions require commit waits, including both prepare and commit.

A synchronous standby can be a physical replication standby or a logical replication subscriber. It can also be any other physical or logical WAL replication stream consumer that knows how to send the appropriate feedback messages. Besides the built-in physical and logical replication systems, this includes special programs such as pg_receivewal and pg_recvlogical as well as some third-party replication systems and custom programs. Check the respective documentation for details on synchronous replication support.

Once streaming replication has been configured, configuring synchronous replication requires only one additional configuration step: synchronous_standby_names must be set to a non-empty value. synchronous_commit must also be set to on, but since this is the default value, typically no change is required. (See Section 19.5.1 and Section 19.6.2.) This configuration will cause each commit to wait for confirmation that the standby has written the commit record to durable storage. synchronous_commit can be set by individual users, so it can be configured in the configuration file, for particular users or databases, or dynamically by applications, in order to control the durability guarantee on a per-transaction basis.

After a commit record has been written to disk on the primary, the WAL record is then sent to the standby. The standby sends reply messages each time a new batch of WAL data is written to disk, unless wal_receiver_status_interval is set to zero on the standby. In the case that synchronous_commit is set to remote_apply, the standby sends reply messages when the commit record is replayed, making the transaction visible. If the standby is chosen as a synchronous standby, according to the setting of synchronous_standby_names on the primary, the reply messages from that standby will be considered along with those from other synchronous standbys to decide when to release transactions waiting for confirmation that the commit record has been received. These parameters allow the administrator to specify which standby servers should be synchronous standbys. Note that the configuration of synchronous replication is mainly on the primary. Named standbys must be directly connected to the primary; the primary knows nothing about downstream standby servers using cascaded replication.

Setting synchronous_commit to remote_write will cause each commit to wait for confirmation that the standby has received the commit record and written it out to its own operating system, but not for the data to be flushed to disk on the standby. This setting provides a weaker guarantee of durability than on does: the standby could lose the data in the event of an operating system crash, though not a PostgreSQL crash. However, it's a useful setting in practice because it can decrease the response time for the transaction. Data loss could only occur if both the primary and the standby crash and the database of the primary gets corrupted at the same time.

Setting synchronous_commit to remote_apply will cause each commit to wait until the current synchronous standbys report that they have replayed the transaction, making it visible to user queries. In simple cases, this allows for load balancing with causal consistency.

Users will stop waiting if a fast shutdown is requested. However, as when using asynchronous replication, the server will not fully shutdown until all outstanding WAL records are transferred to the currently connected standby servers.

Synchronous replication supports one or more synchronous standby servers; transactions will wait until all the standby servers which are considered as synchronous confirm receipt of their data. The number of synchronous standbys that transactions must wait for replies from is specified in synchronous_standby_names. This parameter also specifies a list of standby names and the method (FIRST and ANY) to choose synchronous standbys from the listed ones.

The method FIRST specifies a priority-based synchronous replication and makes transaction commits wait until their WAL records are replicated to the requested number of synchronous standbys chosen based on their priorities. The standbys whose names appear earlier in the list are given higher priority and will be considered as synchronous. Other standby servers appearing later in this list represent potential synchronous standbys. If any of the current synchronous standbys disconnects for whatever reason, it will be replaced immediately with the next-highest-priority standby.

An example of synchronous_standby_names for a priority-based multiple synchronous standbys is:

In this example, if four standby servers s1, s2, s3 and s4 are running, the two standbys s1 and s2 will be chosen as synchronous standbys because their names appear early in the list of standby names. s3 is a potential synchronous standby and will take over the role of synchronous standby when either of s1 or s2 fails. s4 is an asynchronous standby since its name is not in the list.

The method ANY specifies a quorum-based synchronous replication and makes transaction commits wait until their WAL records are replicated to at least the requested number of synchronous standbys in the list.

An example of synchronous_standby_names for a quorum-based multiple synchronous standbys is:

In this example, if four standby servers s1, s2, s3 and s4 are running, transaction commits will wait for replies from at least any two standbys of s1, s2 and s3. s4 is an asynchronous standby since its name is not in the list.

The synchronous states of standby servers can be viewed using the pg_stat_replication view.

Synchronous replication usually requires carefully planned and placed standby servers to ensure applications perform acceptably. Waiting doesn't utilize system resources, but transaction locks continue to be held until the transfer is confirmed. As a result, incautious use of synchronous replication will reduce performance for database applications because of increased response times and higher contention.

PostgreSQL allows the application developer to specify the durability level required via replication. This can be specified for the system overall, though it can also be specified for specific users or connections, or even individual transactions.

For example, an application workload might consist of: 10% of changes are important customer details, while 90% of changes are less important data that the business can more easily survive if it is lost, such as chat messages between users.

With synchronous replication options specified at the application level (on the primary) we can offer synchronous replication for the most important changes, without slowing down the bulk of the total workload. Application level options are an important and practical tool for allowing the benefits of synchronous replication for high performance applications.

You should consider that the network bandwidth must be higher than the rate of generation of WAL data.

synchronous_standby_names specifies the number and names of synchronous standbys that transaction commits made when synchronous_commit is set to on, remote_apply or remote_write will wait for responses from. Such transaction commits may never be completed if any one of the synchronous standbys should crash.

The best solution for high availability is to ensure you keep as many synchronous standbys as requested. This can be achieved by naming multiple potential synchronous standbys using synchronous_standby_names.

In a priority-based synchronous replication, the standbys whose names appear earlier in the list will be used as synchronous standbys. Standbys listed after these will take over the role of synchronous standby if one of current ones should fail.

In a quorum-based synchronous replication, all the standbys appearing in the list will be used as candidates for synchronous standbys. Even if one of them should fail, the other standbys will keep performing the role of candidates of synchronous standby.

When a standby first attaches to the primary, it will not yet be properly synchronized. This is described as catchup mode. Once the lag between standby and primary reaches zero for the first time we move to real-time streaming state. The catch-up duration may be long immediately after the standby has been created. If the standby is shut down, then the catch-up period will increase according to the length of time the standby has been down. The standby is only able to become a synchronous standby once it has reached streaming state. This state can be viewed using the pg_stat_replication view.

If primary restarts while commits are waiting for acknowledgment, those waiting transactions will be marked fully committed once the primary database recovers. There is no way to be certain that all standbys have received all outstanding WAL data at time of the crash of the primary. Some transactions may not show as committed on the standby, even though they show as committed on the primary. The guarantee we offer is that the application will not receive explicit acknowledgment of the successful commit of a transaction until the WAL data is known to be safely received by all the synchronous standbys.

If you really cannot keep as many synchronous standbys as requested then you should decrease the number of synchronous standbys that transaction commits must wait for responses from in synchronous_standby_names (or disable it) and reload the configuration file on the primary server.

If the primary is isolated from remaining standby servers you should fail over to the best candidate of those other remaining standby servers.

If you need to re-create a standby server while transactions are waiting, make sure that the functions pg_backup_start() and pg_backup_stop() are run in a session with synchronous_commit = off, otherwise those requests will wait forever for the standby to appear.

When continuous WAL archiving is used in a standby, there are two different scenarios: the WAL archive can be shared between the primary and the standby, or the standby can have its own WAL archive. When the standby has its own WAL archive, set archive_mode to always, and the standby will call the archive command for every WAL segment it receives, whether it's by restoring from the archive or by streaming replication. The shared archive can be handled similarly, but the archive_command or archive_library must test if the file being archived exists already, and if the existing file has identical contents. This requires more care in the archive_command or archive_library, as it must be careful to not overwrite an existing file with different contents, but return success if the exactly same file is archived twice. And all that must be done free of race conditions, if two servers attempt to archive the same file at the same time.

If archive_mode is set to on, the archiver is not enabled during recovery or standby mode. If the standby server is promoted, it will start archiving after the promotion, but will not archive any WAL or timeline history files that it did not generate itself. To get a complete series of WAL files in the archive, you must ensure that all WAL is archived, before it reaches the standby. This is inherently true with file-based log shipping, as the standby can only restore files that are found in the archive, but not if streaming replication is enabled. When a server is not in recovery mode, there is no difference between on and always modes.

**Examples:**

Example 1 (unknown):
```unknown
archive_timeout
```

Example 2 (unknown):
```unknown
standby.signal
```

Example 3 (unknown):
```unknown
restore_command
```

Example 4 (unknown):
```unknown
restore_command
```

---


---

## 29.8. Restrictions #


**URL:** https://www.postgresql.org/docs/18/logical-replication-restrictions.html

**Contents:**
- 29.8. Restrictions #

Logical replication currently has the following restrictions or missing functionality. These might be addressed in future releases.

The database schema and DDL commands are not replicated. The initial schema can be copied by hand using pg_dump --schema-only. Subsequent schema changes would need to be kept in sync manually. (Note, however, that there is no need for the schemas to be absolutely the same on both sides.) Logical replication is robust when schema definitions change in a live database: When the schema is changed on the publisher and replicated data starts arriving at the subscriber but does not fit into the table schema, replication will error until the schema is updated. In many cases, intermittent errors can be avoided by applying additive schema changes to the subscriber first.

Sequence data is not replicated. The data in serial or identity columns backed by sequences will of course be replicated as part of the table, but the sequence itself would still show the start value on the subscriber. If the subscriber is used as a read-only database, then this should typically not be a problem. If, however, some kind of switchover or failover to the subscriber database is intended, then the sequences would need to be updated to the latest values, either by copying the current data from the publisher (perhaps using pg_dump) or by determining a sufficiently high value from the tables themselves.

Replication of TRUNCATE commands is supported, but some care must be taken when truncating groups of tables connected by foreign keys. When replicating a truncate action, the subscriber will truncate the same group of tables that was truncated on the publisher, either explicitly specified or implicitly collected via CASCADE, minus tables that are not part of the subscription. This will work correctly if all affected tables are part of the same subscription. But if some tables to be truncated on the subscriber have foreign-key links to tables that are not part of the same (or any) subscription, then the application of the truncate action on the subscriber will fail.

Large objects (see Chapter 33) are not replicated. There is no workaround for that, other than storing data in normal tables.

Replication is only supported by tables, including partitioned tables. Attempts to replicate other types of relations, such as views, materialized views, or foreign tables, will result in an error.

When replicating between partitioned tables, the actual replication originates, by default, from the leaf partitions on the publisher, so partitions on the publisher must also exist on the subscriber as valid target tables. (They could either be leaf partitions themselves, or they could be further subpartitioned, or they could even be independent tables.) Publications can also specify that changes are to be replicated using the identity and schema of the partitioned root table instead of that of the individual leaf partitions in which the changes actually originate (see publish_via_partition_root parameter of CREATE PUBLICATION).

When using REPLICA IDENTITY FULL on published tables, it is important to note that the UPDATE and DELETE operations cannot be applied to subscribers if the tables include attributes with datatypes (such as point or box) that do not have a default operator class for B-tree or Hash. However, this limitation can be overcome by ensuring that the table has a primary key or replica identity defined for it.

**Examples:**

Example 1 (unknown):
```unknown
pg_dump --schema-only
```

Example 2 (unknown):
```unknown
publish_via_partition_root
```

Example 3 (unknown):
```unknown
CREATE PUBLICATION
```

Example 4 (unknown):
```unknown
REPLICA IDENTITY FULL
```

---


---

## Chapter 29. Logical Replication


**URL:** https://www.postgresql.org/docs/18/logical-replication.html

**Contents:**
- Chapter 29. Logical Replication

Logical replication is a method of replicating data objects and their changes, based upon their replication identity (usually a primary key). We use the term logical in contrast to physical replication, which uses exact block addresses and byte-by-byte replication. PostgreSQL supports both mechanisms concurrently, see Chapter 26. Logical replication allows fine-grained control over both data replication and security.

Logical replication uses a publish and subscribe model with one or more subscribers subscribing to one or more publications on a publisher node. Subscribers pull data from the publications they subscribe to and may subsequently re-publish data to allow cascading replication or more complex configurations.

When logical replication of a table typically starts, PostgreSQL takes a snapshot of the table's data on the publisher database and copies it to the subscriber. Once complete, changes on the publisher since the initial copy are sent continually to the subscriber. The subscriber applies the data in the same order as the publisher so that transactional consistency is guaranteed for publications within a single subscription. This method of data replication is sometimes referred to as transactional replication.

The typical use-cases for logical replication are:

Sending incremental changes in a single database or a subset of a database to subscribers as they occur.

Firing triggers for individual changes as they arrive on the subscriber.

Consolidating multiple databases into a single one (for example for analytical purposes).

Replicating between different major versions of PostgreSQL.

Replicating between PostgreSQL instances on different platforms (for example Linux to Windows)

Giving access to replicated data to different groups of users.

Sharing a subset of the database between multiple databases.

The subscriber database behaves in the same way as any other PostgreSQL instance and can be used as a publisher for other databases by defining its own publications. When the subscriber is treated as read-only by application, there will be no conflicts from a single subscription. On the other hand, if there are other writes done either by an application or by other subscribers to the same set of tables, conflicts can arise.

---


---

## 29.5. Column Lists #


**URL:** https://www.postgresql.org/docs/18/logical-replication-col-lists.html

**Contents:**
- 29.5. Column Lists #
  - Warning: Combining Column Lists from Multiple Publications
  - 29.5.1. Examples #

Each publication can optionally specify which columns of each table are replicated to subscribers. The table on the subscriber side must have at least all the columns that are published. If no column list is specified, then all columns on the publisher are replicated. See CREATE PUBLICATION for details on the syntax.

The choice of columns can be based on behavioral or performance reasons. However, do not rely on this feature for security: a malicious subscriber is able to obtain data from columns that are not specifically published. If security is a consideration, protections can be applied at the publisher side.

If no column list is specified, any columns added to the table later are automatically replicated. This means that having a column list which names all columns is not the same as having no column list at all.

A column list can contain only simple column references. The order of columns in the list is not preserved.

Generated columns can also be specified in a column list. This allows generated columns to be published, regardless of the publication parameter publish_generated_columns. See Section 29.6 for details.

Specifying a column list when the publication also publishes FOR TABLES IN SCHEMA is not supported.

For partitioned tables, the publication parameter publish_via_partition_root determines which column list is used. If publish_via_partition_root is true, the root partitioned table's column list is used. Otherwise, if publish_via_partition_root is false (the default), each partition's column list is used.

If a publication publishes UPDATE or DELETE operations, any column list must include the table's replica identity columns (see REPLICA IDENTITY). If a publication publishes only INSERT operations, then the column list may omit replica identity columns.

Column lists have no effect for the TRUNCATE command.

During initial data synchronization, only the published columns are copied. However, if the subscriber is from a release prior to 15, then all the columns in the table are copied during initial data synchronization, ignoring any column lists. If the subscriber is from a release prior to 18, then initial table synchronization won't copy generated columns even if they are defined in the publisher.

There's currently no support for subscriptions comprising several publications where the same table has been published with different column lists. CREATE SUBSCRIPTION disallows creating such subscriptions, but it is still possible to get into that situation by adding or altering column lists on the publication side after a subscription has been created.

This means changing the column lists of tables on publications that are already subscribed could lead to errors being thrown on the subscriber side.

If a subscription is affected by this problem, the only way to resume replication is to adjust one of the column lists on the publication side so that they all match; and then either recreate the subscription, or use ALTER SUBSCRIPTION ... DROP PUBLICATION to remove one of the offending publications and add it again.

Create a table t1 to be used in the following example.

Create a publication p1. A column list is defined for table t1 to reduce the number of columns that will be replicated. Notice that the order of column names in the column list does not matter.

psql can be used to show the column lists (if defined) for each publication.

psql can be used to show the column lists (if defined) for each table.

On the subscriber node, create a table t1 which now only needs a subset of the columns that were on the publisher table t1, and also create the subscription s1 that subscribes to the publication p1.

On the publisher node, insert some rows to table t1.

Only data from the column list of publication p1 is replicated.

**Examples:**

Example 1 (unknown):
```unknown
publish_generated_columns
```

Example 2 (bash):
```bash
FOR TABLES IN SCHEMA
```

Example 3 (unknown):
```unknown
publish_via_partition_root
```

Example 4 (unknown):
```unknown
publish_via_partition_root
```

---


---

