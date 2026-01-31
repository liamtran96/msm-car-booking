# PostgreSQL - System Catalogs (Part 4)

## 52.26. pg_index #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-index.html

**Contents:**
- 52.26. pg_index #

The catalog pg_index contains part of the information about indexes. The rest is mostly in pg_class.

Table 52.26. pg_index Columns

indexrelid oid (references pg_class.oid)

The OID of the pg_class entry for this index

indrelid oid (references pg_class.oid)

The OID of the pg_class entry for the table this index is for

The total number of columns in the index (duplicates pg_class.relnatts); this number includes both key and included attributes

The number of key columns in the index, not counting any included columns, which are merely stored and do not participate in the index semantics

If true, this is a unique index

indnullsnotdistinct bool

This value is only used for unique indexes. If false, this unique index will consider null values distinct (so the index can contain multiple null values in a column, the default PostgreSQL behavior). If it is true, it will consider null values to be equal (so the index can only contain one null value in a column).

If true, this index represents the primary key of the table (indisunique should always be true when this is true)

If true, this index supports an exclusion constraint

If true, the uniqueness check is enforced immediately on insertion (irrelevant if indisunique is not true)

If true, the table was last clustered on this index

If true, the index is currently valid for queries. False means the index is possibly incomplete: it must still be modified by INSERT/UPDATE operations, but it cannot safely be used for queries. If it is unique, the uniqueness property is not guaranteed true either.

If true, queries must not use the index until the xmin of this pg_index row is below their TransactionXmin event horizon, because the table may contain broken HOT chains with incompatible rows that they can see

If true, the index is currently ready for inserts. False means the index must be ignored by INSERT/UPDATE operations.

If false, the index is in process of being dropped, and should be ignored for all purposes (including HOT-safety decisions)

If true this index has been chosen as “replica identity” using ALTER TABLE ... REPLICA IDENTITY USING INDEX ...

indkey int2vector (references pg_attribute.attnum)

This is an array of indnatts values that indicate which table columns this index indexes. For example, a value of 1 3 would mean that the first and the third table columns make up the index entries. Key columns come before non-key (included) columns. A zero in this array indicates that the corresponding index attribute is an expression over the table columns, rather than a simple column reference.

indcollation oidvector (references pg_collation.oid)

For each column in the index key (indnkeyatts values), this contains the OID of the collation to use for the index, or zero if the column is not of a collatable data type.

indclass oidvector (references pg_opclass.oid)

For each column in the index key (indnkeyatts values), this contains the OID of the operator class to use. See pg_opclass for details.

This is an array of indnkeyatts values that store per-column flag bits. The meaning of the bits is defined by the index's access method.

indexprs pg_node_tree

Expression trees (in nodeToString() representation) for index attributes that are not simple column references. This is a list with one element for each zero entry in indkey. Null if all index attributes are simple references.

Expression tree (in nodeToString() representation) for partial index predicate. Null if not a partial index.

**Examples:**

Example 1 (unknown):
```unknown
pg_class.relnatts
```

Example 2 (unknown):
```unknown
indnkeyatts
```

Example 3 (unknown):
```unknown
indisunique
```

Example 4 (unknown):
```unknown
indnullsnotdistinct
```

---


---

## 52.4. pg_amop #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-amop.html

**Contents:**
- 52.4. pg_amop #
  - Note

The catalog pg_amop stores information about operators associated with access method operator families. There is one row for each operator that is a member of an operator family. A family member can be either a search operator or an ordering operator. An operator can appear in more than one family, but cannot appear in more than one search position nor more than one ordering position within a family. (It is allowed, though unlikely, for an operator to be used for both search and ordering purposes.)

Table 52.4. pg_amop Columns

amopfamily oid (references pg_opfamily.oid)

The operator family this entry is for

amoplefttype oid (references pg_type.oid)

Left-hand input data type of operator

amoprighttype oid (references pg_type.oid)

Right-hand input data type of operator

Operator strategy number

Operator purpose, either s for search or o for ordering

amopopr oid (references pg_operator.oid)

amopmethod oid (references pg_am.oid)

Index access method operator family is for

amopsortfamily oid (references pg_opfamily.oid)

The B-tree operator family this entry sorts according to, if an ordering operator; zero if a search operator

A “search” operator entry indicates that an index of this operator family can be searched to find all rows satisfying WHERE indexed_column operator constant. Obviously, such an operator must return boolean, and its left-hand input type must match the index's column data type.

An “ordering” operator entry indicates that an index of this operator family can be scanned to return rows in the order represented by ORDER BY indexed_column operator constant. Such an operator could return any sortable data type, though again its left-hand input type must match the index's column data type. The exact semantics of the ORDER BY are specified by the amopsortfamily column, which must reference a B-tree operator family for the operator's result type.

At present, it's assumed that the sort order for an ordering operator is the default for the referenced operator family, i.e., ASC NULLS LAST. This might someday be relaxed by adding additional columns to specify sort options explicitly.

An entry's amopmethod must match the opfmethod of its containing operator family (including amopmethod here is an intentional denormalization of the catalog structure for performance reasons). Also, amoplefttype and amoprighttype must match the oprleft and oprright fields of the referenced pg_operator entry.

**Examples:**

Example 1 (unknown):
```unknown
pg_opfamily
```

Example 2 (unknown):
```unknown
amoplefttype
```

Example 3 (unknown):
```unknown
amoprighttype
```

Example 4 (unknown):
```unknown
amopstrategy
```

---


---

## 52.29. pg_language #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-language.html

**Contents:**
- 52.29. pg_language #

The catalog pg_language registers languages in which you can write functions or stored procedures. See CREATE LANGUAGE and Chapter 40 for more information about language handlers.

Table 52.29. pg_language Columns

lanowner oid (references pg_authid.oid)

Owner of the language

This is false for internal languages (such as SQL) and true for user-defined languages. Currently, pg_dump still uses this to determine which languages need to be dumped, but this might be replaced by a different mechanism in the future.

True if this is a trusted language, which means that it is believed not to grant access to anything outside the normal SQL execution environment. Only superusers can create functions in untrusted languages.

lanplcallfoid oid (references pg_proc.oid)

For noninternal languages this references the language handler, which is a special function that is responsible for executing all functions that are written in the particular language. Zero for internal languages.

laninline oid (references pg_proc.oid)

This references a function that is responsible for executing “inline” anonymous code blocks (DO blocks). Zero if inline blocks are not supported.

lanvalidator oid (references pg_proc.oid)

This references a language validator function that is responsible for checking the syntax and validity of new functions when they are created. Zero if no validator is provided.

Access privileges; see Section 5.8 for details

**Examples:**

Example 1 (unknown):
```unknown
pg_language
```

Example 2 (unknown):
```unknown
pg_language
```

Example 3 (unknown):
```unknown
pg_language
```

Example 4 (unknown):
```unknown
pg_language
```

---


---

## 52.31. pg_largeobject_metadata #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-largeobject-metadata.html

**Contents:**
- 52.31. pg_largeobject_metadata #

The catalog pg_largeobject_metadata holds metadata associated with large objects. The actual large object data is stored in pg_largeobject.

Table 52.31. pg_largeobject_metadata Columns

lomowner oid (references pg_authid.oid)

Owner of the large object

Access privileges; see Section 5.8 for details

**Examples:**

Example 1 (unknown):
```unknown
pg_largeobject_metadata
```

Example 2 (unknown):
```unknown
pg_largeobject_metadata
```

Example 3 (unknown):
```unknown
pg_largeobject_metadata
```

Example 4 (unknown):
```unknown
pg_largeobject
```

---


---

## 52.20. pg_enum #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-enum.html

**Contents:**
- 52.20. pg_enum #

The pg_enum catalog contains entries showing the values and labels for each enum type. The internal representation of a given enum value is actually the OID of its associated row in pg_enum.

Table 52.20. pg_enum Columns

enumtypid oid (references pg_type.oid)

The OID of the pg_type entry owning this enum value

The sort position of this enum value within its enum type

The textual label for this enum value

The OIDs for pg_enum rows follow a special rule: even-numbered OIDs are guaranteed to be ordered in the same way as the sort ordering of their enum type. That is, if two even OIDs belong to the same enum type, the smaller OID must have the smaller enumsortorder value. Odd-numbered OID values need bear no relationship to the sort order. This rule allows the enum comparison routines to avoid catalog lookups in many common cases. The routines that create and alter enum types attempt to assign even OIDs to enum values whenever possible.

When an enum type is created, its members are assigned sort-order positions 1..n. But members added later might be given negative or fractional values of enumsortorder. The only requirement on these values is that they be correctly ordered and unique within each enum type.

**Examples:**

Example 1 (unknown):
```unknown
enumsortorder
```

Example 2 (unknown):
```unknown
enumsortorder
```

Example 3 (unknown):
```unknown
enumsortorder
```

Example 4 (unknown):
```unknown
pg_description
```

---


---

## 52.53. pg_statistic_ext_data #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-statistic-ext-data.html

**Contents:**
- 52.53. pg_statistic_ext_data #

The catalog pg_statistic_ext_data holds data for extended planner statistics defined in pg_statistic_ext. Each row in this catalog corresponds to a statistics object created with CREATE STATISTICS.

Normally there is one entry, with stxdinherit = false, for each statistics object that has been analyzed. If the table has inheritance children or partitions, a second entry with stxdinherit = true is also created. This row represents the statistics object over the inheritance tree, i.e., statistics for the data you'd see with SELECT * FROM table*, whereas the stxdinherit = false row represents the results of SELECT * FROM ONLY table.

Like pg_statistic, pg_statistic_ext_data should not be readable by the public, since the contents might be considered sensitive. (Example: most common combinations of values in columns might be quite interesting.) pg_stats_ext is a publicly readable view on pg_statistic_ext_data (after joining with pg_statistic_ext) that only exposes information about tables the current user owns.

Table 52.53. pg_statistic_ext_data Columns

stxoid oid (references pg_statistic_ext.oid)

Extended statistics object containing the definition for this data

If true, the stats include values from child tables, not just the values in the specified relation

stxdndistinct pg_ndistinct

N-distinct counts, serialized as pg_ndistinct type

stxddependencies pg_dependencies

Functional dependency statistics, serialized as pg_dependencies type

MCV (most-common values) list statistics, serialized as pg_mcv_list type

stxdexpr pg_statistic[]

Per-expression statistics, serialized as an array of pg_statistic type

**Examples:**

Example 1 (unknown):
```unknown
pg_statistic_ext_data
```

Example 2 (unknown):
```unknown
pg_statistic_ext_data
```

Example 3 (unknown):
```unknown
pg_statistic_ext_data
```

Example 4 (unknown):
```unknown
pg_statistic_ext
```

---


---

