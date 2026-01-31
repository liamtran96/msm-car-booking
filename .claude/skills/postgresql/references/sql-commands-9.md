# PostgreSQL - Sql Commands (Part 9)

## 


**URL:** https://www.postgresql.org/docs/18/sql-createtsconfig.html

**Contents:**
- CREATE TEXT SEARCH CONFIGURATION
- Synopsis
- Description
- Parameters
- Notes
- Compatibility
- See Also

CREATE TEXT SEARCH CONFIGURATION — define a new text search configuration

CREATE TEXT SEARCH CONFIGURATION creates a new text search configuration. A text search configuration specifies a text search parser that can divide a string into tokens, plus dictionaries that can be used to determine which tokens are of interest for searching.

If only the parser is specified, then the new text search configuration initially has no mappings from token types to dictionaries, and therefore will ignore all words. Subsequent ALTER TEXT SEARCH CONFIGURATION commands must be used to create mappings to make the configuration useful. Alternatively, an existing text search configuration can be copied.

If a schema name is given then the text search configuration is created in the specified schema. Otherwise it is created in the current schema.

The user who defines a text search configuration becomes its owner.

Refer to Chapter 12 for further information.

The name of the text search configuration to be created. The name can be schema-qualified.

The name of the text search parser to use for this configuration.

The name of an existing text search configuration to copy.

The PARSER and COPY options are mutually exclusive, because when an existing configuration is copied, its parser selection is copied too.

There is no CREATE TEXT SEARCH CONFIGURATION statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
parser_name
```

Example 2 (unknown):
```unknown
source_config
```

Example 3 (unknown):
```unknown
CREATE TEXT SEARCH CONFIGURATION
```

Example 4 (unknown):
```unknown
ALTER TEXT SEARCH CONFIGURATION
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-altertype.html

**Contents:**
- ALTER TYPE
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

ALTER TYPE — change the definition of a type

ALTER TYPE changes the definition of an existing type. There are several subforms:

This form changes the owner of the type.

This form changes the name of the type.

This form moves the type into another schema.

This form is only usable with composite types. It changes the name of an individual attribute of the type.

This form adds a new attribute to a composite type, using the same syntax as CREATE TYPE.

This form drops an attribute from a composite type. If IF EXISTS is specified and the attribute does not exist, no error is thrown. In this case a notice is issued instead.

This form changes the type of an attribute of a composite type.

This form adds a new value to an enum type. The new value's place in the enum's ordering can be specified as being BEFORE or AFTER one of the existing values. Otherwise, the new item is added at the end of the list of values.

If IF NOT EXISTS is specified, it is not an error if the type already contains the new value: a notice is issued but no other action is taken. Otherwise, an error will occur if the new value is already present.

This form renames a value of an enum type. The value's place in the enum's ordering is not affected. An error will occur if the specified value is not present or the new name is already present.

This form is only applicable to base types. It allows adjustment of a subset of the base-type properties that can be set in CREATE TYPE. Specifically, these properties can be changed:

RECEIVE can be set to the name of a binary input function, or NONE to remove the type's binary input function. Using this option requires superuser privilege.

SEND can be set to the name of a binary output function, or NONE to remove the type's binary output function. Using this option requires superuser privilege.

TYPMOD_IN can be set to the name of a type modifier input function, or NONE to remove the type's type modifier input function. Using this option requires superuser privilege.

TYPMOD_OUT can be set to the name of a type modifier output function, or NONE to remove the type's type modifier output function. Using this option requires superuser privilege.

ANALYZE can be set to the name of a type-specific statistics collection function, or NONE to remove the type's statistics collection function. Using this option requires superuser privilege.

SUBSCRIPT can be set to the name of a type-specific subscripting handler function, or NONE to remove the type's subscripting handler function. Using this option requires superuser privilege.

STORAGE can be set to plain, extended, external, or main (see Section 66.2 for more information about what these mean). However, changing from plain to another setting requires superuser privilege (because it requires that the type's C functions all be TOAST-ready), and changing to plain from another setting is not allowed at all (since the type may already have TOASTed values present in the database). Note that changing this option doesn't by itself change any stored data, it just sets the default TOAST strategy to be used for table columns created in the future. See ALTER TABLE to change the TOAST strategy for existing table columns.

See CREATE TYPE for more details about these type properties. Note that where appropriate, a change in these properties for a base type will be propagated automatically to domains based on that type.

The ADD ATTRIBUTE, DROP ATTRIBUTE, and ALTER ATTRIBUTE actions can be combined into a list of multiple alterations to apply in parallel. For example, it is possible to add several attributes and/or alter the type of several attributes in a single command.

You must own the type to use ALTER TYPE. To change the schema of a type, you must also have CREATE privilege on the new schema. To alter the owner, you must be able to SET ROLE to the new owning role, and that role must have CREATE privilege on the type's schema. (These restrictions enforce that altering the owner doesn't do anything you couldn't do by dropping and recreating the type. However, a superuser can alter ownership of any type anyway.) To add an attribute or alter an attribute type, you must also have USAGE privilege on the attribute's data type.

The name (possibly schema-qualified) of an existing type to alter.

The new name for the type.

The user name of the new owner of the type.

The new schema for the type.

The name of the attribute to add, alter, or drop.

The new name of the attribute to be renamed.

The data type of the attribute to add, or the new type of the attribute to alter.

The new value to be added to an enum type's list of values, or the new name to be given to an existing value. Like all enum literals, it needs to be quoted.

The existing enum value that the new value should be added immediately before or after in the enum type's sort ordering. Like all enum literals, it needs to be quoted.

The existing enum value that should be renamed. Like all enum literals, it needs to be quoted.

The name of a base-type property to be modified; see above for possible values.

Automatically propagate the operation to typed tables of the type being altered, and their descendants.

Refuse the operation if the type being altered is the type of a typed table. This is the default.

If ALTER TYPE ... ADD VALUE (the form that adds a new value to an enum type) is executed inside a transaction block, the new value cannot be used until after the transaction has been committed.

Comparisons involving an added enum value will sometimes be slower than comparisons involving only original members of the enum type. This will usually only occur if BEFORE or AFTER is used to set the new value's sort position somewhere other than at the end of the list. However, sometimes it will happen even though the new value is added at the end (this occurs if the OID counter “wrapped around” since the original creation of the enum type). The slowdown is usually insignificant; but if it matters, optimal performance can be regained by dropping and recreating the enum type, or by dumping and restoring the database.

To rename a data type:

To change the owner of the type email to joe:

To change the schema of the type email to customers:

To add a new attribute to a composite type:

To add a new value to an enum type in a particular sort position:

To rename an enum value:

To create binary I/O functions for an existing base type:

The variants to add and drop attributes are part of the SQL standard; the other variants are PostgreSQL extensions.

**Examples:**

Example 1 (unknown):
```unknown
attribute_name
```

Example 2 (unknown):
```unknown
new_attribute_name
```

Example 3 (unknown):
```unknown
new_enum_value
```

Example 4 (unknown):
```unknown
neighbor_enum_value
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterrule.html

**Contents:**
- ALTER RULE
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

ALTER RULE — change the definition of a rule

ALTER RULE changes properties of an existing rule. Currently, the only available action is to change the rule's name.

To use ALTER RULE, you must own the table or view that the rule applies to.

The name of an existing rule to alter.

The name (optionally schema-qualified) of the table or view that the rule applies to.

The new name for the rule.

To rename an existing rule:

ALTER RULE is a PostgreSQL language extension, as is the entire query rewrite system.

**Examples:**

Example 1 (unknown):
```unknown
ALTER RULE notify_all ON emp RENAME TO notify_me;
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-drop-owned.html

**Contents:**
- DROP OWNED
- Synopsis
- Description
- Parameters
- Notes
- Compatibility
- See Also

DROP OWNED — remove database objects owned by a database role

DROP OWNED drops all the objects within the current database that are owned by one of the specified roles. Any privileges granted to the given roles on objects in the current database or on shared objects (databases, tablespaces, configuration parameters) will also be revoked.

The name of a role whose objects will be dropped, and whose privileges will be revoked.

Automatically drop objects that depend on the affected objects, and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the objects owned by a role if any other database objects depend on one of the affected objects. This is the default.

DROP OWNED is often used to prepare for the removal of one or more roles. Because DROP OWNED only affects the objects in the current database, it is usually necessary to execute this command in each database that contains objects owned by a role that is to be removed.

Using the CASCADE option might make the command recurse to objects owned by other users.

The REASSIGN OWNED command is an alternative that reassigns the ownership of all the database objects owned by one or more roles. However, REASSIGN OWNED does not deal with privileges for other objects.

Databases and tablespaces owned by the role(s) will not be removed.

See Section 21.4 for more discussion.

The DROP OWNED command is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
REASSIGN OWNED
```

Example 2 (unknown):
```unknown
REASSIGN OWNED
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterprocedure.html

**Contents:**
- ALTER PROCEDURE
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

ALTER PROCEDURE — change the definition of a procedure

ALTER PROCEDURE changes the definition of a procedure.

You must own the procedure to use ALTER PROCEDURE. To change a procedure's schema, you must also have CREATE privilege on the new schema. To alter the owner, you must be able to SET ROLE to the new owning role, and that role must have CREATE privilege on the procedure's schema. (These restrictions enforce that altering the owner doesn't do anything you couldn't do by dropping and recreating the procedure. However, a superuser can alter ownership of any procedure anyway.)

The name (optionally schema-qualified) of an existing procedure. If no argument list is specified, the name must be unique in its schema.

The mode of an argument: IN, OUT, INOUT, or VARIADIC. If omitted, the default is IN.

The name of an argument. Note that ALTER PROCEDURE does not actually pay any attention to argument names, since only the argument data types are used to determine the procedure's identity.

The data type(s) of the procedure's arguments (optionally schema-qualified), if any. See DROP PROCEDURE for the details of how the procedure is looked up using the argument data type(s).

The new name of the procedure.

The new owner of the procedure. Note that if the procedure is marked SECURITY DEFINER, it will subsequently execute as the new owner.

The new schema for the procedure.

This form marks the procedure as dependent on the extension, or no longer dependent on the extension if NO is specified. A procedure that's marked as dependent on an extension is dropped when the extension is dropped, even if cascade is not specified. A procedure can depend upon multiple extensions, and will be dropped when any one of those extensions is dropped.

Change whether the procedure is a security definer or not. The key word EXTERNAL is ignored for SQL conformance. See CREATE PROCEDURE for more information about this capability.

Add or change the assignment to be made to a configuration parameter when the procedure is called. If value is DEFAULT or, equivalently, RESET is used, the procedure-local setting is removed, so that the procedure executes with the value present in its environment. Use RESET ALL to clear all procedure-local settings. SET FROM CURRENT saves the value of the parameter that is current when ALTER PROCEDURE is executed as the value to be applied when the procedure is entered.

See SET and Chapter 19 for more information about allowed parameter names and values.

Ignored for conformance with the SQL standard.

To rename the procedure insert_data with two arguments of type integer to insert_record:

To change the owner of the procedure insert_data with two arguments of type integer to joe:

To change the schema of the procedure insert_data with two arguments of type integer to accounting:

To mark the procedure insert_data(integer, integer) as being dependent on the extension myext:

To adjust the search path that is automatically set for a procedure:

To disable automatic setting of search_path for a procedure:

The procedure will now execute with whatever search path is used by its caller.

This statement is partially compatible with the ALTER PROCEDURE statement in the SQL standard. The standard allows more properties of a procedure to be modified, but does not provide the ability to rename a procedure, make a procedure a security definer, attach configuration parameter values to a procedure, or change the owner, schema, or volatility of a procedure. The standard also requires the RESTRICT key word, which is optional in PostgreSQL.

**Examples:**

Example 1 (unknown):
```unknown
extension_name
```

Example 2 (unknown):
```unknown
configuration_parameter
```

Example 3 (unknown):
```unknown
configuration_parameter
```

Example 4 (unknown):
```unknown
configuration_parameter
```

---


---

