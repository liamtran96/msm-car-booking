# PostgreSQL - Sql Commands (Part 46)

## 


**URL:** https://www.postgresql.org/docs/18/sql-createusermapping.html

**Contents:**
- CREATE USER MAPPING
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

CREATE USER MAPPING — define a new mapping of a user to a foreign server

CREATE USER MAPPING defines a mapping of a user to a foreign server. A user mapping typically encapsulates connection information that a foreign-data wrapper uses together with the information encapsulated by a foreign server to access an external data resource.

The owner of a foreign server can create user mappings for that server for any user. Also, a user can create a user mapping for their own user name if USAGE privilege on the server has been granted to the user.

Do not throw an error if a mapping of the given user to the given foreign server already exists. A notice is issued in this case. Note that there is no guarantee that the existing user mapping is anything like the one that would have been created.

The name of an existing user that is mapped to foreign server. CURRENT_ROLE, CURRENT_USER, and USER match the name of the current user. When PUBLIC is specified, a so-called public mapping is created that is used when no user-specific mapping is applicable.

The name of an existing server for which the user mapping is to be created.

This clause specifies the options of the user mapping. The options typically define the actual user name and password of the mapping. Option names must be unique. The allowed option names and values are specific to the server's foreign-data wrapper.

Create a user mapping for user bob, server foo:

CREATE USER MAPPING conforms to ISO/IEC 9075-9 (SQL/MED).

**Examples:**

Example 1 (unknown):
```unknown
server_name
```

Example 2 (unknown):
```unknown
CREATE USER MAPPING
```

Example 3 (unknown):
```unknown
IF NOT EXISTS
```

Example 4 (unknown):
```unknown
CURRENT_ROLE
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-createtransform.html

**Contents:**
- CREATE TRANSFORM
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

CREATE TRANSFORM — define a new transform

CREATE TRANSFORM defines a new transform. CREATE OR REPLACE TRANSFORM will either create a new transform, or replace an existing definition.

A transform specifies how to adapt a data type to a procedural language. For example, when writing a function in PL/Python using the hstore type, PL/Python has no prior knowledge how to present hstore values in the Python environment. Language implementations usually default to using the text representation, but that is inconvenient when, for example, an associative array or a list would be more appropriate.

A transform specifies two functions:

A “from SQL” function that converts the type from the SQL environment to the language. This function will be invoked on the arguments of a function written in the language.

A “to SQL” function that converts the type from the language to the SQL environment. This function will be invoked on the return value of a function written in the language.

It is not necessary to provide both of these functions. If one is not specified, the language-specific default behavior will be used if necessary. (To prevent a transformation in a certain direction from happening at all, you could also write a transform function that always errors out.)

To be able to create a transform, you must own and have USAGE privilege on the type, have USAGE privilege on the language, and own and have EXECUTE privilege on the from-SQL and to-SQL functions, if specified.

The name of the data type of the transform.

The name of the language of the transform.

The name of the function for converting the type from the SQL environment to the language. It must take one argument of type internal and return type internal. The actual argument will be of the type for the transform, and the function should be coded as if it were. (But it is not allowed to declare an SQL-level function returning internal without at least one argument of type internal.) The actual return value will be something specific to the language implementation. If no argument list is specified, the function name must be unique in its schema.

The name of the function for converting the type from the language to the SQL environment. It must take one argument of type internal and return the type that is the type for the transform. The actual argument value will be something specific to the language implementation. If no argument list is specified, the function name must be unique in its schema.

Use DROP TRANSFORM to remove transforms.

To create a transform for type hstore and language plpython3u, first set up the type and the language:

Then create the necessary functions:

And finally create the transform to connect them all together:

In practice, these commands would be wrapped up in an extension.

The contrib section contains a number of extensions that provide transforms, which can serve as real-world examples.

This form of CREATE TRANSFORM is a PostgreSQL extension. There is a CREATE TRANSFORM command in the SQL standard, but it is for adapting data types to client languages. That usage is not supported by PostgreSQL.

CREATE FUNCTION, CREATE LANGUAGE, CREATE TYPE, DROP TRANSFORM

**Examples:**

Example 1 (unknown):
```unknown
from_sql_function_name
```

Example 2 (unknown):
```unknown
argument_type
```

Example 3 (unknown):
```unknown
to_sql_function_name
```

Example 4 (unknown):
```unknown
argument_type
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-start-transaction.html

**Contents:**
- START TRANSACTION
- Synopsis
- Description
- Parameters
- Compatibility
- See Also

START TRANSACTION — start a transaction block

This command begins a new transaction block. If the isolation level, read/write mode, or deferrable mode is specified, the new transaction has those characteristics, as if SET TRANSACTION was executed. This is the same as the BEGIN command.

Refer to SET TRANSACTION for information on the meaning of the parameters to this statement.

In the standard, it is not necessary to issue START TRANSACTION to start a transaction block: any SQL command implicitly begins a block. PostgreSQL's behavior can be seen as implicitly issuing a COMMIT after each command that does not follow START TRANSACTION (or BEGIN), and it is therefore often called “autocommit”. Other relational database systems might offer an autocommit feature as a convenience.

The DEFERRABLE transaction_mode is a PostgreSQL language extension.

The SQL standard requires commas between successive transaction_modes, but for historical reasons PostgreSQL allows the commas to be omitted.

See also the compatibility section of SET TRANSACTION.

**Examples:**

Example 1 (unknown):
```unknown
transaction_mode
```

Example 2 (unknown):
```unknown
transaction_mode
```

Example 3 (unknown):
```unknown
SET TRANSACTION
```

Example 4 (unknown):
```unknown
START TRANSACTION
```

---


---

