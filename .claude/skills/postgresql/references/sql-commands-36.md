# PostgreSQL - Sql Commands (Part 36)

## 


**URL:** https://www.postgresql.org/docs/18/sql-droptype.html

**Contents:**
- DROP TYPE
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP TYPE — remove a data type

DROP TYPE removes a user-defined data type. Only the owner of a type can remove it.

Do not throw an error if the type does not exist. A notice is issued in this case.

The name (optionally schema-qualified) of the data type to remove.

Automatically drop objects that depend on the type (such as table columns, functions, and operators), and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the type if any objects depend on it. This is the default.

To remove the data type box:

This command is similar to the corresponding command in the SQL standard, apart from the IF EXISTS option, which is a PostgreSQL extension. But note that much of the CREATE TYPE command and the data type extension mechanisms in PostgreSQL differ from the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
DROP TYPE box;
```

Example 2 (unknown):
```unknown
CREATE TYPE
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-createlanguage.html

**Contents:**
- CREATE LANGUAGE
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

CREATE LANGUAGE — define a new procedural language

CREATE LANGUAGE registers a new procedural language with a PostgreSQL database. Subsequently, functions and procedures can be defined in this new language.

CREATE LANGUAGE effectively associates the language name with handler function(s) that are responsible for executing functions written in the language. Refer to Chapter 57 for more information about language handlers.

CREATE OR REPLACE LANGUAGE will either create a new language, or replace an existing definition. If the language already exists, its parameters are updated according to the command, but the language's ownership and permissions settings do not change, and any existing functions written in the language are assumed to still be valid.

One must have the PostgreSQL superuser privilege to register a new language or change an existing language's parameters. However, once the language is created it is valid to assign ownership of it to a non-superuser, who may then drop it, change its permissions, rename it, or assign it to a new owner. (Do not, however, assign ownership of the underlying C functions to a non-superuser; that would create a privilege escalation path for that user.)

The form of CREATE LANGUAGE that does not supply any handler function is obsolete. For backwards compatibility with old dump files, it is interpreted as CREATE EXTENSION. That will work if the language has been packaged into an extension of the same name, which is the conventional way to set up procedural languages.

TRUSTED specifies that the language does not grant access to data that the user would not otherwise have. If this key word is omitted when registering the language, only users with the PostgreSQL superuser privilege can use this language to create new functions.

This is a noise word.

The name of the new procedural language. The name must be unique among the languages in the database.

call_handler is the name of a previously registered function that will be called to execute the procedural language's functions. The call handler for a procedural language must be written in a compiled language such as C with version 1 call convention and registered with PostgreSQL as a function taking no arguments and returning the language_handler type, a placeholder type that is simply used to identify the function as a call handler.

inline_handler is the name of a previously registered function that will be called to execute an anonymous code block (DO command) in this language. If no inline_handler function is specified, the language does not support anonymous code blocks. The handler function must take one argument of type internal, which will be the DO command's internal representation, and it will typically return void. The return value of the handler is ignored.

valfunction is the name of a previously registered function that will be called when a new function in the language is created, to validate the new function. If no validator function is specified, then a new function will not be checked when it is created. The validator function must take one argument of type oid, which will be the OID of the to-be-created function, and will typically return void.

A validator function would typically inspect the function body for syntactical correctness, but it can also look at other properties of the function, for example if the language cannot handle certain argument types. To signal an error, the validator function should use the ereport() function. The return value of the function is ignored.

Use DROP LANGUAGE to drop procedural languages.

The system catalog pg_language (see Section 52.29) records information about the currently installed languages. Also, the psql command \dL lists the installed languages.

To create functions in a procedural language, a user must have the USAGE privilege for the language. By default, USAGE is granted to PUBLIC (i.e., everyone) for trusted languages. This can be revoked if desired.

Procedural languages are local to individual databases. However, a language can be installed into the template1 database, which will cause it to be available automatically in all subsequently-created databases.

A minimal sequence for creating a new procedural language is:

Typically that would be written in an extension's creation script, and users would do this to install the extension:

CREATE LANGUAGE is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
call_handler
```

Example 2 (unknown):
```unknown
inline_handler
```

Example 3 (unknown):
```unknown
valfunction
```

Example 4 (unknown):
```unknown
CREATE LANGUAGE
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-droptsdictionary.html

**Contents:**
- DROP TEXT SEARCH DICTIONARY
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP TEXT SEARCH DICTIONARY — remove a text search dictionary

DROP TEXT SEARCH DICTIONARY drops an existing text search dictionary. To execute this command you must be the owner of the dictionary.

Do not throw an error if the text search dictionary does not exist. A notice is issued in this case.

The name (optionally schema-qualified) of an existing text search dictionary.

Automatically drop objects that depend on the text search dictionary, and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the text search dictionary if any objects depend on it. This is the default.

Remove the text search dictionary english:

This command will not succeed if there are any existing text search configurations that use the dictionary. Add CASCADE to drop such configurations along with the dictionary.

There is no DROP TEXT SEARCH DICTIONARY statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
DROP TEXT SEARCH DICTIONARY
```

Example 2 (unknown):
```unknown
DROP TEXT SEARCH DICTIONARY english;
```

Example 3 (unknown):
```unknown
DROP TEXT SEARCH DICTIONARY
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-declare.html

**Contents:**
- DECLARE
- Synopsis
- Description
  - Note
- Parameters
- Notes
  - Note
  - Caution
  - Caution
- Examples

DECLARE — define a cursor

DECLARE allows a user to create cursors, which can be used to retrieve a small number of rows at a time out of a larger query. After the cursor is created, rows are fetched from it using FETCH.

This page describes usage of cursors at the SQL command level. If you are trying to use cursors inside a PL/pgSQL function, the rules are different — see Section 41.7.

The name of the cursor to be created. This must be different from any other active cursor name in the session.

Causes the cursor to return data in binary rather than in text format.

Cursor sensitivity determines whether changes to the data underlying the cursor, done in the same transaction, after the cursor has been declared, are visible in the cursor. INSENSITIVE means they are not visible, ASENSITIVE means the behavior is implementation-dependent. A third behavior, SENSITIVE, meaning that such changes are visible in the cursor, is not available in PostgreSQL. In PostgreSQL, all cursors are insensitive; so these key words have no effect and are only accepted for compatibility with the SQL standard.

Specifying INSENSITIVE together with FOR UPDATE or FOR SHARE is an error.

SCROLL specifies that the cursor can be used to retrieve rows in a nonsequential fashion (e.g., backward). Depending upon the complexity of the query's execution plan, specifying SCROLL might impose a performance penalty on the query's execution time. NO SCROLL specifies that the cursor cannot be used to retrieve rows in a nonsequential fashion. The default is to allow scrolling in some cases; this is not the same as specifying SCROLL. See Notes below for details.

WITH HOLD specifies that the cursor can continue to be used after the transaction that created it successfully commits. WITHOUT HOLD specifies that the cursor cannot be used outside of the transaction that created it. If neither WITHOUT HOLD nor WITH HOLD is specified, WITHOUT HOLD is the default.

A SELECT or VALUES command which will provide the rows to be returned by the cursor.

The key words ASENSITIVE, BINARY, INSENSITIVE, and SCROLL can appear in any order.

Normal cursors return data in text format, the same as a SELECT would produce. The BINARY option specifies that the cursor should return data in binary format. This reduces conversion effort for both the server and client, at the cost of more programmer effort to deal with platform-dependent binary data formats. As an example, if a query returns a value of one from an integer column, you would get a string of 1 with a default cursor, whereas with a binary cursor you would get a 4-byte field containing the internal representation of the value (in big-endian byte order).

Binary cursors should be used carefully. Many applications, including psql, are not prepared to handle binary cursors and expect data to come back in the text format.

When the client application uses the “extended query” protocol to issue a FETCH command, the Bind protocol message specifies whether data is to be retrieved in text or binary format. This choice overrides the way that the cursor is defined. The concept of a binary cursor as such is thus obsolete when using extended query protocol — any cursor can be treated as either text or binary.

Unless WITH HOLD is specified, the cursor created by this command can only be used within the current transaction. Thus, DECLARE without WITH HOLD is useless outside a transaction block: the cursor would survive only to the completion of the statement. Therefore PostgreSQL reports an error if such a command is used outside a transaction block. Use BEGIN and COMMIT (or ROLLBACK) to define a transaction block.

If WITH HOLD is specified and the transaction that created the cursor successfully commits, the cursor can continue to be accessed by subsequent transactions in the same session. (But if the creating transaction is aborted, the cursor is removed.) A cursor created with WITH HOLD is closed when an explicit CLOSE command is issued on it, or the session ends. In the current implementation, the rows represented by a held cursor are copied into a temporary file or memory area so that they remain available for subsequent transactions.

WITH HOLD may not be specified when the query includes FOR UPDATE or FOR SHARE.

The SCROLL option should be specified when defining a cursor that will be used to fetch backwards. This is required by the SQL standard. However, for compatibility with earlier versions, PostgreSQL will allow backward fetches without SCROLL, if the cursor's query plan is simple enough that no extra overhead is needed to support it. However, application developers are advised not to rely on using backward fetches from a cursor that has not been created with SCROLL. If NO SCROLL is specified, then backward fetches are disallowed in any case.

Backward fetches are also disallowed when the query includes FOR UPDATE or FOR SHARE; therefore SCROLL may not be specified in this case.

Scrollable cursors may give unexpected results if they invoke any volatile functions (see Section 36.7). When a previously fetched row is re-fetched, the functions might be re-executed, perhaps leading to results different from the first time. It's best to specify NO SCROLL for a query involving volatile functions. If that is not practical, one workaround is to declare the cursor SCROLL WITH HOLD and commit the transaction before reading any rows from it. This will force the entire output of the cursor to be materialized in temporary storage, so that volatile functions are executed exactly once for each row.

If the cursor's query includes FOR UPDATE or FOR SHARE, then returned rows are locked at the time they are first fetched, in the same way as for a regular SELECT command with these options. In addition, the returned rows will be the most up-to-date versions.

It is generally recommended to use FOR UPDATE if the cursor is intended to be used with UPDATE ... WHERE CURRENT OF or DELETE ... WHERE CURRENT OF. Using FOR UPDATE prevents other sessions from changing the rows between the time they are fetched and the time they are updated. Without FOR UPDATE, a subsequent WHERE CURRENT OF command will have no effect if the row was changed since the cursor was created.

Another reason to use FOR UPDATE is that without it, a subsequent WHERE CURRENT OF might fail if the cursor query does not meet the SQL standard's rules for being “simply updatable” (in particular, the cursor must reference just one table and not use grouping or ORDER BY). Cursors that are not simply updatable might work, or might not, depending on plan choice details; so in the worst case, an application might work in testing and then fail in production. If FOR UPDATE is specified, the cursor is guaranteed to be updatable.

The main reason not to use FOR UPDATE with WHERE CURRENT OF is if you need the cursor to be scrollable, or to be isolated from concurrent updates (that is, continue to show the old data). If this is a requirement, pay close heed to the caveats shown above.

The SQL standard only makes provisions for cursors in embedded SQL. The PostgreSQL server does not implement an OPEN statement for cursors; a cursor is considered to be open when it is declared. However, ECPG, the embedded SQL preprocessor for PostgreSQL, supports the standard SQL cursor conventions, including those involving DECLARE and OPEN statements.

The server data structure underlying an open cursor is called a portal. Portal names are exposed in the client protocol: a client can fetch rows directly from an open portal, if it knows the portal name. When creating a cursor with DECLARE, the portal name is the same as the cursor name.

You can see all available cursors by querying the pg_cursors system view.

See FETCH for more examples of cursor usage.

The SQL standard allows cursors only in embedded SQL and in modules. PostgreSQL permits cursors to be used interactively.

According to the SQL standard, changes made to insensitive cursors by UPDATE ... WHERE CURRENT OF and DELETE ... WHERE CURRENT OF statements are visible in that same cursor. PostgreSQL treats these statements like all other data changing statements in that they are not visible in insensitive cursors.

Binary cursors are a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
INSENSITIVE
```

Example 2 (unknown):
```unknown
INSENSITIVE
```

Example 3 (unknown):
```unknown
INSENSITIVE
```

Example 4 (unknown):
```unknown
WITHOUT HOLD
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropeventtrigger.html

**Contents:**
- DROP EVENT TRIGGER
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP EVENT TRIGGER — remove an event trigger

DROP EVENT TRIGGER removes an existing event trigger. To execute this command, the current user must be the owner of the event trigger.

Do not throw an error if the event trigger does not exist. A notice is issued in this case.

The name of the event trigger to remove.

Automatically drop objects that depend on the trigger, and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the trigger if any objects depend on it. This is the default.

Destroy the trigger snitch:

There is no DROP EVENT TRIGGER statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
DROP EVENT TRIGGER
```

Example 2 (unknown):
```unknown
DROP EVENT TRIGGER snitch;
```

Example 3 (unknown):
```unknown
DROP EVENT TRIGGER
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-droprule.html

**Contents:**
- DROP RULE
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP RULE — remove a rewrite rule

DROP RULE drops a rewrite rule.

Do not throw an error if the rule does not exist. A notice is issued in this case.

The name of the rule to drop.

The name (optionally schema-qualified) of the table or view that the rule applies to.

Automatically drop objects that depend on the rule, and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the rule if any objects depend on it. This is the default.

To drop the rewrite rule newrule:

DROP RULE is a PostgreSQL language extension, as is the entire query rewrite system.

**Examples:**

Example 1 (unknown):
```unknown
DROP RULE newrule ON mytable;
```

---


---

