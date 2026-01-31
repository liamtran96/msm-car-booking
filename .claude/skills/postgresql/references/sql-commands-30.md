# PostgreSQL - Sql Commands (Part 30)

## 


**URL:** https://www.postgresql.org/docs/18/sql-reassign-owned.html

**Contents:**
- REASSIGN OWNED
- Synopsis
- Description
- Parameters
- Notes
- Compatibility
- See Also

REASSIGN OWNED — change the ownership of database objects owned by a database role

REASSIGN OWNED instructs the system to change the ownership of database objects owned by any of the old_roles to new_role.

The name of a role. The ownership of all the objects within the current database, and of all shared objects (databases, tablespaces), owned by this role will be reassigned to new_role.

The name of the role that will be made the new owner of the affected objects.

REASSIGN OWNED is often used to prepare for the removal of one or more roles. Because REASSIGN OWNED does not affect objects within other databases, it is usually necessary to execute this command in each database that contains objects owned by a role that is to be removed.

REASSIGN OWNED requires membership on both the source role(s) and the target role.

The DROP OWNED command is an alternative that simply drops all the database objects owned by one or more roles.

The REASSIGN OWNED command does not affect any privileges granted to the old_roles on objects that are not owned by them. Likewise, it does not affect default privileges created with ALTER DEFAULT PRIVILEGES. Use DROP OWNED to revoke such privileges.

See Section 21.4 for more discussion.

The REASSIGN OWNED command is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
REASSIGN OWNED
```

Example 2 (unknown):
```unknown
REASSIGN OWNED
```

Example 3 (unknown):
```unknown
REASSIGN OWNED
```

Example 4 (unknown):
```unknown
REASSIGN OWNED
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-set-role.html

**Contents:**
- SET ROLE
- Synopsis
- Description
- Notes
- Examples
- Compatibility
- See Also

SET ROLE — set the current user identifier of the current session

This command sets the current user identifier of the current SQL session to be role_name. The role name can be written as either an identifier or a string literal. After SET ROLE, permissions checking for SQL commands is carried out as though the named role were the one that had logged in originally. Note that SET ROLE and SET SESSION AUTHORIZATION are exceptions; permissions checks for those continue to use the current session user and the initial session user (the authenticated user), respectively.

The current session user must have the SET option for the specified role_name, either directly or indirectly via a chain of memberships with the SET option. (If the session user is a superuser, any role can be selected.)

The SESSION and LOCAL modifiers act the same as for the regular SET command.

SET ROLE NONE sets the current user identifier to the current session user identifier, as returned by session_user. RESET ROLE sets the current user identifier to the connection-time setting specified by the command-line options, ALTER ROLE, or ALTER DATABASE, if any such settings exist. Otherwise, RESET ROLE sets the current user identifier to the current session user identifier. These forms can be executed by any user.

Using this command, it is possible to either add privileges or restrict one's privileges. If the session user role has been granted memberships WITH INHERIT TRUE, it automatically has all the privileges of every such role. In this case, SET ROLE effectively drops all the privileges except for those which the target role directly possesses or inherits. On the other hand, if the session user role has been granted memberships WITH INHERIT FALSE, the privileges of the granted roles can't be accessed by default. However, if the role was granted WITH SET TRUE, the session user can use SET ROLE to drop the privileges assigned directly to the session user and instead acquire the privileges available to the named role. If the role was granted WITH INHERIT FALSE, SET FALSE then the privileges of that role cannot be exercised either with or without SET ROLE.

SET ROLE has effects comparable to SET SESSION AUTHORIZATION, but the privilege checks involved are quite different. Also, SET SESSION AUTHORIZATION determines which roles are allowable for later SET ROLE commands, whereas changing roles with SET ROLE does not change the set of roles allowed to a later SET ROLE.

SET ROLE does not process session variables as specified by the role's ALTER ROLE settings; this only happens during login.

SET ROLE cannot be used within a SECURITY DEFINER function.

PostgreSQL allows identifier syntax ("rolename"), while the SQL standard requires the role name to be written as a string literal. SQL does not allow this command during a transaction; PostgreSQL does not make this restriction because there is no reason to. The SESSION and LOCAL modifiers are a PostgreSQL extension, as is the RESET syntax.

**Examples:**

Example 1 (unknown):
```unknown
SET SESSION AUTHORIZATION
```

Example 2 (rust):
```rust
SET ROLE NONE
```

Example 3 (unknown):
```unknown
session_user
```

Example 4 (unknown):
```unknown
ALTER DATABASE
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alteroperator.html

**Contents:**
- ALTER OPERATOR
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

ALTER OPERATOR — change the definition of an operator

ALTER OPERATOR changes the definition of an operator.

You must own the operator to use ALTER OPERATOR. To alter the owner, you must be able to SET ROLE to the new owning role, and that role must have CREATE privilege on the operator's schema. (These restrictions enforce that altering the owner doesn't do anything you couldn't do by dropping and recreating the operator. However, a superuser can alter ownership of any operator anyway.)

The name (optionally schema-qualified) of an existing operator.

The data type of the operator's left operand; write NONE if the operator has no left operand.

The data type of the operator's right operand.

The new owner of the operator.

The new schema for the operator.

The restriction selectivity estimator function for this operator; write NONE to remove existing selectivity estimator.

The join selectivity estimator function for this operator; write NONE to remove existing selectivity estimator.

The commutator of this operator. Can only be changed if the operator does not have an existing commutator.

The negator of this operator. Can only be changed if the operator does not have an existing negator.

Indicates this operator can support a hash join. Can only be enabled and not disabled.

Indicates this operator can support a merge join. Can only be enabled and not disabled.

Refer to Section 36.14 and Section 36.15 for further information.

Since commutators come in pairs that are commutators of each other, ALTER OPERATOR SET COMMUTATOR will also set the commutator of the com_op to be the target operator. Likewise, ALTER OPERATOR SET NEGATOR will also set the negator of the neg_op to be the target operator. Therefore, you must own the commutator or negator operator as well as the target operator.

Change the owner of a custom operator a @@ b for type text:

Change the restriction and join selectivity estimator functions of a custom operator a && b for type int[]:

Mark the && operator as being its own commutator:

There is no ALTER OPERATOR statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
ALTER OPERATOR
```

Example 2 (unknown):
```unknown
ALTER OPERATOR
```

Example 3 (unknown):
```unknown
ALTER OPERATOR SET COMMUTATOR
```

Example 4 (unknown):
```unknown
ALTER OPERATOR SET NEGATOR
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-analyze.html

**Contents:**
- ANALYZE
- Synopsis
- Description
- Parameters
- Outputs
- Notes
- Compatibility
- See Also

ANALYZE — collect statistics about a database

ANALYZE collects statistics about the contents of tables in the database, and stores the results in the pg_statistic system catalog. Subsequently, the query planner uses these statistics to help determine the most efficient execution plans for queries.

Without a table_and_columns list, ANALYZE processes every table and materialized view in the current database that the current user has permission to analyze. With a list, ANALYZE processes only those table(s). It is further possible to give a list of column names for a table, in which case only the statistics for those columns are collected.

Enables display of progress messages at INFO level.

Specifies that ANALYZE should not wait for any conflicting locks to be released when beginning work on a relation: if a relation cannot be locked immediately without waiting, the relation is skipped. Note that even with this option, ANALYZE may still block when opening the relation's indexes or when acquiring sample rows from partitions, table inheritance children, and some types of foreign tables. Also, while ANALYZE ordinarily processes all partitions of specified partitioned tables, this option will cause ANALYZE to skip all partitions if there is a conflicting lock on the partitioned table.

Specifies the Buffer Access Strategy ring buffer size for ANALYZE. This size is used to calculate the number of shared buffers which will be reused as part of this strategy. 0 disables use of a Buffer Access Strategy. When this option is not specified, ANALYZE uses the value from vacuum_buffer_usage_limit. Higher settings can allow ANALYZE to run more quickly, but having too large a setting may cause too many other useful pages to be evicted from shared buffers. The minimum value is 128 kB and the maximum value is 16 GB.

Specifies whether the selected option should be turned on or off. You can write TRUE, ON, or 1 to enable the option, and FALSE, OFF, or 0 to disable it. The boolean value can also be omitted, in which case TRUE is assumed.

Specifies an amount of memory in kilobytes. Sizes may also be specified as a string containing the numerical size followed by any one of the following memory units: B (bytes), kB (kilobytes), MB (megabytes), GB (gigabytes), or TB (terabytes).

The name (possibly schema-qualified) of a specific table to analyze. If omitted, all regular tables, partitioned tables, and materialized views in the current database are analyzed (but not foreign tables). If ONLY is specified before the table name, only that table is analyzed. If ONLY is not specified, the table and all its inheritance child tables or partitions (if any) are analyzed. Optionally, * can be specified after the table name to explicitly indicate that inheritance child tables (or partitions) are to be analyzed.

The name of a specific column to analyze. Defaults to all columns.

When VERBOSE is specified, ANALYZE emits progress messages to indicate which table is currently being processed. Various statistics about the tables are printed as well.

To analyze a table, one must ordinarily have the MAINTAIN privilege on the table. However, database owners are allowed to analyze all tables in their databases, except shared catalogs. ANALYZE will skip over any tables that the calling user does not have permission to analyze.

Foreign tables are analyzed only when explicitly selected. Not all foreign data wrappers support ANALYZE. If the table's wrapper does not support ANALYZE, the command prints a warning and does nothing.

In the default PostgreSQL configuration, the autovacuum daemon (see Section 24.1.6) takes care of automatic analyzing of tables when they are first loaded with data, and as they change throughout regular operation. When autovacuum is disabled, it is a good idea to run ANALYZE periodically, or just after making major changes in the contents of a table. Accurate statistics will help the planner to choose the most appropriate query plan, and thereby improve the speed of query processing. A common strategy for read-mostly databases is to run VACUUM and ANALYZE once a day during a low-usage time of day. (This will not be sufficient if there is heavy update activity.)

While ANALYZE is running, the search_path is temporarily changed to pg_catalog, pg_temp.

ANALYZE requires only a read lock on the target table, so it can run in parallel with other non-DDL activity on the table.

The statistics collected by ANALYZE usually include a list of some of the most common values in each column and a histogram showing the approximate data distribution in each column. One or both of these can be omitted if ANALYZE deems them uninteresting (for example, in a unique-key column, there are no common values) or if the column data type does not support the appropriate operators. There is more information about the statistics in Chapter 24.

For large tables, ANALYZE takes a random sample of the table contents, rather than examining every row. This allows even very large tables to be analyzed in a small amount of time. Note, however, that the statistics are only approximate, and will change slightly each time ANALYZE is run, even if the actual table contents did not change. This might result in small changes in the planner's estimated costs shown by EXPLAIN. In rare situations, this non-determinism will cause the planner's choices of query plans to change after ANALYZE is run. To avoid this, raise the amount of statistics collected by ANALYZE, as described below.

The extent of analysis can be controlled by adjusting the default_statistics_target configuration variable, or on a column-by-column basis by setting the per-column statistics target with ALTER TABLE ... ALTER COLUMN ... SET STATISTICS. The target value sets the maximum number of entries in the most-common-value list and the maximum number of bins in the histogram. The default target value is 100, but this can be adjusted up or down to trade off accuracy of planner estimates against the time taken for ANALYZE and the amount of space occupied in pg_statistic. In particular, setting the statistics target to zero disables collection of statistics for that column. It might be useful to do that for columns that are never used as part of the WHERE, GROUP BY, or ORDER BY clauses of queries, since the planner will have no use for statistics on such columns.

The largest statistics target among the columns being analyzed determines the number of table rows sampled to prepare the statistics. Increasing the target causes a proportional increase in the time and space needed to do ANALYZE.

One of the values estimated by ANALYZE is the number of distinct values that appear in each column. Because only a subset of the rows are examined, this estimate can sometimes be quite inaccurate, even with the largest possible statistics target. If this inaccuracy leads to bad query plans, a more accurate value can be determined manually and then installed with ALTER TABLE ... ALTER COLUMN ... SET (n_distinct = ...).

If the table being analyzed has inheritance children, ANALYZE gathers two sets of statistics: one on the rows of the parent table only, and a second including rows of both the parent table and all of its children. This second set of statistics is needed when planning queries that process the inheritance tree as a whole. The autovacuum daemon, however, will only consider inserts or updates on the parent table itself when deciding whether to trigger an automatic analyze for that table. If that table is rarely inserted into or updated, the inheritance statistics will not be up to date unless you run ANALYZE manually. By default, ANALYZE will also recursively collect and update the statistics for each inheritance child table. The ONLY keyword may be used to disable this.

For partitioned tables, ANALYZE gathers statistics by sampling rows from all partitions. By default, ANALYZE will also recursively collect and update the statistics for each partition. The ONLY keyword may be used to disable this.

The autovacuum daemon does not process partitioned tables, nor does it process inheritance parents if only the children are ever modified. It is usually necessary to periodically run a manual ANALYZE to keep the statistics of the table hierarchy up to date.

If any child tables or partitions are foreign tables whose foreign data wrappers do not support ANALYZE, those tables are ignored while gathering inheritance statistics.

If the table being analyzed is completely empty, ANALYZE will not record new statistics for that table. Any existing statistics will be retained.

Each backend running ANALYZE will report its progress in the pg_stat_progress_analyze view. See Section 27.4.1 for details.

There is no ANALYZE statement in the SQL standard.

The following syntax was used before PostgreSQL version 11 and is still supported:

**Examples:**

Example 1 (unknown):
```unknown
table_and_columns
```

Example 2 (unknown):
```unknown
table_and_columns
```

Example 3 (unknown):
```unknown
column_name
```

Example 4 (unknown):
```unknown
pg_statistic
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-altersystem.html

**Contents:**
- ALTER SYSTEM
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

ALTER SYSTEM — change a server configuration parameter

ALTER SYSTEM is used for changing server configuration parameters across the entire database cluster. It can be more convenient than the traditional method of manually editing the postgresql.conf file. ALTER SYSTEM writes the given parameter setting to the postgresql.auto.conf file, which is read in addition to postgresql.conf. Setting a parameter to DEFAULT, or using the RESET variant, removes that configuration entry from the postgresql.auto.conf file. Use RESET ALL to remove all such configuration entries.

Values set with ALTER SYSTEM will be effective after the next server configuration reload, or after the next server restart in the case of parameters that can only be changed at server start. A server configuration reload can be commanded by calling the SQL function pg_reload_conf(), running pg_ctl reload, or sending a SIGHUP signal to the main server process.

Only superusers and users granted ALTER SYSTEM privilege on a parameter can change it using ALTER SYSTEM. Also, since this command acts directly on the file system and cannot be rolled back, it is not allowed inside a transaction block or function.

Name of a settable configuration parameter. Available parameters are documented in Chapter 19.

New value of the parameter. Values can be specified as string constants, identifiers, numbers, or comma-separated lists of these, as appropriate for the particular parameter. Values that are neither numbers nor valid identifiers must be quoted. DEFAULT can be written to specify removing the parameter and its value from postgresql.auto.conf.

For some list-accepting parameters, quoted values will produce double-quoted output to preserve whitespace and commas; for others, double-quotes must be used inside single-quoted strings to get this effect.

This command can't be used to set data_directory, allow_alter_system, nor parameters that are not allowed in postgresql.conf (e.g., preset options).

See Section 19.1 for other ways to set the parameters.

ALTER SYSTEM can be disabled by setting allow_alter_system to off, but this is not a security mechanism (as explained in detail in the documentation for this parameter).

Undo that, restoring whatever setting was effective in postgresql.conf:

The ALTER SYSTEM statement is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
configuration_parameter
```

Example 2 (unknown):
```unknown
configuration_parameter
```

Example 3 (unknown):
```unknown
ALTER SYSTEM
```

Example 4 (unknown):
```unknown
postgresql.conf
```

---


---

