# PostgreSQL - Sql Commands (Part 34)

## 


**URL:** https://www.postgresql.org/docs/18/sql-commit-prepared.html

**Contents:**
- COMMIT PREPARED
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

COMMIT PREPARED — commit a transaction that was earlier prepared for two-phase commit

COMMIT PREPARED commits a transaction that is in prepared state.

The transaction identifier of the transaction that is to be committed.

To commit a prepared transaction, you must be either the same user that executed the transaction originally, or a superuser. But you do not have to be in the same session that executed the transaction.

This command cannot be executed inside a transaction block. The prepared transaction is committed immediately.

All currently available prepared transactions are listed in the pg_prepared_xacts system view.

Commit the transaction identified by the transaction identifier foobar:

COMMIT PREPARED is a PostgreSQL extension. It is intended for use by external transaction management systems, some of which are covered by standards (such as X/Open XA), but the SQL side of those systems is not standardized.

**Examples:**

Example 1 (unknown):
```unknown
transaction_id
```

Example 2 (unknown):
```unknown
COMMIT PREPARED
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


**URL:** https://www.postgresql.org/docs/18/sql-call.html

**Contents:**
- CALL
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

CALL — invoke a procedure

CALL executes a procedure.

If the procedure has any output parameters, then a result row will be returned, containing the values of those parameters.

The name (optionally schema-qualified) of the procedure.

An argument expression for the procedure call.

Arguments can include parameter names, using the syntax name => value. This works the same as in ordinary function calls; see Section 4.3 for details.

Arguments must be supplied for all procedure parameters that lack defaults, including OUT parameters. However, arguments matching OUT parameters are not evaluated, so it's customary to just write NULL for them. (Writing something else for an OUT parameter might cause compatibility problems with future PostgreSQL versions.)

The user must have EXECUTE privilege on the procedure in order to be allowed to invoke it.

To call a function (not a procedure), use SELECT instead.

If CALL is executed in a transaction block, then the called procedure cannot execute transaction control statements. Transaction control statements are only allowed if CALL is executed in its own transaction.

PL/pgSQL handles output parameters in CALL commands differently; see Section 41.6.3.

CALL conforms to the SQL standard, except for the handling of output parameters. The standard says that users should write variables to receive the values of output parameters.

**Examples:**

Example 1 (javascript):
```javascript
name => value
```

Example 2 (unknown):
```unknown
CALL do_db_maintenance();
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-droptstemplate.html

**Contents:**
- DROP TEXT SEARCH TEMPLATE
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP TEXT SEARCH TEMPLATE — remove a text search template

DROP TEXT SEARCH TEMPLATE drops an existing text search template. You must be a superuser to use this command.

Do not throw an error if the text search template does not exist. A notice is issued in this case.

The name (optionally schema-qualified) of an existing text search template.

Automatically drop objects that depend on the text search template, and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the text search template if any objects depend on it. This is the default.

Remove the text search template thesaurus:

This command will not succeed if there are any existing text search dictionaries that use the template. Add CASCADE to drop such dictionaries along with the template.

There is no DROP TEXT SEARCH TEMPLATE statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
DROP TEXT SEARCH TEMPLATE
```

Example 2 (unknown):
```unknown
DROP TEXT SEARCH TEMPLATE thesaurus;
```

Example 3 (unknown):
```unknown
DROP TEXT SEARCH TEMPLATE
```

---


---

