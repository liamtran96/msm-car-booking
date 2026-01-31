# PostgreSQL - Sql Commands (Part 45)

## 


**URL:** https://www.postgresql.org/docs/18/sql-rollback.html

**Contents:**
- ROLLBACK
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

ROLLBACK — abort the current transaction

ROLLBACK rolls back the current transaction and causes all the updates made by the transaction to be discarded.

Optional key words. They have no effect.

If AND CHAIN is specified, a new (not aborted) transaction is immediately started with the same transaction characteristics (see SET TRANSACTION) as the just finished one. Otherwise, no new transaction is started.

Use COMMIT to successfully terminate a transaction.

Issuing ROLLBACK outside of a transaction block emits a warning and otherwise has no effect. ROLLBACK AND CHAIN outside of a transaction block is an error.

To abort all changes:

The command ROLLBACK conforms to the SQL standard. The form ROLLBACK TRANSACTION is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
TRANSACTION
```

Example 2 (unknown):
```unknown
ROLLBACK AND CHAIN
```

Example 3 (unknown):
```unknown
ROLLBACK TRANSACTION
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-rollback-to.html

**Contents:**
- ROLLBACK TO SAVEPOINT
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

ROLLBACK TO SAVEPOINT — roll back to a savepoint

Roll back all commands that were executed after the savepoint was established and then start a new subtransaction at the same transaction level. The savepoint remains valid and can be rolled back to again later, if needed.

ROLLBACK TO SAVEPOINT implicitly destroys all savepoints that were established after the named savepoint.

The savepoint to roll back to.

Use RELEASE SAVEPOINT to destroy a savepoint without discarding the effects of commands executed after it was established.

Specifying a savepoint name that has not been established is an error.

Cursors have somewhat non-transactional behavior with respect to savepoints. Any cursor that is opened inside a savepoint will be closed when the savepoint is rolled back. If a previously opened cursor is affected by a FETCH or MOVE command inside a savepoint that is later rolled back, the cursor remains at the position that FETCH left it pointing to (that is, the cursor motion caused by FETCH is not rolled back). Closing a cursor is not undone by rolling back, either. However, other side-effects caused by the cursor's query (such as side-effects of volatile functions called by the query) are rolled back if they occur during a savepoint that is later rolled back. A cursor whose execution causes a transaction to abort is put in a cannot-execute state, so while the transaction can be restored using ROLLBACK TO SAVEPOINT, the cursor can no longer be used.

To undo the effects of the commands executed after my_savepoint was established:

Cursor positions are not affected by savepoint rollback:

The SQL standard specifies that the key word SAVEPOINT is mandatory, but PostgreSQL and Oracle allow it to be omitted. SQL allows only WORK, not TRANSACTION, as a noise word after ROLLBACK. Also, SQL has an optional clause AND [ NO ] CHAIN which is not currently supported by PostgreSQL. Otherwise, this command conforms to the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
savepoint_name
```

Example 2 (unknown):
```unknown
ROLLBACK TO SAVEPOINT
```

Example 3 (unknown):
```unknown
savepoint_name
```

Example 4 (unknown):
```unknown
RELEASE SAVEPOINT
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-show.html

**Contents:**
- SHOW
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

SHOW — show the value of a run-time parameter

SHOW will display the current setting of run-time parameters. These variables can be set using the SET statement, by editing the postgresql.conf configuration file, through the PGOPTIONS environmental variable (when using libpq or a libpq-based application), or through command-line flags when starting the postgres server. See Chapter 19 for details.

The name of a run-time parameter. Available parameters are documented in Chapter 19 and on the SET reference page. In addition, there are a few parameters that can be shown but not set:

Shows the server's version number.

Shows the server-side character set encoding. At present, this parameter can be shown but not set, because the encoding is determined at database creation time.

True if the current role has superuser privileges.

Show the values of all configuration parameters, with descriptions.

The function current_setting produces equivalent output; see Section 9.28.1. Also, the pg_settings system view produces the same information.

Show the current setting of the parameter DateStyle:

Show the current setting of the parameter geqo:

The SHOW command is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
postgresql.conf
```

Example 2 (unknown):
```unknown
SERVER_VERSION
```

Example 3 (unknown):
```unknown
SERVER_ENCODING
```

Example 4 (unknown):
```unknown
IS_SUPERUSER
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-droptsconfig.html

**Contents:**
- DROP TEXT SEARCH CONFIGURATION
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP TEXT SEARCH CONFIGURATION — remove a text search configuration

DROP TEXT SEARCH CONFIGURATION drops an existing text search configuration. To execute this command you must be the owner of the configuration.

Do not throw an error if the text search configuration does not exist. A notice is issued in this case.

The name (optionally schema-qualified) of an existing text search configuration.

Automatically drop objects that depend on the text search configuration, and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the text search configuration if any objects depend on it. This is the default.

Remove the text search configuration my_english:

This command will not succeed if there are any existing indexes that reference the configuration in to_tsvector calls. Add CASCADE to drop such indexes along with the text search configuration.

There is no DROP TEXT SEARCH CONFIGURATION statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
DROP TEXT SEARCH CONFIGURATION
```

Example 2 (unknown):
```unknown
DROP TEXT SEARCH CONFIGURATION my_english;
```

Example 3 (unknown):
```unknown
to_tsvector
```

Example 4 (unknown):
```unknown
DROP TEXT SEARCH CONFIGURATION
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-altergroup.html

**Contents:**
- ALTER GROUP
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

ALTER GROUP — change role name or membership

ALTER GROUP changes the attributes of a user group. This is an obsolete command, though still accepted for backwards compatibility, because groups (and users too) have been superseded by the more general concept of roles.

The first two variants add users to a group or remove them from a group. (Any role can play the part of either a “user” or a “group” for this purpose.) These variants are effectively equivalent to granting or revoking membership in the role named as the “group”; so the preferred way to do this is to use GRANT or REVOKE. Note that GRANT and REVOKE have additional options which are not available with this command, such as the ability to grant and revoke ADMIN OPTION, and the ability to specify the grantor.

The third variant changes the name of the group. This is exactly equivalent to renaming the role with ALTER ROLE.

The name of the group (role) to modify.

Users (roles) that are to be added to or removed from the group. The users must already exist; ALTER GROUP does not create or drop users.

The new name of the group.

Add users to a group:

Remove a user from a group:

There is no ALTER GROUP statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
role_specification
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
ALTER GROUP
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterlargeobject.html

**Contents:**
- ALTER LARGE OBJECT
- Synopsis
- Description
- Parameters
- Compatibility
- See Also

ALTER LARGE OBJECT — change the definition of a large object

ALTER LARGE OBJECT changes the definition of a large object.

You must own the large object to use ALTER LARGE OBJECT. To alter the owner, you must also be able to SET ROLE to the new owning role. (However, a superuser can alter any large object anyway.) Currently, the only functionality is to assign a new owner, so both restrictions always apply.

OID of the large object to be altered

The new owner of the large object

There is no ALTER LARGE OBJECT statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
large_object_oid
```

Example 2 (unknown):
```unknown
ALTER LARGE OBJECT
```

Example 3 (unknown):
```unknown
ALTER LARGE OBJECT
```

Example 4 (unknown):
```unknown
large_object_oid
```

---


---

