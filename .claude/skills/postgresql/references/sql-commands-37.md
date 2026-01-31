# PostgreSQL - Sql Commands (Part 37)

## 


**URL:** https://www.postgresql.org/docs/18/sql-createserver.html

**Contents:**
- CREATE SERVER
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

CREATE SERVER — define a new foreign server

CREATE SERVER defines a new foreign server. The user who defines the server becomes its owner.

A foreign server typically encapsulates connection information that a foreign-data wrapper uses to access an external data resource. Additional user-specific connection information may be specified by means of user mappings.

The server name must be unique within the database.

Creating a server requires USAGE privilege on the foreign-data wrapper being used.

Do not throw an error if a server with the same name already exists. A notice is issued in this case. Note that there is no guarantee that the existing server is anything like the one that would have been created.

The name of the foreign server to be created.

Optional server type, potentially useful to foreign-data wrappers.

Optional server version, potentially useful to foreign-data wrappers.

The name of the foreign-data wrapper that manages the server.

This clause specifies the options for the server. The options typically define the connection details of the server, but the actual names and values are dependent on the server's foreign-data wrapper.

When using the dblink module, a foreign server's name can be used as an argument of the dblink_connect function to indicate the connection parameters. It is necessary to have the USAGE privilege on the foreign server to be able to use it in this way.

If the foreign server supports sort pushdown, it is necessary for it to have the same sort ordering as the local server.

Create a server myserver that uses the foreign-data wrapper postgres_fdw:

See postgres_fdw for more details.

CREATE SERVER conforms to ISO/IEC 9075-9 (SQL/MED).

**Examples:**

Example 1 (unknown):
```unknown
server_name
```

Example 2 (unknown):
```unknown
server_type
```

Example 3 (unknown):
```unknown
server_version
```

Example 4 (unknown):
```unknown
CREATE SERVER
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropserver.html

**Contents:**
- DROP SERVER
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP SERVER — remove a foreign server descriptor

DROP SERVER removes an existing foreign server descriptor. To execute this command, the current user must be the owner of the server.

Do not throw an error if the server does not exist. A notice is issued in this case.

The name of an existing server.

Automatically drop objects that depend on the server (such as user mappings), and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the server if any objects depend on it. This is the default.

Drop a server foo if it exists:

DROP SERVER conforms to ISO/IEC 9075-9 (SQL/MED). The IF EXISTS clause is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
DROP SERVER
```

Example 2 (unknown):
```unknown
DROP SERVER IF EXISTS foo;
```

Example 3 (unknown):
```unknown
DROP SERVER
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterforeigndatawrapper.html

**Contents:**
- ALTER FOREIGN DATA WRAPPER
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

ALTER FOREIGN DATA WRAPPER — change the definition of a foreign-data wrapper

ALTER FOREIGN DATA WRAPPER changes the definition of a foreign-data wrapper. The first form of the command changes the support functions or the generic options of the foreign-data wrapper (at least one clause is required). The second form changes the owner of the foreign-data wrapper.

Only superusers can alter foreign-data wrappers. Additionally, only superusers can own foreign-data wrappers.

The name of an existing foreign-data wrapper.

Specifies a new handler function for the foreign-data wrapper.

This is used to specify that the foreign-data wrapper should no longer have a handler function.

Note that foreign tables that use a foreign-data wrapper with no handler cannot be accessed.

Specifies a new validator function for the foreign-data wrapper.

Note that it is possible that pre-existing options of the foreign-data wrapper, or of dependent servers, user mappings, or foreign tables, are invalid according to the new validator. PostgreSQL does not check for this. It is up to the user to make sure that these options are correct before using the modified foreign-data wrapper. However, any options specified in this ALTER FOREIGN DATA WRAPPER command will be checked using the new validator.

This is used to specify that the foreign-data wrapper should no longer have a validator function.

Change options for the foreign-data wrapper. ADD, SET, and DROP specify the action to be performed. ADD is assumed if no operation is explicitly specified. Option names must be unique; names and values are also validated using the foreign data wrapper's validator function, if any.

The user name of the new owner of the foreign-data wrapper.

The new name for the foreign-data wrapper.

Change a foreign-data wrapper dbi, add option foo, drop bar:

Change the foreign-data wrapper dbi validator to bob.myvalidator:

ALTER FOREIGN DATA WRAPPER conforms to ISO/IEC 9075-9 (SQL/MED), except that the HANDLER, VALIDATOR, OWNER TO, and RENAME clauses are extensions.

**Examples:**

Example 1 (unknown):
```unknown
handler_function
```

Example 2 (unknown):
```unknown
validator_function
```

Example 3 (unknown):
```unknown
ALTER FOREIGN DATA WRAPPER
```

Example 4 (unknown):
```unknown
HANDLER handler_function
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropindex.html

**Contents:**
- DROP INDEX
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP INDEX — remove an index

DROP INDEX drops an existing index from the database system. To execute this command you must be the owner of the index.

Drop the index without locking out concurrent selects, inserts, updates, and deletes on the index's table. A normal DROP INDEX acquires an ACCESS EXCLUSIVE lock on the table, blocking other accesses until the index drop can be completed. With this option, the command instead waits until conflicting transactions have completed.

There are several caveats to be aware of when using this option. Only one index name can be specified, and the CASCADE option is not supported. (Thus, an index that supports a UNIQUE or PRIMARY KEY constraint cannot be dropped this way.) Also, regular DROP INDEX commands can be performed within a transaction block, but DROP INDEX CONCURRENTLY cannot. Lastly, indexes on partitioned tables cannot be dropped using this option.

For temporary tables, DROP INDEX is always non-concurrent, as no other session can access them, and non-concurrent index drop is cheaper.

Do not throw an error if the index does not exist. A notice is issued in this case.

The name (optionally schema-qualified) of an index to remove.

Automatically drop objects that depend on the index, and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the index if any objects depend on it. This is the default.

This command will remove the index title_idx:

DROP INDEX is a PostgreSQL language extension. There are no provisions for indexes in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
CONCURRENTLY
```

Example 2 (unknown):
```unknown
ACCESS EXCLUSIVE
```

Example 3 (unknown):
```unknown
PRIMARY KEY
```

Example 4 (unknown):
```unknown
DROP INDEX CONCURRENTLY
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-createschema.html

**Contents:**
- CREATE SCHEMA
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

CREATE SCHEMA — define a new schema

CREATE SCHEMA enters a new schema into the current database. The schema name must be distinct from the name of any existing schema in the current database.

A schema is essentially a namespace: it contains named objects (tables, data types, functions, and operators) whose names can duplicate those of other objects existing in other schemas. Named objects are accessed either by “qualifying” their names with the schema name as a prefix, or by setting a search path that includes the desired schema(s). A CREATE command specifying an unqualified object name creates the object in the current schema (the one at the front of the search path, which can be determined with the function current_schema).

Optionally, CREATE SCHEMA can include subcommands to create objects within the new schema. The subcommands are treated essentially the same as separate commands issued after creating the schema, except that if the AUTHORIZATION clause is used, all the created objects will be owned by that user.

The name of a schema to be created. If this is omitted, the user_name is used as the schema name. The name cannot begin with pg_, as such names are reserved for system schemas.

The role name of the user who will own the new schema. If omitted, defaults to the user executing the command. To create a schema owned by another role, you must be able to SET ROLE to that role.

An SQL statement defining an object to be created within the schema. Currently, only CREATE TABLE, CREATE VIEW, CREATE INDEX, CREATE SEQUENCE, CREATE TRIGGER and GRANT are accepted as clauses within CREATE SCHEMA. Other kinds of objects may be created in separate commands after the schema is created.

Do nothing (except issuing a notice) if a schema with the same name already exists. schema_element subcommands cannot be included when this option is used.

To create a schema, the invoking user must have the CREATE privilege for the current database. (Of course, superusers bypass this check.)

Create a schema for user joe; the schema will also be named joe:

Create a schema named test that will be owned by user joe, unless there already is a schema named test. (It does not matter whether joe owns the pre-existing schema.)

Create a schema and create a table and view within it:

Notice that the individual subcommands do not end with semicolons.

The following is an equivalent way of accomplishing the same result:

The SQL standard allows a DEFAULT CHARACTER SET clause in CREATE SCHEMA, as well as more subcommand types than are presently accepted by PostgreSQL.

The SQL standard specifies that the subcommands in CREATE SCHEMA can appear in any order. The present PostgreSQL implementation does not handle all cases of forward references in subcommands; it might sometimes be necessary to reorder the subcommands in order to avoid forward references.

According to the SQL standard, the owner of a schema always owns all objects within it. PostgreSQL allows schemas to contain objects owned by users other than the schema owner. This can happen only if the schema owner grants the CREATE privilege on their schema to someone else, or a superuser chooses to create objects in it.

The IF NOT EXISTS option is a PostgreSQL extension.

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
schema_element
```

Example 4 (unknown):
```unknown
role_specification
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-altereventtrigger.html

**Contents:**
- ALTER EVENT TRIGGER
- Synopsis
- Description
- Parameters
- Compatibility
- See Also

ALTER EVENT TRIGGER — change the definition of an event trigger

ALTER EVENT TRIGGER changes properties of an existing event trigger.

You must be superuser to alter an event trigger.

The name of an existing trigger to alter.

The user name of the new owner of the event trigger.

The new name of the event trigger.

These forms configure the firing of event triggers. A disabled trigger is still known to the system, but is not executed when its triggering event occurs. See also session_replication_role.

There is no ALTER EVENT TRIGGER statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
ALTER EVENT TRIGGER
```

Example 2 (unknown):
```unknown
ENABLE [ REPLICA | ALWAYS ]
```

Example 3 (unknown):
```unknown
ALTER EVENT TRIGGER
```

---


---

