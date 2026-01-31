# PostgreSQL - Sql Commands (Part 25)

## 


**URL:** https://www.postgresql.org/docs/18/sql-createstatistics.html

**Contents:**
- CREATE STATISTICS
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

CREATE STATISTICS — define extended statistics

CREATE STATISTICS will create a new extended statistics object tracking data about the specified table, foreign table or materialized view. The statistics object will be created in the current database and will be owned by the user issuing the command.

The CREATE STATISTICS command has two basic forms. The first form allows univariate statistics for a single expression to be collected, providing benefits similar to an expression index without the overhead of index maintenance. This form does not allow the statistics kind to be specified, since the various statistics kinds refer only to multivariate statistics. The second form of the command allows multivariate statistics on multiple columns and/or expressions to be collected, optionally specifying which statistics kinds to include. This form will also automatically cause univariate statistics to be collected on any expressions included in the list.

If a schema name is given (for example, CREATE STATISTICS myschema.mystat ...) then the statistics object is created in the specified schema. Otherwise it is created in the current schema. If given, the name of the statistics object must be distinct from the name of any other statistics object in the same schema.

Do not throw an error if a statistics object with the same name already exists. A notice is issued in this case. Note that only the name of the statistics object is considered here, not the details of its definition. Statistics name is required when IF NOT EXISTS is specified.

The name (optionally schema-qualified) of the statistics object to be created. If the name is omitted, PostgreSQL chooses a suitable name based on the parent table's name and the defined column name(s) and/or expression(s).

A multivariate statistics kind to be computed in this statistics object. Currently supported kinds are ndistinct, which enables n-distinct statistics, dependencies, which enables functional dependency statistics, and mcv which enables most-common values lists. If this clause is omitted, all supported statistics kinds are included in the statistics object. Univariate expression statistics are built automatically if the statistics definition includes any complex expressions rather than just simple column references. For more information, see Section 14.2.2 and Section 69.2.

The name of a table column to be covered by the computed statistics. This is only allowed when building multivariate statistics. At least two column names or expressions must be specified, and their order is not significant.

An expression to be covered by the computed statistics. This may be used to build univariate statistics on a single expression, or as part of a list of multiple column names and/or expressions to build multivariate statistics. In the latter case, separate univariate statistics are built automatically for each expression in the list.

The name (optionally schema-qualified) of the table containing the column(s) the statistics are computed on; see ANALYZE for an explanation of the handling of inheritance and partitions.

You must be the owner of a table to create a statistics object reading it. Once created, however, the ownership of the statistics object is independent of the underlying table(s).

Expression statistics are per-expression and are similar to creating an index on the expression, except that they avoid the overhead of index maintenance. Expression statistics are built automatically for each expression in the statistics object definition.

Extended statistics are not currently used by the planner for selectivity estimations made for table joins. This limitation will likely be removed in a future version of PostgreSQL.

Create table t1 with two functionally dependent columns, i.e., knowledge of a value in the first column is sufficient for determining the value in the other column. Then functional dependency statistics are built on those columns:

Without functional-dependency statistics, the planner would assume that the two WHERE conditions are independent, and would multiply their selectivities together to arrive at a much-too-small row count estimate. With such statistics, the planner recognizes that the WHERE conditions are redundant and does not underestimate the row count.

Create table t2 with two perfectly correlated columns (containing identical data), and an MCV list on those columns:

The MCV list gives the planner more detailed information about the specific values that commonly appear in the table, as well as an upper bound on the selectivities of combinations of values that do not appear in the table, allowing it to generate better estimates in both cases.

Create table t3 with a single timestamp column, and run queries using expressions on that column. Without extended statistics, the planner has no information about the data distribution for the expressions, and uses default estimates. The planner also does not realize that the value of the date truncated to the month is fully determined by the value of the date truncated to the day. Then expression and ndistinct statistics are built on those two expressions:

Without expression and ndistinct statistics, the planner has no information about the number of distinct values for the expressions, and has to rely on default estimates. The equality and range conditions are assumed to have 0.5% selectivity, and the number of distinct values in the expression is assumed to be the same as for the column (i.e. unique). This results in a significant underestimate of the row count in the first two queries. Moreover, the planner has no information about the relationship between the expressions, so it assumes the two WHERE and GROUP BY conditions are independent, and multiplies their selectivities together to arrive at a severe overestimate of the group count in the aggregate query. This is further exacerbated by the lack of accurate statistics for the expressions, forcing the planner to use a default ndistinct estimate for the expression derived from ndistinct for the column. With such statistics, the planner recognizes that the conditions are correlated, and arrives at much more accurate estimates.

There is no CREATE STATISTICS command in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
statistics_name
```

Example 2 (unknown):
```unknown
statistics_name
```

Example 3 (unknown):
```unknown
statistics_kind
```

Example 4 (unknown):
```unknown
column_name
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-importforeignschema.html

**Contents:**
- IMPORT FOREIGN SCHEMA
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

IMPORT FOREIGN SCHEMA — import table definitions from a foreign server

IMPORT FOREIGN SCHEMA creates foreign tables that represent tables existing on a foreign server. The new foreign tables will be owned by the user issuing the command and are created with the correct column definitions and options to match the remote tables.

By default, all tables and views existing in a particular schema on the foreign server are imported. Optionally, the list of tables can be limited to a specified subset, or specific tables can be excluded. The new foreign tables are all created in the target schema, which must already exist.

To use IMPORT FOREIGN SCHEMA, the user must have USAGE privilege on the foreign server, as well as CREATE privilege on the target schema.

The remote schema to import from. The specific meaning of a remote schema depends on the foreign data wrapper in use.

Import only foreign tables matching one of the given table names. Other tables existing in the foreign schema will be ignored.

Exclude specified foreign tables from the import. All tables existing in the foreign schema will be imported except the ones listed here.

The foreign server to import from.

The schema in which the imported foreign tables will be created.

Options to be used during the import. The allowed option names and values are specific to each foreign data wrapper.

Import table definitions from a remote schema foreign_films on server film_server, creating the foreign tables in local schema films:

As above, but import only the two tables actors and directors (if they exist):

The IMPORT FOREIGN SCHEMA command conforms to the SQL standard, except that the OPTIONS clause is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
remote_schema
```

Example 2 (unknown):
```unknown
server_name
```

Example 3 (unknown):
```unknown
local_schema
```

Example 4 (python):
```python
IMPORT FOREIGN SCHEMA
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-creategroup.html

**Contents:**
- CREATE GROUP
- Synopsis
- Description
- Compatibility
- See Also

CREATE GROUP — define a new database role

CREATE GROUP is now an alias for CREATE ROLE.

There is no CREATE GROUP statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
CREATE GROUP
```

Example 2 (unknown):
```unknown
CREATE GROUP
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-execute.html

**Contents:**
- EXECUTE
- Synopsis
- Description
- Parameters
- Outputs
- Examples
- Compatibility
- See Also

EXECUTE — execute a prepared statement

EXECUTE is used to execute a previously prepared statement. Since prepared statements only exist for the duration of a session, the prepared statement must have been created by a PREPARE statement executed earlier in the current session.

If the PREPARE statement that created the statement specified some parameters, a compatible set of parameters must be passed to the EXECUTE statement, or else an error is raised. Note that (unlike functions) prepared statements are not overloaded based on the type or number of their parameters; the name of a prepared statement must be unique within a database session.

For more information on the creation and usage of prepared statements, see PREPARE.

The name of the prepared statement to execute.

The actual value of a parameter to the prepared statement. This must be an expression yielding a value that is compatible with the data type of this parameter, as was determined when the prepared statement was created.

The command tag returned by EXECUTE is that of the prepared statement, and not EXECUTE.

Examples are given in Examples in the PREPARE documentation.

The SQL standard includes an EXECUTE statement, but it is only for use in embedded SQL. This version of the EXECUTE statement also uses a somewhat different syntax.

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-createopfamily.html

**Contents:**
- CREATE OPERATOR FAMILY
- Synopsis
- Description
- Parameters
- Compatibility
- See Also

CREATE OPERATOR FAMILY — define a new operator family

CREATE OPERATOR FAMILY creates a new operator family. An operator family defines a collection of related operator classes, and perhaps some additional operators and support functions that are compatible with these operator classes but not essential for the functioning of any individual index. (Operators and functions that are essential to indexes should be grouped within the relevant operator class, rather than being “loose” in the operator family. Typically, single-data-type operators are bound to operator classes, while cross-data-type operators can be loose in an operator family containing operator classes for both data types.)

The new operator family is initially empty. It should be populated by issuing subsequent CREATE OPERATOR CLASS commands to add contained operator classes, and optionally ALTER OPERATOR FAMILY commands to add “loose” operators and their corresponding support functions.

If a schema name is given then the operator family is created in the specified schema. Otherwise it is created in the current schema. Two operator families in the same schema can have the same name only if they are for different index methods.

The user who defines an operator family becomes its owner. Presently, the creating user must be a superuser. (This restriction is made because an erroneous operator family definition could confuse or even crash the server.)

Refer to Section 36.16 for further information.

The name of the operator family to be created. The name can be schema-qualified.

The name of the index method this operator family is for.

CREATE OPERATOR FAMILY is a PostgreSQL extension. There is no CREATE OPERATOR FAMILY statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
index_method
```

Example 2 (unknown):
```unknown
CREATE OPERATOR FAMILY
```

Example 3 (unknown):
```unknown
CREATE OPERATOR CLASS
```

Example 4 (unknown):
```unknown
ALTER OPERATOR FAMILY
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-reset.html

**Contents:**
- RESET
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

RESET — restore the value of a run-time parameter to the default value

RESET restores run-time parameters to their default values. RESET is an alternative spelling for

Refer to SET for details.

The default value is defined as the value that the parameter would have had, if no SET had ever been issued for it in the current session. The actual source of this value might be a compiled-in default, the configuration file, command-line options, or per-database or per-user default settings. This is subtly different from defining it as “the value that the parameter had at session start”, because if the value came from the configuration file, it will be reset to whatever is specified by the configuration file now. See Chapter 19 for details.

The transactional behavior of RESET is the same as SET: its effects will be undone by transaction rollback.

Name of a settable run-time parameter. Available parameters are documented in Chapter 19 and on the SET reference page.

Resets all settable run-time parameters to default values.

Set the timezone configuration variable to its default value:

RESET is a PostgreSQL extension.

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
configuration_parameter
```

Example 4 (unknown):
```unknown
RESET timezone;
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-checkpoint.html

**Contents:**
- CHECKPOINT
- Synopsis
- Description
- Compatibility

CHECKPOINT — force a write-ahead log checkpoint

A checkpoint is a point in the write-ahead log sequence at which all data files have been updated to reflect the information in the log. All data files will be flushed to disk. Refer to Section 28.5 for more details about what happens during a checkpoint.

The CHECKPOINT command forces an immediate checkpoint when the command is issued, without waiting for a regular checkpoint scheduled by the system (controlled by the settings in Section 19.5.2). CHECKPOINT is not intended for use during normal operation.

If executed during recovery, the CHECKPOINT command will force a restartpoint (see Section 28.5) rather than writing a new checkpoint.

Only superusers or users with the privileges of the pg_checkpoint role can call CHECKPOINT.

The CHECKPOINT command is a PostgreSQL language extension.

---


---

