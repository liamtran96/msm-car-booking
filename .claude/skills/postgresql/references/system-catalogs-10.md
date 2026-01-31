# PostgreSQL - System Catalogs (Part 10)

## 52.36. pg_parameter_acl #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-parameter-acl.html

**Contents:**
- 52.36. pg_parameter_acl #

The catalog pg_parameter_acl records configuration parameters for which privileges have been granted to one or more roles. No entry is made for parameters that have default privileges.

Unlike most system catalogs, pg_parameter_acl is shared across all databases of a cluster: there is only one copy of pg_parameter_acl per cluster, not one per database.

Table 52.36. pg_parameter_acl Columns

The name of a configuration parameter for which privileges are granted

Access privileges; see Section 5.8 for details

**Examples:**

Example 1 (unknown):
```unknown
pg_parameter_acl
```

Example 2 (unknown):
```unknown
pg_parameter_acl
```

Example 3 (unknown):
```unknown
pg_parameter_acl
```

Example 4 (unknown):
```unknown
pg_parameter_acl
```

---


---

## 52.32. pg_namespace #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-namespace.html

**Contents:**
- 52.32. pg_namespace #

The catalog pg_namespace stores namespaces. A namespace is the structure underlying SQL schemas: each namespace can have a separate collection of relations, types, etc. without name conflicts.

Table 52.32. pg_namespace Columns

Name of the namespace

nspowner oid (references pg_authid.oid)

Owner of the namespace

Access privileges; see Section 5.8 for details

**Examples:**

Example 1 (unknown):
```unknown
pg_namespace
```

Example 2 (unknown):
```unknown
pg_namespace
```

Example 3 (unknown):
```unknown
pg_namespace
```

Example 4 (unknown):
```unknown
pg_namespace
```

---


---

## 52.30. pg_largeobject #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-largeobject.html

**Contents:**
- 52.30. pg_largeobject #

The catalog pg_largeobject holds the data making up “large objects”. A large object is identified by an OID assigned when it is created. Each large object is broken into segments or “pages” small enough to be conveniently stored as rows in pg_largeobject. The amount of data per page is defined to be LOBLKSIZE (which is currently BLCKSZ/4, or typically 2 kB).

Prior to PostgreSQL 9.0, there was no permission structure associated with large objects. As a result, pg_largeobject was publicly readable and could be used to obtain the OIDs (and contents) of all large objects in the system. This is no longer the case; use pg_largeobject_metadata to obtain a list of large object OIDs.

Table 52.30. pg_largeobject Columns

loid oid (references pg_largeobject_metadata.oid)

Identifier of the large object that includes this page

Page number of this page within its large object (counting from zero)

Actual data stored in the large object. This will never be more than LOBLKSIZE bytes and might be less.

Each row of pg_largeobject holds data for one page of a large object, beginning at byte offset (pageno * LOBLKSIZE) within the object. The implementation allows sparse storage: pages might be missing, and might be shorter than LOBLKSIZE bytes even if they are not the last page of the object. Missing regions within a large object read as zeroes.

**Examples:**

Example 1 (unknown):
```unknown
pg_largeobject
```

Example 2 (unknown):
```unknown
pg_largeobject
```

Example 3 (unknown):
```unknown
pg_largeobject
```

Example 4 (unknown):
```unknown
pg_largeobject
```

---


---

## Chapter 52. System Catalogs


**URL:** https://www.postgresql.org/docs/18/catalogs.html

**Contents:**
- Chapter 52. System Catalogs

The system catalogs are the place where a relational database management system stores schema metadata, such as information about tables and columns, and internal bookkeeping information. PostgreSQL's system catalogs are regular tables. You can drop and recreate the tables, add columns, insert and update values, and severely mess up your system that way. Normally, one should not change the system catalogs by hand, there are normally SQL commands to do that. (For example, CREATE DATABASE inserts a row into the pg_database catalog — and actually creates the database on disk.) There are some exceptions for particularly esoteric operations, but many of those have been made available as SQL commands over time, and so the need for direct manipulation of the system catalogs is ever decreasing.

**Examples:**

Example 1 (unknown):
```unknown
pg_aggregate
```

Example 2 (unknown):
```unknown
pg_attribute
```

Example 3 (unknown):
```unknown
pg_auth_members
```

Example 4 (unknown):
```unknown
pg_collation
```

---


---

## 52.6. pg_attrdef #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-attrdef.html

**Contents:**
- 52.6. pg_attrdef #

The catalog pg_attrdef stores column default expressions and generation expressions. The main information about columns is stored in pg_attribute. Only columns for which a default expression or generation expression has been explicitly set will have an entry here.

Table 52.6. pg_attrdef Columns

adrelid oid (references pg_class.oid)

The table this column belongs to

adnum int2 (references pg_attribute.attnum)

The number of the column

The column default or generation expression, in nodeToString() representation. Use pg_get_expr(adbin, adrelid) to convert it to an SQL expression.

**Examples:**

Example 1 (unknown):
```unknown
pg_attribute
```

Example 2 (unknown):
```unknown
pg_attribute
```

Example 3 (unknown):
```unknown
pg_node_tree
```

Example 4 (unknown):
```unknown
nodeToString()
```

---


---

## 52.38. pg_policy #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-policy.html

**Contents:**
- 52.38. pg_policy #
  - Note

The catalog pg_policy stores row-level security policies for tables. A policy includes the kind of command that it applies to (possibly all commands), the roles that it applies to, the expression to be added as a security-barrier qualification to queries that include the table, and the expression to be added as a WITH CHECK option for queries that attempt to add new records to the table.

Table 52.38. pg_policy Columns

The name of the policy

polrelid oid (references pg_class.oid)

The table to which the policy applies

The command type to which the policy is applied: r for SELECT, a for INSERT, w for UPDATE, d for DELETE, or * for all

Is the policy permissive or restrictive?

polroles oid[] (references pg_authid.oid)

The roles to which the policy is applied; zero means PUBLIC (and normally appears alone in the array)

The expression tree to be added to the security barrier qualifications for queries that use the table

polwithcheck pg_node_tree

The expression tree to be added to the WITH CHECK qualifications for queries that attempt to add rows to the table

Policies stored in pg_policy are applied only when pg_class.relrowsecurity is set for their table.

**Examples:**

Example 1 (unknown):
```unknown
polpermissive
```

Example 2 (unknown):
```unknown
pg_node_tree
```

Example 3 (unknown):
```unknown
polwithcheck
```

Example 4 (unknown):
```unknown
pg_node_tree
```

---


---

## 52.21. pg_event_trigger #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-event-trigger.html

**Contents:**
- 52.21. pg_event_trigger #

The catalog pg_event_trigger stores event triggers. See Chapter 38 for more information.

Table 52.21. pg_event_trigger Columns

Trigger name (must be unique)

Identifies the event for which this trigger fires

evtowner oid (references pg_authid.oid)

Owner of the event trigger

evtfoid oid (references pg_proc.oid)

The function to be called

Controls in which session_replication_role modes the event trigger fires. O = trigger fires in “origin” and “local” modes, D = trigger is disabled, R = trigger fires in “replica” mode, A = trigger fires always.

Command tags for which this trigger will fire. If NULL, the firing of this trigger is not restricted on the basis of the command tag.

**Examples:**

Example 1 (unknown):
```unknown
pg_event_trigger
```

Example 2 (unknown):
```unknown
pg_event_trigger
```

Example 3 (unknown):
```unknown
pg_event_trigger
```

Example 4 (unknown):
```unknown
pg_event_trigger
```

---


---

