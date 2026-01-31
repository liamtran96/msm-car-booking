# PostgreSQL - System Views (Part 6)

## 53.27. pg_shmem_allocations #


**URL:** https://www.postgresql.org/docs/18/view-pg-shmem-allocations.html

**Contents:**
- 53.27. pg_shmem_allocations #

The pg_shmem_allocations view shows allocations made from the server's main shared memory segment. This includes both memory allocated by PostgreSQL itself and memory allocated by extensions using the mechanisms detailed in Section 36.10.11.

Note that this view does not include memory allocated using the dynamic shared memory infrastructure.

Table 53.27. pg_shmem_allocations Columns

The name of the shared memory allocation. NULL for unused memory and <anonymous> for anonymous allocations.

The offset at which the allocation starts. NULL for anonymous allocations, since details related to them are not known.

Size of the allocation in bytes

Size of the allocation in bytes including padding. For anonymous allocations, no information about padding is available, so the size and allocated_size columns will always be equal. Padding is not meaningful for free memory, so the columns will be equal in that case also.

Anonymous allocations are allocations that have been made with ShmemAlloc() directly, rather than via ShmemInitStruct() or ShmemInitHash().

By default, the pg_shmem_allocations view can be read only by superusers or roles with privileges of the pg_read_all_stats role.

**Examples:**

Example 1 (unknown):
```unknown
pg_shmem_allocations
```

Example 2 (unknown):
```unknown
pg_shmem_allocations
```

Example 3 (unknown):
```unknown
pg_shmem_allocations
```

Example 4 (unknown):
```unknown
pg_shmem_allocations
```

---


---

## 53.30. pg_stats_ext #


**URL:** https://www.postgresql.org/docs/18/view-pg-stats-ext.html

**Contents:**
- 53.30. pg_stats_ext #

The view pg_stats_ext provides access to information about each extended statistics object in the database, combining information stored in the pg_statistic_ext and pg_statistic_ext_data catalogs. This view allows access only to rows of pg_statistic_ext and pg_statistic_ext_data that correspond to tables the user owns, and therefore it is safe to allow public read access to this view.

pg_stats_ext is also designed to present the information in a more readable format than the underlying catalogs — at the cost that its schema must be extended whenever new types of extended statistics are added to pg_statistic_ext.

Table 53.30. pg_stats_ext Columns

schemaname name (references pg_namespace.nspname)

Name of schema containing table

tablename name (references pg_class.relname)

statistics_schemaname name (references pg_namespace.nspname)

Name of schema containing extended statistics object

statistics_name name (references pg_statistic_ext.stxname)

Name of extended statistics object

statistics_owner name (references pg_authid.rolname)

Owner of the extended statistics object

attnames name[] (references pg_attribute.attname)

Names of the columns included in the extended statistics object

Expressions included in the extended statistics object

Types of extended statistics object enabled for this record

inherited bool (references pg_statistic_ext_data.stxdinherit)

If true, the stats include values from child tables, not just the values in the specified relation

n_distinct pg_ndistinct

N-distinct counts for combinations of column values. If greater than zero, the estimated number of distinct values in the combination. If less than zero, the negative of the number of distinct values divided by the number of rows. (The negated form is used when ANALYZE believes that the number of distinct values is likely to increase as the table grows; the positive form is used when the column seems to have a fixed number of possible values.) For example, -1 indicates a unique combination of columns in which the number of distinct combinations is the same as the number of rows.

dependencies pg_dependencies

Functional dependency statistics

most_common_vals text[]

A list of the most common combinations of values in the columns. (Null if no combinations seem to be more common than any others.)

most_common_val_nulls bool[]

A list of NULL flags for the most common combinations of values. (Null when most_common_vals is.)

most_common_freqs float8[]

A list of the frequencies of the most common combinations, i.e., number of occurrences of each divided by total number of rows. (Null when most_common_vals is.)

most_common_base_freqs float8[]

A list of the base frequencies of the most common combinations, i.e., product of per-value frequencies. (Null when most_common_vals is.)

The maximum number of entries in the array fields can be controlled on a column-by-column basis using the ALTER TABLE SET STATISTICS command, or globally by setting the default_statistics_target run-time parameter.

**Examples:**

Example 1 (unknown):
```unknown
pg_stats_ext
```

Example 2 (unknown):
```unknown
pg_stats_ext
```

Example 3 (unknown):
```unknown
pg_stats_ext
```

Example 4 (unknown):
```unknown
pg_statistic_ext
```

---


---

## 53.38. pg_wait_events #


**URL:** https://www.postgresql.org/docs/18/view-pg-wait-events.html

**Contents:**
- 53.38. pg_wait_events #

The view pg_wait_events provides description about the wait events.

Table 53.38. pg_wait_events Columns

Wait event description

**Examples:**

Example 1 (unknown):
```unknown
pg_wait_events
```

Example 2 (unknown):
```unknown
pg_wait_events
```

Example 3 (unknown):
```unknown
pg_wait_events
```

Example 4 (unknown):
```unknown
pg_wait_events
```

---


---

## 53.18. pg_publication_tables #


**URL:** https://www.postgresql.org/docs/18/view-pg-publication-tables.html

**Contents:**
- 53.18. pg_publication_tables #

The view pg_publication_tables provides information about the mapping between publications and information of tables they contain. Unlike the underlying catalog pg_publication_rel, this view expands publications defined as FOR ALL TABLES and FOR TABLES IN SCHEMA, so for such publications there will be a row for each eligible table.

Table 53.18. pg_publication_tables Columns

pubname name (references pg_publication.pubname)

schemaname name (references pg_namespace.nspname)

Name of schema containing table

tablename name (references pg_class.relname)

attnames name[] (references pg_attribute.attname)

Names of table columns included in the publication. This contains all the columns of the table when the user didn't specify the column list for the table.

Expression for the table's publication qualifying condition

**Examples:**

Example 1 (unknown):
```unknown
pg_publication_tables
```

Example 2 (unknown):
```unknown
pg_publication_tables
```

Example 3 (unknown):
```unknown
pg_publication_tables
```

Example 4 (unknown):
```unknown
pg_publication_rel
```

---


---

## 53.26. pg_shadow #


**URL:** https://www.postgresql.org/docs/18/view-pg-shadow.html

**Contents:**
- 53.26. pg_shadow #

The view pg_shadow exists for backwards compatibility: it emulates a catalog that existed in PostgreSQL before version 8.1. It shows properties of all roles that are marked as rolcanlogin in pg_authid.

The name stems from the fact that this table should not be readable by the public since it contains passwords. pg_user is a publicly readable view on pg_shadow that blanks out the password field.

Table 53.26. pg_shadow Columns

usename name (references pg_authid.rolname)

usesysid oid (references pg_authid.oid)

User can create databases

User can initiate streaming replication and put the system in and out of backup mode.

User bypasses every row-level security policy, see Section 5.9 for more information.

Encrypted password; null if none. See pg_authid for details of how encrypted passwords are stored.

Password expiry time (only used for password authentication)

Session defaults for run-time configuration variables

**Examples:**

Example 1 (unknown):
```unknown
rolcanlogin
```

Example 2 (unknown):
```unknown
usecreatedb
```

Example 3 (unknown):
```unknown
usebypassrls
```

Example 4 (unknown):
```unknown
timestamptz
```

---


---

## 53.37. pg_views #


**URL:** https://www.postgresql.org/docs/18/view-pg-views.html

**Contents:**
- 53.37. pg_views #

The view pg_views provides access to useful information about each view in the database.

Table 53.37. pg_views Columns

schemaname name (references pg_namespace.nspname)

Name of schema containing view

viewname name (references pg_class.relname)

viewowner name (references pg_authid.rolname)

View definition (a reconstructed SELECT query)

**Examples:**

Example 1 (unknown):
```unknown
pg_namespace
```

Example 2 (unknown):
```unknown
pg_user_mappings
```

Example 3 (unknown):
```unknown
pg_wait_events
```

---


---

