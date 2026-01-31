# PostgreSQL - Replication (Part 2)

## 29.11. Security #


**URL:** https://www.postgresql.org/docs/18/logical-replication-security.html

**Contents:**
- 29.11. Security #

The role used for the replication connection must have the REPLICATION attribute (or be a superuser). If the role lacks SUPERUSER and BYPASSRLS, publisher row security policies can execute. If the role does not trust all table owners, include options=-crow_security=off in the connection string; if a table owner then adds a row security policy, that setting will cause replication to halt rather than execute the policy. Access for the role must be configured in pg_hba.conf and it must have the LOGIN attribute.

In order to be able to copy the initial table data, the role used for the replication connection must have the SELECT privilege on a published table (or be a superuser).

To create a publication, the user must have the CREATE privilege in the database.

To add tables to a publication, the user must have ownership rights on the table. To add all tables in schema to a publication, the user must be a superuser. To create a publication that publishes all tables or all tables in schema automatically, the user must be a superuser.

There are currently no privileges on publications. Any subscription (that is able to connect) can access any publication. Thus, if you intend to hide some information from particular subscribers, such as by using row filters or column lists, or by not adding the whole table to the publication, be aware that other publications in the same database could expose the same information. Publication privileges might be added to PostgreSQL in the future to allow for finer-grained access control.

To create a subscription, the user must have the privileges of the pg_create_subscription role, as well as CREATE privileges on the database.

The subscription apply process will, at a session level, run with the privileges of the subscription owner. However, when performing an insert, update, delete, or truncate operation on a particular table, it will switch roles to the table owner and perform the operation with the table owner's privileges. This means that the subscription owner needs to be able to SET ROLE to each role that owns a replicated table.

If the subscription has been configured with run_as_owner = true, then no user switching will occur. Instead, all operations will be performed with the permissions of the subscription owner. In this case, the subscription owner only needs privileges to SELECT, INSERT, UPDATE, and DELETE from the target table, and does not need privileges to SET ROLE to the table owner. However, this also means that any user who owns a table into which replication is happening can execute arbitrary code with the privileges of the subscription owner. For example, they could do this by simply attaching a trigger to one of the tables which they own. Because it is usually undesirable to allow one role to freely assume the privileges of another, this option should be avoided unless user security within the database is of no concern.

On the publisher, privileges are only checked once at the start of a replication connection and are not re-checked as each change record is read.

On the subscriber, the subscription owner's privileges are re-checked for each transaction when applied. If a worker is in the process of applying a transaction when the ownership of the subscription is changed by a concurrent transaction, the application of the current transaction will continue under the old owner's privileges.

**Examples:**

Example 1 (unknown):
```unknown
REPLICATION
```

Example 2 (unknown):
```unknown
options=-crow_security=off
```

Example 3 (unknown):
```unknown
pg_hba.conf
```

Example 4 (unknown):
```unknown
pg_create_subscription
```

---


---

## 26.1. Comparison of Different Solutions #


**URL:** https://www.postgresql.org/docs/18/different-replication-solutions.html

**Contents:**
- 26.1. Comparison of Different Solutions #

Shared disk failover avoids synchronization overhead by having only one copy of the database. It uses a single disk array that is shared by multiple servers. If the main database server fails, the standby server is able to mount and start the database as though it were recovering from a database crash. This allows rapid failover with no data loss.

Shared hardware functionality is common in network storage devices. Using a network file system is also possible, though care must be taken that the file system has full POSIX behavior (see Section 18.2.2.1). One significant limitation of this method is that if the shared disk array fails or becomes corrupt, the primary and standby servers are both nonfunctional. Another issue is that the standby server should never access the shared storage while the primary server is running.

A modified version of shared hardware functionality is file system replication, where all changes to a file system are mirrored to a file system residing on another computer. The only restriction is that the mirroring must be done in a way that ensures the standby server has a consistent copy of the file system — specifically, writes to the standby must be done in the same order as those on the primary. DRBD is a popular file system replication solution for Linux.

Warm and hot standby servers can be kept current by reading a stream of write-ahead log (WAL) records. If the main server fails, the standby contains almost all of the data of the main server, and can be quickly made the new primary database server. This can be synchronous or asynchronous and can only be done for the entire database server.

A standby server can be implemented using file-based log shipping (Section 26.2) or streaming replication (see Section 26.2.5), or a combination of both. For information on hot standby, see Section 26.4.

Logical replication allows a database server to send a stream of data modifications to another server. PostgreSQL logical replication constructs a stream of logical data modifications from the WAL. Logical replication allows replication of data changes on a per-table basis. In addition, a server that is publishing its own changes can also subscribe to changes from another server, allowing data to flow in multiple directions. For more information on logical replication, see Chapter 29. Through the logical decoding interface (Chapter 47), third-party extensions can also provide similar functionality.

A trigger-based replication setup typically funnels data modification queries to a designated primary server. Operating on a per-table basis, the primary server sends data changes (typically) asynchronously to the standby servers. Standby servers can answer queries while the primary is running, and may allow some local data changes or write activity. This form of replication is often used for offloading large analytical or data warehouse queries.

Slony-I is an example of this type of replication, with per-table granularity, and support for multiple standby servers. Because it updates the standby server asynchronously (in batches), there is possible data loss during fail over.

With SQL-based replication middleware, a program intercepts every SQL query and sends it to one or all servers. Each server operates independently. Read-write queries must be sent to all servers, so that every server receives any changes. But read-only queries can be sent to just one server, allowing the read workload to be distributed among them.

If queries are simply broadcast unmodified, functions like random(), CURRENT_TIMESTAMP, and sequences can have different values on different servers. This is because each server operates independently, and because SQL queries are broadcast rather than actual data changes. If this is unacceptable, either the middleware or the application must determine such values from a single source and then use those values in write queries. Care must also be taken that all transactions either commit or abort on all servers, perhaps using two-phase commit (PREPARE TRANSACTION and COMMIT PREPARED). Pgpool-II and Continuent Tungsten are examples of this type of replication.

For servers that are not regularly connected or have slow communication links, like laptops or remote servers, keeping data consistent among servers is a challenge. Using asynchronous multimaster replication, each server works independently, and periodically communicates with the other servers to identify conflicting transactions. The conflicts can be resolved by users or conflict resolution rules. Bucardo is an example of this type of replication.

In synchronous multimaster replication, each server can accept write requests, and modified data is transmitted from the original server to every other server before each transaction commits. Heavy write activity can cause excessive locking and commit delays, leading to poor performance. Read requests can be sent to any server. Some implementations use shared disk to reduce the communication overhead. Synchronous multimaster replication is best for mostly read workloads, though its big advantage is that any server can accept write requests — there is no need to partition workloads between primary and standby servers, and because the data changes are sent from one server to another, there is no problem with non-deterministic functions like random().

PostgreSQL does not offer this type of replication, though PostgreSQL two-phase commit (PREPARE TRANSACTION and COMMIT PREPARED) can be used to implement this in application code or middleware.

Table 26.1 summarizes the capabilities of the various solutions listed above.

Table 26.1. High Availability, Load Balancing, and Replication Feature Matrix

There are a few solutions that do not fit into the above categories:

Data partitioning splits tables into data sets. Each set can be modified by only one server. For example, data can be partitioned by offices, e.g., London and Paris, with a server in each office. If queries combining London and Paris data are necessary, an application can query both servers, or primary/standby replication can be used to keep a read-only copy of the other office's data on each server.

Many of the above solutions allow multiple servers to handle multiple queries, but none allow a single query to use multiple servers to complete faster. This solution allows multiple servers to work concurrently on a single query. It is usually accomplished by splitting the data among servers and having each server execute its part of the query and return results to a central server where they are combined and returned to the user. This can be implemented using the PL/Proxy tool set.

It should also be noted that because PostgreSQL is open source and easily extended, a number of companies have taken PostgreSQL and created commercial closed-source solutions with unique failover, replication, and load balancing capabilities. These are not discussed here.

**Examples:**

Example 1 (unknown):
```unknown
CURRENT_TIMESTAMP
```

---


---

## Chapter 26. High Availability, Load Balancing, and Replication


**URL:** https://www.postgresql.org/docs/18/high-availability.html

**Contents:**
- Chapter 26. High Availability, Load Balancing, and Replication

Database servers can work together to allow a second server to take over quickly if the primary server fails (high availability), or to allow several computers to serve the same data (load balancing). Ideally, database servers could work together seamlessly. Web servers serving static web pages can be combined quite easily by merely load-balancing web requests to multiple machines. In fact, read-only database servers can be combined relatively easily too. Unfortunately, most database servers have a read/write mix of requests, and read/write servers are much harder to combine. This is because though read-only data needs to be placed on each server only once, a write to any server has to be propagated to all servers so that future read requests to those servers return consistent results.

This synchronization problem is the fundamental difficulty for servers working together. Because there is no single solution that eliminates the impact of the sync problem for all use cases, there are multiple solutions. Each solution addresses this problem in a different way, and minimizes its impact for a specific workload.

Some solutions deal with synchronization by allowing only one server to modify the data. Servers that can modify data are called read/write, master or primary servers. Servers that track changes in the primary are called standby or secondary servers. A standby server that cannot be connected to until it is promoted to a primary server is called a warm standby server, and one that can accept connections and serves read-only queries is called a hot standby server.

Some solutions are synchronous, meaning that a data-modifying transaction is not considered committed until all servers have committed the transaction. This guarantees that a failover will not lose any data and that all load-balanced servers will return consistent results no matter which server is queried. In contrast, asynchronous solutions allow some delay between the time of a commit and its propagation to the other servers, opening the possibility that some transactions might be lost in the switch to a backup server, and that load balanced servers might return slightly stale results. Asynchronous communication is used when synchronous would be too slow.

Solutions can also be categorized by their granularity. Some solutions can deal only with an entire database server, while others allow control at the per-table or per-database level.

Performance must be considered in any choice. There is usually a trade-off between functionality and performance. For example, a fully synchronous solution over a slow network might cut performance by more than half, while an asynchronous one might have a minimal performance impact.

The remainder of this section outlines various failover, replication, and load balancing solutions.

---


---

## 29.2. Subscription #


**URL:** https://www.postgresql.org/docs/18/logical-replication-subscription.html

**Contents:**
- 29.2. Subscription #
  - 29.2.1. Replication Slot Management #
  - 29.2.2. Examples: Set Up Logical Replication #
  - 29.2.3. Examples: Deferred Replication Slot Creation #

A subscription is the downstream side of logical replication. The node where a subscription is defined is referred to as the subscriber. A subscription defines the connection to another database and set of publications (one or more) to which it wants to subscribe.

The subscriber database behaves in the same way as any other PostgreSQL instance and can be used as a publisher for other databases by defining its own publications.

A subscriber node may have multiple subscriptions if desired. It is possible to define multiple subscriptions between a single publisher-subscriber pair, in which case care must be taken to ensure that the subscribed publication objects don't overlap.

Each subscription will receive changes via one replication slot (see Section 26.2.6). Additional replication slots may be required for the initial data synchronization of pre-existing table data and those will be dropped at the end of data synchronization.

A logical replication subscription can be a standby for synchronous replication (see Section 26.2.8). The standby name is by default the subscription name. An alternative name can be specified as application_name in the connection information of the subscription.

Subscriptions are dumped by pg_dump if the current user is a superuser. Otherwise a warning is written and subscriptions are skipped, because non-superusers cannot read all subscription information from the pg_subscription catalog.

The subscription is added using CREATE SUBSCRIPTION and can be stopped/resumed at any time using the ALTER SUBSCRIPTION command and removed using DROP SUBSCRIPTION.

When a subscription is dropped and recreated, the synchronization information is lost. This means that the data has to be resynchronized afterwards.

The schema definitions are not replicated, and the published tables must exist on the subscriber. Only regular tables may be the target of replication. For example, you can't replicate to a view.

The tables are matched between the publisher and the subscriber using the fully qualified table name. Replication to differently-named tables on the subscriber is not supported.

Columns of a table are also matched by name. The order of columns in the subscriber table does not need to match that of the publisher. The data types of the columns do not need to match, as long as the text representation of the data can be converted to the target type. For example, you can replicate from a column of type integer to a column of type bigint. The target table can also have additional columns not provided by the published table. Any such columns will be filled with the default value as specified in the definition of the target table. However, logical replication in binary format is more restrictive. See the binary option of CREATE SUBSCRIPTION for details.

As mentioned earlier, each (active) subscription receives changes from a replication slot on the remote (publishing) side.

Additional table synchronization slots are normally transient, created internally to perform initial table synchronization and dropped automatically when they are no longer needed. These table synchronization slots have generated names: “pg_%u_sync_%u_%llu” (parameters: Subscription oid, Table relid, system identifier sysid)

Normally, the remote replication slot is created automatically when the subscription is created using CREATE SUBSCRIPTION and it is dropped automatically when the subscription is dropped using DROP SUBSCRIPTION. In some situations, however, it can be useful or necessary to manipulate the subscription and the underlying replication slot separately. Here are some scenarios:

When creating a subscription, the replication slot already exists. In that case, the subscription can be created using the create_slot = false option to associate with the existing slot.

When creating a subscription, the remote host is not reachable or in an unclear state. In that case, the subscription can be created using the connect = false option. The remote host will then not be contacted at all. This is what pg_dump uses. The remote replication slot will then have to be created manually before the subscription can be activated.

When dropping a subscription, the replication slot should be kept. This could be useful when the subscriber database is being moved to a different host and will be activated from there. In that case, disassociate the slot from the subscription using ALTER SUBSCRIPTION before attempting to drop the subscription.

When dropping a subscription, the remote host is not reachable. In that case, disassociate the slot from the subscription using ALTER SUBSCRIPTION before attempting to drop the subscription. If the remote database instance no longer exists, no further action is then necessary. If, however, the remote database instance is just unreachable, the replication slot (and any still remaining table synchronization slots) should then be dropped manually; otherwise it/they would continue to reserve WAL and might eventually cause the disk to fill up. Such cases should be carefully investigated.

Create some test tables on the publisher.

Create the same tables on the subscriber.

Insert data to the tables at the publisher side.

Create publications for the tables. The publications pub2 and pub3a disallow some publish operations. The publication pub3b has a row filter (see Section 29.4).

Create subscriptions for the publications. The subscription sub3 subscribes to both pub3a and pub3b. All subscriptions will copy initial data by default.

Observe that initial table data is copied, regardless of the publish operation of the publication.

Furthermore, because the initial data copy ignores the publish operation, and because publication pub3a has no row filter, it means the copied table t3 contains all rows even when they do not match the row filter of publication pub3b.

Insert more data to the tables at the publisher side.

Now the publisher side data looks like:

Observe that during normal replication the appropriate publish operations are used. This means publications pub2 and pub3a will not replicate the INSERT. Also, publication pub3b will only replicate data that matches the row filter of pub3b. Now the subscriber side data looks like:

There are some cases (e.g. Section 29.2.1) where, if the remote replication slot was not created automatically, the user must create it manually before the subscription can be activated. The steps to create the slot and activate the subscription are shown in the following examples. These examples specify the standard logical decoding output plugin (pgoutput), which is what the built-in logical replication uses.

First, create a publication for the examples to use.

Example 1: Where the subscription says connect = false

Create the subscription.

On the publisher, manually create a slot. Because the name was not specified during CREATE SUBSCRIPTION, the name of the slot to create is same as the subscription name, e.g. "sub1".

On the subscriber, complete the activation of the subscription. After this the tables of pub1 will start replicating.

Example 2: Where the subscription says connect = false, but also specifies the slot_name option.

Create the subscription.

On the publisher, manually create a slot using the same name that was specified during CREATE SUBSCRIPTION, e.g. "myslot".

On the subscriber, the remaining subscription activation steps are the same as before.

Example 3: Where the subscription specifies slot_name = NONE

Create the subscription. When slot_name = NONE then enabled = false, and create_slot = false are also needed.

On the publisher, manually create a slot using any name, e.g. "myslot".

On the subscriber, associate the subscription with the slot name just created.

The remaining subscription activation steps are same as before.

**Examples:**

Example 1 (unknown):
```unknown
application_name
```

Example 2 (unknown):
```unknown
pg_subscription
```

Example 3 (unknown):
```unknown
CREATE SUBSCRIPTION
```

Example 4 (unknown):
```unknown
ALTER SUBSCRIPTION
```

---


---

