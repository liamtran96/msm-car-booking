# PostgreSQL - System Catalogs

## 52.3. pg_am #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-am.html

**Contents:**
- 52.3. pg_am #
  - Note

The catalog pg_am stores information about relation access methods. There is one row for each access method supported by the system. Currently, only tables and indexes have access methods. The requirements for table and index access methods are discussed in detail in Chapter 62 and Chapter 63 respectively.

Table 52.3. pg_am Columns

Name of the access method

amhandler regproc (references pg_proc.oid)

OID of a handler function that is responsible for supplying information about the access method

t = table (including materialized views), i = index.

Before PostgreSQL 9.6, pg_am contained many additional columns representing properties of index access methods. That data is now only directly visible at the C code level. However, pg_index_column_has_property() and related functions have been added to allow SQL queries to inspect index access method properties; see Table 9.76.

**Examples:**

Example 1 (unknown):
```unknown
pg_index_column_has_property()
```

Example 2 (unknown):
```unknown
pg_aggregate
```

---


---

## 52.58. pg_trigger #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-trigger.html

**Contents:**
- 52.58. pg_trigger #
  - Note
  - Note

The catalog pg_trigger stores triggers on tables and views. See CREATE TRIGGER for more information.

Table 52.58. pg_trigger Columns

tgrelid oid (references pg_class.oid)

The table this trigger is on

tgparentid oid (references pg_trigger.oid)

Parent trigger that this trigger is cloned from (this happens when partitions are created or attached to a partitioned table); zero if not a clone

Trigger name (must be unique among triggers of same table)

tgfoid oid (references pg_proc.oid)

The function to be called

Bit mask identifying trigger firing conditions

Controls in which session_replication_role modes the trigger fires. O = trigger fires in “origin” and “local” modes, D = trigger is disabled, R = trigger fires in “replica” mode, A = trigger fires always.

True if trigger is internally generated (usually, to enforce the constraint identified by tgconstraint)

tgconstrrelid oid (references pg_class.oid)

The table referenced by a referential integrity constraint (zero if trigger is not for a referential integrity constraint)

tgconstrindid oid (references pg_class.oid)

The index supporting a unique, primary key, referential integrity, or exclusion constraint (zero if trigger is not for one of these types of constraint)

tgconstraint oid (references pg_constraint.oid)

The pg_constraint entry associated with the trigger (zero if trigger is not for a constraint)

True if constraint trigger is deferrable

True if constraint trigger is initially deferred

Number of argument strings passed to trigger function

tgattr int2vector (references pg_attribute.attnum)

Column numbers, if trigger is column-specific; otherwise an empty array

Argument strings to pass to trigger, each NULL-terminated

Expression tree (in nodeToString() representation) for the trigger's WHEN condition, or null if none

REFERENCING clause name for OLD TABLE, or null if none

REFERENCING clause name for NEW TABLE, or null if none

Currently, column-specific triggering is supported only for UPDATE events, and so tgattr is relevant only for that event type. tgtype might contain bits for other event types as well, but those are presumed to be table-wide regardless of what is in tgattr.

When tgconstraint is nonzero, tgconstrrelid, tgconstrindid, tgdeferrable, and tginitdeferred are largely redundant with the referenced pg_constraint entry. However, it is possible for a non-deferrable trigger to be associated with a deferrable constraint: foreign key constraints can have some deferrable and some non-deferrable triggers.

pg_class.relhastriggers must be true if a relation has any triggers in this catalog.

**Examples:**

Example 1 (unknown):
```unknown
tgisinternal
```

Example 2 (unknown):
```unknown
tgconstraint
```

Example 3 (unknown):
```unknown
tgconstrrelid
```

Example 4 (unknown):
```unknown
tgconstrindid
```

---


---

## 52.43. pg_range #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-range.html

**Contents:**
- 52.43. pg_range #

The catalog pg_range stores information about range types. This is in addition to the types' entries in pg_type.

Table 52.43. pg_range Columns

rngtypid oid (references pg_type.oid)

OID of the range type

rngsubtype oid (references pg_type.oid)

OID of the element type (subtype) of this range type

rngmultitypid oid (references pg_type.oid)

OID of the multirange type for this range type

rngcollation oid (references pg_collation.oid)

OID of the collation used for range comparisons, or zero if none

rngsubopc oid (references pg_opclass.oid)

OID of the subtype's operator class used for range comparisons

rngcanonical regproc (references pg_proc.oid)

OID of the function to convert a range value into canonical form, or zero if none

rngsubdiff regproc (references pg_proc.oid)

OID of the function to return the difference between two element values as double precision, or zero if none

rngsubopc (plus rngcollation, if the element type is collatable) determines the sort ordering used by the range type. rngcanonical is used when the element type is discrete. rngsubdiff is optional but should be supplied to improve performance of GiST indexes on the range type.

**Examples:**

Example 1 (unknown):
```unknown
rngmultitypid
```

Example 2 (unknown):
```unknown
rngcollation
```

Example 3 (unknown):
```unknown
pg_collation
```

Example 4 (unknown):
```unknown
rngcanonical
```

---


---

## 52.42. pg_publication_rel #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-publication-rel.html

**Contents:**
- 52.42. pg_publication_rel #

The catalog pg_publication_rel contains the mapping between relations and publications in the database. This is a many-to-many mapping. See also Section 53.18 for a more user-friendly view of this information.

Table 52.42. pg_publication_rel Columns

prpubid oid (references pg_publication.oid)

Reference to publication

prrelid oid (references pg_class.oid)

Reference to relation

Expression tree (in nodeToString() representation) for the relation's publication qualifying condition. Null if there is no publication qualifying condition.

prattrs int2vector (references pg_attribute.attnum)

This is an array of values that indicates which table columns are part of the publication. For example, a value of 1 3 would mean that the first and the third table columns are published. A null value indicates that all columns are published.

**Examples:**

Example 1 (unknown):
```unknown
pg_publication_rel
```

Example 2 (unknown):
```unknown
pg_publication_rel
```

Example 3 (unknown):
```unknown
pg_publication_rel
```

Example 4 (unknown):
```unknown
pg_publication_rel
```

---


---

## 52.39. pg_proc #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-proc.html

**Contents:**
- 52.39. pg_proc #

The catalog pg_proc stores information about functions, procedures, aggregate functions, and window functions (collectively also known as routines). See CREATE FUNCTION, CREATE PROCEDURE, and Section 36.3 for more information.

If prokind indicates that the entry is for an aggregate function, there should be a matching row in pg_aggregate.

Table 52.39. pg_proc Columns

pronamespace oid (references pg_namespace.oid)

The OID of the namespace that contains this function

proowner oid (references pg_authid.oid)

Owner of the function

prolang oid (references pg_language.oid)

Implementation language or call interface of this function

Estimated execution cost (in units of cpu_operator_cost); if proretset, this is cost per row returned

Estimated number of result rows (zero if not proretset)

provariadic oid (references pg_type.oid)

Data type of the variadic array parameter's elements, or zero if the function does not have a variadic parameter

prosupport regproc (references pg_proc.oid)

Planner support function for this function (see Section 36.11), or zero if none

f for a normal function, p for a procedure, a for an aggregate function, or w for a window function

Function is a security definer (i.e., a “setuid” function)

The function has no side effects. No information about the arguments is conveyed except via the return value. Any function that might throw an error depending on the values of its arguments is not leakproof.

Function returns null if any call argument is null. In that case the function won't actually be called at all. Functions that are not “strict” must be prepared to handle null inputs.

Function returns a set (i.e., multiple values of the specified data type)

provolatile tells whether the function's result depends only on its input arguments, or is affected by outside factors. It is i for “immutable” functions, which always deliver the same result for the same inputs. It is s for “stable” functions, whose results (for fixed inputs) do not change within a scan. It is v for “volatile” functions, whose results might change at any time. (Use v also for functions with side-effects, so that calls to them cannot get optimized away.)

proparallel tells whether the function can be safely run in parallel mode. It is s for functions which are safe to run in parallel mode without restriction. It is r for functions which can be run in parallel mode, but their execution is restricted to the parallel group leader; parallel worker processes cannot invoke these functions. It is u for functions which are unsafe in parallel mode; the presence of such a function forces a serial execution plan.

Number of input arguments

Number of arguments that have defaults

prorettype oid (references pg_type.oid)

Data type of the return value

proargtypes oidvector (references pg_type.oid)

An array of the data types of the function arguments. This includes only input arguments (including INOUT and VARIADIC arguments), and thus represents the call signature of the function.

proallargtypes oid[] (references pg_type.oid)

An array of the data types of the function arguments. This includes all arguments (including OUT and INOUT arguments); however, if all the arguments are IN arguments, this field will be null. Note that subscripting is 1-based, whereas for historical reasons proargtypes is subscripted from 0.

An array of the modes of the function arguments, encoded as i for IN arguments, o for OUT arguments, b for INOUT arguments, v for VARIADIC arguments, t for TABLE arguments. If all the arguments are IN arguments, this field will be null. Note that subscripts correspond to positions of proallargtypes not proargtypes.

An array of the names of the function arguments. Arguments without a name are set to empty strings in the array. If none of the arguments have a name, this field will be null. Note that subscripts correspond to positions of proallargtypes not proargtypes.

proargdefaults pg_node_tree

Expression trees (in nodeToString() representation) for default values. This is a list with pronargdefaults elements, corresponding to the last N input arguments (i.e., the last N proargtypes positions). If none of the arguments have defaults, this field will be null.

protrftypes oid[] (references pg_type.oid)

An array of the argument/result data type(s) for which to apply transforms (from the function's TRANSFORM clause). Null if none.

This tells the function handler how to invoke the function. It might be the actual source code of the function for interpreted languages, a link symbol, a file name, or just about anything else, depending on the implementation language/call convention.

Additional information about how to invoke the function. Again, the interpretation is language-specific.

prosqlbody pg_node_tree

Pre-parsed SQL function body. This is used for SQL-language functions when the body is given in SQL-standard notation rather than as a string literal. It's null in other cases.

Function's local settings for run-time configuration variables

Access privileges; see Section 5.8 for details

For compiled functions, both built-in and dynamically loaded, prosrc contains the function's C-language name (link symbol). For SQL-language functions, prosrc contains the function's source text if that is specified as a string literal; but if the function body is specified in SQL-standard style, prosrc is unused (typically it's an empty string) and prosqlbody contains the pre-parsed definition. For all other currently-known language types, prosrc contains the function's source text. probin is null except for dynamically-loaded C functions, for which it gives the name of the shared library file containing the function.

**Examples:**

Example 1 (unknown):
```unknown
pg_aggregate
```

Example 2 (unknown):
```unknown
pronamespace
```

Example 3 (unknown):
```unknown
pg_namespace
```

Example 4 (unknown):
```unknown
pg_language
```

---


---

