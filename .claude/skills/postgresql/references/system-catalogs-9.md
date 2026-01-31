# PostgreSQL - System Catalogs (Part 9)

## 52.45. pg_rewrite #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-rewrite.html

**Contents:**
- 52.45. pg_rewrite #
  - Note

The catalog pg_rewrite stores rewrite rules for tables and views.

Table 52.45. pg_rewrite Columns

ev_class oid (references pg_class.oid)

The table this rule is for

Event type that the rule is for: 1 = SELECT, 2 = UPDATE, 3 = INSERT, 4 = DELETE

Controls in which session_replication_role modes the rule fires. O = rule fires in “origin” and “local” modes, D = rule is disabled, R = rule fires in “replica” mode, A = rule fires always.

True if the rule is an INSTEAD rule

Expression tree (in the form of a nodeToString() representation) for the rule's qualifying condition

ev_action pg_node_tree

Query tree (in the form of a nodeToString() representation) for the rule's action

pg_class.relhasrules must be true if a table has any rules in this catalog.

**Examples:**

Example 1 (unknown):
```unknown
pg_node_tree
```

Example 2 (unknown):
```unknown
nodeToString()
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

## 52.12. pg_collation #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-collation.html

**Contents:**
- 52.12. pg_collation #

The catalog pg_collation describes the available collations, which are essentially mappings from an SQL name to operating system locale categories. See Section 23.2 for more information.

Table 52.12. pg_collation Columns

Collation name (unique per namespace and encoding)

collnamespace oid (references pg_namespace.oid)

The OID of the namespace that contains this collation

collowner oid (references pg_authid.oid)

Owner of the collation

Provider of the collation: d = database default, b = builtin, c = libc, i = icu

collisdeterministic bool

Is the collation deterministic?

Encoding in which the collation is applicable, or -1 if it works for any encoding

LC_COLLATE for this collation object. If the provider is not libc, collcollate is NULL and colllocale is used instead.

LC_CTYPE for this collation object. If the provider is not libc, collctype is NULL and colllocale is used instead.

Collation provider locale name for this collation object. If the provider is libc, colllocale is NULL; collcollate and collctype are used instead.

ICU collation rules for this collation object

Provider-specific version of the collation. This is recorded when the collation is created and then checked when it is used, to detect changes in the collation definition that could lead to data corruption.

Note that the unique key on this catalog is (collname, collencoding, collnamespace) not just (collname, collnamespace). PostgreSQL generally ignores all collations that do not have collencoding equal to either the current database's encoding or -1, and creation of new entries with the same name as an entry with collencoding = -1 is forbidden. Therefore it is sufficient to use a qualified SQL name (schema.name) to identify a collation, even though this is not unique according to the catalog definition. The reason for defining the catalog this way is that initdb fills it in at cluster initialization time with entries for all locales available on the system, so it must be able to hold entries for all encodings that might ever be used in the cluster.

In the template0 database, it could be useful to create collations whose encoding does not match the database encoding, since they could match the encodings of databases later cloned from template0. This would currently have to be done manually.

**Examples:**

Example 1 (unknown):
```unknown
pg_collation
```

Example 2 (unknown):
```unknown
pg_collation
```

Example 3 (unknown):
```unknown
pg_collation
```

Example 4 (unknown):
```unknown
pg_collation
```

---


---

## 52.11. pg_class #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-class.html

**Contents:**
- 52.11. pg_class #

The catalog pg_class describes tables and other objects that have columns or are otherwise similar to a table. This includes indexes (but see also pg_index), sequences (but see also pg_sequence), views, materialized views, composite types, and TOAST tables; see relkind. Below, when we mean all of these kinds of objects we speak of “relations”. Not all of pg_class's columns are meaningful for all relation kinds.

Table 52.11. pg_class Columns

Name of the table, index, view, etc.

relnamespace oid (references pg_namespace.oid)

The OID of the namespace that contains this relation

reltype oid (references pg_type.oid)

The OID of the data type that corresponds to this table's row type, if any; zero for indexes, sequences, and toast tables, which have no pg_type entry

reloftype oid (references pg_type.oid)

For typed tables, the OID of the underlying composite type; zero for all other relations

relowner oid (references pg_authid.oid)

Owner of the relation

relam oid (references pg_am.oid)

The access method used to access this table or index. Not meaningful if the relation is a sequence or has no on-disk file, except for partitioned tables, where, if set, it takes precedence over default_table_access_method when determining the access method to use for partitions created when one is not specified in the creation command.

Name of the on-disk file of this relation; zero means this is a “mapped” relation whose disk file name is determined by low-level state

reltablespace oid (references pg_tablespace.oid)

The tablespace in which this relation is stored. If zero, the database's default tablespace is implied. Not meaningful if the relation has no on-disk file, except for partitioned tables, where this is the tablespace in which partitions will be created when one is not specified in the creation command.

Size of the on-disk representation of this table in pages (of size BLCKSZ). This is only an estimate used by the planner. It is updated by VACUUM, ANALYZE, and a few DDL commands such as CREATE INDEX.

Number of live rows in the table. This is only an estimate used by the planner. It is updated by VACUUM, ANALYZE, and a few DDL commands such as CREATE INDEX. If the table has never yet been vacuumed or analyzed, reltuples contains -1 indicating that the row count is unknown.

Number of pages that are marked all-visible in the table's visibility map. This is only an estimate used by the planner. It is updated by VACUUM, ANALYZE, and a few DDL commands such as CREATE INDEX.

Number of pages that are marked all-frozen in the table's visibility map. This is only an estimate used for triggering autovacuums. It can also be used along with relallvisible for scheduling manual vacuums and tuning vacuum's freezing behavior. It is updated by VACUUM, ANALYZE, and a few DDL commands such as CREATE INDEX.

reltoastrelid oid (references pg_class.oid)

OID of the TOAST table associated with this table, zero if none. The TOAST table stores large attributes “out of line” in a secondary table.

True if this is a table and it has (or recently had) any indexes

True if this table is shared across all databases in the cluster. Only certain system catalogs (such as pg_database) are shared.

p = permanent table/sequence, u = unlogged table/sequence, t = temporary table/sequence

r = ordinary table, i = index, S = sequence, t = TOAST table, v = view, m = materialized view, c = composite type, f = foreign table, p = partitioned table, I = partitioned index

Number of user columns in the relation (system columns not counted). There must be this many corresponding entries in pg_attribute. See also pg_attribute.attnum.

Number of CHECK constraints on the table; see pg_constraint catalog

True if table has (or once had) rules; see pg_rewrite catalog

True if table has (or once had) triggers; see pg_trigger catalog

True if table or index has (or once had) any inheritance children or partitions

True if table has row-level security enabled; see pg_policy catalog

relforcerowsecurity bool

True if row-level security (when enabled) will also apply to table owner; see pg_policy catalog

True if relation is populated (this is true for all relations other than some materialized views)

Columns used to form “replica identity” for rows: d = default (primary key, if any), n = nothing, f = all columns, i = index with indisreplident set (same as nothing if the index used has been dropped)

True if table or index is a partition

relrewrite oid (references pg_class.oid)

For new relations being written during a DDL operation that requires a table rewrite, this contains the OID of the original relation; otherwise zero. That state is only visible internally; this field should never contain anything other than zero for a user-visible relation.

All transaction IDs before this one have been replaced with a permanent (“frozen”) transaction ID in this table. This is used to track whether the table needs to be vacuumed in order to prevent transaction ID wraparound or to allow pg_xact to be shrunk. Zero (InvalidTransactionId) if the relation is not a table.

All multixact IDs before this one have been replaced by a transaction ID in this table. This is used to track whether the table needs to be vacuumed in order to prevent multixact ID wraparound or to allow pg_multixact to be shrunk. Zero (InvalidMultiXactId) if the relation is not a table.

Access privileges; see Section 5.8 for details

Access-method-specific options, as “keyword=value” strings

relpartbound pg_node_tree

If table is a partition (see relispartition), internal representation of the partition bound

Several of the Boolean flags in pg_class are maintained lazily: they are guaranteed to be true if that's the correct state, but may not be reset to false immediately when the condition is no longer true. For example, relhasindex is set by CREATE INDEX, but it is never cleared by DROP INDEX. Instead, VACUUM clears relhasindex if it finds the table has no indexes. This arrangement avoids race conditions and improves concurrency.

**Examples:**

Example 1 (unknown):
```unknown
pg_sequence
```

Example 2 (unknown):
```unknown
relnamespace
```

Example 3 (unknown):
```unknown
pg_namespace
```

Example 4 (unknown):
```unknown
default_table_access_method
```

---


---

## 52.55. pg_subscription_rel #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-subscription-rel.html

**Contents:**
- 52.55. pg_subscription_rel #

The catalog pg_subscription_rel contains the state for each replicated relation in each subscription. This is a many-to-many mapping.

This catalog only contains tables known to the subscription after running either CREATE SUBSCRIPTION or ALTER SUBSCRIPTION ... REFRESH PUBLICATION.

Table 52.55. pg_subscription_rel Columns

srsubid oid (references pg_subscription.oid)

Reference to subscription

srrelid oid (references pg_class.oid)

Reference to relation

State code: i = initialize, d = data is being copied, f = finished table copy, s = synchronized, r = ready (normal replication)

Remote LSN of the state change used for synchronization coordination when in s or r states, otherwise null

**Examples:**

Example 1 (unknown):
```unknown
pg_subscription_rel
```

Example 2 (unknown):
```unknown
pg_subscription_rel
```

Example 3 (unknown):
```unknown
pg_subscription_rel
```

Example 4 (unknown):
```unknown
CREATE SUBSCRIPTION
```

---


---

## 52.9. pg_auth_members #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-auth-members.html

**Contents:**
- 52.9. pg_auth_members #

The catalog pg_auth_members shows the membership relations between roles. Any non-circular set of relationships is allowed.

Because user identities are cluster-wide, pg_auth_members is shared across all databases of a cluster: there is only one copy of pg_auth_members per cluster, not one per database.

Table 52.9. pg_auth_members Columns

roleid oid (references pg_authid.oid)

ID of a role that has a member

member oid (references pg_authid.oid)

ID of a role that is a member of roleid

grantor oid (references pg_authid.oid)

ID of the role that granted this membership

True if member can grant membership in roleid to others

True if the member automatically inherits the privileges of the granted role

True if the member can SET ROLE to the granted role

**Examples:**

Example 1 (unknown):
```unknown
pg_auth_members
```

Example 2 (unknown):
```unknown
pg_auth_members
```

Example 3 (unknown):
```unknown
pg_auth_members
```

Example 4 (unknown):
```unknown
pg_auth_members
```

---


---

