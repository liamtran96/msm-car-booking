# PostgreSQL - Appendix Glossary (Part 2)

## Appendix M. Glossary (continued)

Other object types, such as roles, tablespaces, replication origins, subscriptions for logical replication, and databases themselves are not local SQL objects since they exist entirely outside of any specific database; they are called global objects. The names of such objects are enforced to be unique within the whole database cluster.

For more information, see Section 22.1.

A series of documents that define the SQL language.

See Replica (server).

An auxiliary process that replays WAL during crash recovery and in a physical replica.

(The name is historical: the startup process was named before replication was implemented; the name refers to its task as it relates to the server startup following a crash.)

As used in this documentation, it is a synonym for database superuser.

A collection of tables which describe the structure of all SQL objects of the instance. The system catalog resides in the schema pg_catalog. These tables contain data in internal representation and are not typically considered useful for user examination; a number of user-friendlier views, also in schema pg_catalog, offer more convenient access to some of that information, while additional tables and views exist in schema information_schema (see Chapter 35) that expose some of the same and additional information as mandated by the SQL standard.

For more information, see Section 5.10.

A collection of tuples having a common data structure (the same number of attributes, in the same order, having the same name and type per position). A table is the most common form of relation in PostgreSQL.

For more information, see CREATE TABLE.

A named location on the server file system. All SQL objects which require storage beyond their definition in the system catalog must belong to a single tablespace. Initially, a database cluster contains a single usable tablespace which is used as the default for all SQL objects, called pg_default.

For more information, see Section 22.6.

Tables that exist either for the lifetime of a session or a transaction, as specified at the time of creation. The data in them is not visible to other sessions, and is not logged. Temporary tables are often used to store intermediate data for a multi-step operation.

For more information, see CREATE TABLE.

A mechanism by which large attributes of table rows are split and stored in a secondary table, called the TOAST table. Each relation with large attributes has its own TOAST table.

For more information, see Section 66.2.

A combination of commands that must act as a single atomic command: they all succeed or all fail as a single unit, and their effects are not visible to other sessions until the transaction is complete, and possibly even later, depending on the isolation level.

For more information, see Section 13.2.

The numerical, unique, sequentially-assigned identifier that each transaction receives when it first causes a database modification. Frequently abbreviated as xid. When stored on disk, xids are only 32-bits wide, so only approximately four billion write transaction IDs can be generated; to permit the system to run for longer than that, epochs are used, also 32 bits wide. When the counter reaches the maximum xid value, it starts over at 3 (values under that are reserved) and the epoch value is incremented by one. In some contexts, the epoch and xid values are considered together as a single 64-bit value; see Section 67.1 for more details.

For more information, see Section 8.19.

Average number of transactions that are executed per second, totaled across all sessions active for a measured run. This is used as a measure of the performance characteristics of an instance.

A function which can be defined to execute whenever a certain operation (INSERT, UPDATE, DELETE, TRUNCATE) is applied to a relation. A trigger executes within the same transaction as the statement which invoked it, and if the function fails, then the invoking statement also fails.

For more information, see CREATE TRIGGER.

A collection of attributes in a fixed order. That order may be defined by the table (or other relation) where the tuple is contained, in which case the tuple is often called a row. It may also be defined by the structure of a result set, in which case it is sometimes called a record.

A type of constraint defined on a relation which restricts the values allowed in one or a combination of columns so that each value or combination of values can only appear once in the relation — that is, no other row in the relation contains values that are equal to those.

Because null values are not considered equal to each other, multiple rows with null values are allowed to exist without violating the unique constraint.

The property of certain relations that the changes to them are not reflected in the WAL. This disables replication and crash recovery for these relations.

The primary use of unlogged tables is for storing transient work data that must be shared across processes.

Temporary tables are always unlogged.

An SQL command used to modify rows that may already exist in a specified table. It cannot create or remove rows.

For more information, see UPDATE.

A role that has the login privilege (see Section 21.2).

The translation of login credentials in the local database to credentials in a remote data system defined by a foreign data wrapper.

For more information, see CREATE USER MAPPING.

Universal Coordinated Time, the primary global time reference, approximately the time prevailing at the zero meridian of longitude. Often but inaccurately referred to as GMT (Greenwich Mean Time).

The process of removing outdated tuple versions from tables or materialized views, and other closely related processing required by PostgreSQL's implementation of MVCC. This can be initiated through the use of the VACUUM command, but can also be handled automatically via autovacuum processes.

For more information, see Section 24.1 .

A relation that is defined by a SELECT statement, but has no storage of its own. Any time a query references a view, the definition of the view is substituted into the query as if the user had typed it as a subquery instead of the name of the view.

For more information, see CREATE VIEW.

A storage structure that keeps metadata about each data page of a table's main fork. The visibility map entry for each page stores two bits: the first one (all-visible) indicates that all tuples in the page are visible to all transactions. The second one (all-frozen) indicates that all tuples in the page are marked frozen.

An auxiliary process which, if enabled, saves copies of WAL files for the purpose of creating backups or keeping replicas current.

For more information, see Section 25.3.

Also known as WAL segment or WAL segment file. Each of the sequentially-numbered files that provide storage space for WAL. The files are all of the same predefined size and are written in sequential order, interspersing changes as they occur in multiple simultaneous sessions. If the system crashes, the files are read in order, and each of the changes is replayed to restore the system to the state it was in before the crash.

Each WAL file can be released after a checkpoint writes all the changes in it to the corresponding data files. Releasing the file can be done either by deleting it, or by changing its name so that it will be used in the future, which is called recycling.

For more information, see Section 28.6.

A low-level description of an individual data change. It contains sufficient information for the data change to be re-executed (replayed) in case a system failure causes the change to be lost. WAL records use a non-printable binary format.

For more information, see Section 28.6.

An auxiliary process that runs on a replica to receive WAL from the primary server for replay by the startup process.

For more information, see Section 26.2.

A special backend process that streams WAL over a network. The receiving end can be a WAL receiver in a replica, pg_receivewal, or any other client program that speaks the replication protocol.

An auxiliary process that summarizes WAL data for incremental backups.

For more information, see Section 19.5.7.

An auxiliary process that writes WAL records from shared memory to WAL files.

For more information, see Section 19.5.

A type of function used in a query that applies to a partition of the query's result set; the function's result is based on values found in rows of the same partition or frame.

All aggregate functions can be used as window functions, but window functions can also be used to, for example, give ranks to each of the rows in the partition. Also known as analytic functions.

For more information, see Section 3.5.

The journal that keeps track of the changes in the database cluster as user- and system-invoked operations take place. It comprises many individual WAL records written sequentially to WAL files.

**Examples:**

Example 1 (sql):
```sql
CREATE TABLE AS SELECT
```

Example 2 (unknown):
```unknown
ALTER TABLE
```

Example 3 (unknown):
```unknown
CREATE DATABASE
```

Example 4 (unknown):
```unknown
CREATE INDEX
```

---


---

