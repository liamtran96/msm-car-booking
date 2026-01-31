# PostgreSQL - Sql Commands (Part 31)

## 


**URL:** https://www.postgresql.org/docs/18/sql-refreshmaterializedview.html

**Contents:**
- REFRESH MATERIALIZED VIEW
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

REFRESH MATERIALIZED VIEW — replace the contents of a materialized view

REFRESH MATERIALIZED VIEW completely replaces the contents of a materialized view. To execute this command you must have the MAINTAIN privilege on the materialized view. The old contents are discarded. If WITH DATA is specified (or defaults) the backing query is executed to provide the new data, and the materialized view is left in a scannable state. If WITH NO DATA is specified no new data is generated and the materialized view is left in an unscannable state.

CONCURRENTLY and WITH NO DATA may not be specified together.

Refresh the materialized view without locking out concurrent selects on the materialized view. Without this option a refresh which affects a lot of rows will tend to use fewer resources and complete more quickly, but could block other connections which are trying to read from the materialized view. This option may be faster in cases where a small number of rows are affected.

This option is only allowed if there is at least one UNIQUE index on the materialized view which uses only column names and includes all rows; that is, it must not be an expression index or include a WHERE clause.

This option can only be used when the materialized view is already populated.

Even with this option only one REFRESH at a time may run against any one materialized view.

The name (optionally schema-qualified) of the materialized view to refresh.

If there is an ORDER BY clause in the materialized view's defining query, the original contents of the materialized view will be ordered that way; but REFRESH MATERIALIZED VIEW does not guarantee to preserve that ordering.

While REFRESH MATERIALIZED VIEW is running, the search_path is temporarily changed to pg_catalog, pg_temp.

This command will replace the contents of the materialized view called order_summary using the query from the materialized view's definition, and leave it in a scannable state:

This command will free storage associated with the materialized view annual_statistics_basis and leave it in an unscannable state:

REFRESH MATERIALIZED VIEW is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
REFRESH MATERIALIZED VIEW
```

Example 2 (unknown):
```unknown
WITH NO DATA
```

Example 3 (unknown):
```unknown
CONCURRENTLY
```

Example 4 (unknown):
```unknown
WITH NO DATA
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-prepare.html

**Contents:**
- PREPARE
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

PREPARE — prepare a statement for execution

PREPARE creates a prepared statement. A prepared statement is a server-side object that can be used to optimize performance. When the PREPARE statement is executed, the specified statement is parsed, analyzed, and rewritten. When an EXECUTE command is subsequently issued, the prepared statement is planned and executed. This division of labor avoids repetitive parse analysis work, while allowing the execution plan to depend on the specific parameter values supplied.

Prepared statements can take parameters: values that are substituted into the statement when it is executed. When creating the prepared statement, refer to parameters by position, using $1, $2, etc. A corresponding list of parameter data types can optionally be specified. When a parameter's data type is not specified or is declared as unknown, the type is inferred from the context in which the parameter is first referenced (if possible). When executing the statement, specify the actual values for these parameters in the EXECUTE statement. Refer to EXECUTE for more information about that.

Prepared statements only last for the duration of the current database session. When the session ends, the prepared statement is forgotten, so it must be recreated before being used again. This also means that a single prepared statement cannot be used by multiple simultaneous database clients; however, each client can create their own prepared statement to use. Prepared statements can be manually cleaned up using the DEALLOCATE command.

Prepared statements potentially have the largest performance advantage when a single session is being used to execute a large number of similar statements. The performance difference will be particularly significant if the statements are complex to plan or rewrite, e.g., if the query involves a join of many tables or requires the application of several rules. If the statement is relatively simple to plan and rewrite but relatively expensive to execute, the performance advantage of prepared statements will be less noticeable.

An arbitrary name given to this particular prepared statement. It must be unique within a single session and is subsequently used to execute or deallocate a previously prepared statement.

The data type of a parameter to the prepared statement. If the data type of a particular parameter is unspecified or is specified as unknown, it will be inferred from the context in which the parameter is first referenced. To refer to the parameters in the prepared statement itself, use $1, $2, etc.

Any SELECT, INSERT, UPDATE, DELETE, MERGE, or VALUES statement.

A prepared statement can be executed with either a generic plan or a custom plan. A generic plan is the same across all executions, while a custom plan is generated for a specific execution using the parameter values given in that call. Use of a generic plan avoids planning overhead, but in some situations a custom plan will be much more efficient to execute because the planner can make use of knowledge of the parameter values. (Of course, if the prepared statement has no parameters, then this is moot and a generic plan is always used.)

By default (that is, when plan_cache_mode is set to auto), the server will automatically choose whether to use a generic or custom plan for a prepared statement that has parameters. The current rule for this is that the first five executions are done with custom plans and the average estimated cost of those plans is calculated. Then a generic plan is created and its estimated cost is compared to the average custom-plan cost. Subsequent executions use the generic plan if its cost is not so much higher than the average custom-plan cost as to make repeated replanning seem preferable.

This heuristic can be overridden, forcing the server to use either generic or custom plans, by setting plan_cache_mode to force_generic_plan or force_custom_plan respectively. This setting is primarily useful if the generic plan's cost estimate is badly off for some reason, allowing it to be chosen even though its actual cost is much more than that of a custom plan.

To examine the query plan PostgreSQL is using for a prepared statement, use EXPLAIN, for example

If a generic plan is in use, it will contain parameter symbols $n, while a custom plan will have the supplied parameter values substituted into it.

For more information on query planning and the statistics collected by PostgreSQL for that purpose, see the ANALYZE documentation.

Although the main point of a prepared statement is to avoid repeated parse analysis and planning of the statement, PostgreSQL will force re-analysis and re-planning of the statement before using it whenever database objects used in the statement have undergone definitional (DDL) changes or their planner statistics have been updated since the previous use of the prepared statement. Also, if the value of search_path changes from one use to the next, the statement will be re-parsed using the new search_path. (This latter behavior is new as of PostgreSQL 9.3.) These rules make use of a prepared statement semantically almost equivalent to re-submitting the same query text over and over, but with a performance benefit if no object definitions are changed, especially if the best plan remains the same across uses. An example of a case where the semantic equivalence is not perfect is that if the statement refers to a table by an unqualified name, and then a new table of the same name is created in a schema appearing earlier in the search_path, no automatic re-parse will occur since no object used in the statement changed. However, if some other change forces a re-parse, the new table will be referenced in subsequent uses.

You can see all prepared statements available in the session by querying the pg_prepared_statements system view.

Create a prepared statement for an INSERT statement, and then execute it:

Create a prepared statement for a SELECT statement, and then execute it:

In this example, the data type of the second parameter is not specified, so it is inferred from the context in which $2 is used.

The SQL standard includes a PREPARE statement, but it is only for use in embedded SQL. This version of the PREPARE statement also uses a somewhat different syntax.

**Examples:**

Example 1 (unknown):
```unknown
plan_cache_mode
```

Example 2 (unknown):
```unknown
force_generic_plan
```

Example 3 (unknown):
```unknown
force_custom_plan
```

Example 4 (unknown):
```unknown
EXPLAIN EXECUTE name(parameter_values);
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-createtstemplate.html

**Contents:**
- CREATE TEXT SEARCH TEMPLATE
- Synopsis
- Description
- Parameters
- Compatibility
- See Also

CREATE TEXT SEARCH TEMPLATE — define a new text search template

CREATE TEXT SEARCH TEMPLATE creates a new text search template. Text search templates define the functions that implement text search dictionaries. A template is not useful by itself, but must be instantiated as a dictionary to be used. The dictionary typically specifies parameters to be given to the template functions.

If a schema name is given then the text search template is created in the specified schema. Otherwise it is created in the current schema.

You must be a superuser to use CREATE TEXT SEARCH TEMPLATE. This restriction is made because an erroneous text search template definition could confuse or even crash the server. The reason for separating templates from dictionaries is that a template encapsulates the “unsafe” aspects of defining a dictionary. The parameters that can be set when defining a dictionary are safe for unprivileged users to set, and so creating a dictionary need not be a privileged operation.

Refer to Chapter 12 for further information.

The name of the text search template to be created. The name can be schema-qualified.

The name of the init function for the template.

The name of the lexize function for the template.

The function names can be schema-qualified if necessary. Argument types are not given, since the argument list for each type of function is predetermined. The lexize function is required, but the init function is optional.

The arguments can appear in any order, not only the one shown above.

There is no CREATE TEXT SEARCH TEMPLATE statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
init_function
```

Example 2 (unknown):
```unknown
lexize_function
```

Example 3 (unknown):
```unknown
CREATE TEXT SEARCH TEMPLATE
```

Example 4 (unknown):
```unknown
CREATE TEXT SEARCH TEMPLATE
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-reindex.html

**Contents:**
- REINDEX
- Synopsis
- Description
- Parameters
- Notes
  - Rebuilding Indexes Concurrently
- Examples
- Compatibility
- See Also

REINDEX — rebuild indexes

REINDEX rebuilds an index using the data stored in the index's table, replacing the old copy of the index. There are several scenarios in which to use REINDEX:

An index has become corrupted, and no longer contains valid data. Although in theory this should never happen, in practice indexes can become corrupted due to software bugs or hardware failures. REINDEX provides a recovery method.

An index has become “bloated”, that is it contains many empty or nearly-empty pages. This can occur with B-tree indexes in PostgreSQL under certain uncommon access patterns. REINDEX provides a way to reduce the space consumption of the index by writing a new version of the index without the dead pages. See Section 24.2 for more information.

You have altered a storage parameter (such as fillfactor) for an index, and wish to ensure that the change has taken full effect.

If an index build fails with the CONCURRENTLY option, this index is left as “invalid”. Such indexes are useless but it can be convenient to use REINDEX to rebuild them. Note that only REINDEX INDEX is able to perform a concurrent build on an invalid index.

Recreate the specified index. This form of REINDEX cannot be executed inside a transaction block when used with a partitioned index.

Recreate all indexes of the specified table. If the table has a secondary “TOAST” table, that is reindexed as well. This form of REINDEX cannot be executed inside a transaction block when used with a partitioned table.

Recreate all indexes of the specified schema. If a table of this schema has a secondary “TOAST” table, that is reindexed as well. Indexes on shared system catalogs are also processed. This form of REINDEX cannot be executed inside a transaction block.

Recreate all indexes within the current database, except system catalogs. Indexes on system catalogs are not processed. This form of REINDEX cannot be executed inside a transaction block.

Recreate all indexes on system catalogs within the current database. Indexes on shared system catalogs are included. Indexes on user tables are not processed. This form of REINDEX cannot be executed inside a transaction block.

The name of the specific index, table, or database to be reindexed. Index and table names can be schema-qualified. Presently, REINDEX DATABASE and REINDEX SYSTEM can only reindex the current database. Their parameter is optional, and it must match the current database's name.

When this option is used, PostgreSQL will rebuild the index without taking any locks that prevent concurrent inserts, updates, or deletes on the table; whereas a standard index rebuild locks out writes (but not reads) on the table until it's done. There are several caveats to be aware of when using this option — see Rebuilding Indexes Concurrently below.

For temporary tables, REINDEX is always non-concurrent, as no other session can access them, and non-concurrent reindex is cheaper.

Specifies that indexes will be rebuilt on a new tablespace.

Prints a progress report as each index is reindexed at INFO level.

Specifies whether the selected option should be turned on or off. You can write TRUE, ON, or 1 to enable the option, and FALSE, OFF, or 0 to disable it. The boolean value can also be omitted, in which case TRUE is assumed.

The tablespace where indexes will be rebuilt.

If you suspect corruption of an index on a user table, you can simply rebuild that index, or all indexes on the table, using REINDEX INDEX or REINDEX TABLE.

Things are more difficult if you need to recover from corruption of an index on a system table. In this case it's important for the system to not have used any of the suspect indexes itself. (Indeed, in this sort of scenario you might find that server processes are crashing immediately at start-up, due to reliance on the corrupted indexes.) To recover safely, the server must be started with the -P option, which prevents it from using indexes for system catalog lookups.

One way to do this is to shut down the server and start a single-user PostgreSQL server with the -P option included on its command line. Then, REINDEX DATABASE, REINDEX SYSTEM, REINDEX TABLE, or REINDEX INDEX can be issued, depending on how much you want to reconstruct. If in doubt, use REINDEX SYSTEM to select reconstruction of all system indexes in the database. Then quit the single-user server session and restart the regular server. See the postgres reference page for more information about how to interact with the single-user server interface.

Alternatively, a regular server session can be started with -P included in its command line options. The method for doing this varies across clients, but in all libpq-based clients, it is possible to set the PGOPTIONS environment variable to -P before starting the client. Note that while this method does not require locking out other clients, it might still be wise to prevent other users from connecting to the damaged database until repairs have been completed.

REINDEX is similar to a drop and recreate of the index in that the index contents are rebuilt from scratch. However, the locking considerations are rather different. REINDEX locks out writes but not reads of the index's parent table. It also takes an ACCESS EXCLUSIVE lock on the specific index being processed, which will block reads that attempt to use that index. In particular, the query planner tries to take an ACCESS SHARE lock on every index of the table, regardless of the query, and so REINDEX blocks virtually any queries except for some prepared queries whose plan has been cached and which don't use this very index. In contrast, DROP INDEX momentarily takes an ACCESS EXCLUSIVE lock on the parent table, blocking both writes and reads. The subsequent CREATE INDEX locks out writes but not reads; since the index is not there, no read will attempt to use it, meaning that there will be no blocking but reads might be forced into expensive sequential scans.

While REINDEX is running, the search_path is temporarily changed to pg_catalog, pg_temp.

Reindexing a single index or table requires having the MAINTAIN privilege on the table. Note that while REINDEX on a partitioned index or table requires having the MAINTAIN privilege on the partitioned table, such commands skip the privilege checks when processing the individual partitions. Reindexing a schema or database requires being the owner of that schema or database or having privileges of the pg_maintain role. Note specifically that it's thus possible for non-superusers to rebuild indexes of tables owned by other users. However, as a special exception, REINDEX DATABASE, REINDEX SCHEMA, and REINDEX SYSTEM will skip indexes on shared catalogs unless the user has the MAINTAIN privilege on the catalog.

Reindexing partitioned indexes or partitioned tables is supported with REINDEX INDEX or REINDEX TABLE, respectively. Each partition of the specified partitioned relation is reindexed in a separate transaction. Those commands cannot be used inside a transaction block when working on a partitioned table or index.

When using the TABLESPACE clause with REINDEX on a partitioned index or table, only the tablespace references of the leaf partitions are updated. As partitioned indexes are not updated, it is recommended to separately use ALTER TABLE ONLY on them so as any new partitions attached inherit the new tablespace. On failure, it may not have moved all the indexes to the new tablespace. Re-running the command will rebuild all the leaf partitions and move previously-unprocessed indexes to the new tablespace.

If SCHEMA, DATABASE or SYSTEM is used with TABLESPACE, system relations are skipped and a single WARNING will be generated. Indexes on TOAST tables are rebuilt, but not moved to the new tablespace.

Rebuilding an index can interfere with regular operation of a database. Normally PostgreSQL locks the table whose index is rebuilt against writes and performs the entire index build with a single scan of the table. Other transactions can still read the table, but if they try to insert, update, or delete rows in the table they will block until the index rebuild is finished. This could have a severe effect if the system is a live production database. Very large tables can take many hours to be indexed, and even for smaller tables, an index rebuild can lock out writers for periods that are unacceptably long for a production system.

PostgreSQL supports rebuilding indexes with minimum locking of writes. This method is invoked by specifying the CONCURRENTLY option of REINDEX. When this option is used, PostgreSQL must perform two scans of the table for each index that needs to be rebuilt and wait for termination of all existing transactions that could potentially use the index. This method requires more total work than a standard index rebuild and takes significantly longer to complete as it needs to wait for unfinished transactions that might modify the index. However, since it allows normal operations to continue while the index is being rebuilt, this method is useful for rebuilding indexes in a production environment. Of course, the extra CPU, memory and I/O load imposed by the index rebuild may slow down other operations.

The following steps occur in a concurrent reindex. Each step is run in a separate transaction. If there are multiple indexes to be rebuilt, then each step loops through all the indexes before moving to the next step.

A new transient index definition is added to the catalog pg_index. This definition will be used to replace the old index. A SHARE UPDATE EXCLUSIVE lock at session level is taken on the indexes being reindexed as well as their associated tables to prevent any schema modification while processing.

A first pass to build the index is done for each new index. Once the index is built, its flag pg_index.indisready is switched to “true” to make it ready for inserts, making it visible to other sessions once the transaction that performed the build is finished. This step is done in a separate transaction for each index.

Then a second pass is performed to add tuples that were added while the first pass was running. This step is also done in a separate transaction for each index.

All the constraints that refer to the index are changed to refer to the new index definition, and the names of the indexes are changed. At this point, pg_index.indisvalid is switched to “true” for the new index and to “false” for the old, and a cache invalidation is done causing all sessions that referenced the old index to be invalidated.

The old indexes have pg_index.indisready switched to “false” to prevent any new tuple insertions, after waiting for running queries that might reference the old index to complete.

The old indexes are dropped. The SHARE UPDATE EXCLUSIVE session locks for the indexes and the table are released.

If a problem arises while rebuilding the indexes, such as a uniqueness violation in a unique index, the REINDEX command will fail but leave behind an “invalid” new index in addition to the pre-existing one. This index will be ignored for querying purposes because it might be incomplete; however it will still consume update overhead. The psql \d command will report such an index as INVALID:

If the index marked INVALID is suffixed _ccnew, then it corresponds to the transient index created during the concurrent operation, and the recommended recovery method is to drop it using DROP INDEX, then attempt REINDEX CONCURRENTLY again. If the invalid index is instead suffixed _ccold, it corresponds to the original index which could not be dropped; the recommended recovery method is to just drop said index, since the rebuild proper has been successful. A nonzero number may be appended to the suffix of the invalid index names to keep them unique, like _ccnew1, _ccold2, etc.

Regular index builds permit other regular index builds on the same table to occur simultaneously, but only one concurrent index build can occur on a table at a time. In both cases, no other types of schema modification on the table are allowed meanwhile. Another difference is that a regular REINDEX TABLE or REINDEX INDEX command can be performed within a transaction block, but REINDEX CONCURRENTLY cannot.

Like any long-running transaction, REINDEX on a table can affect which tuples can be removed by concurrent VACUUM on any other table.

REINDEX SYSTEM does not support CONCURRENTLY since system catalogs cannot be reindexed concurrently.

Furthermore, indexes for exclusion constraints cannot be reindexed concurrently. If such an index is named directly in this command, an error is raised. If a table or database with exclusion constraint indexes is reindexed concurrently, those indexes will be skipped. (It is possible to reindex such indexes without the CONCURRENTLY option.)

Each backend running REINDEX will report its progress in the pg_stat_progress_create_index view. See Section 27.4.4 for details.

Rebuild a single index:

Rebuild all the indexes on the table my_table:

Rebuild all indexes in a particular database, without trusting the system indexes to be valid already:

Rebuild indexes for a table, without blocking read and write operations on involved relations while reindexing is in progress:

There is no REINDEX command in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
new_tablespace
```

Example 2 (unknown):
```unknown
CONCURRENTLY
```

Example 3 (unknown):
```unknown
REINDEX INDEX
```

Example 4 (unknown):
```unknown
REINDEX DATABASE
```

---


---

