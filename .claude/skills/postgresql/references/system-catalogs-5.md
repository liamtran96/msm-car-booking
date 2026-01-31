# PostgreSQL - System Catalogs (Part 5)

## 52.33. pg_opclass #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-opclass.html

**Contents:**
- 52.33. pg_opclass #

The catalog pg_opclass defines index access method operator classes. Each operator class defines semantics for index columns of a particular data type and a particular index access method. An operator class essentially specifies that a particular operator family is applicable to a particular indexable column data type. The set of operators from the family that are actually usable with the indexed column are whichever ones accept the column's data type as their left-hand input.

Operator classes are described at length in Section 36.16.

Table 52.33. pg_opclass Columns

opcmethod oid (references pg_am.oid)

Index access method operator class is for

Name of this operator class

opcnamespace oid (references pg_namespace.oid)

Namespace of this operator class

opcowner oid (references pg_authid.oid)

Owner of the operator class

opcfamily oid (references pg_opfamily.oid)

Operator family containing the operator class

opcintype oid (references pg_type.oid)

Data type that the operator class indexes

True if this operator class is the default for opcintype

opckeytype oid (references pg_type.oid)

Type of data stored in index, or zero if same as opcintype

An operator class's opcmethod must match the opfmethod of its containing operator family. Also, there must be no more than one pg_opclass row having opcdefault true for any given combination of opcmethod and opcintype.

**Examples:**

Example 1 (unknown):
```unknown
opcnamespace
```

Example 2 (unknown):
```unknown
pg_namespace
```

Example 3 (unknown):
```unknown
pg_opfamily
```

Example 4 (unknown):
```unknown
pg_namespace
```

---


---

## 52.8. pg_authid #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-authid.html

**Contents:**
- 52.8. pg_authid #
  - Warning

The catalog pg_authid contains information about database authorization identifiers (roles). A role subsumes the concepts of “users” and “groups”. A user is essentially just a role with the rolcanlogin flag set. Any role (with or without rolcanlogin) can have other roles as members; see pg_auth_members.

Since this catalog contains passwords, it must not be publicly readable. pg_roles is a publicly readable view on pg_authid that blanks out the password field.

Chapter 21 contains detailed information about user and privilege management.

Because user identities are cluster-wide, pg_authid is shared across all databases of a cluster: there is only one copy of pg_authid per cluster, not one per database.

Table 52.8. pg_authid Columns

Role has superuser privileges

Role automatically inherits privileges of roles it is a member of

Role can create more roles

Role can create databases

Role can log in. That is, this role can be given as the initial session authorization identifier.

Role is a replication role. A replication role can initiate replication connections and create and drop replication slots.

Role bypasses every row-level security policy, see Section 5.9 for more information.

For roles that can log in, this sets maximum number of concurrent connections this role can make. -1 means no limit.

Encrypted password; null if none. The format depends on the form of encryption used.

rolvaliduntil timestamptz

Password expiry time (only used for password authentication); null if no expiration

For an MD5 encrypted password, rolpassword column will begin with the string md5 followed by a 32-character hexadecimal MD5 hash. The MD5 hash will be of the user's password concatenated to their user name. For example, if user joe has password xyzzy, PostgreSQL will store the md5 hash of xyzzyjoe.

Support for MD5-encrypted passwords is deprecated and will be removed in a future release of PostgreSQL. Refer to Section 20.5 for details about migrating to another password type.

If the password is encrypted with SCRAM-SHA-256, it has the format:

where salt, StoredKey and ServerKey are in Base64 encoded format. This format is the same as that specified by RFC 5803.

**Examples:**

Example 1 (unknown):
```unknown
rolcanlogin
```

Example 2 (unknown):
```unknown
rolcanlogin
```

Example 3 (unknown):
```unknown
pg_auth_members
```

Example 4 (unknown):
```unknown
rolcreaterole
```

---


---

## 52.18. pg_depend #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-depend.html

**Contents:**
- 52.18. pg_depend #

The catalog pg_depend records the dependency relationships between database objects. This information allows DROP commands to find which other objects must be dropped by DROP CASCADE or prevent dropping in the DROP RESTRICT case.

See also pg_shdepend, which performs a similar function for dependencies involving objects that are shared across a database cluster.

Table 52.18. pg_depend Columns

classid oid (references pg_class.oid)

The OID of the system catalog the dependent object is in

objid oid (references any OID column)

The OID of the specific dependent object

For a table column, this is the column number (the objid and classid refer to the table itself). For all other object types, this column is zero.

refclassid oid (references pg_class.oid)

The OID of the system catalog the referenced object is in

refobjid oid (references any OID column)

The OID of the specific referenced object

For a table column, this is the column number (the refobjid and refclassid refer to the table itself). For all other object types, this column is zero.

A code defining the specific semantics of this dependency relationship; see text

In all cases, a pg_depend entry indicates that the referenced object cannot be dropped without also dropping the dependent object. However, there are several subflavors identified by deptype:

A normal relationship between separately-created objects. The dependent object can be dropped without affecting the referenced object. The referenced object can only be dropped by specifying CASCADE, in which case the dependent object is dropped, too. Example: a table column has a normal dependency on its data type.

The dependent object can be dropped separately from the referenced object, and should be automatically dropped (regardless of RESTRICT or CASCADE mode) if the referenced object is dropped. Example: a named constraint on a table is made auto-dependent on the table, so that it will go away if the table is dropped.

The dependent object was created as part of creation of the referenced object, and is really just a part of its internal implementation. A direct DROP of the dependent object will be disallowed outright (we'll tell the user to issue a DROP against the referenced object, instead). A DROP of the referenced object will result in automatically dropping the dependent object whether CASCADE is specified or not. If the dependent object has to be dropped due to a dependency on some other object being removed, its drop is converted to a drop of the referenced object, so that NORMAL and AUTO dependencies of the dependent object behave much like they were dependencies of the referenced object. Example: a view's ON SELECT rule is made internally dependent on the view, preventing it from being dropped while the view remains. Dependencies of the rule (such as tables it refers to) act as if they were dependencies of the view.

The dependent object was created as part of creation of the referenced object, and is really just a part of its internal implementation; however, unlike INTERNAL, there is more than one such referenced object. The dependent object must not be dropped unless at least one of these referenced objects is dropped; if any one is, the dependent object should be dropped whether or not CASCADE is specified. Also unlike INTERNAL, a drop of some other object that the dependent object depends on does not result in automatic deletion of any partition-referenced object. Hence, if the drop does not cascade to at least one of these objects via some other path, it will be refused. (In most cases, the dependent object shares all its non-partition dependencies with at least one partition-referenced object, so that this restriction does not result in blocking any cascaded delete.) Primary and secondary partition dependencies behave identically except that the primary dependency is preferred for use in error messages; hence, a partition-dependent object should have one primary partition dependency and one or more secondary partition dependencies. Note that partition dependencies are made in addition to, not instead of, any dependencies the object would normally have. This simplifies ATTACH/DETACH PARTITION operations: the partition dependencies need only be added or removed. Example: a child partitioned index is made partition-dependent on both the partition table it is on and the parent partitioned index, so that it goes away if either of those is dropped, but not otherwise. The dependency on the parent index is primary, so that if the user tries to drop the child partitioned index, the error message will suggest dropping the parent index instead (not the table).

The dependent object is a member of the extension that is the referenced object (see pg_extension). The dependent object can be dropped only via DROP EXTENSION on the referenced object. Functionally this dependency type acts the same as an INTERNAL dependency, but it's kept separate for clarity and to simplify pg_dump.

The dependent object is not a member of the extension that is the referenced object (and so it should not be ignored by pg_dump), but it cannot function without the extension and should be auto-dropped if the extension is. The dependent object may be dropped on its own as well. Functionally this dependency type acts the same as an AUTO dependency, but it's kept separate for clarity and to simplify pg_dump.

Other dependency flavors might be needed in future.

Note that it's quite possible for two objects to be linked by more than one pg_depend entry. For example, a child partitioned index would have both a partition-type dependency on its associated partition table, and an auto dependency on each column of that table that it indexes. This sort of situation expresses the union of multiple dependency semantics. A dependent object can be dropped without CASCADE if any of its dependencies satisfies its condition for automatic dropping. Conversely, all the dependencies' restrictions about which objects must be dropped together must be satisfied.

Most objects created during initdb are considered “pinned”, which means that the system itself depends on them. Therefore, they are never allowed to be dropped. Also, knowing that pinned objects will not be dropped, the dependency mechanism doesn't bother to make pg_depend entries showing dependencies on them. Thus, for example, a table column of type numeric notionally has a NORMAL dependency on the numeric data type, but no such entry actually appears in pg_depend.

**Examples:**

Example 1 (unknown):
```unknown
DROP CASCADE
```

Example 2 (unknown):
```unknown
DROP RESTRICT
```

Example 3 (unknown):
```unknown
pg_shdepend
```

Example 4 (unknown):
```unknown
refobjsubid
```

---


---

## 52.27. pg_inherits #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-inherits.html

**Contents:**
- 52.27. pg_inherits #

The catalog pg_inherits records information about table and index inheritance hierarchies. There is one entry for each direct parent-child table or index relationship in the database. (Indirect inheritance can be determined by following chains of entries.)

Table 52.27. pg_inherits Columns

inhrelid oid (references pg_class.oid)

The OID of the child table or index

inhparent oid (references pg_class.oid)

The OID of the parent table or index

If there is more than one direct parent for a child table (multiple inheritance), this number tells the order in which the inherited columns are to be arranged. The count starts at 1.

Indexes cannot have multiple inheritance, since they can only inherit when using declarative partitioning.

inhdetachpending bool

true for a partition that is in the process of being detached; false otherwise.

**Examples:**

Example 1 (unknown):
```unknown
pg_inherits
```

Example 2 (unknown):
```unknown
pg_inherits
```

Example 3 (unknown):
```unknown
pg_inherits
```

Example 4 (unknown):
```unknown
pg_inherits
```

---


---

## 52.61. pg_ts_dict #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-ts-dict.html

**Contents:**
- 52.61. pg_ts_dict #

The pg_ts_dict catalog contains entries defining text search dictionaries. A dictionary depends on a text search template, which specifies all the implementation functions needed; the dictionary itself provides values for the user-settable parameters supported by the template. This division of labor allows dictionaries to be created by unprivileged users. The parameters are specified by a text string dictinitoption, whose format and meaning vary depending on the template.

PostgreSQL's text search features are described at length in Chapter 12.

Table 52.61. pg_ts_dict Columns

Text search dictionary name

dictnamespace oid (references pg_namespace.oid)

The OID of the namespace that contains this dictionary

dictowner oid (references pg_authid.oid)

Owner of the dictionary

dicttemplate oid (references pg_ts_template.oid)

The OID of the text search template for this dictionary

Initialization option string for the template

**Examples:**

Example 1 (unknown):
```unknown
dictinitoption
```

Example 2 (unknown):
```unknown
dictnamespace
```

Example 3 (unknown):
```unknown
pg_namespace
```

Example 4 (unknown):
```unknown
dicttemplate
```

---


---

