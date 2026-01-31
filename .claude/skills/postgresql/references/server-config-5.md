# PostgreSQL - Server Config (Part 5)

## 19.1. Setting Parameters #


**URL:** https://www.postgresql.org/docs/18/config-setting.html

**Contents:**
- 19.1. Setting Parameters #
  - 19.1.1. Parameter Names and Values #
  - 19.1.2. Parameter Interaction via the Configuration File #
  - 19.1.3. Parameter Interaction via SQL #
  - 19.1.4. Parameter Interaction via the Shell #
  - 19.1.5. Managing Configuration File Contents #

All parameter names are case-insensitive. Every parameter takes a value of one of five types: boolean, string, integer, floating point, or enumerated (enum). The type determines the syntax for setting the parameter:

Boolean: Values can be written as on, off, true, false, yes, no, 1, 0 (all case-insensitive) or any unambiguous prefix of one of these.

String: In general, enclose the value in single quotes, doubling any single quotes within the value. Quotes can usually be omitted if the value is a simple number or identifier, however. (Values that match an SQL keyword require quoting in some contexts.)

Numeric (integer and floating point): Numeric parameters can be specified in the customary integer and floating-point formats; fractional values are rounded to the nearest integer if the parameter is of integer type. Integer parameters additionally accept hexadecimal input (beginning with 0x) and octal input (beginning with 0), but these formats cannot have a fraction. Do not use thousands separators. Quotes are not required, except for hexadecimal input.

Numeric with Unit: Some numeric parameters have an implicit unit, because they describe quantities of memory or time. The unit might be bytes, kilobytes, blocks (typically eight kilobytes), milliseconds, seconds, or minutes. An unadorned numeric value for one of these settings will use the setting's default unit, which can be learned from pg_settings.unit. For convenience, settings can be given with a unit specified explicitly, for example '120 ms' for a time value, and they will be converted to whatever the parameter's actual unit is. Note that the value must be written as a string (with quotes) to use this feature. The unit name is case-sensitive, and there can be whitespace between the numeric value and the unit.

Valid memory units are B (bytes), kB (kilobytes), MB (megabytes), GB (gigabytes), and TB (terabytes). The multiplier for memory units is 1024, not 1000.

Valid time units are us (microseconds), ms (milliseconds), s (seconds), min (minutes), h (hours), and d (days).

If a fractional value is specified with a unit, it will be rounded to a multiple of the next smaller unit if there is one. For example, 30.1 GB will be converted to 30822 MB not 32319628902 B. If the parameter is of integer type, a final rounding to integer occurs after any unit conversion.

Enumerated: Enumerated-type parameters are written in the same way as string parameters, but are restricted to have one of a limited set of values. The values allowable for such a parameter can be found from pg_settings.enumvals. Enum parameter values are case-insensitive.

The most fundamental way to set these parameters is to edit the file postgresql.conf, which is normally kept in the data directory. A default copy is installed when the database cluster directory is initialized. An example of what this file might look like is:

One parameter is specified per line. The equal sign between name and value is optional. Whitespace is insignificant (except within a quoted parameter value) and blank lines are ignored. Hash marks (#) designate the remainder of the line as a comment. Parameter values that are not simple identifiers or numbers must be single-quoted. To embed a single quote in a parameter value, write either two quotes (preferred) or backslash-quote. If the file contains multiple entries for the same parameter, all but the last one are ignored.

Parameters set in this way provide default values for the cluster. The settings seen by active sessions will be these values unless they are overridden. The following sections describe ways in which the administrator or user can override these defaults.

The configuration file is reread whenever the main server process receives a SIGHUP signal; this signal is most easily sent by running pg_ctl reload from the command line or by calling the SQL function pg_reload_conf(). The main server process also propagates this signal to all currently running server processes, so that existing sessions also adopt the new values (this will happen after they complete any currently-executing client command). Alternatively, you can send the signal to a single server process directly. Some parameters can only be set at server start; any changes to their entries in the configuration file will be ignored until the server is restarted. Invalid parameter settings in the configuration file are likewise ignored (but logged) during SIGHUP processing.

In addition to postgresql.conf, a PostgreSQL data directory contains a file postgresql.auto.conf, which has the same format as postgresql.conf but is intended to be edited automatically, not manually. This file holds settings provided through the ALTER SYSTEM command. This file is read whenever postgresql.conf is, and its settings take effect in the same way. Settings in postgresql.auto.conf override those in postgresql.conf.

External tools may also modify postgresql.auto.conf. It is not recommended to do this while the server is running unless allow_alter_system is set to off, since a concurrent ALTER SYSTEM command could overwrite such changes. Such tools might simply append new settings to the end, or they might choose to remove duplicate settings and/or comments (as ALTER SYSTEM will).

The system view pg_file_settings can be helpful for pre-testing changes to the configuration files, or for diagnosing problems if a SIGHUP signal did not have the desired effects.

PostgreSQL provides three SQL commands to establish configuration defaults. The already-mentioned ALTER SYSTEM command provides an SQL-accessible means of changing global defaults; it is functionally equivalent to editing postgresql.conf. In addition, there are two commands that allow setting of defaults on a per-database or per-role basis:

The ALTER DATABASE command allows global settings to be overridden on a per-database basis.

The ALTER ROLE command allows both global and per-database settings to be overridden with user-specific values.

Values set with ALTER DATABASE and ALTER ROLE are applied only when starting a fresh database session. They override values obtained from the configuration files or server command line, and constitute defaults for the rest of the session. Note that some settings cannot be changed after server start, and so cannot be set with these commands (or the ones listed below).

Once a client is connected to the database, PostgreSQL provides two additional SQL commands (and equivalent functions) to interact with session-local configuration settings:

The SHOW command allows inspection of the current value of any parameter. The corresponding SQL function is current_setting(setting_name text) (see Section 9.28.1).

The SET command allows modification of the current value of those parameters that can be set locally to a session; it has no effect on other sessions. Many parameters can be set this way by any user, but some can only be set by superusers and users who have been granted SET privilege on that parameter. The corresponding SQL function is set_config(setting_name, new_value, is_local) (see Section 9.28.1).

In addition, the system view pg_settings can be used to view and change session-local values:

Querying this view is similar to using SHOW ALL but provides more detail. It is also more flexible, since it's possible to specify filter conditions or join against other relations.

Using UPDATE on this view, specifically updating the setting column, is the equivalent of issuing SET commands. For example, the equivalent of

In addition to setting global defaults or attaching overrides at the database or role level, you can pass settings to PostgreSQL via shell facilities. Both the server and libpq client library accept parameter values via the shell.

During server startup, parameter settings can be passed to the postgres command via the -c name=value command-line parameter, or its equivalent --name=value variation. For example,

Settings provided in this way override those set via postgresql.conf or ALTER SYSTEM, so they cannot be changed globally without restarting the server.

When starting a client session via libpq, parameter settings can be specified using the PGOPTIONS environment variable. Settings established in this way constitute defaults for the life of the session, but do not affect other sessions. For historical reasons, the format of PGOPTIONS is similar to that used when launching the postgres command; specifically, the -c, or prepended --, before the name must be specified. For example,

Other clients and libraries might provide their own mechanisms, via the shell or otherwise, that allow the user to alter session settings without direct use of SQL commands.

PostgreSQL provides several features for breaking down complex postgresql.conf files into sub-files. These features are especially useful when managing multiple servers with related, but not identical, configurations.

In addition to individual parameter settings, the postgresql.conf file can contain include directives, which specify another file to read and process as if it were inserted into the configuration file at this point. This feature allows a configuration file to be divided into physically separate parts. Include directives simply look like:

If the file name is not an absolute path, it is taken as relative to the directory containing the referencing configuration file. Inclusions can be nested.

There is also an include_if_exists directive, which acts the same as the include directive, except when the referenced file does not exist or cannot be read. A regular include will consider this an error condition, but include_if_exists merely logs a message and continues processing the referencing configuration file.

The postgresql.conf file can also contain include_dir directives, which specify an entire directory of configuration files to include. These look like

Non-absolute directory names are taken as relative to the directory containing the referencing configuration file. Within the specified directory, only non-directory files whose names end with the suffix .conf will be included. File names that start with the . character are also ignored, to prevent mistakes since such files are hidden on some platforms. Multiple files within an include directory are processed in file name order (according to C locale rules, i.e., numbers before letters, and uppercase letters before lowercase ones).

Include files or directories can be used to logically separate portions of the database configuration, rather than having a single large postgresql.conf file. Consider a company that has two database servers, each with a different amount of memory. There are likely elements of the configuration both will share, for things such as logging. But memory-related parameters on the server will vary between the two. And there might be server specific customizations, too. One way to manage this situation is to break the custom configuration changes for your site into three files. You could add this to the end of your postgresql.conf file to include them:

All systems would have the same shared.conf. Each server with a particular amount of memory could share the same memory.conf; you might have one for all servers with 8GB of RAM, another for those having 16GB. And finally server.conf could have truly server-specific configuration information in it.

Another possibility is to create a configuration file directory and put this information into files there. For example, a conf.d directory could be referenced at the end of postgresql.conf:

Then you could name the files in the conf.d directory like this:

This naming convention establishes a clear order in which these files will be loaded. This is important because only the last setting encountered for a particular parameter while the server is reading configuration files will be used. In this example, something set in conf.d/02server.conf would override a value set in conf.d/01memory.conf.

You might instead use this approach to naming the files descriptively:

This sort of arrangement gives a unique name for each configuration file variation. This can help eliminate ambiguity when several servers have their configurations all stored in one place, such as in a version control repository. (Storing database configuration files under version control is another good practice to consider.)

**Examples:**

Example 1 (unknown):
```unknown
pg_settings
```

Example 2 (unknown):
```unknown
32319628902 B
```

Example 3 (unknown):
```unknown
pg_settings
```

Example 4 (unknown):
```unknown
postgresql.conf
```

---


---

## 19.7. Query Planning #


**URL:** https://www.postgresql.org/docs/18/runtime-config-query.html

**Contents:**
- 19.7. Query Planning #
  - 19.7.1. Planner Method Configuration #
  - 19.7.2. Planner Cost Constants #
  - Note
  - Tip
  - 19.7.3. Genetic Query Optimizer #
  - 19.7.4. Other Planner Options #

These configuration parameters provide a crude method of influencing the query plans chosen by the query optimizer. If the default plan chosen by the optimizer for a particular query is not optimal, a temporary solution is to use one of these configuration parameters to force the optimizer to choose a different plan. Better ways to improve the quality of the plans chosen by the optimizer include adjusting the planner cost constants (see Section 19.7.2), running ANALYZE manually, increasing the value of the default_statistics_target configuration parameter, and increasing the amount of statistics collected for specific columns using ALTER TABLE SET STATISTICS.

Enables or disables the query planner's use of async-aware append plan types. The default is on.

Enables or disables the query planner's use of bitmap-scan plan types. The default is on.

Enables or disables the query planner's ability to reorder DISTINCT keys to match the input path's pathkeys. The default is on.

Enables or disables the query planner's use of gather merge plan types. The default is on.

Controls if the query planner will produce a plan which will provide GROUP BY keys sorted in the order of keys of a child node of the plan, such as an index scan. When disabled, the query planner will produce a plan with GROUP BY keys only sorted to match the ORDER BY clause, if any. When enabled, the planner will try to produce a more efficient plan. The default value is on.

Enables or disables the query planner's use of hashed aggregation plan types. The default is on.

Enables or disables the query planner's use of hash-join plan types. The default is on.

Enables or disables the query planner's use of incremental sort steps. The default is on.

Enables or disables the query planner's use of index-scan and index-only-scan plan types. The default is on. Also see enable_indexonlyscan.

Enables or disables the query planner's use of index-only-scan plan types (see Section 11.9). The default is on. The enable_indexscan setting must also be enabled to have the query planner consider index-only-scans.

Enables or disables the query planner's use of materialization. It is impossible to suppress materialization entirely, but turning this variable off prevents the planner from inserting materialize nodes except in cases where it is required for correctness. The default is on.

Enables or disables the query planner's use of memoize plans for caching results from parameterized scans inside nested-loop joins. This plan type allows scans to the underlying plans to be skipped when the results for the current parameters are already in the cache. Less commonly looked up results may be evicted from the cache when more space is required for new entries. The default is on.

Enables or disables the query planner's use of merge-join plan types. The default is on.

Enables or disables the query planner's use of nested-loop join plans. It is impossible to suppress nested-loop joins entirely, but turning this variable off discourages the planner from using one if there are other methods available. The default is on.

Enables or disables the query planner's use of parallel-aware append plan types. The default is on.

Enables or disables the query planner's use of hash-join plan types with parallel hash. Has no effect if hash-join plans are not also enabled. The default is on.

Enables or disables the query planner's ability to eliminate a partitioned table's partitions from query plans. This also controls the planner's ability to generate query plans which allow the query executor to remove (ignore) partitions during query execution. The default is on. See Section 5.12.4 for details.

Enables or disables the query planner's use of partitionwise join, which allows a join between partitioned tables to be performed by joining the matching partitions. Partitionwise join currently applies only when the join conditions include all the partition keys, which must be of the same data type and have one-to-one matching sets of child partitions. With this setting enabled, the number of nodes whose memory usage is restricted by work_mem appearing in the final plan can increase linearly according to the number of partitions being scanned. This can result in a large increase in overall memory consumption during the execution of the query. Query planning also becomes significantly more expensive in terms of memory and CPU. The default value is off.

Enables or disables the query planner's use of partitionwise grouping or aggregation, which allows grouping or aggregation on partitioned tables to be performed separately for each partition. If the GROUP BY clause does not include the partition keys, only partial aggregation can be performed on a per-partition basis, and finalization must be performed later. With this setting enabled, the number of nodes whose memory usage is restricted by work_mem appearing in the final plan can increase linearly according to the number of partitions being scanned. This can result in a large increase in overall memory consumption during the execution of the query. Query planning also becomes significantly more expensive in terms of memory and CPU. The default value is off.

Controls if the query planner will produce a plan which will provide rows which are presorted in the order required for the query's ORDER BY / DISTINCT aggregate functions. When disabled, the query planner will produce a plan which will always require the executor to perform a sort before performing aggregation of each aggregate function containing an ORDER BY or DISTINCT clause. When enabled, the planner will try to produce a more efficient plan which provides input to the aggregate functions which is presorted in the order they require for aggregation. The default value is on.

Enables or disables the query planner's optimization which analyses the query tree and replaces self joins with semantically equivalent single scans. Takes into consideration only plain tables. The default is on.

Enables or disables the query planner's use of sequential scan plan types. It is impossible to suppress sequential scans entirely, but turning this variable off discourages the planner from using one if there are other methods available. The default is on.

Enables or disables the query planner's use of explicit sort steps. It is impossible to suppress explicit sorts entirely, but turning this variable off discourages the planner from using one if there are other methods available. The default is on.

Enables or disables the query planner's use of TID scan plan types. The default is on.

The cost variables described in this section are measured on an arbitrary scale. Only their relative values matter, hence scaling them all up or down by the same factor will result in no change in the planner's choices. By default, these cost variables are based on the cost of sequential page fetches; that is, seq_page_cost is conventionally set to 1.0 and the other cost variables are set with reference to that. But you can use a different scale if you prefer, such as actual execution times in milliseconds on a particular machine.

Unfortunately, there is no well-defined method for determining ideal values for the cost variables. They are best treated as averages over the entire mix of queries that a particular installation will receive. This means that changing them on the basis of just a few experiments is very risky.

Sets the planner's estimate of the cost of a disk page fetch that is part of a series of sequential fetches. The default is 1.0. This value can be overridden for tables and indexes in a particular tablespace by setting the tablespace parameter of the same name (see ALTER TABLESPACE).

Sets the planner's estimate of the cost of a non-sequentially-fetched disk page. The default is 4.0. This value can be overridden for tables and indexes in a particular tablespace by setting the tablespace parameter of the same name (see ALTER TABLESPACE).

Reducing this value relative to seq_page_cost will cause the system to prefer index scans; raising it will make index scans look relatively more expensive. You can raise or lower both values together to change the importance of disk I/O costs relative to CPU costs, which are described by the following parameters.

Random access to durable storage is normally much more expensive than four times sequential access. However, a lower default is used (4.0) because the majority of random accesses to storage, such as indexed reads, are assumed to be in cache. Also, the latency of network-attached storage tends to reduce the relative overhead of random access.

If you believe caching is less frequent than the default value reflects, and network latency is minimal, you can increase random_page_cost to better reflect the true cost of random storage reads. Storage that has a higher random read cost relative to sequential, like magnetic disks, might also be better modeled with a higher value for random_page_cost. Correspondingly, if your data is likely to be completely in cache, such as when the database is smaller than the total server memory, or network latency is high, decreasing random_page_cost might be appropriate.

Although the system will let you set random_page_cost to less than seq_page_cost, it is not physically sensible to do so. However, setting them equal makes sense if the database is entirely cached in RAM, since in that case there is no penalty for touching pages out of sequence. Also, in a heavily-cached database you should lower both values relative to the CPU parameters, since the cost of fetching a page already in RAM is much smaller than it would normally be.

Sets the planner's estimate of the cost of processing each row during a query. The default is 0.01.

Sets the planner's estimate of the cost of processing each index entry during an index scan. The default is 0.005.

Sets the planner's estimate of the cost of processing each operator or function executed during a query. The default is 0.0025.

Sets the planner's estimate of the cost of launching parallel worker processes. The default is 1000.

Sets the planner's estimate of the cost of transferring one tuple from a parallel worker process to another process. The default is 0.1.

Sets the minimum amount of table data that must be scanned in order for a parallel scan to be considered. For a parallel sequential scan, the amount of table data scanned is always equal to the size of the table, but when indexes are used the amount of table data scanned will normally be less. If this value is specified without units, it is taken as blocks, that is BLCKSZ bytes, typically 8kB. The default is 8 megabytes (8MB).

Sets the minimum amount of index data that must be scanned in order for a parallel scan to be considered. Note that a parallel index scan typically won't touch the entire index; it is the number of pages which the planner believes will actually be touched by the scan which is relevant. This parameter is also used to decide whether a particular index can participate in a parallel vacuum. See VACUUM. If this value is specified without units, it is taken as blocks, that is BLCKSZ bytes, typically 8kB. The default is 512 kilobytes (512kB).

Sets the planner's assumption about the effective size of the disk cache that is available to a single query. This is factored into estimates of the cost of using an index; a higher value makes it more likely index scans will be used, a lower value makes it more likely sequential scans will be used. When setting this parameter you should consider both PostgreSQL's shared buffers and the portion of the kernel's disk cache that will be used for PostgreSQL data files, though some data might exist in both places. Also, take into account the expected number of concurrent queries on different tables, since they will have to share the available space. This parameter has no effect on the size of shared memory allocated by PostgreSQL, nor does it reserve kernel disk cache; it is used only for estimation purposes. The system also does not assume data remains in the disk cache between queries. If this value is specified without units, it is taken as blocks, that is BLCKSZ bytes, typically 8kB. The default is 4 gigabytes (4GB). (If BLCKSZ is not 8kB, the default value scales proportionally to it.)

Sets the query cost above which JIT compilation is activated, if enabled (see Chapter 30). Performing JIT costs planning time but can accelerate query execution. Setting this to -1 disables JIT compilation. The default is 100000.

Sets the query cost above which JIT compilation attempts to inline functions and operators. Inlining adds planning time, but can improve execution speed. It is not meaningful to set this to less than jit_above_cost. Setting this to -1 disables inlining. The default is 500000.

Sets the query cost above which JIT compilation applies expensive optimizations. Such optimization adds planning time, but can improve execution speed. It is not meaningful to set this to less than jit_above_cost, and it is unlikely to be beneficial to set it to more than jit_inline_above_cost. Setting this to -1 disables expensive optimizations. The default is 500000.

The genetic query optimizer (GEQO) is an algorithm that does query planning using heuristic searching. This reduces planning time for complex queries (those joining many relations), at the cost of producing plans that are sometimes inferior to those found by the normal exhaustive-search algorithm. For more information see Chapter 61.

Enables or disables genetic query optimization. This is on by default. It is usually best not to turn it off in production; the geqo_threshold variable provides more granular control of GEQO.

Use genetic query optimization to plan queries with at least this many FROM items involved. (Note that a FULL OUTER JOIN construct counts as only one FROM item.) The default is 12. For simpler queries it is usually best to use the regular, exhaustive-search planner, but for queries with many tables the exhaustive search takes too long, often longer than the penalty of executing a suboptimal plan. Thus, a threshold on the size of the query is a convenient way to manage use of GEQO.

Controls the trade-off between planning time and query plan quality in GEQO. This variable must be an integer in the range from 1 to 10. The default value is five. Larger values increase the time spent doing query planning, but also increase the likelihood that an efficient query plan will be chosen.

geqo_effort doesn't actually do anything directly; it is only used to compute the default values for the other variables that influence GEQO behavior (described below). If you prefer, you can set the other parameters by hand instead.

Controls the pool size used by GEQO, that is the number of individuals in the genetic population. It must be at least two, and useful values are typically 100 to 1000. If it is set to zero (the default setting) then a suitable value is chosen based on geqo_effort and the number of tables in the query.

Controls the number of generations used by GEQO, that is the number of iterations of the algorithm. It must be at least one, and useful values are in the same range as the pool size. If it is set to zero (the default setting) then a suitable value is chosen based on geqo_pool_size.

Controls the selection bias used by GEQO. The selection bias is the selective pressure within the population. Values can be from 1.50 to 2.00; the latter is the default.

Controls the initial value of the random number generator used by GEQO to select random paths through the join order search space. The value can range from zero (the default) to one. Varying the value changes the set of join paths explored, and may result in a better or worse best path being found.

Sets the default statistics target for table columns without a column-specific target set via ALTER TABLE SET STATISTICS. Larger values increase the time needed to do ANALYZE, but might improve the quality of the planner's estimates. The default is 100. For more information on the use of statistics by the PostgreSQL query planner, refer to Section 14.2.

Controls the query planner's use of table constraints to optimize queries. The allowed values of constraint_exclusion are on (examine constraints for all tables), off (never examine constraints), and partition (examine constraints only for inheritance child tables and UNION ALL subqueries). partition is the default setting. It is often used with traditional inheritance trees to improve performance.

When this parameter allows it for a particular table, the planner compares query conditions with the table's CHECK constraints, and omits scanning tables for which the conditions contradict the constraints. For example:

With constraint exclusion enabled, this SELECT will not scan child1000 at all, improving performance.

Currently, constraint exclusion is enabled by default only for cases that are often used to implement table partitioning via inheritance trees. Turning it on for all tables imposes extra planning overhead that is quite noticeable on simple queries, and most often will yield no benefit for simple queries. If you have no tables that are partitioned using traditional inheritance, you might prefer to turn it off entirely. (Note that the equivalent feature for partitioned tables is controlled by a separate parameter, enable_partition_pruning.)

Refer to Section 5.12.5 for more information on using constraint exclusion to implement partitioning.

Sets the planner's estimate of the fraction of a cursor's rows that will be retrieved. The default is 0.1. Smaller values of this setting bias the planner towards using “fast start” plans for cursors, which will retrieve the first few rows quickly while perhaps taking a long time to fetch all rows. Larger values put more emphasis on the total estimated time. At the maximum setting of 1.0, cursors are planned exactly like regular queries, considering only the total estimated time and not how soon the first rows might be delivered.

The planner will merge sub-queries into upper queries if the resulting FROM list would have no more than this many items. Smaller values reduce planning time but might yield inferior query plans. The default is eight. For more information see Section 14.3.

Setting this value to geqo_threshold or more may trigger use of the GEQO planner, resulting in non-optimal plans. See Section 19.7.3.

Determines whether JIT compilation may be used by PostgreSQL, if available (see Chapter 30). The default is on.

The planner will rewrite explicit JOIN constructs (except FULL JOINs) into lists of FROM items whenever a list of no more than this many items would result. Smaller values reduce planning time but might yield inferior query plans.

By default, this variable is set the same as from_collapse_limit, which is appropriate for most uses. Setting it to 1 prevents any reordering of explicit JOINs. Thus, the explicit join order specified in the query will be the actual order in which the relations are joined. Because the query planner does not always choose the optimal join order, advanced users can elect to temporarily set this variable to 1, and then specify the join order they desire explicitly. For more information see Section 14.3.

Setting this value to geqo_threshold or more may trigger use of the GEQO planner, resulting in non-optimal plans. See Section 19.7.3.

Prepared statements (either explicitly prepared or implicitly generated, for example by PL/pgSQL) can be executed using custom or generic plans. Custom plans are made afresh for each execution using its specific set of parameter values, while generic plans do not rely on the parameter values and can be re-used across executions. Thus, use of a generic plan saves planning time, but if the ideal plan depends strongly on the parameter values then a generic plan may be inefficient. The choice between these options is normally made automatically, but it can be overridden with plan_cache_mode. The allowed values are auto (the default), force_custom_plan and force_generic_plan. This setting is considered when a cached plan is to be executed, not when it is prepared. For more information see PREPARE.

Sets the planner's estimate of the average size of the working table of a recursive query, as a multiple of the estimated size of the initial non-recursive term of the query. This helps the planner choose the most appropriate method for joining the working table to the query's other tables. The default value is 10.0. A smaller value such as 1.0 can be helpful when the recursion has low “fan-out” from one step to the next, as for example in shortest-path queries. Graph analytics queries may benefit from larger-than-default values.

**Examples:**

Example 1 (unknown):
```unknown
ALTER TABLE SET STATISTICS
```

Example 2 (unknown):
```unknown
enable_async_append
```

Example 3 (unknown):
```unknown
enable_bitmapscan
```

Example 4 (unknown):
```unknown
enable_distinct_reordering
```

---


---

## 19.15. Preset Options #


**URL:** https://www.postgresql.org/docs/18/runtime-config-preset.html

**Contents:**
- 19.15. Preset Options #

The following “parameters” are read-only. As such, they have been excluded from the sample postgresql.conf file. These options report various aspects of PostgreSQL behavior that might be of interest to certain applications, particularly administrative front-ends. Most of them are determined when PostgreSQL is compiled or when it is installed.

Reports the size of a disk block. It is determined by the value of BLCKSZ when building the server. The default value is 8192 bytes. The meaning of some configuration variables (such as shared_buffers) is influenced by block_size. See Section 19.4 for information.

Reports whether data checksums are enabled for this cluster. See -k for more information.

On Unix systems this parameter reports the permissions the data directory (defined by data_directory) had at server startup. (On Microsoft Windows this parameter will always display 0700.) See the initdb -g option for more information.

Reports whether PostgreSQL has been built with assertions enabled. That is the case if the macro USE_ASSERT_CHECKING is defined when PostgreSQL is built (accomplished e.g., by the configure option --enable-cassert). By default PostgreSQL is built without assertions.

Reports the state of huge pages in the current instance: on, off, or unknown (if displayed with postgres -C). This parameter is useful to determine whether allocation of huge pages was successful under huge_pages=try. See huge_pages for more information.

Reports whether PostgreSQL was built with support for 64-bit-integer dates and times. As of PostgreSQL 10, this is always on.

Reports whether the server is currently in hot standby mode. When this is on, all transactions are forced to be read-only. Within a session, this can change only if the server is promoted to be primary. See Section 26.4 for more information.

Reports the maximum number of function arguments. It is determined by the value of FUNC_MAX_ARGS when building the server. The default value is 100 arguments.

Reports the maximum identifier length. It is determined as one less than the value of NAMEDATALEN when building the server. The default value of NAMEDATALEN is 64; therefore the default max_identifier_length is 63 bytes, which can be less than 63 characters when using multibyte encodings.

Reports the maximum number of index keys. It is determined by the value of INDEX_MAX_KEYS when building the server. The default value is 32 keys.

Reports the number of semaphores that are needed for the server based on the configured number of allowed connections (max_connections), allowed autovacuum worker processes (autovacuum_max_workers), allowed WAL sender processes (max_wal_senders), allowed background processes (max_worker_processes), etc.

Reports the number of blocks (pages) that can be stored within a file segment. It is determined by the value of RELSEG_SIZE when building the server. The maximum size of a segment file in bytes is equal to segment_size multiplied by block_size; by default this is 1GB.

Reports the database encoding (character set). It is determined when the database is created. Ordinarily, clients need only be concerned with the value of client_encoding.

Reports the version number of the server. It is determined by the value of PG_VERSION when building the server.

Reports the version number of the server as an integer. It is determined by the value of PG_VERSION_NUM when building the server.

Reports the size of the main shared memory area, rounded up to the nearest megabyte.

Reports the number of huge pages that are needed for the main shared memory area based on the specified huge_page_size. If huge pages are not supported, this will be -1.

This setting is supported only on Linux. It is always set to -1 on other platforms. For more details about using huge pages on Linux, see Section 18.4.5.

Reports the name of the SSL library that this PostgreSQL server was built with (even if SSL is not currently configured or in use on this instance), for example OpenSSL, or an empty string if none.

Reports the size of a WAL disk block. It is determined by the value of XLOG_BLCKSZ when building the server. The default value is 8192 bytes.

Reports the size of write ahead log segments. The default value is 16MB. See Section 28.5 for more information.

**Examples:**

Example 1 (unknown):
```unknown
postgresql.conf
```

Example 2 (unknown):
```unknown
data_checksums
```

Example 3 (unknown):
```unknown
data_directory_mode
```

Example 4 (unknown):
```unknown
debug_assertions
```

---


---

