# PostgreSQL - Sql Commands (Part 32)

## 


**URL:** https://www.postgresql.org/docs/18/sql-create-access-method.html

**Contents:**
- CREATE ACCESS METHOD
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

CREATE ACCESS METHOD — define a new access method

CREATE ACCESS METHOD creates a new access method.

The access method name must be unique within the database.

Only superusers can define new access methods.

The name of the access method to be created.

This clause specifies the type of access method to define. Only TABLE and INDEX are supported at present.

handler_function is the name (possibly schema-qualified) of a previously registered function that represents the access method. The handler function must be declared to take a single argument of type internal, and its return type depends on the type of access method; for TABLE access methods, it must be table_am_handler and for INDEX access methods, it must be index_am_handler. The C-level API that the handler function must implement varies depending on the type of access method. The table access method API is described in Chapter 62 and the index access method API is described in Chapter 63.

Create an index access method heptree with handler function heptree_handler:

CREATE ACCESS METHOD is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
access_method_type
```

Example 2 (unknown):
```unknown
handler_function
```

Example 3 (unknown):
```unknown
CREATE ACCESS METHOD
```

Example 4 (unknown):
```unknown
access_method_type
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-revoke.html

**Contents:**
- REVOKE
- Synopsis
- Description
- Notes
- Examples
- Compatibility
- See Also

REVOKE — remove access privileges

The REVOKE command revokes previously granted privileges from one or more roles. The key word PUBLIC refers to the implicitly defined group of all roles.

See the description of the GRANT command for the meaning of the privilege types.

Note that any particular role will have the sum of privileges granted directly to it, privileges granted to any role it is presently a member of, and privileges granted to PUBLIC. Thus, for example, revoking SELECT privilege from PUBLIC does not necessarily mean that all roles have lost SELECT privilege on the object: those who have it granted directly or via another role will still have it. Similarly, revoking SELECT from a user might not prevent that user from using SELECT if PUBLIC or another membership role still has SELECT rights.

If GRANT OPTION FOR is specified, only the grant option for the privilege is revoked, not the privilege itself. Otherwise, both the privilege and the grant option are revoked.

If a user holds a privilege with grant option and has granted it to other users then the privileges held by those other users are called dependent privileges. If the privilege or the grant option held by the first user is being revoked and dependent privileges exist, those dependent privileges are also revoked if CASCADE is specified; if it is not, the revoke action will fail. This recursive revocation only affects privileges that were granted through a chain of users that is traceable to the user that is the subject of this REVOKE command. Thus, the affected users might effectively keep the privilege if it was also granted through other users.

When revoking privileges on a table, the corresponding column privileges (if any) are automatically revoked on each column of the table, as well. On the other hand, if a role has been granted privileges on a table, then revoking the same privileges from individual columns will have no effect.

When revoking membership in a role, GRANT OPTION is instead called ADMIN OPTION, but the behavior is similar. Note that, in releases prior to PostgreSQL 16, dependent privileges were not tracked for grants of role membership, and thus CASCADE had no effect for role membership. This is no longer the case. Note also that this form of the command does not allow the noise word GROUP in role_specification.

Just as ADMIN OPTION can be removed from an existing role grant, it is also possible to revoke INHERIT OPTION or SET OPTION. This is equivalent to setting the value of the corresponding option to FALSE.

A user can only revoke privileges that were granted directly by that user. If, for example, user A has granted a privilege with grant option to user B, and user B has in turn granted it to user C, then user A cannot revoke the privilege directly from C. Instead, user A could revoke the grant option from user B and use the CASCADE option so that the privilege is in turn revoked from user C. For another example, if both A and B have granted the same privilege to C, A can revoke their own grant but not B's grant, so C will still effectively have the privilege.

When a non-owner of an object attempts to REVOKE privileges on the object, the command will fail outright if the user has no privileges whatsoever on the object. As long as some privilege is available, the command will proceed, but it will revoke only those privileges for which the user has grant options. The REVOKE ALL PRIVILEGES forms will issue a warning message if no grant options are held, while the other forms will issue a warning if grant options for any of the privileges specifically named in the command are not held. (In principle these statements apply to the object owner as well, but since the owner is always treated as holding all grant options, the cases can never occur.)

If a superuser chooses to issue a GRANT or REVOKE command, the command is performed as though it were issued by the owner of the affected object. (Since roles do not have owners, in the case of a GRANT of role membership, the command is performed as though it were issued by the bootstrap superuser.) Since all privileges ultimately come from the object owner (possibly indirectly via chains of grant options), it is possible for a superuser to revoke all privileges, but this might require use of CASCADE as stated above.

REVOKE can also be done by a role that is not the owner of the affected object, but is a member of the role that owns the object, or is a member of a role that holds privileges WITH GRANT OPTION on the object. In this case the command is performed as though it were issued by the containing role that actually owns the object or holds the privileges WITH GRANT OPTION. For example, if table t1 is owned by role g1, of which role u1 is a member, then u1 can revoke privileges on t1 that are recorded as being granted by g1. This would include grants made by u1 as well as by other members of role g1.

If the role executing REVOKE holds privileges indirectly via more than one role membership path, it is unspecified which containing role will be used to perform the command. In such cases it is best practice to use SET ROLE to become the specific role you want to do the REVOKE as. Failure to do so might lead to revoking privileges other than the ones you intended, or not revoking anything at all.

See Section 5.8 for more information about specific privilege types, as well as how to inspect objects' privileges.

Revoke insert privilege for the public on table films:

Revoke all privileges from user manuel on view kinds:

Note that this actually means “revoke all privileges that I granted”.

Revoke membership in role admins from user joe:

The compatibility notes of the GRANT command apply analogously to REVOKE. The keyword RESTRICT or CASCADE is required according to the standard, but PostgreSQL assumes RESTRICT by default.

**Examples:**

Example 1 (unknown):
```unknown
schema_name
```

Example 2 (unknown):
```unknown
role_specification
```

Example 3 (unknown):
```unknown
role_specification
```

Example 4 (unknown):
```unknown
column_name
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-truncate.html

**Contents:**
- TRUNCATE
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

TRUNCATE — empty a table or set of tables

TRUNCATE quickly removes all rows from a set of tables. It has the same effect as an unqualified DELETE on each table, but since it does not actually scan the tables it is faster. Furthermore, it reclaims disk space immediately, rather than requiring a subsequent VACUUM operation. This is most useful on large tables.

The name (optionally schema-qualified) of a table to truncate. If ONLY is specified before the table name, only that table is truncated. If ONLY is not specified, the table and all its descendant tables (if any) are truncated. Optionally, * can be specified after the table name to explicitly indicate that descendant tables are included.

Automatically restart sequences owned by columns of the truncated table(s).

Do not change the values of sequences. This is the default.

Automatically truncate all tables that have foreign-key references to any of the named tables, or to any tables added to the group due to CASCADE.

Refuse to truncate if any of the tables have foreign-key references from tables that are not listed in the command. This is the default.

You must have the TRUNCATE privilege on a table to truncate it.

TRUNCATE acquires an ACCESS EXCLUSIVE lock on each table it operates on, which blocks all other concurrent operations on the table. When RESTART IDENTITY is specified, any sequences that are to be restarted are likewise locked exclusively. If concurrent access to a table is required, then the DELETE command should be used instead.

TRUNCATE cannot be used on a table that has foreign-key references from other tables, unless all such tables are also truncated in the same command. Checking validity in such cases would require table scans, and the whole point is not to do one. The CASCADE option can be used to automatically include all dependent tables — but be very careful when using this option, or else you might lose data you did not intend to! Note in particular that when the table to be truncated is a partition, siblings partitions are left untouched, but cascading occurs to all referencing tables and all their partitions with no distinction.

TRUNCATE will not fire any ON DELETE triggers that might exist for the tables. But it will fire ON TRUNCATE triggers. If ON TRUNCATE triggers are defined for any of the tables, then all BEFORE TRUNCATE triggers are fired before any truncation happens, and all AFTER TRUNCATE triggers are fired after the last truncation is performed and any sequences are reset. The triggers will fire in the order that the tables are to be processed (first those listed in the command, and then any that were added due to cascading).

TRUNCATE is not MVCC-safe. After truncation, the table will appear empty to concurrent transactions, if they are using a snapshot taken before the truncation occurred. See Section 13.6 for more details.

TRUNCATE is transaction-safe with respect to the data in the tables: the truncation will be safely rolled back if the surrounding transaction does not commit.

When RESTART IDENTITY is specified, the implied ALTER SEQUENCE RESTART operations are also done transactionally; that is, they will be rolled back if the surrounding transaction does not commit. Be aware that if any additional sequence operations are done on the restarted sequences before the transaction rolls back, the effects of these operations on the sequences will be rolled back, but not their effects on currval(); that is, after the transaction currval() will continue to reflect the last sequence value obtained inside the failed transaction, even though the sequence itself may no longer be consistent with that. This is similar to the usual behavior of currval() after a failed transaction.

TRUNCATE can be used for foreign tables if supported by the foreign data wrapper, for instance, see postgres_fdw.

Truncate the tables bigtable and fattable:

The same, and also reset any associated sequence generators:

Truncate the table othertable, and cascade to any tables that reference othertable via foreign-key constraints:

The SQL:2008 standard includes a TRUNCATE command with the syntax TRUNCATE TABLE tablename. The clauses CONTINUE IDENTITY/RESTART IDENTITY also appear in that standard, but have slightly different though related meanings. Some of the concurrency behavior of this command is left implementation-defined by the standard, so the above notes should be considered and compared with other implementations if necessary.

**Examples:**

Example 1 (unknown):
```unknown
RESTART IDENTITY
```

Example 2 (unknown):
```unknown
CONTINUE IDENTITY
```

Example 3 (unknown):
```unknown
ACCESS EXCLUSIVE
```

Example 4 (unknown):
```unknown
RESTART IDENTITY
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alteropfamily.html

**Contents:**
- ALTER OPERATOR FAMILY
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

ALTER OPERATOR FAMILY — change the definition of an operator family

ALTER OPERATOR FAMILY changes the definition of an operator family. You can add operators and support functions to the family, remove them from the family, or change the family's name or owner.

When operators and support functions are added to a family with ALTER OPERATOR FAMILY, they are not part of any specific operator class within the family, but are just “loose” within the family. This indicates that these operators and functions are compatible with the family's semantics, but are not required for correct functioning of any specific index. (Operators and functions that are so required should be declared as part of an operator class, instead; see CREATE OPERATOR CLASS.) PostgreSQL will allow loose members of a family to be dropped from the family at any time, but members of an operator class cannot be dropped without dropping the whole class and any indexes that depend on it. Typically, single-data-type operators and functions are part of operator classes because they are needed to support an index on that specific data type, while cross-data-type operators and functions are made loose members of the family.

You must be a superuser to use ALTER OPERATOR FAMILY. (This restriction is made because an erroneous operator family definition could confuse or even crash the server.)

ALTER OPERATOR FAMILY does not presently check whether the operator family definition includes all the operators and functions required by the index method, nor whether the operators and functions form a self-consistent set. It is the user's responsibility to define a valid operator family.

Refer to Section 36.16 for further information.

The name (optionally schema-qualified) of an existing operator family.

The name of the index method this operator family is for.

The index method's strategy number for an operator associated with the operator family.

The name (optionally schema-qualified) of an operator associated with the operator family.

In an OPERATOR clause, the operand data type(s) of the operator, or NONE to signify a prefix operator. Unlike the comparable syntax in CREATE OPERATOR CLASS, the operand data types must always be specified.

In an ADD FUNCTION clause, the operand data type(s) the function is intended to support, if different from the input data type(s) of the function. For B-tree comparison functions and hash functions it is not necessary to specify op_type since the function's input data type(s) are always the correct ones to use. For B-tree sort support functions, B-Tree equal image functions, and all functions in GiST, SP-GiST and GIN operator classes, it is necessary to specify the operand data type(s) the function is to be used with.

In a DROP FUNCTION clause, the operand data type(s) the function is intended to support must be specified.

The name (optionally schema-qualified) of an existing btree operator family that describes the sort ordering associated with an ordering operator.

If neither FOR SEARCH nor FOR ORDER BY is specified, FOR SEARCH is the default.

The index method's support function number for a function associated with the operator family.

The name (optionally schema-qualified) of a function that is an index method support function for the operator family. If no argument list is specified, the name must be unique in its schema.

The parameter data type(s) of the function.

The new name of the operator family.

The new owner of the operator family.

The new schema for the operator family.

The OPERATOR and FUNCTION clauses can appear in any order.

Notice that the DROP syntax only specifies the “slot” in the operator family, by strategy or support number and input data type(s). The name of the operator or function occupying the slot is not mentioned. Also, for DROP FUNCTION the type(s) to specify are the input data type(s) the function is intended to support; for GiST, SP-GiST and GIN indexes this might have nothing to do with the actual input argument types of the function.

Because the index machinery does not check access permissions on functions before using them, including a function or operator in an operator family is tantamount to granting public execute permission on it. This is usually not an issue for the sorts of functions that are useful in an operator family.

The operators should not be defined by SQL functions. An SQL function is likely to be inlined into the calling query, which will prevent the optimizer from recognizing that the query matches an index.

The following example command adds cross-data-type operators and support functions to an operator family that already contains B-tree operator classes for data types int4 and int2.

To remove these entries again:

There is no ALTER OPERATOR FAMILY statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
index_method
```

Example 2 (unknown):
```unknown
strategy_number
```

Example 3 (unknown):
```unknown
operator_name
```

Example 4 (unknown):
```unknown
sort_family_name
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-altertsparser.html

**Contents:**
- ALTER TEXT SEARCH PARSER
- Synopsis
- Description
- Parameters
- Compatibility
- See Also

ALTER TEXT SEARCH PARSER — change the definition of a text search parser

ALTER TEXT SEARCH PARSER changes the definition of a text search parser. Currently, the only supported functionality is to change the parser's name.

You must be a superuser to use ALTER TEXT SEARCH PARSER.

The name (optionally schema-qualified) of an existing text search parser.

The new name of the text search parser.

The new schema for the text search parser.

There is no ALTER TEXT SEARCH PARSER statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
ALTER TEXT SEARCH PARSER
```

Example 2 (unknown):
```unknown
ALTER TEXT SEARCH PARSER
```

Example 3 (unknown):
```unknown
ALTER TEXT SEARCH PARSER
```

---


---

