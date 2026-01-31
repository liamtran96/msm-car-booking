# PostgreSQL - System Catalogs (Part 12)

## 52.5. pg_amproc #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-amproc.html

**Contents:**
- 52.5. pg_amproc #

The catalog pg_amproc stores information about support functions associated with access method operator families. There is one row for each support function belonging to an operator family.

Table 52.5. pg_amproc Columns

amprocfamily oid (references pg_opfamily.oid)

The operator family this entry is for

amproclefttype oid (references pg_type.oid)

Left-hand input data type of associated operator

amprocrighttype oid (references pg_type.oid)

Right-hand input data type of associated operator

Support function number

amproc regproc (references pg_proc.oid)

The usual interpretation of the amproclefttype and amprocrighttype fields is that they identify the left and right input types of the operator(s) that a particular support function supports. For some access methods these match the input data type(s) of the support function itself, for others not. There is a notion of “default” support functions for an index, which are those with amproclefttype and amprocrighttype both equal to the index operator class's opcintype.

**Examples:**

Example 1 (unknown):
```unknown
amprocfamily
```

Example 2 (unknown):
```unknown
pg_opfamily
```

Example 3 (unknown):
```unknown
amproclefttype
```

Example 4 (unknown):
```unknown
amprocrighttype
```

---


---

## 52.35. pg_opfamily #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-opfamily.html

**Contents:**
- 52.35. pg_opfamily #

The catalog pg_opfamily defines operator families. Each operator family is a collection of operators and associated support routines that implement the semantics specified for a particular index access method. Furthermore, the operators in a family are all “compatible”, in a way that is specified by the access method. The operator family concept allows cross-data-type operators to be used with indexes and to be reasoned about using knowledge of access method semantics.

Operator families are described at length in Section 36.16.

Table 52.35. pg_opfamily Columns

opfmethod oid (references pg_am.oid)

Index access method operator family is for

Name of this operator family

opfnamespace oid (references pg_namespace.oid)

Namespace of this operator family

opfowner oid (references pg_authid.oid)

Owner of the operator family

The majority of the information defining an operator family is not in its pg_opfamily row, but in the associated rows in pg_amop, pg_amproc, and pg_opclass.

**Examples:**

Example 1 (unknown):
```unknown
pg_opfamily
```

Example 2 (unknown):
```unknown
pg_opfamily
```

Example 3 (unknown):
```unknown
pg_opfamily
```

Example 4 (unknown):
```unknown
pg_opfamily
```

---


---

## 52.24. pg_foreign_server #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-foreign-server.html

**Contents:**
- 52.24. pg_foreign_server #

The catalog pg_foreign_server stores foreign server definitions. A foreign server describes a source of external data, such as a remote server. Foreign servers are accessed via foreign-data wrappers.

Table 52.24. pg_foreign_server Columns

Name of the foreign server

srvowner oid (references pg_authid.oid)

Owner of the foreign server

srvfdw oid (references pg_foreign_data_wrapper.oid)

OID of the foreign-data wrapper of this foreign server

Type of the server (optional)

Version of the server (optional)

Access privileges; see Section 5.8 for details

Foreign server specific options, as “keyword=value” strings

**Examples:**

Example 1 (unknown):
```unknown
pg_foreign_server
```

Example 2 (unknown):
```unknown
pg_foreign_server
```

Example 3 (unknown):
```unknown
pg_foreign_server
```

Example 4 (unknown):
```unknown
pg_foreign_server
```

---


---

## 52.44. pg_replication_origin #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-replication-origin.html

**Contents:**
- 52.44. pg_replication_origin #

The pg_replication_origin catalog contains all replication origins created. For more on replication origins see Chapter 48.

Unlike most system catalogs, pg_replication_origin is shared across all databases of a cluster: there is only one copy of pg_replication_origin per cluster, not one per database.

Table 52.44. pg_replication_origin Columns

A unique, cluster-wide identifier for the replication origin. Should never leave the system.

The external, user defined, name of a replication origin.

**Examples:**

Example 1 (unknown):
```unknown
pg_replication_origin
```

Example 2 (unknown):
```unknown
pg_replication_origin
```

Example 3 (unknown):
```unknown
pg_replication_origin
```

Example 4 (unknown):
```unknown
pg_replication_origin
```

---


---

## 52.1. Overview #


**URL:** https://www.postgresql.org/docs/18/catalogs-overview.html

**Contents:**
- 52.1. Overview #

Table 52.1 lists the system catalogs. More detailed documentation of each catalog follows below.

Most system catalogs are copied from the template database during database creation and are thereafter database-specific. A few catalogs are physically shared across all databases in a cluster; these are noted in the descriptions of the individual catalogs.

Table 52.1. System Catalogs

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

## 52.23. pg_foreign_data_wrapper #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-foreign-data-wrapper.html

**Contents:**
- 52.23. pg_foreign_data_wrapper #

The catalog pg_foreign_data_wrapper stores foreign-data wrapper definitions. A foreign-data wrapper is the mechanism by which external data, residing on foreign servers, is accessed.

Table 52.23. pg_foreign_data_wrapper Columns

Name of the foreign-data wrapper

fdwowner oid (references pg_authid.oid)

Owner of the foreign-data wrapper

fdwhandler oid (references pg_proc.oid)

References a handler function that is responsible for supplying execution routines for the foreign-data wrapper. Zero if no handler is provided

fdwvalidator oid (references pg_proc.oid)

References a validator function that is responsible for checking the validity of the options given to the foreign-data wrapper, as well as options for foreign servers and user mappings using the foreign-data wrapper. Zero if no validator is provided

Access privileges; see Section 5.8 for details

Foreign-data wrapper specific options, as “keyword=value” strings

**Examples:**

Example 1 (unknown):
```unknown
pg_foreign_data_wrapper
```

Example 2 (unknown):
```unknown
pg_foreign_data_wrapper
```

Example 3 (unknown):
```unknown
pg_foreign_data_wrapper
```

Example 4 (unknown):
```unknown
pg_foreign_data_wrapper
```

---


---

