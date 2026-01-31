# PostgreSQL - System Views (Part 7)

## 53.3. pg_available_extensions #


**URL:** https://www.postgresql.org/docs/18/view-pg-available-extensions.html

**Contents:**
- 53.3. pg_available_extensions #

The pg_available_extensions view lists the extensions that are available for installation. See also the pg_extension catalog, which shows the extensions currently installed.

Table 53.3. pg_available_extensions Columns

Name of default version, or NULL if none is specified

installed_version text

Currently installed version of the extension, or NULL if not installed

Comment string from the extension's control file

The pg_available_extensions view is read-only.

**Examples:**

Example 1 (unknown):
```unknown
pg_available_extensions
```

Example 2 (unknown):
```unknown
pg_available_extensions
```

Example 3 (unknown):
```unknown
pg_available_extensions
```

Example 4 (unknown):
```unknown
pg_extension
```

---


---

## 53.29. pg_stats #


**URL:** https://www.postgresql.org/docs/18/view-pg-stats.html

**Contents:**
- 53.29. pg_stats #

The view pg_stats provides access to the information stored in the pg_statistic catalog. This view allows access only to rows of pg_statistic that correspond to tables the user has permission to read, and therefore it is safe to allow public read access to this view.

pg_stats is also designed to present the information in a more readable format than the underlying catalog — at the cost that its schema must be extended whenever new slot types are defined for pg_statistic.

Table 53.29. pg_stats Columns

schemaname name (references pg_namespace.nspname)

Name of schema containing table

tablename name (references pg_class.relname)

attname name (references pg_attribute.attname)

Name of column described by this row

If true, this row includes values from child tables, not just the values in the specified table

Fraction of column entries that are null

Average width in bytes of column's entries

If greater than zero, the estimated number of distinct values in the column. If less than zero, the negative of the number of distinct values divided by the number of rows. (The negated form is used when ANALYZE believes that the number of distinct values is likely to increase as the table grows; the positive form is used when the column seems to have a fixed number of possible values.) For example, -1 indicates a unique column in which the number of distinct values is the same as the number of rows.

most_common_vals anyarray

A list of the most common values in the column. (Null if no values seem to be more common than any others.)

most_common_freqs float4[]

A list of the frequencies of the most common values, i.e., number of occurrences of each divided by total number of rows. (Null when most_common_vals is.)

histogram_bounds anyarray

A list of values that divide the column's values into groups of approximately equal population. The values in most_common_vals, if present, are omitted from this histogram calculation. (This column is null if the column data type does not have a < operator or if the most_common_vals list accounts for the entire population.)

Statistical correlation between physical row ordering and logical ordering of the column values. This ranges from -1 to +1. When the value is near -1 or +1, an index scan on the column will be estimated to be cheaper than when it is near zero, due to reduction of random access to the disk. (This column is null if the column data type does not have a < operator.)

most_common_elems anyarray

A list of non-null element values most often appearing within values of the column. (Null for scalar types.)

most_common_elem_freqs float4[]

A list of the frequencies of the most common element values, i.e., the fraction of rows containing at least one instance of the given value. Two or three additional values follow the per-element frequencies; these are the minimum and maximum of the preceding per-element frequencies, and optionally the frequency of null elements. (Null when most_common_elems is.)

elem_count_histogram float4[]

A histogram of the counts of distinct non-null element values within the values of the column, followed by the average number of distinct non-null elements. (Null for scalar types.)

range_length_histogram anyarray

A histogram of the lengths of non-empty and non-null range values of a range type column. (Null for non-range types.)

This histogram is calculated using the subtype_diff range function regardless of whether range bounds are inclusive.

range_empty_frac float4

Fraction of column entries whose values are empty ranges. (Null for non-range types.)

range_bounds_histogram anyarray

A histogram of lower and upper bounds of non-empty and non-null range values. (Null for non-range types.)

These two histograms are represented as a single array of ranges, whose lower bounds represent the histogram of lower bounds, and upper bounds represent the histogram of upper bounds.

The maximum number of entries in the array fields can be controlled on a column-by-column basis using the ALTER TABLE SET STATISTICS command, or globally by setting the default_statistics_target run-time parameter.

**Examples:**

Example 1 (unknown):
```unknown
pg_statistic
```

Example 2 (unknown):
```unknown
pg_statistic
```

Example 3 (unknown):
```unknown
pg_statistic
```

Example 4 (unknown):
```unknown
pg_namespace
```

---


---

## 53.11. pg_ident_file_mappings #


**URL:** https://www.postgresql.org/docs/18/view-pg-ident-file-mappings.html

**Contents:**
- 53.11. pg_ident_file_mappings #

The view pg_ident_file_mappings provides a summary of the contents of the client user name mapping configuration file, pg_ident.conf. A row appears in this view for each non-empty, non-comment line in the file, with annotations indicating whether the map could be applied successfully.

This view can be helpful for checking whether planned changes in the authentication configuration file will work, or for diagnosing a previous failure. Note that this view reports on the current contents of the file, not on what was last loaded by the server.

By default, the pg_ident_file_mappings view can be read only by superusers.

Table 53.11. pg_ident_file_mappings Columns

Number of this map, in priority order, if valid, otherwise NULL

Name of the file containing this map

Line number of this map in file_name

Detected user name of the client

Requested PostgreSQL user name

If not NULL, an error message indicating why this line could not be processed

Usually, a row reflecting an incorrect entry will have values for only the line_number and error fields.

See Chapter 20 for more information about client authentication configuration.

**Examples:**

Example 1 (unknown):
```unknown
pg_ident_file_mappings
```

Example 2 (unknown):
```unknown
pg_ident_file_mappings
```

Example 3 (unknown):
```unknown
pg_ident_file_mappings
```

Example 4 (unknown):
```unknown
pg_ident.conf
```

---


---

## 53.19. pg_replication_origin_status #


**URL:** https://www.postgresql.org/docs/18/view-pg-replication-origin-status.html

**Contents:**
- 53.19. pg_replication_origin_status #

The pg_replication_origin_status view contains information about how far replay for a certain origin has progressed. For more on replication origins see Chapter 48.

Table 53.19. pg_replication_origin_status Columns

local_id oid (references pg_replication_origin.roident)

internal node identifier

external_id text (references pg_replication_origin.roname)

external node identifier

The origin node's LSN up to which data has been replicated.

This node's LSN at which remote_lsn has been replicated. Used to flush commit records before persisting data to disk when using asynchronous commits.

**Examples:**

Example 1 (unknown):
```unknown
pg_replication_origin_status
```

Example 2 (unknown):
```unknown
pg_replication_origin_status
```

Example 3 (unknown):
```unknown
pg_replication_origin_status
```

Example 4 (unknown):
```unknown
pg_replication_origin_status
```

---


---

## 53.6. pg_config #


**URL:** https://www.postgresql.org/docs/18/view-pg-config.html

**Contents:**
- 53.6. pg_config #

The view pg_config describes the compile-time configuration parameters of the currently installed version of PostgreSQL. It is intended, for example, to be used by software packages that want to interface to PostgreSQL to facilitate finding the required header files and libraries. It provides the same basic information as the pg_config PostgreSQL client application.

By default, the pg_config view can be read only by superusers.

Table 53.6. pg_config Columns

**Examples:**

Example 1 (unknown):
```unknown
pg_backend_memory_contexts
```

---


---

## 53.17. pg_prepared_xacts #


**URL:** https://www.postgresql.org/docs/18/view-pg-prepared-xacts.html

**Contents:**
- 53.17. pg_prepared_xacts #

The view pg_prepared_xacts displays information about transactions that are currently prepared for two-phase commit (see PREPARE TRANSACTION for details).

pg_prepared_xacts contains one row per prepared transaction. An entry is removed when the transaction is committed or rolled back.

Table 53.17. pg_prepared_xacts Columns

Numeric transaction identifier of the prepared transaction

Global transaction identifier that was assigned to the transaction

Time at which the transaction was prepared for commit

owner name (references pg_authid.rolname)

Name of the user that executed the transaction

database name (references pg_database.datname)

Name of the database in which the transaction was executed

When the pg_prepared_xacts view is accessed, the internal transaction manager data structures are momentarily locked, and a copy is made for the view to display. This ensures that the view produces a consistent set of results, while not blocking normal operations longer than necessary. Nonetheless there could be some impact on database performance if this view is frequently accessed.

**Examples:**

Example 1 (unknown):
```unknown
pg_prepared_xacts
```

Example 2 (unknown):
```unknown
pg_prepared_xacts
```

Example 3 (unknown):
```unknown
pg_prepared_xacts
```

Example 4 (unknown):
```unknown
pg_prepared_xacts
```

---


---

