# PostgreSQL - System Catalogs (Part 8)

## 52.60. pg_ts_config_map #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-ts-config-map.html

**Contents:**
- 52.60. pg_ts_config_map #

The pg_ts_config_map catalog contains entries showing which text search dictionaries should be consulted, and in what order, for each output token type of each text search configuration's parser.

PostgreSQL's text search features are described at length in Chapter 12.

Table 52.60. pg_ts_config_map Columns

mapcfg oid (references pg_ts_config.oid)

The OID of the pg_ts_config entry owning this map entry

A token type emitted by the configuration's parser

Order in which to consult this entry (lower mapseqnos first)

mapdict oid (references pg_ts_dict.oid)

The OID of the text search dictionary to consult

**Examples:**

Example 1 (unknown):
```unknown
pg_ts_config_map
```

Example 2 (unknown):
```unknown
pg_ts_config_map
```

Example 3 (unknown):
```unknown
pg_ts_config_map
```

Example 4 (unknown):
```unknown
pg_ts_config_map
```

---


---

## 52.50. pg_shseclabel #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-shseclabel.html

**Contents:**
- 52.50. pg_shseclabel #

The catalog pg_shseclabel stores security labels on shared database objects. Security labels can be manipulated with the SECURITY LABEL command. For an easier way to view security labels, see Section 53.23.

See also pg_seclabel, which performs a similar function for security labels involving objects within a single database.

Unlike most system catalogs, pg_shseclabel is shared across all databases of a cluster: there is only one copy of pg_shseclabel per cluster, not one per database.

Table 52.50. pg_shseclabel Columns

objoid oid (references any OID column)

The OID of the object this security label pertains to

classoid oid (references pg_class.oid)

The OID of the system catalog this object appears in

The label provider associated with this label.

The security label applied to this object.

**Examples:**

Example 1 (unknown):
```unknown
pg_shseclabel
```

Example 2 (unknown):
```unknown
pg_shseclabel
```

Example 3 (unknown):
```unknown
pg_shseclabel
```

Example 4 (unknown):
```unknown
SECURITY LABEL
```

---


---

## 52.34. pg_operator #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-operator.html

**Contents:**
- 52.34. pg_operator #

The catalog pg_operator stores information about operators. See CREATE OPERATOR and Section 36.14 for more information.

Table 52.34. pg_operator Columns

oprnamespace oid (references pg_namespace.oid)

The OID of the namespace that contains this operator

oprowner oid (references pg_authid.oid)

Owner of the operator

b = infix operator (“both”), or l = prefix operator (“left”)

This operator supports merge joins

This operator supports hash joins

oprleft oid (references pg_type.oid)

Type of the left operand (zero for a prefix operator)

oprright oid (references pg_type.oid)

Type of the right operand

oprresult oid (references pg_type.oid)

Type of the result (zero for a not-yet-defined “shell” operator)

oprcom oid (references pg_operator.oid)

Commutator of this operator (zero if none)

oprnegate oid (references pg_operator.oid)

Negator of this operator (zero if none)

oprcode regproc (references pg_proc.oid)

Function that implements this operator (zero for a not-yet-defined “shell” operator)

oprrest regproc (references pg_proc.oid)

Restriction selectivity estimation function for this operator (zero if none)

oprjoin regproc (references pg_proc.oid)

Join selectivity estimation function for this operator (zero if none)

**Examples:**

Example 1 (unknown):
```unknown
pg_operator
```

Example 2 (unknown):
```unknown
pg_operator
```

Example 3 (unknown):
```unknown
pg_operator
```

Example 4 (unknown):
```unknown
pg_operator
```

---


---

## 52.47. pg_sequence #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-sequence.html

**Contents:**
- 52.47. pg_sequence #

The catalog pg_sequence contains information about sequences. Some of the information about sequences, such as the name and the schema, is in pg_class

Table 52.47. pg_sequence Columns

seqrelid oid (references pg_class.oid)

The OID of the pg_class entry for this sequence

seqtypid oid (references pg_type.oid)

Data type of the sequence

Start value of the sequence

Increment value of the sequence

Maximum value of the sequence

Minimum value of the sequence

Cache size of the sequence

Whether the sequence cycles

**Examples:**

Example 1 (unknown):
```unknown
pg_sequence
```

Example 2 (unknown):
```unknown
pg_sequence
```

Example 3 (unknown):
```unknown
pg_sequence
```

Example 4 (unknown):
```unknown
pg_sequence
```

---


---

## 52.41. pg_publication_namespace #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-publication-namespace.html

**Contents:**
- 52.41. pg_publication_namespace #

The catalog pg_publication_namespace contains the mapping between schemas and publications in the database. This is a many-to-many mapping.

Table 52.41. pg_publication_namespace Columns

pnpubid oid (references pg_publication.oid)

Reference to publication

pnnspid oid (references pg_namespace.oid)

**Examples:**

Example 1 (unknown):
```unknown
pg_publication_namespace
```

Example 2 (unknown):
```unknown
pg_publication_namespace
```

Example 3 (unknown):
```unknown
pg_publication_namespace
```

Example 4 (unknown):
```unknown
pg_publication_namespace
```

---


---

## 52.37. pg_partitioned_table #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-partitioned-table.html

**Contents:**
- 52.37. pg_partitioned_table #

The catalog pg_partitioned_table stores information about how tables are partitioned.

Table 52.37. pg_partitioned_table Columns

partrelid oid (references pg_class.oid)

The OID of the pg_class entry for this partitioned table

Partitioning strategy; h = hash partitioned table, l = list partitioned table, r = range partitioned table

The number of columns in the partition key

partdefid oid (references pg_class.oid)

The OID of the pg_class entry for the default partition of this partitioned table, or zero if this partitioned table does not have a default partition

partattrs int2vector (references pg_attribute.attnum)

This is an array of partnatts values that indicate which table columns are part of the partition key. For example, a value of 1 3 would mean that the first and the third table columns make up the partition key. A zero in this array indicates that the corresponding partition key column is an expression, rather than a simple column reference.

partclass oidvector (references pg_opclass.oid)

For each column in the partition key, this contains the OID of the operator class to use. See pg_opclass for details.

partcollation oidvector (references pg_collation.oid)

For each column in the partition key, this contains the OID of the collation to use for partitioning, or zero if the column is not of a collatable data type.

partexprs pg_node_tree

Expression trees (in nodeToString() representation) for partition key columns that are not simple column references. This is a list with one element for each zero entry in partattrs. Null if all partition key columns are simple references.

**Examples:**

Example 1 (unknown):
```unknown
pg_partitioned_table
```

Example 2 (unknown):
```unknown
pg_partitioned_table
```

Example 3 (unknown):
```unknown
pg_partitioned_table
```

Example 4 (unknown):
```unknown
pg_partitioned_table
```

---


---

