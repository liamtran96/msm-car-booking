# PostgreSQL - Monitoring

## 27.6. Monitoring Disk Usage #


**URL:** https://www.postgresql.org/docs/18/diskusage.html

**Contents:**
- 27.6. Monitoring Disk Usage #
  - 27.6.1. Determining Disk Usage #
  - 27.6.2. Disk Full Failure #
  - Tip

This section discusses how to monitor the disk usage of a PostgreSQL database system.

Each table has a primary heap disk file where most of the data is stored. If the table has any columns with potentially-wide values, there also might be a TOAST file associated with the table, which is used to store values too wide to fit comfortably in the main table (see Section 66.2). There will be one valid index on the TOAST table, if present. There also might be indexes associated with the base table. Each table and index is stored in a separate disk file — possibly more than one file, if the file would exceed one gigabyte. Naming conventions for these files are described in Section 66.1.

You can monitor disk space in three ways: using the SQL functions listed in Table 9.102, using the oid2name module, or using manual inspection of the system catalogs. The SQL functions are the easiest to use and are generally recommended. The remainder of this section shows how to do it by inspection of the system catalogs.

Using psql on a recently vacuumed or analyzed database, you can issue queries to see the disk usage of any table:

Each page is typically 8 kilobytes. (Remember, relpages is only updated by VACUUM, ANALYZE, and a few DDL commands such as CREATE INDEX.) The file path name is of interest if you want to examine the table's disk file directly.

To show the space used by TOAST tables, use a query like the following:

You can easily display index sizes, too:

It is easy to find your largest tables and indexes using this information:

The most important disk monitoring task of a database administrator is to make sure the disk doesn't become full. A filled data disk will not result in data corruption, but it might prevent useful activity from occurring. If the disk holding the WAL files grows full, database server panic and consequent shutdown might occur.

If you cannot free up additional space on the disk by deleting other things, you can move some of the database files to other file systems by making use of tablespaces. See Section 22.6 for more information about that.

Some file systems perform badly when they are almost full, so do not wait until the disk is completely full to take action.

If your system supports per-user disk quotas, then the database will naturally be subject to whatever quota is placed on the user the server runs as. Exceeding the quota will have the same bad effects as running out of disk space entirely.

**Examples:**

Example 1 (sql):
```sql
SELECT pg_relation_filepath(oid), relpages FROM pg_class WHERE relname = 'customer';

 pg_relation_filepath | relpages
----------------------+----------
 base/16384/16806     |       60
(1 row)
```

Example 2 (unknown):
```unknown
CREATE INDEX
```

Example 3 (sql):
```sql
SELECT relname, relpages
FROM pg_class,
     (SELECT reltoastrelid
      FROM pg_class
      WHERE relname = 'customer') AS ss
WHERE oid = ss.reltoastrelid OR
      oid = (SELECT indexrelid
             FROM pg_index
             WHERE indrelid = ss.reltoastrelid)
ORDER BY relname;

       relname        | relpages
----------------------+----------
 pg_toast_16806       |        0
 pg_toast_16806_index |        1
```

Example 4 (sql):
```sql
SELECT c2.relname, c2.relpages
FROM pg_class c, pg_class c2, pg_index i
WHERE c.relname = 'customer' AND
      c.oid = i.indrelid AND
      c2.oid = i.indexrelid
ORDER BY c2.relname;

      relname      | relpages
-------------------+----------
 customer_id_index |       26
```

---


---

## 27.5. Dynamic Tracing #


**URL:** https://www.postgresql.org/docs/18/dynamic-trace.html

**Contents:**
- 27.5. Dynamic Tracing #
  - 27.5.1. Compiling for Dynamic Tracing #
  - 27.5.2. Built-in Probes #
  - 27.5.3. Using Probes #
  - Note
  - 27.5.4. Defining New Probes #

PostgreSQL provides facilities to support dynamic tracing of the database server. This allows an external utility to be called at specific points in the code and thereby trace execution.

A number of probes or trace points are already inserted into the source code. These probes are intended to be used by database developers and administrators. By default the probes are not compiled into PostgreSQL; the user needs to explicitly tell the configure script to make the probes available.

Currently, the DTrace utility is supported, which, at the time of this writing, is available on Solaris, macOS, FreeBSD, NetBSD, and Oracle Linux. The SystemTap project for Linux provides a DTrace equivalent and can also be used. Supporting other dynamic tracing utilities is theoretically possible by changing the definitions for the macros in src/include/utils/probes.h.

By default, probes are not available, so you will need to explicitly tell the configure script to make the probes available in PostgreSQL. To include DTrace support specify --enable-dtrace to configure. See Section 17.3.3.6 for further information.

A number of standard probes are provided in the source code, as shown in Table 27.49; Table 27.50 shows the types used in the probes. More probes can certainly be added to enhance PostgreSQL's observability.

Table 27.49. Built-in DTrace Probes

Table 27.50. Defined Types Used in Probe Parameters

The example below shows a DTrace script for analyzing transaction counts in the system, as an alternative to snapshotting pg_stat_database before and after a performance test:

When executed, the example D script gives output such as:

SystemTap uses a different notation for trace scripts than DTrace does, even though the underlying trace points are compatible. One point worth noting is that at this writing, SystemTap scripts must reference probe names using double underscores in place of hyphens. This is expected to be fixed in future SystemTap releases.

You should remember that DTrace scripts need to be carefully written and debugged, otherwise the trace information collected might be meaningless. In most cases where problems are found it is the instrumentation that is at fault, not the underlying system. When discussing information found using dynamic tracing, be sure to enclose the script used to allow that too to be checked and discussed.

New probes can be defined within the code wherever the developer desires, though this will require a recompilation. Below are the steps for inserting new probes:

Decide on probe names and data to be made available through the probes

Add the probe definitions to src/backend/utils/probes.d

Include pg_trace.h if it is not already present in the module(s) containing the probe points, and insert TRACE_POSTGRESQL probe macros at the desired locations in the source code

Recompile and verify that the new probes are available

Example: Here is an example of how you would add a probe to trace all new transactions by transaction ID.

Decide that the probe will be named transaction-start and requires a parameter of type LocalTransactionId

Add the probe definition to src/backend/utils/probes.d:

Note the use of the double underline in the probe name. In a DTrace script using the probe, the double underline needs to be replaced with a hyphen, so transaction-start is the name to document for users.

At compile time, transaction__start is converted to a macro called TRACE_POSTGRESQL_TRANSACTION_START (notice the underscores are single here), which is available by including pg_trace.h. Add the macro call to the appropriate location in the source code. In this case, it looks like the following:

After recompiling and running the new binary, check that your newly added probe is available by executing the following DTrace command. You should see similar output:

There are a few things to be careful about when adding trace macros to the C code:

You should take care that the data types specified for a probe's parameters match the data types of the variables used in the macro. Otherwise, you will get compilation errors.

On most platforms, if PostgreSQL is built with --enable-dtrace, the arguments to a trace macro will be evaluated whenever control passes through the macro, even if no tracing is being done. This is usually not worth worrying about if you are just reporting the values of a few local variables. But beware of putting expensive function calls into the arguments. If you need to do that, consider protecting the macro with a check to see if the trace is actually enabled:

Each trace macro has a corresponding ENABLED macro.

**Examples:**

Example 1 (unknown):
```unknown
src/include/utils/probes.h
```

Example 2 (unknown):
```unknown
--enable-dtrace
```

Example 3 (unknown):
```unknown
transaction-start
```

Example 4 (unknown):
```unknown
(LocalTransactionId)
```

---


---

## Chapter 27. Monitoring Database Activity


**URL:** https://www.postgresql.org/docs/18/monitoring.html

**Contents:**
- Chapter 27. Monitoring Database Activity

A database administrator frequently wonders, “What is the system doing right now?” This chapter discusses how to find that out.

Several tools are available for monitoring database activity and analyzing performance. Most of this chapter is devoted to describing PostgreSQL's cumulative statistics system, but one should not neglect regular Unix monitoring programs such as ps, top, iostat, and vmstat. Also, once one has identified a poorly-performing query, further investigation might be needed using PostgreSQL's EXPLAIN command. Section 14.1 discusses EXPLAIN and other methods for understanding the behavior of an individual query.

**Examples:**

Example 1 (unknown):
```unknown
pg_stat_activity
```

Example 2 (unknown):
```unknown
pg_stat_replication
```

Example 3 (unknown):
```unknown
pg_stat_replication_slots
```

Example 4 (unknown):
```unknown
pg_stat_wal_receiver
```

---


---

