# PostgreSQL - Contrib Modules (Part 2)

## F.29. pg_overexplain — allow EXPLAIN to dump even more details #


**URL:** https://www.postgresql.org/docs/18/pgoverexplain.html

**Contents:**
- F.29. pg_overexplain — allow EXPLAIN to dump even more details #
  - F.29.1. EXPLAIN (DEBUG) #
  - F.29.2. EXPLAIN (RANGE_TABLE) #
  - F.29.3. Author #

The pg_overexplain module extends EXPLAIN with new options that provide additional output. It is mostly intended to assist with debugging of and development of the planner, rather than for general use. Since this module displays internal details of planner data structures, it may be necessary to refer to the source code to make sense of the output. Furthermore, the output is likely to change whenever (and as often as) those data structures change.

To use it, simply load it into the server. You can load it into an individual session:

You can also preload it into some or all sessions by including pg_overexplain in session_preload_libraries or shared_preload_libraries in postgresql.conf.

The DEBUG option displays miscellaneous information from the plan tree that is not normally shown because it is not expected to be of general interest. For each individual plan node, it will display the following fields. See Plan in nodes/plannodes.h for additional documentation of these fields.

Disabled Nodes. Normal EXPLAIN determines whether a node is disabled by checking whether the node's count of disabled nodes is larger than the sum of the counts for the underlying nodes. This option shows the raw counter value.

Parallel Safe. Indicates whether it would be safe for a plan tree node to appear beneath a Gather or Gather Merge node, regardless of whether it is actually below such a node.

Plan Node ID. An internal ID number that should be unique for every node in the plan tree. It is used to coordinate parallel query activity.

extParam and allParam. Information about which numbered parameters affect this plan node or its children. In text mode, these fields are only displayed if they are non-empty sets.

Once per query, the DEBUG option will display the following fields. See PlannedStmt in nodes/plannodes.h for additional detail.

Command Type. For example, select or update.

Flags. A comma-separated list of Boolean structure member names from the PlannedStmt that are set to true. It covers the following structure members: hasReturning, hasModifyingCTE, canSetTag, transientPlan, dependsOnRole, parallelModeNeeded.

Subplans Needing Rewind. Integer IDs of subplans that may need to be rewound by the executor.

Relation OIDs. OIDs of relations upon which this plan depends.

Executor Parameter Types. Type OID for each executor parameter (e.g. when a nested loop is chosen and a parameter is used to pass a value down to an inner index scan). Does not include parameters supplied to a prepared statement by the user.

Parse Location. Location within the query string supplied to the planner where this query's text can be found. May be Unknown in some contexts. Otherwise, may be NNN to end for some integer NNN or NNN for MMM bytes for some integers NNN and MMM.

The RANGE_TABLE option displays information from the plan tree specifically concerning the query's range table. Range table entries correspond roughly to items appearing in the query's FROM clause, but with numerous exceptions. For example, subqueries that are proved unnecessary may be deleted from the range table entirely, while inheritance expansion adds range table entries for child tables that are not named directly in the query.

Range table entries are generally referenced within the query plan by a range table index, or RTI. Plan nodes that reference one or more RTIs will be labelled accordingly, using one of the following fields: Scan RTI, Nominal RTI, Exclude Relation RTI, Append RTIs.

In addition, the query as a whole may maintain lists of range table indexes that are needed for various purposes. These lists will be displayed once per query, labelled as appropriate as Unprunable RTIs or Result RTIs. In text mode, these fields are only displayed if they are non-empty sets.

Finally, but most importantly, the RANGE_TABLE option will display a dump of the query's entire range table. Each range table entry is labelled with the appropriate range table index, the kind of range table entry (e.g. relation, subquery, or join), followed by the contents of various range table entry fields that are not normally part of EXPLAIN output. Some of these fields are only displayed for certain kinds of range table entries. For example, Eref is displayed for all types of range table entries, but CTE Name is displayed only for range table entries of type cte.

For more information about range table entries, see the definition of RangeTblEntry in nodes/plannodes.h.

Robert Haas <rhaas@postgresql.org>

**Examples:**

Example 1 (unknown):
```unknown
pg_overexplain
```

Example 2 (unknown):
```unknown
LOAD 'pg_overexplain';
```

Example 3 (unknown):
```unknown
pg_overexplain
```

Example 4 (unknown):
```unknown
postgresql.conf
```

---


---

## F.32. pg_stat_statements — track statistics of SQL planning and execution #


**URL:** https://www.postgresql.org/docs/18/pgstatstatements.html

**Contents:**
- F.32. pg_stat_statements — track statistics of SQL planning and execution #
  - F.32.1. The pg_stat_statements View #
  - Note
  - F.32.2. The pg_stat_statements_info View #
  - F.32.3. Functions #
  - F.32.4. Configuration Parameters #
  - F.32.5. Sample Output #
  - F.32.6. Authors #

The pg_stat_statements module provides a means for tracking planning and execution statistics of all SQL statements executed by a server.

The module must be loaded by adding pg_stat_statements to shared_preload_libraries in postgresql.conf, because it requires additional shared memory. This means that a server restart is needed to add or remove the module. In addition, query identifier calculation must be enabled in order for the module to be active, which is done automatically if compute_query_id is set to auto or on, or any third-party module that calculates query identifiers is loaded.

When pg_stat_statements is active, it tracks statistics across all databases of the server. To access and manipulate these statistics, the module provides views pg_stat_statements and pg_stat_statements_info, and the utility functions pg_stat_statements_reset and pg_stat_statements. These are not available globally but can be enabled for a specific database with CREATE EXTENSION pg_stat_statements.

The statistics gathered by the module are made available via a view named pg_stat_statements. This view contains one row for each distinct combination of database ID, user ID, query ID and whether it's a top-level statement or not (up to the maximum number of distinct statements that the module can track). The columns of the view are shown in Table F.22.

Table F.22. pg_stat_statements Columns

userid oid (references pg_authid.oid)

OID of user who executed the statement

dbid oid (references pg_database.oid)

OID of database in which the statement was executed

True if the query was executed as a top-level statement (always true if pg_stat_statements.track is set to top)

Hash code to identify identical normalized queries.

Text of a representative statement

Number of times the statement was planned (if pg_stat_statements.track_planning is enabled, otherwise zero)

total_plan_time double precision

Total time spent planning the statement, in milliseconds (if pg_stat_statements.track_planning is enabled, otherwise zero)

min_plan_time double precision

Minimum time spent planning the statement, in milliseconds. This field will be zero if pg_stat_statements.track_planning is disabled, or if the counter has been reset using the pg_stat_statements_reset function with the minmax_only parameter set to true and never been planned since.

max_plan_time double precision

Maximum time spent planning the statement, in milliseconds. This field will be zero if pg_stat_statements.track_planning is disabled, or if the counter has been reset using the pg_stat_statements_reset function with the minmax_only parameter set to true and never been planned since.

mean_plan_time double precision

Mean time spent planning the statement, in milliseconds (if pg_stat_statements.track_planning is enabled, otherwise zero)

stddev_plan_time double precision

Population standard deviation of time spent planning the statement, in milliseconds (if pg_stat_statements.track_planning is enabled, otherwise zero)

Number of times the statement was executed

total_exec_time double precision

Total time spent executing the statement, in milliseconds

min_exec_time double precision

Minimum time spent executing the statement, in milliseconds, this field will be zero until this statement is executed first time after reset performed by the pg_stat_statements_reset function with the minmax_only parameter set to true

max_exec_time double precision

Maximum time spent executing the statement, in milliseconds, this field will be zero until this statement is executed first time after reset performed by the pg_stat_statements_reset function with the minmax_only parameter set to true

mean_exec_time double precision

Mean time spent executing the statement, in milliseconds

stddev_exec_time double precision

Population standard deviation of time spent executing the statement, in milliseconds

Total number of rows retrieved or affected by the statement

shared_blks_hit bigint

Total number of shared block cache hits by the statement

shared_blks_read bigint

Total number of shared blocks read by the statement

shared_blks_dirtied bigint

Total number of shared blocks dirtied by the statement

shared_blks_written bigint

Total number of shared blocks written by the statement

local_blks_hit bigint

Total number of local block cache hits by the statement

local_blks_read bigint

Total number of local blocks read by the statement

local_blks_dirtied bigint

Total number of local blocks dirtied by the statement

local_blks_written bigint

Total number of local blocks written by the statement

temp_blks_read bigint

Total number of temp blocks read by the statement

temp_blks_written bigint

Total number of temp blocks written by the statement

shared_blk_read_time double precision

Total time the statement spent reading shared blocks, in milliseconds (if track_io_timing is enabled, otherwise zero)

shared_blk_write_time double precision

Total time the statement spent writing shared blocks, in milliseconds (if track_io_timing is enabled, otherwise zero)

local_blk_read_time double precision

Total time the statement spent reading local blocks, in milliseconds (if track_io_timing is enabled, otherwise zero)

local_blk_write_time double precision

Total time the statement spent writing local blocks, in milliseconds (if track_io_timing is enabled, otherwise zero)

temp_blk_read_time double precision

Total time the statement spent reading temporary file blocks, in milliseconds (if track_io_timing is enabled, otherwise zero)

temp_blk_write_time double precision

Total time the statement spent writing temporary file blocks, in milliseconds (if track_io_timing is enabled, otherwise zero)

Total number of WAL records generated by the statement

Total number of WAL full page images generated by the statement

Total amount of WAL generated by the statement in bytes

wal_buffers_full bigint

Number of times the WAL buffers became full

Total number of functions JIT-compiled by the statement

jit_generation_time double precision

Total time spent by the statement on generating JIT code, in milliseconds

jit_inlining_count bigint

Number of times functions have been inlined

jit_inlining_time double precision

Total time spent by the statement on inlining functions, in milliseconds

jit_optimization_count bigint

Number of times the statement has been optimized

jit_optimization_time double precision

Total time spent by the statement on optimizing, in milliseconds

jit_emission_count bigint

Number of times code has been emitted

jit_emission_time double precision

Total time spent by the statement on emitting code, in milliseconds

jit_deform_count bigint

Total number of tuple deform functions JIT-compiled by the statement

jit_deform_time double precision

Total time spent by the statement on JIT-compiling tuple deform functions, in milliseconds

parallel_workers_to_launch bigint

Number of parallel workers planned to be launched

parallel_workers_launched bigint

Number of parallel workers actually launched

stats_since timestamp with time zone

Time at which statistics gathering started for this statement

minmax_stats_since timestamp with time zone

Time at which min/max statistics gathering started for this statement (fields min_plan_time, max_plan_time, min_exec_time and max_exec_time)

For security reasons, only superusers and roles with privileges of the pg_read_all_stats role are allowed to see the SQL text and queryid of queries executed by other users. Other users can see the statistics, however, if the view has been installed in their database.

Plannable queries (that is, SELECT, INSERT, UPDATE, DELETE, and MERGE) and utility commands are combined into a single pg_stat_statements entry whenever they have identical query structures according to an internal hash calculation. Typically, two queries will be considered the same for this purpose if they are semantically equivalent except for the values of literal constants appearing in the query.

The following details about constant replacement and queryid only apply when compute_query_id is enabled. If you use an external module instead to compute queryid, you should refer to its documentation for details.

When a constant's value has been ignored for purposes of matching the query to other queries, the constant is replaced by a parameter symbol, such as $1, in the pg_stat_statements display. The rest of the query text is that of the first query that had the particular queryid hash value associated with the pg_stat_statements entry.

Queries on which normalization can be applied may be observed with constant values in pg_stat_statements, especially when there is a high rate of entry deallocations. To reduce the likelihood of this happening, consider increasing pg_stat_statements.max. The pg_stat_statements_info view, discussed below in Section F.32.2, provides statistics about entry deallocations.

In some cases, queries with visibly different texts might get merged into a single pg_stat_statements entry; as explained above, this is expected to happen for semantically equivalent queries. In addition, if the only difference between queries is the number of elements in a list of constants, the list will get squashed down to a single element but shown with a commented-out list indicator:

In addition to these cases, there is a small chance of hash collisions causing unrelated queries to be merged into one entry. (This cannot happen for queries belonging to different users or databases, however.)

Since the queryid hash value is computed on the post-parse-analysis representation of the queries, the opposite is also possible: queries with identical texts might appear as separate entries, if they have different meanings as a result of factors such as different search_path settings.

Consumers of pg_stat_statements may wish to use queryid (perhaps in combination with dbid and userid) as a more stable and reliable identifier for each entry than its query text. However, it is important to understand that there are only limited guarantees around the stability of the queryid hash value. Since the identifier is derived from the post-parse-analysis tree, its value is a function of, among other things, the internal object identifiers appearing in this representation. This has some counterintuitive implications. For example, pg_stat_statements will consider two apparently-identical queries to be distinct, if they reference for example a function that was dropped and recreated between the executions of the two queries. Conversely, if a table is dropped and recreated between the executions of queries, two apparently-identical queries may be considered the same. However, if the alias for a table is different for otherwise-similar queries, these queries will be considered distinct. The hashing process is also sensitive to differences in machine architecture and other facets of the platform. Furthermore, it is not safe to assume that queryid will be stable across major versions of PostgreSQL.

Two servers participating in replication based on physical WAL replay can be expected to have identical queryid values for the same query. However, logical replication schemes do not promise to keep replicas identical in all relevant details, so queryid will not be a useful identifier for accumulating costs across a set of logical replicas. If in doubt, direct testing is recommended.

Generally, it can be assumed that queryid values are stable between minor version releases of PostgreSQL, providing that instances are running on the same machine architecture and the catalog metadata details match. Compatibility will only be broken between minor versions as a last resort.

The parameter symbols used to replace constants in representative query texts start from the next number after the highest $n parameter in the original query text, or $1 if there was none. It's worth noting that in some cases there may be hidden parameter symbols that affect this numbering. For example, PL/pgSQL uses hidden parameter symbols to insert values of function local variables into queries, so that a PL/pgSQL statement like SELECT i + 1 INTO j would have representative text like SELECT i + $2.

The representative query texts are kept in an external disk file, and do not consume shared memory. Therefore, even very lengthy query texts can be stored successfully. However, if many long query texts are accumulated, the external file might grow unmanageably large. As a recovery method if that happens, pg_stat_statements may choose to discard the query texts, whereupon all existing entries in the pg_stat_statements view will show null query fields, though the statistics associated with each queryid are preserved. If this happens, consider reducing pg_stat_statements.max to prevent recurrences.

plans and calls aren't always expected to match because planning and execution statistics are updated at their respective end phase, and only for successful operations. For example, if a statement is successfully planned but fails during the execution phase, only its planning statistics will be updated. If planning is skipped because a cached plan is used, only its execution statistics will be updated.

The statistics of the pg_stat_statements module itself are tracked and made available via a view named pg_stat_statements_info. This view contains only a single row. The columns of the view are shown in Table F.23.

Table F.23. pg_stat_statements_info Columns

Total number of times pg_stat_statements entries about the least-executed statements were deallocated because more distinct statements than pg_stat_statements.max were observed

stats_reset timestamp with time zone

Time at which all statistics in the pg_stat_statements view were last reset.

pg_stat_statements_reset discards statistics gathered so far by pg_stat_statements corresponding to the specified userid, dbid and queryid. If any of the parameters are not specified, the default value 0(invalid) is used for each of them and the statistics that match with other parameters will be reset. If no parameter is specified or all the specified parameters are 0(invalid), it will discard all statistics. If all statistics in the pg_stat_statements view are discarded, it will also reset the statistics in the pg_stat_statements_info view. When minmax_only is true only the values of minimum and maximum planning and execution time will be reset (i.e. min_plan_time, max_plan_time, min_exec_time and max_exec_time fields). The default value for minmax_only parameter is false. Time of last min/max reset performed is shown in minmax_stats_since field of the pg_stat_statements view. This function returns the time of a reset. This time is saved to stats_reset field of pg_stat_statements_info view or to minmax_stats_since field of the pg_stat_statements view if the corresponding reset was actually performed. By default, this function can only be executed by superusers. Access may be granted to others using GRANT.

The pg_stat_statements view is defined in terms of a function also named pg_stat_statements. It is possible for clients to call the pg_stat_statements function directly, and by specifying showtext := false have query text be omitted (that is, the OUT argument that corresponds to the view's query column will return nulls). This feature is intended to support external tools that might wish to avoid the overhead of repeatedly retrieving query texts of indeterminate length. Such tools can instead cache the first query text observed for each entry themselves, since that is all pg_stat_statements itself does, and then retrieve query texts only as needed. Since the server stores query texts in a file, this approach may reduce physical I/O for repeated examination of the pg_stat_statements data.

pg_stat_statements.max is the maximum number of statements tracked by the module (i.e., the maximum number of rows in the pg_stat_statements view). If more distinct statements than that are observed, information about the least-executed statements is discarded. The number of times such information was discarded can be seen in the pg_stat_statements_info view. The default value is 5000. This parameter can only be set at server start.

pg_stat_statements.track controls which statements are counted by the module. Specify top to track top-level statements (those issued directly by clients), all to also track nested statements (such as statements invoked within functions), or none to disable statement statistics collection. The default value is top. Only superusers can change this setting.

pg_stat_statements.track_utility controls whether utility commands are tracked by the module. Utility commands are all those other than SELECT, INSERT, UPDATE, DELETE, and MERGE. The default value is on. Only superusers can change this setting.

pg_stat_statements.track_planning controls whether planning operations and duration are tracked by the module. Enabling this parameter may incur a noticeable performance penalty, especially when statements with identical query structure are executed by many concurrent connections which compete to update a small number of pg_stat_statements entries. The default value is off. Only superusers can change this setting.

pg_stat_statements.save specifies whether to save statement statistics across server shutdowns. If it is off then statistics are not saved at shutdown nor reloaded at server start. The default value is on. This parameter can only be set in the postgresql.conf file or on the server command line.

The module requires additional shared memory proportional to pg_stat_statements.max. Note that this memory is consumed whenever the module is loaded, even if pg_stat_statements.track is set to none.

These parameters must be set in postgresql.conf. Typical usage might be:

Takahiro Itagaki <itagaki.takahiro@oss.ntt.co.jp>. Query normalization added by Peter Geoghegan <peter@2ndquadrant.com>.

**Examples:**

Example 1 (unknown):
```unknown
pg_stat_statements
```

Example 2 (unknown):
```unknown
pg_stat_statements_info
```

Example 3 (unknown):
```unknown
pg_stat_statements
```

Example 4 (unknown):
```unknown
pg_stat_statements
```

---


---

