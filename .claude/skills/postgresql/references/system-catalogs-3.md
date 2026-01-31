# PostgreSQL - System Catalogs (Part 3)

## 52.52. pg_statistic_ext #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-statistic-ext.html

**Contents:**
- 52.52. pg_statistic_ext #

The catalog pg_statistic_ext holds definitions of extended planner statistics. Each row in this catalog corresponds to a statistics object created with CREATE STATISTICS.

Table 52.52. pg_statistic_ext Columns

stxrelid oid (references pg_class.oid)

Table containing the columns described by this object

Name of the statistics object

stxnamespace oid (references pg_namespace.oid)

The OID of the namespace that contains this statistics object

stxowner oid (references pg_authid.oid)

Owner of the statistics object

stxkeys int2vector (references pg_attribute.attnum)

An array of attribute numbers, indicating which table columns are covered by this statistics object; for example a value of 1 3 would mean that the first and the third table columns are covered

stxstattarget controls the level of detail of statistics accumulated for this statistics object by ANALYZE. A zero value indicates that no statistics should be collected. A null value says to use the maximum of the statistics targets of the referenced columns, if set, or the system default statistics target. Positive values of stxstattarget determine the target number of “most common values” to collect.

An array containing codes for the enabled statistics kinds; valid values are: d for n-distinct statistics, f for functional dependency statistics, m for most common values (MCV) list statistics, and e for expression statistics

stxexprs pg_node_tree

Expression trees (in nodeToString() representation) for statistics object attributes that are not simple column references. This is a list with one element per expression. Null if all statistics object attributes are simple references.

The pg_statistic_ext entry is filled in completely during CREATE STATISTICS, but the actual statistical values are not computed then. Subsequent ANALYZE commands compute the desired values and populate an entry in the pg_statistic_ext_data catalog.

**Examples:**

Example 1 (unknown):
```unknown
pg_statistic_ext
```

Example 2 (unknown):
```unknown
pg_statistic_ext
```

Example 3 (unknown):
```unknown
pg_statistic_ext
```

Example 4 (unknown):
```unknown
CREATE STATISTICS
```

---


---

## 52.13. pg_constraint #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-constraint.html

**Contents:**
- 52.13. pg_constraint #
  - Note

The catalog pg_constraint stores check, not-null, primary key, unique, foreign key, and exclusion constraints on tables. (Column constraints are not treated specially. Every column constraint is equivalent to some table constraint.)

User-defined constraint triggers (created with CREATE CONSTRAINT TRIGGER) also give rise to an entry in this table.

Check constraints on domains are stored here, too.

Table 52.13. pg_constraint Columns

Constraint name (not necessarily unique!)

connamespace oid (references pg_namespace.oid)

The OID of the namespace that contains this constraint

c = check constraint, f = foreign key constraint, n = not-null constraint, p = primary key constraint, u = unique constraint, t = constraint trigger, x = exclusion constraint

Is the constraint deferrable?

Is the constraint deferred by default?

Is the constraint enforced?

Has the constraint been validated?

conrelid oid (references pg_class.oid)

The table this constraint is on; zero if not a table constraint

contypid oid (references pg_type.oid)

The domain this constraint is on; zero if not a domain constraint

conindid oid (references pg_class.oid)

The index supporting this constraint, if it's a unique, primary key, foreign key, or exclusion constraint; else zero

conparentid oid (references pg_constraint.oid)

The corresponding constraint of the parent partitioned table, if this is a constraint on a partition; else zero

confrelid oid (references pg_class.oid)

If a foreign key, the referenced table; else zero

Foreign key update action code: a = no action, r = restrict, c = cascade, n = set null, d = set default

Foreign key deletion action code: a = no action, r = restrict, c = cascade, n = set null, d = set default

Foreign key match type: f = full, p = partial, s = simple

This constraint is defined locally for the relation. Note that a constraint can be locally defined and inherited simultaneously.

The number of direct inheritance ancestors this constraint has. A constraint with a nonzero number of ancestors cannot be dropped nor renamed.

This constraint is defined locally for the relation. It is a non-inheritable constraint.

This constraint is defined with WITHOUT OVERLAPS (for primary keys and unique constraints) or PERIOD (for foreign keys).

conkey int2[] (references pg_attribute.attnum)

If a table constraint (including foreign keys, but not constraint triggers), list of the constrained columns

confkey int2[] (references pg_attribute.attnum)

If a foreign key, list of the referenced columns

conpfeqop oid[] (references pg_operator.oid)

If a foreign key, list of the equality operators for PK = FK comparisons

conppeqop oid[] (references pg_operator.oid)

If a foreign key, list of the equality operators for PK = PK comparisons

conffeqop oid[] (references pg_operator.oid)

If a foreign key, list of the equality operators for FK = FK comparisons

confdelsetcols int2[] (references pg_attribute.attnum)

If a foreign key with a SET NULL or SET DEFAULT delete action, the columns that will be updated. If null, all of the referencing columns will be updated.

conexclop oid[] (references pg_operator.oid)

If an exclusion constraint or WITHOUT OVERLAPS primary key/unique constraint, list of the per-column exclusion operators.

If a check constraint, an internal representation of the expression. (It's recommended to use pg_get_constraintdef() to extract the definition of a check constraint.)

In the case of an exclusion constraint, conkey is only useful for constraint elements that are simple column references. For other cases, a zero appears in conkey and the associated index must be consulted to discover the expression that is constrained. (conkey thus has the same contents as pg_index.indkey for the index.)

pg_class.relchecks needs to agree with the number of check-constraint entries found in this table for each relation.

**Examples:**

Example 1 (unknown):
```unknown
pg_constraint
```

Example 2 (unknown):
```unknown
pg_constraint
```

Example 3 (unknown):
```unknown
pg_constraint
```

Example 4 (unknown):
```unknown
CREATE CONSTRAINT TRIGGER
```

---


---

## 52.14. pg_conversion #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-conversion.html

**Contents:**
- 52.14. pg_conversion #

The catalog pg_conversion describes encoding conversion functions. See CREATE CONVERSION for more information.

Table 52.14. pg_conversion Columns

Conversion name (unique within a namespace)

connamespace oid (references pg_namespace.oid)

The OID of the namespace that contains this conversion

conowner oid (references pg_authid.oid)

Owner of the conversion

Source encoding ID (pg_encoding_to_char() can translate this number to the encoding name)

Destination encoding ID (pg_encoding_to_char() can translate this number to the encoding name)

conproc regproc (references pg_proc.oid)

True if this is the default conversion

**Examples:**

Example 1 (unknown):
```unknown
pg_conversion
```

Example 2 (unknown):
```unknown
pg_conversion
```

Example 3 (unknown):
```unknown
pg_conversion
```

Example 4 (unknown):
```unknown
pg_conversion
```

---


---

## 52.49. pg_shdescription #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-shdescription.html

**Contents:**
- 52.49. pg_shdescription #

The catalog pg_shdescription stores optional descriptions (comments) for shared database objects. Descriptions can be manipulated with the COMMENT command and viewed with psql's \d commands.

See also pg_description, which performs a similar function for descriptions involving objects within a single database.

Unlike most system catalogs, pg_shdescription is shared across all databases of a cluster: there is only one copy of pg_shdescription per cluster, not one per database.

Table 52.49. pg_shdescription Columns

objoid oid (references any OID column)

The OID of the object this description pertains to

classoid oid (references pg_class.oid)

The OID of the system catalog this object appears in

Arbitrary text that serves as the description of this object

**Examples:**

Example 1 (unknown):
```unknown
pg_shdescription
```

Example 2 (unknown):
```unknown
pg_shdescription
```

Example 3 (unknown):
```unknown
pg_shdescription
```

Example 4 (unknown):
```unknown
pg_description
```

---


---

## 52.54. pg_subscription #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-subscription.html

**Contents:**
- 52.54. pg_subscription #

The catalog pg_subscription contains all existing logical replication subscriptions. For more information about logical replication see Chapter 29.

Unlike most system catalogs, pg_subscription is shared across all databases of a cluster: there is only one copy of pg_subscription per cluster, not one per database.

Access to the column subconninfo is revoked from normal users, because it could contain plain-text passwords.

Table 52.54. pg_subscription Columns

subdbid oid (references pg_database.oid)

OID of the database that the subscription resides in

Finish LSN of the transaction whose changes are to be skipped, if a valid LSN; otherwise 0/0.

Name of the subscription

subowner oid (references pg_authid.oid)

Owner of the subscription

If true, the subscription is enabled and should be replicating

If true, the subscription will request that the publisher send data in binary format

Controls how to handle the streaming of in-progress transactions: f = disallow streaming of in-progress transactions, t = spill the changes of in-progress transactions to disk and apply at once after the transaction is committed on the publisher and received by the subscriber, p = apply changes directly using a parallel apply worker if available (same as t if no worker is available)

subtwophasestate char

State codes for two-phase mode: d = disabled, p = pending enablement, e = enabled

If true, the subscription will be disabled if one of its workers detects an error

subpasswordrequired bool

If true, the subscription will be required to specify a password for authentication

If true, the subscription will be run with the permissions of the subscription owner

If true, the associated replication slots (i.e. the main slot and the table synchronization slots) in the upstream database are enabled to be synchronized to the standbys

Connection string to the upstream database

Name of the replication slot in the upstream database (also used for the local replication origin name); null represents NONE

The synchronous_commit setting for the subscription's workers to use

subpublications text[]

Array of subscribed publication names. These reference publications defined in the upstream database. For more on publications see Section 29.1.

The origin value must be either none or any. The default is any. If none, the subscription will request the publisher to only send changes that don't have an origin. If any, the publisher sends changes regardless of their origin.

**Examples:**

Example 1 (unknown):
```unknown
pg_subscription
```

Example 2 (unknown):
```unknown
pg_subscription
```

Example 3 (unknown):
```unknown
pg_subscription
```

Example 4 (unknown):
```unknown
pg_subscription
```

---


---

