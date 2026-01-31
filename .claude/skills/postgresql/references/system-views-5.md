# PostgreSQL - System Views (Part 5)

## 53.36. pg_user_mappings #


**URL:** https://www.postgresql.org/docs/18/view-pg-user-mappings.html

**Contents:**
- 53.36. pg_user_mappings #

The view pg_user_mappings provides access to information about user mappings. This is essentially a publicly readable view of pg_user_mapping that leaves out the options field if the user has no rights to use it.

Table 53.36. pg_user_mappings Columns

umid oid (references pg_user_mapping.oid)

OID of the user mapping

srvid oid (references pg_foreign_server.oid)

The OID of the foreign server that contains this mapping

srvname name (references pg_foreign_server.srvname)

Name of the foreign server

umuser oid (references pg_authid.oid)

OID of the local role being mapped, or zero if the user mapping is public

Name of the local user to be mapped

User mapping specific options, as “keyword=value” strings

To protect password information stored as a user mapping option, the umoptions column will read as null unless one of the following applies:

current user is the user being mapped, and owns the server or holds USAGE privilege on it

current user is the server owner and mapping is for PUBLIC

current user is a superuser

**Examples:**

Example 1 (unknown):
```unknown
pg_user_mappings
```

Example 2 (unknown):
```unknown
pg_user_mappings
```

Example 3 (unknown):
```unknown
pg_user_mappings
```

Example 4 (unknown):
```unknown
pg_user_mapping
```

---


---

## 53.32. pg_tables #


**URL:** https://www.postgresql.org/docs/18/view-pg-tables.html

**Contents:**
- 53.32. pg_tables #

The view pg_tables provides access to useful information about each table in the database.

Table 53.32. pg_tables Columns

schemaname name (references pg_namespace.nspname)

Name of schema containing table

tablename name (references pg_class.relname)

tableowner name (references pg_authid.rolname)

Name of table's owner

tablespace name (references pg_tablespace.spcname)

Name of tablespace containing table (null if default for database)

hasindexes bool (references pg_class.relhasindex)

True if table has (or recently had) any indexes

hasrules bool (references pg_class.relhasrules)

True if table has (or once had) rules

hastriggers bool (references pg_class.relhastriggers)

True if table has (or once had) triggers

rowsecurity bool (references pg_class.relrowsecurity)

True if row security is enabled on the table

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
relhasindex
```

Example 4 (unknown):
```unknown
relhasrules
```

---


---

## 53.22. pg_rules #


**URL:** https://www.postgresql.org/docs/18/view-pg-rules.html

**Contents:**
- 53.22. pg_rules #

The view pg_rules provides access to useful information about query rewrite rules.

Table 53.22. pg_rules Columns

schemaname name (references pg_namespace.nspname)

Name of schema containing table

tablename name (references pg_class.relname)

Name of table the rule is for

rulename name (references pg_rewrite.rulename)

Rule definition (a reconstructed creation command)

The pg_rules view excludes the ON SELECT rules of views and materialized views; those can be seen in pg_views and pg_matviews.

**Examples:**

Example 1 (unknown):
```unknown
pg_namespace
```

Example 2 (unknown):
```unknown
pg_matviews
```

Example 3 (unknown):
```unknown
pg_seclabels
```

---


---

## 53.14. pg_matviews #


**URL:** https://www.postgresql.org/docs/18/view-pg-matviews.html

**Contents:**
- 53.14. pg_matviews #

The view pg_matviews provides access to useful information about each materialized view in the database.

Table 53.14. pg_matviews Columns

schemaname name (references pg_namespace.nspname)

Name of schema containing materialized view

matviewname name (references pg_class.relname)

Name of materialized view

matviewowner name (references pg_authid.rolname)

Name of materialized view's owner

tablespace name (references pg_tablespace.spcname)

Name of tablespace containing materialized view (null if default for database)

True if materialized view has (or recently had) any indexes

True if materialized view is currently populated

Materialized view definition (a reconstructed SELECT query)

**Examples:**

Example 1 (unknown):
```unknown
pg_matviews
```

Example 2 (unknown):
```unknown
pg_matviews
```

Example 3 (unknown):
```unknown
pg_matviews
```

Example 4 (unknown):
```unknown
pg_matviews
```

---


---

## Chapter 53. System Views


**URL:** https://www.postgresql.org/docs/18/views.html

**Contents:**
- Chapter 53. System Views

In addition to the system catalogs, PostgreSQL provides a number of built-in views. Some system views provide convenient access to some commonly used queries on the system catalogs. Other views provide access to internal server state.

The information schema (Chapter 35) provides an alternative set of views which overlap the functionality of the system views. Since the information schema is SQL-standard whereas the views described here are PostgreSQL-specific, it's usually better to use the information schema if it provides all the information you need.

Table 53.1 lists the system views described here. More detailed documentation of each view follows below. There are some additional views that provide access to accumulated statistics; they are described in Table 27.2.

**Examples:**

Example 1 (unknown):
```unknown
pg_available_extensions
```

Example 2 (unknown):
```unknown
pg_available_extension_versions
```

Example 3 (unknown):
```unknown
pg_backend_memory_contexts
```

Example 4 (unknown):
```unknown
pg_file_settings
```

---


---

## 53.5. pg_backend_memory_contexts #


**URL:** https://www.postgresql.org/docs/18/view-pg-backend-memory-contexts.html

**Contents:**
- 53.5. pg_backend_memory_contexts #

The view pg_backend_memory_contexts displays all the memory contexts of the server process attached to the current session.

pg_backend_memory_contexts contains one row for each memory context.

Table 53.5. pg_backend_memory_contexts Columns

Name of the memory context

Identification information of the memory context. This field is truncated at 1024 bytes

Type of the memory context

The 1-based level of the context in the memory context hierarchy. The level of a context also shows the position of that context in the path column.

Array of transient numerical identifiers to describe the memory context hierarchy. The first element is for TopMemoryContext, subsequent elements contain intermediate parents and the final element contains the identifier for the current context.

Total bytes allocated for this memory context

Total number of blocks allocated for this memory context

Total number of free chunks

By default, the pg_backend_memory_contexts view can be read only by superusers or roles with the privileges of the pg_read_all_stats role.

Since memory contexts are created and destroyed during the running of a query, the identifiers stored in the path column can be unstable between multiple invocations of the view in the same query. The example below demonstrates an effective usage of this column and calculates the total number of bytes used by CacheMemoryContext and all of its children:

The Common Table Expression is used to ensure the context IDs in the path column match between both evaluations of the view.

**Examples:**

Example 1 (unknown):
```unknown
pg_backend_memory_contexts
```

Example 2 (unknown):
```unknown
pg_backend_memory_contexts
```

Example 3 (unknown):
```unknown
pg_backend_memory_contexts
```

Example 4 (unknown):
```unknown
pg_backend_memory_contexts
```

---


---

