# PostgreSQL - System Catalogs (Part 11)

## 52.28. pg_init_privs #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-init-privs.html

**Contents:**
- 52.28. pg_init_privs #

The catalog pg_init_privs records information about the initial privileges of objects in the system. There is one entry for each object in the database which has a non-default (non-NULL) initial set of privileges.

Objects can have initial privileges either by having those privileges set when the system is initialized (by initdb) or when the object is created during a CREATE EXTENSION and the extension script sets initial privileges using the GRANT system. Note that the system will automatically handle recording of the privileges during the extension script and that extension authors need only use the GRANT and REVOKE statements in their script to have the privileges recorded. The privtype column indicates if the initial privilege was set by initdb or during a CREATE EXTENSION command.

Objects which have initial privileges set by initdb will have entries where privtype is 'i', while objects which have initial privileges set by CREATE EXTENSION will have entries where privtype is 'e'.

Table 52.28. pg_init_privs Columns

objoid oid (references any OID column)

The OID of the specific object

classoid oid (references pg_class.oid)

The OID of the system catalog the object is in

For a table column, this is the column number (the objoid and classoid refer to the table itself). For all other object types, this column is zero.

A code defining the type of initial privilege of this object; see text

The initial access privileges; see Section 5.8 for details

**Examples:**

Example 1 (unknown):
```unknown
pg_init_privs
```

Example 2 (unknown):
```unknown
pg_init_privs
```

Example 3 (unknown):
```unknown
pg_init_privs
```

Example 4 (unknown):
```unknown
CREATE EXTENSION
```

---


---

## 52.57. pg_transform #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-transform.html

**Contents:**
- 52.57. pg_transform #

The catalog pg_transform stores information about transforms, which are a mechanism to adapt data types to procedural languages. See CREATE TRANSFORM for more information.

Table 52.57. pg_transform Columns

trftype oid (references pg_type.oid)

OID of the data type this transform is for

trflang oid (references pg_language.oid)

OID of the language this transform is for

trffromsql regproc (references pg_proc.oid)

The OID of the function to use when converting the data type for input to the procedural language (e.g., function parameters). Zero is stored if the default behavior should be used.

trftosql regproc (references pg_proc.oid)

The OID of the function to use when converting output from the procedural language (e.g., return values) to the data type. Zero is stored if the default behavior should be used.

**Examples:**

Example 1 (unknown):
```unknown
pg_transform
```

Example 2 (unknown):
```unknown
pg_transform
```

Example 3 (unknown):
```unknown
pg_transform
```

Example 4 (unknown):
```unknown
pg_transform
```

---


---

## 52.2. pg_aggregate #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-aggregate.html

**Contents:**
- 52.2. pg_aggregate #

The catalog pg_aggregate stores information about aggregate functions. An aggregate function is a function that operates on a set of values (typically one column from each row that matches a query condition) and returns a single value computed from all these values. Typical aggregate functions are sum, count, and max. Each entry in pg_aggregate is an extension of an entry in pg_proc. The pg_proc entry carries the aggregate's name, input and output data types, and other information that is similar to ordinary functions.

Table 52.2. pg_aggregate Columns

aggfnoid regproc (references pg_proc.oid)

pg_proc OID of the aggregate function

Aggregate kind: n for “normal” aggregates, o for “ordered-set” aggregates, or h for “hypothetical-set” aggregates

aggnumdirectargs int2

Number of direct (non-aggregated) arguments of an ordered-set or hypothetical-set aggregate, counting a variadic array as one argument. If equal to pronargs, the aggregate must be variadic and the variadic array describes the aggregated arguments as well as the final direct arguments. Always zero for normal aggregates.

aggtransfn regproc (references pg_proc.oid)

aggfinalfn regproc (references pg_proc.oid)

Final function (zero if none)

aggcombinefn regproc (references pg_proc.oid)

Combine function (zero if none)

aggserialfn regproc (references pg_proc.oid)

Serialization function (zero if none)

aggdeserialfn regproc (references pg_proc.oid)

Deserialization function (zero if none)

aggmtransfn regproc (references pg_proc.oid)

Forward transition function for moving-aggregate mode (zero if none)

aggminvtransfn regproc (references pg_proc.oid)

Inverse transition function for moving-aggregate mode (zero if none)

aggmfinalfn regproc (references pg_proc.oid)

Final function for moving-aggregate mode (zero if none)

True to pass extra dummy arguments to aggfinalfn

True to pass extra dummy arguments to aggmfinalfn

Whether aggfinalfn modifies the transition state value: r if it is read-only, s if the aggtransfn cannot be applied after the aggfinalfn, or w if it writes on the value

Like aggfinalmodify, but for the aggmfinalfn

aggsortop oid (references pg_operator.oid)

Associated sort operator (zero if none)

aggtranstype oid (references pg_type.oid)

Data type of the aggregate function's internal transition (state) data

Approximate average size (in bytes) of the transition state data, or zero to use a default estimate

aggmtranstype oid (references pg_type.oid)

Data type of the aggregate function's internal transition (state) data for moving-aggregate mode (zero if none)

Approximate average size (in bytes) of the transition state data for moving-aggregate mode, or zero to use a default estimate

The initial value of the transition state. This is a text field containing the initial value in its external string representation. If this field is null, the transition state value starts out null.

The initial value of the transition state for moving-aggregate mode. This is a text field containing the initial value in its external string representation. If this field is null, the transition state value starts out null.

New aggregate functions are registered with the CREATE AGGREGATE command. See Section 36.12 for more information about writing aggregate functions and the meaning of the transition functions, etc.

**Examples:**

Example 1 (unknown):
```unknown
pg_aggregate
```

Example 2 (unknown):
```unknown
pg_aggregate
```

Example 3 (unknown):
```unknown
pg_aggregate
```

Example 4 (unknown):
```unknown
pg_aggregate
```

---


---

## 52.56. pg_tablespace #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-tablespace.html

**Contents:**
- 52.56. pg_tablespace #

The catalog pg_tablespace stores information about the available tablespaces. Tables can be placed in particular tablespaces to aid administration of disk layout.

Unlike most system catalogs, pg_tablespace is shared across all databases of a cluster: there is only one copy of pg_tablespace per cluster, not one per database.

Table 52.56. pg_tablespace Columns

spcowner oid (references pg_authid.oid)

Owner of the tablespace, usually the user who created it

Access privileges; see Section 5.8 for details

Tablespace-level options, as “keyword=value” strings

**Examples:**

Example 1 (unknown):
```unknown
pg_tablespace
```

Example 2 (unknown):
```unknown
pg_tablespace
```

Example 3 (unknown):
```unknown
pg_tablespace
```

Example 4 (unknown):
```unknown
pg_tablespace
```

---


---

## 52.7. pg_attribute #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-attribute.html

**Contents:**
- 52.7. pg_attribute #

The catalog pg_attribute stores information about table columns. There will be exactly one pg_attribute row for every column in every table in the database. (There will also be attribute entries for indexes, and indeed all objects that have pg_class entries.)

The term attribute is equivalent to column and is used for historical reasons.

Table 52.7. pg_attribute Columns

attrelid oid (references pg_class.oid)

The table this column belongs to

atttypid oid (references pg_type.oid)

The data type of this column (zero for a dropped column)

A copy of pg_type.typlen of this column's type

The number of the column. Ordinary columns are numbered from 1 up. System columns, such as ctid, have (arbitrary) negative numbers.

atttypmod records type-specific data supplied at table creation time (for example, the maximum length of a varchar column). It is passed to type-specific input functions and length coercion functions. The value will generally be -1 for types that do not need atttypmod.

Number of dimensions, if the column is an array type; otherwise 0. (Presently, the number of dimensions of an array is not enforced, so any nonzero value effectively means “it's an array”.)

A copy of pg_type.typbyval of this column's type

A copy of pg_type.typalign of this column's type

Normally a copy of pg_type.typstorage of this column's type. For TOAST-able data types, this can be altered after column creation to control storage policy.

The current compression method of the column. Typically this is '\0' to specify use of the current default setting (see default_toast_compression). Otherwise, 'p' selects pglz compression, while 'l' selects LZ4 compression. However, this field is ignored whenever attstorage does not allow compression.

This column has a (possibly invalid) not-null constraint.

This column has a default expression or generation expression, in which case there will be a corresponding entry in the pg_attrdef catalog that actually defines the expression. (Check attgenerated to determine whether this is a default or a generation expression.)

This column has a value which is used where the column is entirely missing from the row, as happens when a column is added with a non-volatile DEFAULT value after the row is created. The actual value used is stored in the attmissingval column.

If a zero byte (''), then not an identity column. Otherwise, a = generated always, d = generated by default.

If a zero byte (''), then not a generated column. Otherwise, s = stored, v = virtual. A stored generated column is physically stored like a normal column. A virtual generated column is physically stored as a null value, with the actual value being computed at run time.

This column has been dropped and is no longer valid. A dropped column is still physically present in the table, but is ignored by the parser and so cannot be accessed via SQL.

This column is defined locally in the relation. Note that a column can be locally defined and inherited simultaneously.

The number of direct ancestors this column has. A column with a nonzero number of ancestors cannot be dropped nor renamed.

attcollation oid (references pg_collation.oid)

The defined collation of the column, or zero if the column is not of a collatable data type

attstattarget controls the level of detail of statistics accumulated for this column by ANALYZE. A zero value indicates that no statistics should be collected. A null value says to use the system default statistics target. The exact meaning of positive values is data type-dependent. For scalar data types, attstattarget is both the target number of “most common values” to collect, and the target number of histogram bins to create.

Column-level access privileges, if any have been granted specifically on this column

Attribute-level options, as “keyword=value” strings

Attribute-level foreign data wrapper options, as “keyword=value” strings

attmissingval anyarray

This column has a one element array containing the value used when the column is entirely missing from the row, as happens when the column is added with a non-volatile DEFAULT value after the row is created. The value is only used when atthasmissing is true. If there is no value the column is null.

In a dropped column's pg_attribute entry, atttypid is reset to zero, but attlen and the other fields copied from pg_type are still valid. This arrangement is needed to cope with the situation where the dropped column's data type was later dropped, and so there is no pg_type row anymore. attlen and the other fields can be used to interpret the contents of a row of the table.

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
pg_attribute
```

Example 4 (unknown):
```unknown
pg_attribute
```

---


---

