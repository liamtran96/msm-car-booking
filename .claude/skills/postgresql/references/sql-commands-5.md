# PostgreSQL - Sql Commands (Part 5)

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropdatabase.html

**Contents:**
- DROP DATABASE
- Synopsis
- Description
- Parameters
- Notes
- Compatibility
- See Also

DROP DATABASE — remove a database

DROP DATABASE drops a database. It removes the catalog entries for the database and deletes the directory containing the data. It can only be executed by the database owner. It cannot be executed while you are connected to the target database. (Connect to postgres or any other database to issue this command.) Also, if anyone else is connected to the target database, this command will fail unless you use the FORCE option described below.

DROP DATABASE cannot be undone. Use it with care!

Do not throw an error if the database does not exist. A notice is issued in this case.

The name of the database to remove.

Attempt to terminate all existing connections to the target database. It doesn't terminate if prepared transactions, active logical replication slots or subscriptions are present in the target database.

This terminates background worker connections and connections that the current user has permission to terminate with pg_terminate_backend, described in Section 9.28.2. If connections would remain, this command will fail.

DROP DATABASE cannot be executed inside a transaction block.

This command cannot be executed while connected to the target database. Thus, it might be more convenient to use the program dropdb instead, which is a wrapper around this command.

There is no DROP DATABASE statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
DROP DATABASE
```

Example 2 (unknown):
```unknown
DROP DATABASE
```

Example 3 (unknown):
```unknown
pg_terminate_backend
```

Example 4 (unknown):
```unknown
DROP DATABASE
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-rollback-prepared.html

**Contents:**
- ROLLBACK PREPARED
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

ROLLBACK PREPARED — cancel a transaction that was earlier prepared for two-phase commit

ROLLBACK PREPARED rolls back a transaction that is in prepared state.

The transaction identifier of the transaction that is to be rolled back.

To roll back a prepared transaction, you must be either the same user that executed the transaction originally, or a superuser. But you do not have to be in the same session that executed the transaction.

This command cannot be executed inside a transaction block. The prepared transaction is rolled back immediately.

All currently available prepared transactions are listed in the pg_prepared_xacts system view.

Roll back the transaction identified by the transaction identifier foobar:

ROLLBACK PREPARED is a PostgreSQL extension. It is intended for use by external transaction management systems, some of which are covered by standards (such as X/Open XA), but the SQL side of those systems is not standardized.

**Examples:**

Example 1 (unknown):
```unknown
transaction_id
```

Example 2 (unknown):
```unknown
ROLLBACK PREPARED
```

Example 3 (unknown):
```unknown
transaction_id
```

Example 4 (unknown):
```unknown
pg_prepared_xacts
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropforeigntable.html

**Contents:**
- DROP FOREIGN TABLE
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP FOREIGN TABLE — remove a foreign table

DROP FOREIGN TABLE removes a foreign table. Only the owner of a foreign table can remove it.

Do not throw an error if the foreign table does not exist. A notice is issued in this case.

The name (optionally schema-qualified) of the foreign table to drop.

Automatically drop objects that depend on the foreign table (such as views), and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the foreign table if any objects depend on it. This is the default.

To destroy two foreign tables, films and distributors:

This command conforms to ISO/IEC 9075-9 (SQL/MED), except that the standard only allows one foreign table to be dropped per command, and apart from the IF EXISTS option, which is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
DROP FOREIGN TABLE
```

Example 2 (unknown):
```unknown
distributors
```

Example 3 (unknown):
```unknown
DROP FOREIGN TABLE films, distributors;
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-createcast.html

**Contents:**
- CREATE CAST
- Synopsis
- Description
  - Note
- Parameters
- Notes
  - Note
  - Note
- Examples
- Compatibility

CREATE CAST — define a new cast

CREATE CAST defines a new cast. A cast specifies how to perform a conversion between two data types. For example,

converts the integer constant 42 to type float8 by invoking a previously specified function, in this case float8(int4). (If no suitable cast has been defined, the conversion fails.)

Two types can be binary coercible, which means that the conversion can be performed “for free” without invoking any function. This requires that corresponding values use the same internal representation. For instance, the types text and varchar are binary coercible both ways. Binary coercibility is not necessarily a symmetric relationship. For example, the cast from xml to text can be performed for free in the present implementation, but the reverse direction requires a function that performs at least a syntax check. (Two types that are binary coercible both ways are also referred to as binary compatible.)

You can define a cast as an I/O conversion cast by using the WITH INOUT syntax. An I/O conversion cast is performed by invoking the output function of the source data type, and passing the resulting string to the input function of the target data type. In many common cases, this feature avoids the need to write a separate cast function for conversion. An I/O conversion cast acts the same as a regular function-based cast; only the implementation is different.

By default, a cast can be invoked only by an explicit cast request, that is an explicit CAST(x AS typename) or x::typename construct.

If the cast is marked AS ASSIGNMENT then it can be invoked implicitly when assigning a value to a column of the target data type. For example, supposing that foo.f1 is a column of type text, then:

will be allowed if the cast from type integer to type text is marked AS ASSIGNMENT, otherwise not. (We generally use the term assignment cast to describe this kind of cast.)

If the cast is marked AS IMPLICIT then it can be invoked implicitly in any context, whether assignment or internally in an expression. (We generally use the term implicit cast to describe this kind of cast.) For example, consider this query:

The parser initially marks the constants as being of type integer and numeric respectively. There is no integer + numeric operator in the system catalogs, but there is a numeric + numeric operator. The query will therefore succeed if a cast from integer to numeric is available and is marked AS IMPLICIT — which in fact it is. The parser will apply the implicit cast and resolve the query as if it had been written

Now, the catalogs also provide a cast from numeric to integer. If that cast were marked AS IMPLICIT — which it is not — then the parser would be faced with choosing between the above interpretation and the alternative of casting the numeric constant to integer and applying the integer + integer operator. Lacking any knowledge of which choice to prefer, it would give up and declare the query ambiguous. The fact that only one of the two casts is implicit is the way in which we teach the parser to prefer resolution of a mixed numeric-and-integer expression as numeric; there is no built-in knowledge about that.

It is wise to be conservative about marking casts as implicit. An overabundance of implicit casting paths can cause PostgreSQL to choose surprising interpretations of commands, or to be unable to resolve commands at all because there are multiple possible interpretations. A good rule of thumb is to make a cast implicitly invokable only for information-preserving transformations between types in the same general type category. For example, the cast from int2 to int4 can reasonably be implicit, but the cast from float8 to int4 should probably be assignment-only. Cross-type-category casts, such as text to int4, are best made explicit-only.

Sometimes it is necessary for usability or standards-compliance reasons to provide multiple implicit casts among a set of types, resulting in ambiguity that cannot be avoided as above. The parser has a fallback heuristic based on type categories and preferred types that can help to provide desired behavior in such cases. See CREATE TYPE for more information.

To be able to create a cast, you must own the source or the target data type and have USAGE privilege on the other type. To create a binary-coercible cast, you must be superuser. (This restriction is made because an erroneous binary-coercible cast conversion can easily crash the server.)

The name of the source data type of the cast.

The name of the target data type of the cast.

The function used to perform the cast. The function name can be schema-qualified. If it is not, the function will be looked up in the schema search path. The function's result data type must match the target type of the cast. Its arguments are discussed below. If no argument list is specified, the function name must be unique in its schema.

Indicates that the source type is binary-coercible to the target type, so no function is required to perform the cast.

Indicates that the cast is an I/O conversion cast, performed by invoking the output function of the source data type, and passing the resulting string to the input function of the target data type.

Indicates that the cast can be invoked implicitly in assignment contexts.

Indicates that the cast can be invoked implicitly in any context.

Cast implementation functions can have one to three arguments. The first argument type must be identical to or binary-coercible from the cast's source type. The second argument, if present, must be type integer; it receives the type modifier associated with the destination type, or -1 if there is none. The third argument, if present, must be type boolean; it receives true if the cast is an explicit cast, false otherwise. (Bizarrely, the SQL standard demands different behaviors for explicit and implicit casts in some cases. This argument is supplied for functions that must implement such casts. It is not recommended that you design your own data types so that this matters.)

The return type of a cast function must be identical to or binary-coercible to the cast's target type.

Ordinarily a cast must have different source and target data types. However, it is allowed to declare a cast with identical source and target types if it has a cast implementation function with more than one argument. This is used to represent type-specific length coercion functions in the system catalogs. The named function is used to coerce a value of the type to the type modifier value given by its second argument.

When a cast has different source and target types and a function that takes more than one argument, it supports converting from one type to another and applying a length coercion in a single step. When no such entry is available, coercion to a type that uses a type modifier involves two cast steps, one to convert between data types and a second to apply the modifier.

A cast to or from a domain type currently has no effect. Casting to or from a domain uses the casts associated with its underlying type.

Use DROP CAST to remove user-defined casts.

Remember that if you want to be able to convert types both ways you need to declare casts both ways explicitly.

It is normally not necessary to create casts between user-defined types and the standard string types (text, varchar, and char(n), as well as user-defined types that are defined to be in the string category). PostgreSQL provides automatic I/O conversion casts for that. The automatic casts to string types are treated as assignment casts, while the automatic casts from string types are explicit-only. You can override this behavior by declaring your own cast to replace an automatic cast, but usually the only reason to do so is if you want the conversion to be more easily invokable than the standard assignment-only or explicit-only setting. Another possible reason is that you want the conversion to behave differently from the type's I/O function; but that is sufficiently surprising that you should think twice about whether it's a good idea. (A small number of the built-in types do indeed have different behaviors for conversions, mostly because of requirements of the SQL standard.)

While not required, it is recommended that you continue to follow this old convention of naming cast implementation functions after the target data type. Many users are used to being able to cast data types using a function-style notation, that is typename(x). This notation is in fact nothing more nor less than a call of the cast implementation function; it is not specially treated as a cast. If your conversion functions are not named to support this convention then you will have surprised users. Since PostgreSQL allows overloading of the same function name with different argument types, there is no difficulty in having multiple conversion functions from different types that all use the target type's name.

Actually the preceding paragraph is an oversimplification: there are two cases in which a function-call construct will be treated as a cast request without having matched it to an actual function. If a function call name(x) does not exactly match any existing function, but name is the name of a data type and pg_cast provides a binary-coercible cast to this type from the type of x, then the call will be construed as a binary-coercible cast. This exception is made so that binary-coercible casts can be invoked using functional syntax, even though they lack any function. Likewise, if there is no pg_cast entry but the cast would be to or from a string type, the call will be construed as an I/O conversion cast. This exception allows I/O conversion casts to be invoked using functional syntax.

There is also an exception to the exception: I/O conversion casts from composite types to string types cannot be invoked using functional syntax, but must be written in explicit cast syntax (either CAST or :: notation). This exception was added because after the introduction of automatically-provided I/O conversion casts, it was found too easy to accidentally invoke such a cast when a function or column reference was intended.

To create an assignment cast from type bigint to type int4 using the function int4(bigint):

(This cast is already predefined in the system.)

The CREATE CAST command conforms to the SQL standard, except that SQL does not make provisions for binary-coercible types or extra arguments to implementation functions. AS IMPLICIT is a PostgreSQL extension, too.

CREATE FUNCTION, CREATE TYPE, DROP CAST

**Examples:**

Example 1 (unknown):
```unknown
source_type
```

Example 2 (unknown):
```unknown
target_type
```

Example 3 (unknown):
```unknown
function_name
```

Example 4 (unknown):
```unknown
argument_type
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropoperator.html

**Contents:**
- DROP OPERATOR
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP OPERATOR — remove an operator

DROP OPERATOR drops an existing operator from the database system. To execute this command you must be the owner of the operator.

Do not throw an error if the operator does not exist. A notice is issued in this case.

The name (optionally schema-qualified) of an existing operator.

The data type of the operator's left operand; write NONE if the operator has no left operand.

The data type of the operator's right operand.

Automatically drop objects that depend on the operator (such as views using it), and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the operator if any objects depend on it. This is the default.

Remove the power operator a^b for type integer:

Remove the bitwise-complement prefix operator ~b for type bit:

Remove multiple operators in one command:

There is no DROP OPERATOR statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
DROP OPERATOR
```

Example 2 (unknown):
```unknown
DROP OPERATOR ^ (integer, integer);
```

Example 3 (rust):
```rust
DROP OPERATOR ~ (none, bit);
```

Example 4 (rust):
```rust
DROP OPERATOR ~ (none, bit), ^ (integer, integer);
```

---


---

