# PostgreSQL - Sql Commands (Part 6)

## 


**URL:** https://www.postgresql.org/docs/18/sql-altersubscription.html

**Contents:**
- ALTER SUBSCRIPTION
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

ALTER SUBSCRIPTION — change the definition of a subscription

ALTER SUBSCRIPTION can change most of the subscription properties that can be specified in CREATE SUBSCRIPTION.

You must own the subscription to use ALTER SUBSCRIPTION. To rename a subscription or alter the owner, you must have CREATE permission on the database. In addition, to alter the owner, you must be able to SET ROLE to the new owning role. If the subscription has password_required=false, only superusers can modify it.

When refreshing a publication we remove the relations that are no longer part of the publication and we also remove the table synchronization slots if there are any. It is necessary to remove these slots so that the resources allocated for the subscription on the remote host are released. If due to network breakdown or some other error, PostgreSQL is unable to remove the slots, an error will be reported. To proceed in this situation, the user either needs to retry the operation or disassociate the slot from the subscription and drop the subscription as explained in DROP SUBSCRIPTION.

Commands ALTER SUBSCRIPTION ... REFRESH PUBLICATION, ALTER SUBSCRIPTION ... {SET|ADD|DROP} PUBLICATION ... with refresh option as true, ALTER SUBSCRIPTION ... SET (failover = true|false) and ALTER SUBSCRIPTION ... SET (two_phase = false) cannot be executed inside a transaction block.

Commands ALTER SUBSCRIPTION ... REFRESH PUBLICATION and ALTER SUBSCRIPTION ... {SET|ADD|DROP} PUBLICATION ... with refresh option as true also cannot be executed when the subscription has two_phase commit enabled, unless copy_data is false. See column subtwophasestate of pg_subscription to know the actual two-phase state.

The name of a subscription whose properties are to be altered.

This clause replaces the connection string originally set by CREATE SUBSCRIPTION. See there for more information.

These forms change the list of subscribed publications. SET replaces the entire list of publications with a new list, ADD adds additional publications to the list of publications, and DROP removes the publications from the list of publications. We allow non-existent publications to be specified in ADD and SET variants so that users can add those later. See CREATE SUBSCRIPTION for more information. By default, this command will also act like REFRESH PUBLICATION.

publication_option specifies additional options for this operation. The supported options are:

When false, the command will not try to refresh table information. REFRESH PUBLICATION should then be executed separately. The default is true.

Additionally, the options described under REFRESH PUBLICATION may be specified, to control the implicit refresh operation.

Fetch missing table information from publisher. This will start replication of tables that were added to the subscribed-to publications since CREATE SUBSCRIPTION or the last invocation of REFRESH PUBLICATION.

refresh_option specifies additional options for the refresh operation. The supported options are:

Specifies whether to copy pre-existing data in the publications that are being subscribed to when the replication starts. The default is true.

Previously subscribed tables are not copied, even if a table's row filter WHERE clause has since been modified.

See Notes for details of how copy_data = true can interact with the origin parameter.

See the binary parameter of CREATE SUBSCRIPTION for details about copying pre-existing data in binary format.

Enables a previously disabled subscription, starting the logical replication worker at the end of the transaction.

Disables a running subscription, stopping the logical replication worker at the end of the transaction.

This clause alters parameters originally set by CREATE SUBSCRIPTION. See there for more information. The parameters that can be altered are slot_name, synchronous_commit, binary, streaming, disable_on_error, password_required, run_as_owner, origin, failover, and two_phase. Only a superuser can set password_required = false.

When altering the slot_name, the failover and two_phase property values of the named slot may differ from the counterpart failover and two_phase parameters specified in the subscription. When creating the slot, ensure the slot properties failover and two_phase match their counterpart parameters of the subscription. Otherwise, the slot on the publisher may behave differently from what these subscription options say: for example, the slot on the publisher could either be synced to the standbys even when the subscription's failover option is disabled or could be disabled for sync even when the subscription's failover option is enabled.

The failover and two_phase parameters can only be altered when the subscription is disabled.

When altering two_phase from true to false, the backend process reports an error if any prepared transactions done by the logical replication worker (from when two_phase parameter was still true) are found. You can resolve prepared transactions on the publisher node, or manually roll back them on the subscriber, and then try again. The transactions prepared by logical replication worker corresponding to a particular subscription have the following pattern: “pg_gid_%u_%u” (parameters: subscription oid, remote transaction id xid). To resolve such transactions manually, you need to roll back all the prepared transactions with corresponding subscription IDs in their names. Applications can check pg_prepared_xacts to find the required prepared transactions. After the two_phase option is changed from true to false, the publisher will replicate the transactions again when they are committed.

Skips applying all changes of the remote transaction. If incoming data violates any constraints, logical replication will stop until it is resolved. By using the ALTER SUBSCRIPTION ... SKIP command, the logical replication worker skips all data modification changes within the transaction. This option has no effect on the transactions that are already prepared by enabling two_phase on the subscriber. After the logical replication worker successfully skips the transaction or finishes a transaction, the LSN (stored in pg_subscription.subskiplsn) is cleared. See Section 29.7 for the details of logical replication conflicts.

skip_option specifies options for this operation. The supported option is:

Specifies the finish LSN of the remote transaction whose changes are to be skipped by the logical replication worker. The finish LSN is the LSN at which the transaction is either committed or prepared. Skipping individual subtransactions is not supported. Setting NONE resets the LSN.

The user name of the new owner of the subscription.

The new name for the subscription.

When specifying a parameter of type boolean, the = value part can be omitted, which is equivalent to specifying TRUE.

Change the publication subscribed by a subscription to insert_only:

Disable (stop) the subscription:

ALTER SUBSCRIPTION is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
publication_name
```

Example 2 (unknown):
```unknown
publication_option
```

Example 3 (unknown):
```unknown
publication_name
```

Example 4 (unknown):
```unknown
publication_option
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-altertstemplate.html

**Contents:**
- ALTER TEXT SEARCH TEMPLATE
- Synopsis
- Description
- Parameters
- Compatibility
- See Also

ALTER TEXT SEARCH TEMPLATE — change the definition of a text search template

ALTER TEXT SEARCH TEMPLATE changes the definition of a text search template. Currently, the only supported functionality is to change the template's name.

You must be a superuser to use ALTER TEXT SEARCH TEMPLATE.

The name (optionally schema-qualified) of an existing text search template.

The new name of the text search template.

The new schema for the text search template.

There is no ALTER TEXT SEARCH TEMPLATE statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
ALTER TEXT SEARCH TEMPLATE
```

Example 2 (unknown):
```unknown
ALTER TEXT SEARCH TEMPLATE
```

Example 3 (unknown):
```unknown
ALTER TEXT SEARCH TEMPLATE
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropmaterializedview.html

**Contents:**
- DROP MATERIALIZED VIEW
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP MATERIALIZED VIEW — remove a materialized view

DROP MATERIALIZED VIEW drops an existing materialized view. To execute this command you must be the owner of the materialized view.

Do not throw an error if the materialized view does not exist. A notice is issued in this case.

The name (optionally schema-qualified) of the materialized view to remove.

Automatically drop objects that depend on the materialized view (such as other materialized views, or regular views), and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the materialized view if any objects depend on it. This is the default.

This command will remove the materialized view called order_summary:

DROP MATERIALIZED VIEW is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
DROP MATERIALIZED VIEW
```

Example 2 (unknown):
```unknown
order_summary
```

Example 3 (unknown):
```unknown
DROP MATERIALIZED VIEW order_summary;
```

Example 4 (unknown):
```unknown
DROP MATERIALIZED VIEW
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-savepoint.html

**Contents:**
- SAVEPOINT
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

SAVEPOINT — define a new savepoint within the current transaction

SAVEPOINT establishes a new savepoint within the current transaction.

A savepoint is a special mark inside a transaction that allows all commands that are executed after it was established to be rolled back, restoring the transaction state to what it was at the time of the savepoint.

The name to give to the new savepoint. If savepoints with the same name already exist, they will be inaccessible until newer identically-named savepoints are released.

Use ROLLBACK TO to rollback to a savepoint. Use RELEASE SAVEPOINT to destroy a savepoint, keeping the effects of commands executed after it was established.

Savepoints can only be established when inside a transaction block. There can be multiple savepoints defined within a transaction.

To establish a savepoint and later undo the effects of all commands executed after it was established:

The above transaction will insert the values 1 and 3, but not 2.

To establish and later destroy a savepoint:

The above transaction will insert both 3 and 4.

To use a single savepoint name:

The above transaction shows row 3 being rolled back first, then row 2.

SQL requires a savepoint to be destroyed automatically when another savepoint with the same name is established. In PostgreSQL, the old savepoint is kept, though only the more recent one will be used when rolling back or releasing. (Releasing the newer savepoint with RELEASE SAVEPOINT will cause the older one to again become accessible to ROLLBACK TO SAVEPOINT and RELEASE SAVEPOINT.) Otherwise, SAVEPOINT is fully SQL conforming.

**Examples:**

Example 1 (unknown):
```unknown
savepoint_name
```

Example 2 (unknown):
```unknown
savepoint_name
```

Example 3 (unknown):
```unknown
ROLLBACK TO
```

Example 4 (unknown):
```unknown
RELEASE SAVEPOINT
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-createopclass.html

**Contents:**
- CREATE OPERATOR CLASS
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

CREATE OPERATOR CLASS — define a new operator class

CREATE OPERATOR CLASS creates a new operator class. An operator class defines how a particular data type can be used with an index. The operator class specifies that certain operators will fill particular roles or “strategies” for this data type and this index method. The operator class also specifies the support functions to be used by the index method when the operator class is selected for an index column. All the operators and functions used by an operator class must be defined before the operator class can be created.

If a schema name is given then the operator class is created in the specified schema. Otherwise it is created in the current schema. Two operator classes in the same schema can have the same name only if they are for different index methods.

The user who defines an operator class becomes its owner. Presently, the creating user must be a superuser. (This restriction is made because an erroneous operator class definition could confuse or even crash the server.)

CREATE OPERATOR CLASS does not presently check whether the operator class definition includes all the operators and functions required by the index method, nor whether the operators and functions form a self-consistent set. It is the user's responsibility to define a valid operator class.

Related operator classes can be grouped into operator families. To add a new operator class to an existing family, specify the FAMILY option in CREATE OPERATOR CLASS. Without this option, the new class is placed into a family named the same as the new class (creating that family if it doesn't already exist).

Refer to Section 36.16 for further information.

The name of the operator class to be created. The name can be schema-qualified.

If present, the operator class will become the default operator class for its data type. At most one operator class can be the default for a specific data type and index method.

The column data type that this operator class is for.

The name of the index method this operator class is for.

The name of the existing operator family to add this operator class to. If not specified, a family named the same as the operator class is used (creating it, if it doesn't already exist).

The index method's strategy number for an operator associated with the operator class.

The name (optionally schema-qualified) of an operator associated with the operator class.

In an OPERATOR clause, the operand data type(s) of the operator, or NONE to signify a prefix operator. The operand data types can be omitted in the normal case where they are the same as the operator class's data type.

In a FUNCTION clause, the operand data type(s) the function is intended to support, if different from the input data type(s) of the function (for B-tree comparison functions and hash functions) or the class's data type (for B-tree sort support functions, B-tree equal image functions, and all functions in GiST, SP-GiST, GIN and BRIN operator classes). These defaults are correct, and so op_type need not be specified in FUNCTION clauses, except for the case of a B-tree sort support function that is meant to support cross-data-type comparisons.

The name (optionally schema-qualified) of an existing btree operator family that describes the sort ordering associated with an ordering operator.

If neither FOR SEARCH nor FOR ORDER BY is specified, FOR SEARCH is the default.

The index method's support function number for a function associated with the operator class.

The name (optionally schema-qualified) of a function that is an index method support function for the operator class.

The parameter data type(s) of the function.

The data type actually stored in the index. Normally this is the same as the column data type, but some index methods (currently GiST, GIN, SP-GiST and BRIN) allow it to be different. The STORAGE clause must be omitted unless the index method allows a different type to be used. If the column data_type is specified as anyarray, the storage_type can be declared as anyelement to indicate that the index entries are members of the element type belonging to the actual array type that each particular index is created for.

The OPERATOR, FUNCTION, and STORAGE clauses can appear in any order.

Because the index machinery does not check access permissions on functions before using them, including a function or operator in an operator class is tantamount to granting public execute permission on it. This is usually not an issue for the sorts of functions that are useful in an operator class.

The operators should not be defined by SQL functions. An SQL function is likely to be inlined into the calling query, which will prevent the optimizer from recognizing that the query matches an index.

The following example command defines a GiST index operator class for the data type _int4 (array of int4). See the intarray module for the complete example.

CREATE OPERATOR CLASS is a PostgreSQL extension. There is no CREATE OPERATOR CLASS statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
index_method
```

Example 2 (unknown):
```unknown
family_name
```

Example 3 (unknown):
```unknown
strategy_number
```

Example 4 (unknown):
```unknown
operator_name
```

---


---

