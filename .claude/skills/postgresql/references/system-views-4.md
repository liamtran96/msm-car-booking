# PostgreSQL - System Views (Part 4)

## 53.2. pg_aios #


**URL:** https://www.postgresql.org/docs/18/view-pg-aios.html

**Contents:**
- 53.2. pg_aios #

The pg_aios view lists all Asynchronous I/O handles that are currently in-use. An I/O handle is used to reference an I/O operation that is being prepared, executed or is in the process of completing. pg_aios contains one row for each I/O handle.

This view is mainly useful for developers of PostgreSQL, but may also be useful when tuning PostgreSQL.

Table 53.2. pg_aios Columns

Process ID of the server process that is issuing this I/O.

Identifier of the I/O handle. Handles are reused once the I/O completed (or if the handle is released before I/O is started). On reuse pg_aios.io_generation is incremented.

Generation of the I/O handle.

State of the I/O handle:

HANDED_OUT, referenced by code but not yet used

DEFINED, information necessary for execution is known

STAGED, ready for execution

SUBMITTED, submitted for execution

COMPLETED_IO, finished, but result has not yet been processed

COMPLETED_SHARED, shared completion processing completed

COMPLETED_LOCAL, backend local completion processing completed

Operation performed using the I/O handle:

invalid, not yet known

readv, a vectored read

writev, a vectored write

Offset of the I/O operation.

Length of the I/O operation.

What kind of object is the I/O targeting:

smgr, I/O on relations

Length of the data associated with the I/O operation. For I/O to/from shared_buffers and temp_buffers, this indicates the number of buffers the I/O is operating on.

Low-level result of the I/O operation, or NULL if the operation has not yet completed.

High-level result of the I/O operation:

UNKNOWN means that the result of the operation is not yet known.

OK means the I/O completed successfully.

PARTIAL means that the I/O completed without error, but did not process all data. Commonly callers will need to retry and perform the remainder of the work in a separate I/O.

WARNING means that the I/O completed without error, but that execution of the IO triggered a warning. E.g. when encountering a corrupted buffer with zero_damaged_pages enabled.

ERROR means the I/O failed with an error.

Description of what the I/O operation is targeting.

Flag indicating whether the I/O is executed synchronously.

Flag indicating whether the I/O references process local memory.

Flag indicating whether the I/O is buffered I/O.

The pg_aios view is read-only.

By default, the pg_aios view can be read only by superusers or roles with privileges of the pg_read_all_stats role.

**Examples:**

Example 1 (unknown):
```unknown
io_generation
```

Example 2 (unknown):
```unknown
io_generation
```

Example 3 (unknown):
```unknown
COMPLETED_IO
```

Example 4 (unknown):
```unknown
COMPLETED_SHARED
```

---


---

## 53.31. pg_stats_ext_exprs #


**URL:** https://www.postgresql.org/docs/18/view-pg-stats-ext-exprs.html

**Contents:**
- 53.31. pg_stats_ext_exprs #

The view pg_stats_ext_exprs provides access to information about all expressions included in extended statistics objects, combining information stored in the pg_statistic_ext and pg_statistic_ext_data catalogs. This view allows access only to rows of pg_statistic_ext and pg_statistic_ext_data that correspond to tables the user owns, and therefore it is safe to allow public read access to this view.

pg_stats_ext_exprs is also designed to present the information in a more readable format than the underlying catalogs — at the cost that its schema must be extended whenever the structure of statistics in pg_statistic_ext changes.

Table 53.31. pg_stats_ext_exprs Columns

schemaname name (references pg_namespace.nspname)

Name of schema containing table

tablename name (references pg_class.relname)

Name of table the statistics object is defined on

statistics_schemaname name (references pg_namespace.nspname)

Name of schema containing extended statistics object

statistics_name name (references pg_statistic_ext.stxname)

Name of extended statistics object

statistics_owner name (references pg_authid.rolname)

Owner of the extended statistics object

Expression included in the extended statistics object

inherited bool (references pg_statistic_ext_data.stxdinherit)

If true, the stats include values from child tables, not just the values in the specified relation

Fraction of expression entries that are null

Average width in bytes of expression's entries

If greater than zero, the estimated number of distinct values in the expression. If less than zero, the negative of the number of distinct values divided by the number of rows. (The negated form is used when ANALYZE believes that the number of distinct values is likely to increase as the table grows; the positive form is used when the expression seems to have a fixed number of possible values.) For example, -1 indicates a unique expression in which the number of distinct values is the same as the number of rows.

most_common_vals anyarray

A list of the most common values in the expression. (Null if no values seem to be more common than any others.)

most_common_freqs float4[]

A list of the frequencies of the most common values, i.e., number of occurrences of each divided by total number of rows. (Null when most_common_vals is.)

histogram_bounds anyarray

A list of values that divide the expression's values into groups of approximately equal population. The values in most_common_vals, if present, are omitted from this histogram calculation. (This expression is null if the expression data type does not have a < operator or if the most_common_vals list accounts for the entire population.)

Statistical correlation between physical row ordering and logical ordering of the expression values. This ranges from -1 to +1. When the value is near -1 or +1, an index scan on the expression will be estimated to be cheaper than when it is near zero, due to reduction of random access to the disk. (This expression is null if the expression's data type does not have a < operator.)

most_common_elems anyarray

A list of non-null element values most often appearing within values of the expression. (Null for scalar types.)

most_common_elem_freqs float4[]

A list of the frequencies of the most common element values, i.e., the fraction of rows containing at least one instance of the given value. Two or three additional values follow the per-element frequencies; these are the minimum and maximum of the preceding per-element frequencies, and optionally the frequency of null elements. (Null when most_common_elems is.)

elem_count_histogram float4[]

A histogram of the counts of distinct non-null element values within the values of the expression, followed by the average number of distinct non-null elements. (Null for scalar types.)

The maximum number of entries in the array fields can be controlled on a column-by-column basis using the ALTER TABLE SET STATISTICS command, or globally by setting the default_statistics_target run-time parameter.

**Examples:**

Example 1 (unknown):
```unknown
pg_stats_ext_exprs
```

Example 2 (unknown):
```unknown
pg_stats_ext_exprs
```

Example 3 (unknown):
```unknown
pg_stats_ext_exprs
```

Example 4 (unknown):
```unknown
pg_statistic_ext
```

---


---

## 53.16. pg_prepared_statements #


**URL:** https://www.postgresql.org/docs/18/view-pg-prepared-statements.html

**Contents:**
- 53.16. pg_prepared_statements #

The pg_prepared_statements view displays all the prepared statements that are available in the current session. See PREPARE for more information about prepared statements.

pg_prepared_statements contains one row for each prepared statement. Rows are added to the view when a new prepared statement is created and removed when a prepared statement is released (for example, via the DEALLOCATE command).

Table 53.16. pg_prepared_statements Columns

The identifier of the prepared statement

The query string submitted by the client to create this prepared statement. For prepared statements created via SQL, this is the PREPARE statement submitted by the client. For prepared statements created via the frontend/backend protocol, this is the text of the prepared statement itself.

prepare_time timestamptz

The time at which the prepared statement was created

parameter_types regtype[]

The expected parameter types for the prepared statement in the form of an array of regtype. The OID corresponding to an element of this array can be obtained by casting the regtype value to oid.

result_types regtype[]

The types of the columns returned by the prepared statement in the form of an array of regtype. The OID corresponding to an element of this array can be obtained by casting the regtype value to oid. If the prepared statement does not provide a result (e.g., a DML statement), then this field will be null.

true if the prepared statement was created via the PREPARE SQL command; false if the statement was prepared via the frontend/backend protocol

Number of times generic plan was chosen

Number of times custom plan was chosen

The pg_prepared_statements view is read-only.

**Examples:**

Example 1 (unknown):
```unknown
pg_prepared_statements
```

Example 2 (unknown):
```unknown
pg_prepared_statements
```

Example 3 (unknown):
```unknown
pg_prepared_statements
```

Example 4 (unknown):
```unknown
pg_prepared_statements
```

---


---

## 53.10. pg_hba_file_rules #


**URL:** https://www.postgresql.org/docs/18/view-pg-hba-file-rules.html

**Contents:**
- 53.10. pg_hba_file_rules #

The view pg_hba_file_rules provides a summary of the contents of the client authentication configuration file, pg_hba.conf. A row appears in this view for each non-empty, non-comment line in the file, with annotations indicating whether the rule could be applied successfully.

This view can be helpful for checking whether planned changes in the authentication configuration file will work, or for diagnosing a previous failure. Note that this view reports on the current contents of the file, not on what was last loaded by the server.

By default, the pg_hba_file_rules view can be read only by superusers.

Table 53.10. pg_hba_file_rules Columns

Number of this rule, if valid, otherwise NULL. This indicates the order in which each rule is considered until a match is found during authentication.

Name of the file containing this rule

Line number of this rule in file_name

List of database name(s) to which this rule applies

List of user and group name(s) to which this rule applies

Host name or IP address, or one of all, samehost, or samenet, or null for local connections

IP address mask, or null if not applicable

Authentication method

Options specified for authentication method, if any

If not null, an error message indicating why this line could not be processed

Usually, a row reflecting an incorrect entry will have values for only the line_number and error fields.

See Chapter 20 for more information about client authentication configuration.

**Examples:**

Example 1 (unknown):
```unknown
pg_hba_file_rules
```

Example 2 (unknown):
```unknown
pg_hba_file_rules
```

Example 3 (unknown):
```unknown
pg_hba_file_rules
```

Example 4 (unknown):
```unknown
pg_hba.conf
```

---


---

## 53.12. pg_indexes #


**URL:** https://www.postgresql.org/docs/18/view-pg-indexes.html

**Contents:**
- 53.12. pg_indexes #

The view pg_indexes provides access to useful information about each index in the database.

Table 53.12. pg_indexes Columns

schemaname name (references pg_namespace.nspname)

Name of schema containing table and index

tablename name (references pg_class.relname)

Name of table the index is for

indexname name (references pg_class.relname)

tablespace name (references pg_tablespace.spcname)

Name of tablespace containing index (null if default for database)

Index definition (a reconstructed CREATE INDEX command)

**Examples:**

Example 1 (unknown):
```unknown
pg_namespace
```

Example 2 (unknown):
```unknown
pg_tablespace
```

Example 3 (unknown):
```unknown
pg_ident_file_mappings
```

---


---

