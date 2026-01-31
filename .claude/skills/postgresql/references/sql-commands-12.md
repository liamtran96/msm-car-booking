# PostgreSQL - Sql Commands (Part 12)

## 


**URL:** https://www.postgresql.org/docs/18/sql-discard.html

**Contents:**
- DISCARD
- Synopsis
- Description
- Parameters
- Notes
- Compatibility

DISCARD — discard session state

DISCARD releases internal resources associated with a database session. This command is useful for partially or fully resetting the session's state. There are several subcommands to release different types of resources; the DISCARD ALL variant subsumes all the others, and also resets additional state.

Releases all cached query plans, forcing re-planning to occur the next time the associated prepared statement is used.

Discards all cached sequence-related state, including currval()/lastval() information and any preallocated sequence values that have not yet been returned by nextval(). (See CREATE SEQUENCE for a description of preallocated sequence values.)

Drops all temporary tables created in the current session.

Releases all temporary resources associated with the current session and resets the session to its initial state. Currently, this has the same effect as executing the following sequence of statements:

DISCARD ALL cannot be executed inside a transaction block.

DISCARD is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
DISCARD ALL
```

Example 2 (sql):
```sql
CLOSE ALL;
SET SESSION AUTHORIZATION DEFAULT;
RESET ALL;
DEALLOCATE ALL;
UNLISTEN *;
SELECT pg_advisory_unlock_all();
DISCARD PLANS;
DISCARD TEMP;
DISCARD SEQUENCES;
```

Example 3 (unknown):
```unknown
DISCARD ALL
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-createtsparser.html

**Contents:**
- CREATE TEXT SEARCH PARSER
- Synopsis
- Description
- Parameters
- Compatibility
- See Also

CREATE TEXT SEARCH PARSER — define a new text search parser

CREATE TEXT SEARCH PARSER creates a new text search parser. A text search parser defines a method for splitting a text string into tokens and assigning types (categories) to the tokens. A parser is not particularly useful by itself, but must be bound into a text search configuration along with some text search dictionaries to be used for searching.

If a schema name is given then the text search parser is created in the specified schema. Otherwise it is created in the current schema.

You must be a superuser to use CREATE TEXT SEARCH PARSER. (This restriction is made because an erroneous text search parser definition could confuse or even crash the server.)

Refer to Chapter 12 for further information.

The name of the text search parser to be created. The name can be schema-qualified.

The name of the start function for the parser.

The name of the get-next-token function for the parser.

The name of the end function for the parser.

The name of the lextypes function for the parser (a function that returns information about the set of token types it produces).

The name of the headline function for the parser (a function that summarizes a set of tokens).

The function names can be schema-qualified if necessary. Argument types are not given, since the argument list for each type of function is predetermined. All except the headline function are required.

The arguments can appear in any order, not only the one shown above.

There is no CREATE TEXT SEARCH PARSER statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
start_function
```

Example 2 (unknown):
```unknown
gettoken_function
```

Example 3 (unknown):
```unknown
end_function
```

Example 4 (unknown):
```unknown
lextypes_function
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-cluster.html

**Contents:**
- CLUSTER
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

CLUSTER — cluster a table according to an index

CLUSTER instructs PostgreSQL to cluster the table specified by table_name based on the index specified by index_name. The index must already have been defined on table_name.

When a table is clustered, it is physically reordered based on the index information. Clustering is a one-time operation: when the table is subsequently updated, the changes are not clustered. That is, no attempt is made to store new or updated rows according to their index order. (If one wishes, one can periodically recluster by issuing the command again. Also, setting the table's fillfactor storage parameter to less than 100% can aid in preserving cluster ordering during updates, since updated rows are kept on the same page if enough space is available there.)

When a table is clustered, PostgreSQL remembers which index it was clustered by. The form CLUSTER table_name reclusters the table using the same index as before. You can also use the CLUSTER or SET WITHOUT CLUSTER forms of ALTER TABLE to set the index to be used for future cluster operations, or to clear any previous setting.

CLUSTER without a table_name reclusters all the previously-clustered tables in the current database that the calling user has privileges for. This form of CLUSTER cannot be executed inside a transaction block.

When a table is being clustered, an ACCESS EXCLUSIVE lock is acquired on it. This prevents any other database operations (both reads and writes) from operating on the table until the CLUSTER is finished.

The name (possibly schema-qualified) of a table.

The name of an index.

Prints a progress report as each table is clustered at INFO level.

Specifies whether the selected option should be turned on or off. You can write TRUE, ON, or 1 to enable the option, and FALSE, OFF, or 0 to disable it. The boolean value can also be omitted, in which case TRUE is assumed.

To cluster a table, one must have the MAINTAIN privilege on the table.

In cases where you are accessing single rows randomly within a table, the actual order of the data in the table is unimportant. However, if you tend to access some data more than others, and there is an index that groups them together, you will benefit from using CLUSTER. If you are requesting a range of indexed values from a table, or a single indexed value that has multiple rows that match, CLUSTER will help because once the index identifies the table page for the first row that matches, all other rows that match are probably already on the same table page, and so you save disk accesses and speed up the query.

CLUSTER can re-sort the table using either an index scan on the specified index, or (if the index is a b-tree) a sequential scan followed by sorting. It will attempt to choose the method that will be faster, based on planner cost parameters and available statistical information.

While CLUSTER is running, the search_path is temporarily changed to pg_catalog, pg_temp.

When an index scan is used, a temporary copy of the table is created that contains the table data in the index order. Temporary copies of each index on the table are created as well. Therefore, you need free space on disk at least equal to the sum of the table size and the index sizes.

When a sequential scan and sort is used, a temporary sort file is also created, so that the peak temporary space requirement is as much as double the table size, plus the index sizes. This method is often faster than the index scan method, but if the disk space requirement is intolerable, you can disable this choice by temporarily setting enable_sort to off.

It is advisable to set maintenance_work_mem to a reasonably large value (but not more than the amount of RAM you can dedicate to the CLUSTER operation) before clustering.

Because the planner records statistics about the ordering of tables, it is advisable to run ANALYZE on the newly clustered table. Otherwise, the planner might make poor choices of query plans.

Because CLUSTER remembers which indexes are clustered, one can cluster the tables one wants clustered manually the first time, then set up a periodic maintenance script that executes CLUSTER without any parameters, so that the desired tables are periodically reclustered.

Each backend running CLUSTER will report its progress in the pg_stat_progress_cluster view. See Section 27.4.2 for details.

Clustering a partitioned table clusters each of its partitions using the partition of the specified partitioned index. When clustering a partitioned table, the index may not be omitted. CLUSTER on a partitioned table cannot be executed inside a transaction block.

Cluster the table employees on the basis of its index employees_ind:

Cluster the employees table using the same index that was used before:

Cluster all tables in the database that have previously been clustered:

There is no CLUSTER statement in the SQL standard.

The following syntax was used before PostgreSQL 17 and is still supported:

The following syntax was used before PostgreSQL 8.3 and is still supported:

**Examples:**

Example 1 (unknown):
```unknown
CLUSTER table_name
```

Example 2 (unknown):
```unknown
SET WITHOUT CLUSTER
```

Example 3 (unknown):
```unknown
ALTER TABLE
```

Example 4 (unknown):
```unknown
ACCESS EXCLUSIVE
```

---


---

