# PostgreSQL - System Catalogs (Part 7)

## 52.15. pg_database #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-database.html

**Contents:**
- 52.15. pg_database #

The catalog pg_database stores information about the available databases. Databases are created with the CREATE DATABASE command. Consult Chapter 22 for details about the meaning of some of the parameters.

Unlike most system catalogs, pg_database is shared across all databases of a cluster: there is only one copy of pg_database per cluster, not one per database.

Table 52.15. pg_database Columns

datdba oid (references pg_authid.oid)

Owner of the database, usually the user who created it

Character encoding for this database (pg_encoding_to_char() can translate this number to the encoding name)

Locale provider for this database: b = builtin, c = libc, i = icu

If true, then this database can be cloned by any user with CREATEDB privileges; if false, then only superusers or the owner of the database can clone it.

If false then no one can connect to this database. This is used to protect the template0 database from being altered.

Indicates that there are login event triggers defined for this database. This flag is used to avoid extra lookups on the pg_event_trigger table during each backend startup. This flag is used internally by PostgreSQL and should not be manually altered or read for monitoring purposes.

Sets maximum number of concurrent connections that can be made to this database. -1 means no limit, -2 indicates the database is invalid.

All transaction IDs before this one have been replaced with a permanent (“frozen”) transaction ID in this database. This is used to track whether the database needs to be vacuumed in order to prevent transaction ID wraparound or to allow pg_xact to be shrunk. It is the minimum of the per-table pg_class.relfrozenxid values.

All multixact IDs before this one have been replaced with a transaction ID in this database. This is used to track whether the database needs to be vacuumed in order to prevent multixact ID wraparound or to allow pg_multixact to be shrunk. It is the minimum of the per-table pg_class.relminmxid values.

dattablespace oid (references pg_tablespace.oid)

The default tablespace for the database. Within this database, all tables for which pg_class.reltablespace is zero will be stored in this tablespace; in particular, all the non-shared system catalogs will be there.

LC_COLLATE for this database

LC_CTYPE for this database

Collation provider locale name for this database. If the provider is libc, datlocale is NULL; datcollate and datctype are used instead.

ICU collation rules for this database

Provider-specific version of the collation. This is recorded when the database is created and then checked when it is used, to detect changes in the collation definition that could lead to data corruption.

Access privileges; see Section 5.8 for details

**Examples:**

Example 1 (unknown):
```unknown
pg_database
```

Example 2 (unknown):
```unknown
pg_database
```

Example 3 (unknown):
```unknown
pg_database
```

Example 4 (unknown):
```unknown
CREATE DATABASE
```

---


---

## 52.22. pg_extension #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-extension.html

**Contents:**
- 52.22. pg_extension #

The catalog pg_extension stores information about the installed extensions. See Section 36.17 for details about extensions.

Table 52.22. pg_extension Columns

Name of the extension

extowner oid (references pg_authid.oid)

Owner of the extension

extnamespace oid (references pg_namespace.oid)

Schema containing the extension's exported objects

True if extension can be relocated to another schema

Version name for the extension

extconfig oid[] (references pg_class.oid)

Array of regclass OIDs for the extension's configuration table(s), or NULL if none

Array of WHERE-clause filter conditions for the extension's configuration table(s), or NULL if none

Note that unlike most catalogs with a “namespace” column, extnamespace is not meant to imply that the extension belongs to that schema. Extension names are never schema-qualified. Rather, extnamespace indicates the schema that contains most or all of the extension's objects. If extrelocatable is true, then this schema must in fact contain all schema-qualifiable objects belonging to the extension.

**Examples:**

Example 1 (unknown):
```unknown
pg_extension
```

Example 2 (unknown):
```unknown
pg_extension
```

Example 3 (unknown):
```unknown
pg_extension
```

Example 4 (unknown):
```unknown
pg_extension
```

---


---

## 52.40. pg_publication #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-publication.html

**Contents:**
- 52.40. pg_publication #

The catalog pg_publication contains all publications created in the database. For more on publications see Section 29.1.

Table 52.40. pg_publication Columns

Name of the publication

pubowner oid (references pg_authid.oid)

Owner of the publication

If true, this publication automatically includes all tables in the database, including any that will be created in the future.

If true, INSERT operations are replicated for tables in the publication.

If true, UPDATE operations are replicated for tables in the publication.

If true, DELETE operations are replicated for tables in the publication.

If true, TRUNCATE operations are replicated for tables in the publication.

If true, operations on a leaf partition are replicated using the identity and schema of its topmost partitioned ancestor mentioned in the publication instead of its own.

Controls how to handle generated column replication when there is no publication column list: n = generated columns in the tables associated with the publication should not be replicated, s = stored generated columns in the tables associated with the publication should be replicated.

**Examples:**

Example 1 (unknown):
```unknown
pg_publication
```

Example 2 (unknown):
```unknown
pg_publication
```

Example 3 (unknown):
```unknown
pg_publication
```

Example 4 (unknown):
```unknown
pg_publication
```

---


---

## 52.19. pg_description #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-description.html

**Contents:**
- 52.19. pg_description #

The catalog pg_description stores optional descriptions (comments) for each database object. Descriptions can be manipulated with the COMMENT command and viewed with psql's \d commands. Descriptions of many built-in system objects are provided in the initial contents of pg_description.

See also pg_shdescription, which performs a similar function for descriptions involving objects that are shared across a database cluster.

Table 52.19. pg_description Columns

objoid oid (references any OID column)

The OID of the object this description pertains to

classoid oid (references pg_class.oid)

The OID of the system catalog this object appears in

For a comment on a table column, this is the column number (the objoid and classoid refer to the table itself). For all other object types, this column is zero.

Arbitrary text that serves as the description of this object

**Examples:**

Example 1 (unknown):
```unknown
pg_description
```

Example 2 (unknown):
```unknown
pg_description
```

Example 3 (unknown):
```unknown
pg_description
```

Example 4 (unknown):
```unknown
pg_description
```

---


---

## 52.25. pg_foreign_table #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-foreign-table.html

**Contents:**
- 52.25. pg_foreign_table #

The catalog pg_foreign_table contains auxiliary information about foreign tables. A foreign table is primarily represented by a pg_class entry, just like a regular table. Its pg_foreign_table entry contains the information that is pertinent only to foreign tables and not any other kind of relation.

Table 52.25. pg_foreign_table Columns

ftrelid oid (references pg_class.oid)

The OID of the pg_class entry for this foreign table

ftserver oid (references pg_foreign_server.oid)

OID of the foreign server for this foreign table

Foreign table options, as “keyword=value” strings

**Examples:**

Example 1 (unknown):
```unknown
pg_foreign_table
```

Example 2 (unknown):
```unknown
pg_foreign_table
```

Example 3 (unknown):
```unknown
pg_foreign_table
```

Example 4 (unknown):
```unknown
pg_foreign_table
```

---


---

## 52.51. pg_statistic #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-statistic.html

**Contents:**
- 52.51. pg_statistic #

The catalog pg_statistic stores statistical data about the contents of the database. Entries are created by ANALYZE and subsequently used by the query planner. Note that all the statistical data is inherently approximate, even assuming that it is up-to-date.

Normally there is one entry, with stainherit = false, for each table column that has been analyzed. If the table has inheritance children or partitions, a second entry with stainherit = true is also created. This row represents the column's statistics over the inheritance tree, i.e., statistics for the data you'd see with SELECT column FROM table*, whereas the stainherit = false row represents the results of SELECT column FROM ONLY table.

pg_statistic also stores statistical data about the values of index expressions. These are described as if they were actual data columns; in particular, starelid references the index. No entry is made for an ordinary non-expression index column, however, since it would be redundant with the entry for the underlying table column. Currently, entries for index expressions always have stainherit = false.

Since different kinds of statistics might be appropriate for different kinds of data, pg_statistic is designed not to assume very much about what sort of statistics it stores. Only extremely general statistics (such as nullness) are given dedicated columns in pg_statistic. Everything else is stored in “slots”, which are groups of associated columns whose content is identified by a code number in one of the slot's columns. For more information see src/include/catalog/pg_statistic.h.

pg_statistic should not be readable by the public, since even statistical information about a table's contents might be considered sensitive. (Example: minimum and maximum values of a salary column might be quite interesting.) pg_stats is a publicly readable view on pg_statistic that only exposes information about those tables that are readable by the current user.

Table 52.51. pg_statistic Columns

starelid oid (references pg_class.oid)

The table or index that the described column belongs to

staattnum int2 (references pg_attribute.attnum)

The number of the described column

If true, the stats include values from child tables, not just the values in the specified relation

The fraction of the column's entries that are null

The average stored width, in bytes, of nonnull entries

The number of distinct nonnull data values in the column. A value greater than zero is the actual number of distinct values. A value less than zero is the negative of a multiplier for the number of rows in the table; for example, a column in which about 80% of the values are nonnull and each nonnull value appears about twice on average could be represented by stadistinct = -0.4. A zero value means the number of distinct values is unknown.

A code number indicating the kind of statistics stored in the Nth “slot” of the pg_statistic row.

staopN oid (references pg_operator.oid)

An operator used to derive the statistics stored in the Nth “slot”. For example, a histogram slot would show the < operator that defines the sort order of the data. Zero if the statistics kind does not require an operator.

stacollN oid (references pg_collation.oid)

The collation used to derive the statistics stored in the Nth “slot”. For example, a histogram slot for a collatable column would show the collation that defines the sort order of the data. Zero for noncollatable data.

Numerical statistics of the appropriate kind for the Nth “slot”, or null if the slot kind does not involve numerical values

Column data values of the appropriate kind for the Nth “slot”, or null if the slot kind does not store any data values. Each array's element values are actually of the specific column's data type, or a related type such as an array's element type, so there is no way to define these columns' type more specifically than anyarray.

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

Example 4 (sql):
```sql
SELECT column FROM table*
```

---


---

