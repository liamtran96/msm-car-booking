# PostgreSQL - Sql Commands (Part 10)

## 


**URL:** https://www.postgresql.org/docs/18/sql-begin.html

**Contents:**
- BEGIN
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

BEGIN — start a transaction block

BEGIN initiates a transaction block, that is, all statements after a BEGIN command will be executed in a single transaction until an explicit COMMIT or ROLLBACK is given. By default (without BEGIN), PostgreSQL executes transactions in “autocommit” mode, that is, each statement is executed in its own transaction and a commit is implicitly performed at the end of the statement (if execution was successful, otherwise a rollback is done).

Statements are executed more quickly in a transaction block, because transaction start/commit requires significant CPU and disk activity. Execution of multiple statements inside a transaction is also useful to ensure consistency when making several related changes: other sessions will be unable to see the intermediate states wherein not all the related updates have been done.

If the isolation level, read/write mode, or deferrable mode is specified, the new transaction has those characteristics, as if SET TRANSACTION was executed.

Optional key words. They have no effect.

Refer to SET TRANSACTION for information on the meaning of the other parameters to this statement.

START TRANSACTION has the same functionality as BEGIN.

Use COMMIT or ROLLBACK to terminate a transaction block.

Issuing BEGIN when already inside a transaction block will provoke a warning message. The state of the transaction is not affected. To nest transactions within a transaction block, use savepoints (see SAVEPOINT).

For reasons of backwards compatibility, the commas between successive transaction_modes can be omitted.

To begin a transaction block:

BEGIN is a PostgreSQL language extension. It is equivalent to the SQL-standard command START TRANSACTION, whose reference page contains additional compatibility information.

The DEFERRABLE transaction_mode is a PostgreSQL language extension.

Incidentally, the BEGIN key word is used for a different purpose in embedded SQL. You are advised to be careful about the transaction semantics when porting database applications.

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
TRANSACTION
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-altercollation.html

**Contents:**
- ALTER COLLATION
- Synopsis
- Description
- Parameters
- Notes
  - Note
- Examples
- Compatibility
- See Also

ALTER COLLATION — change the definition of a collation

ALTER COLLATION changes the definition of a collation.

You must own the collation to use ALTER COLLATION. To alter the owner, you must be able to SET ROLE to the new owning role, and that role must have CREATE privilege on the collation's schema. (These restrictions enforce that altering the owner doesn't do anything you couldn't do by dropping and recreating the collation. However, a superuser can alter ownership of any collation anyway.)

The name (optionally schema-qualified) of an existing collation.

The new name of the collation.

The new owner of the collation.

The new schema for the collation.

Update the collation's version. See Notes below.

When a collation object is created, the provider-specific version of the collation is recorded in the system catalog. When the collation is used, the current version is checked against the recorded version, and a warning is issued when there is a mismatch, for example:

A change in collation definitions can lead to corrupt indexes and other problems because the database system relies on stored objects having a certain sort order. Generally, this should be avoided, but it can happen in legitimate circumstances, such as when upgrading the operating system to a new major version or when using pg_upgrade to upgrade to server binaries linked with a newer version of ICU. When this happens, all objects depending on the collation should be rebuilt, for example, using REINDEX. When that is done, the collation version can be refreshed using the command ALTER COLLATION ... REFRESH VERSION. This will update the system catalog to record the current collation version and will make the warning go away. Note that this does not actually check whether all affected objects have been rebuilt correctly.

When using collations provided by libc, version information is recorded on systems using the GNU C library (most Linux systems), FreeBSD and Windows. When using collations provided by ICU, the version information is provided by the ICU library and is available on all platforms.

When using the GNU C library for collations, the C library's version is used as a proxy for the collation version. Many Linux distributions change collation definitions only when upgrading the C library, but this approach is imperfect as maintainers are free to back-port newer collation definitions to older C library releases.

When using Windows for collations, version information is only available for collations defined with BCP 47 language tags such as en-US.

For the database default collation, there is an analogous command ALTER DATABASE ... REFRESH COLLATION VERSION.

The following query can be used to identify all collations in the current database that need to be refreshed and the objects that depend on them:

To rename the collation de_DE to german:

To change the owner of the collation en_US to joe:

There is no ALTER COLLATION statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
ALTER COLLATION
```

Example 2 (unknown):
```unknown
ALTER COLLATION
```

Example 3 (unknown):
```unknown
REFRESH VERSION
```

Example 4 (yaml):
```yaml
WARNING:  collation "xx-x-icu" has version mismatch
DETAIL:  The collation in the database was created using version 1.2.3.4, but the operating system provides version 2.3.4.5.
HINT:  Rebuild all objects affected by this collation and run ALTER COLLATION pg_catalog."xx-x-icu" REFRESH VERSION, or build PostgreSQL with the right library version.
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterusermapping.html

**Contents:**
- ALTER USER MAPPING
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

ALTER USER MAPPING — change the definition of a user mapping

ALTER USER MAPPING changes the definition of a user mapping.

The owner of a foreign server can alter user mappings for that server for any user. Also, a user can alter a user mapping for their own user name if USAGE privilege on the server has been granted to the user.

User name of the mapping. CURRENT_ROLE, CURRENT_USER, and USER match the name of the current user. PUBLIC is used to match all present and future user names in the system.

Server name of the user mapping.

Change options for the user mapping. The new options override any previously specified options. ADD, SET, and DROP specify the action to be performed. ADD is assumed if no operation is explicitly specified. Option names must be unique; options are also validated by the server's foreign-data wrapper.

Change the password for user mapping bob, server foo:

ALTER USER MAPPING conforms to ISO/IEC 9075-9 (SQL/MED). There is a subtle syntax issue: The standard omits the FOR key word. Since both CREATE USER MAPPING and DROP USER MAPPING use FOR in analogous positions, and IBM DB2 (being the other major SQL/MED implementation) also requires it for ALTER USER MAPPING, PostgreSQL diverges from the standard here in the interest of consistency and interoperability.

**Examples:**

Example 1 (unknown):
```unknown
server_name
```

Example 2 (unknown):
```unknown
ALTER USER MAPPING
```

Example 3 (unknown):
```unknown
CURRENT_ROLE
```

Example 4 (unknown):
```unknown
CURRENT_USER
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-load.html

**Contents:**
- LOAD
- Synopsis
- Description
- Compatibility
- See Also

LOAD — load a shared library file

This command loads a shared library file into the PostgreSQL server's address space. If the file has been loaded already, the command does nothing. Shared library files that contain C functions are automatically loaded whenever one of their functions is called. Therefore, an explicit LOAD is usually only needed to load a library that modifies the server's behavior through “hooks” rather than providing a set of functions.

The library file name is typically given as just a bare file name, which is sought in the server's library search path (set by dynamic_library_path). Alternatively it can be given as a full path name. In either case the platform's standard shared library file name extension may be omitted. See Section 36.10.1 for more information on this topic.

Non-superusers can only apply LOAD to library files located in $libdir/plugins/ — the specified filename must begin with exactly that string. (It is the database administrator's responsibility to ensure that only “safe” libraries are installed there.)

LOAD is a PostgreSQL extension.

**Examples:**

Example 1 (bash):
```bash
$libdir/plugins/
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-createdatabase.html

**Contents:**
- CREATE DATABASE
- Synopsis
- Description
- Parameters
  - Tip
- Notes
- Examples
- Compatibility
- See Also

CREATE DATABASE — create a new database

CREATE DATABASE creates a new PostgreSQL database.

To create a database, you must be a superuser or have the special CREATEDB privilege. See CREATE ROLE.

By default, the new database will be created by cloning the standard system database template1. A different template can be specified by writing TEMPLATE name. In particular, by writing TEMPLATE template0, you can create a pristine database (one where no user-defined objects exist and where the system objects have not been altered) containing only the standard objects predefined by your version of PostgreSQL. This is useful if you wish to avoid copying any installation-local objects that might have been added to template1.

The name of a database to create.

The role name of the user who will own the new database, or DEFAULT to use the default (namely, the user executing the command). To create a database owned by another role, you must be able to SET ROLE to that role.

The name of the template from which to create the new database, or DEFAULT to use the default template (template1).

Character set encoding to use in the new database. Specify a string constant (e.g., 'SQL_ASCII'), or an integer encoding number, or DEFAULT to use the default encoding (namely, the encoding of the template database). The character sets supported by the PostgreSQL server are described in Section 23.3.1. See below for additional restrictions.

Strategy to be used in creating the new database. If the WAL_LOG strategy is used, the database will be copied block by block and each block will be separately written to the write-ahead log. This is the most efficient strategy in cases where the template database is small, and therefore it is the default. The older FILE_COPY strategy is also available. This strategy writes a small record to the write-ahead log for each tablespace used by the target database. Each such record represents copying an entire directory to a new location at the filesystem level. While this does reduce the write-ahead log volume substantially, especially if the template database is large, it also forces the system to perform a checkpoint both before and after the creation of the new database. In some situations, this may have a noticeable negative impact on overall system performance. The FILE_COPY strategy is affected by the file_copy_method setting.

Sets the default collation order and character classification in the new database. Collation affects the sort order applied to strings, e.g., in queries with ORDER BY, as well as the order used in indexes on text columns. Character classification affects the categorization of characters, e.g., lower, upper, and digit. Also sets the associated aspects of the operating system environment, LC_COLLATE and LC_CTYPE. The default is the same setting as the template database. See Section 23.2.2.3.1 and Section 23.2.2.3.2 for details.

Can be overridden by setting lc_collate, lc_ctype, builtin_locale, or icu_locale individually.

If locale_provider is builtin, then locale or builtin_locale must be specified and set to either C, C.UTF-8, or PG_UNICODE_FAST.

The other locale settings lc_messages, lc_monetary, lc_numeric, and lc_time are not fixed per database and are not set by this command. If you want to make them the default for a specific database, you can use ALTER DATABASE ... SET.

Sets LC_COLLATE in the database server's operating system environment. The default is the setting of locale if specified, otherwise the same setting as the template database. See below for additional restrictions.

If locale_provider is libc, also sets the default collation order to use in the new database, overriding the setting locale.

Sets LC_CTYPE in the database server's operating system environment. The default is the setting of locale if specified, otherwise the same setting as the template database. See below for additional restrictions.

If locale_provider is libc, also sets the default character classification to use in the new database, overriding the setting locale.

Specifies the builtin provider locale for the database default collation order and character classification, overriding the setting locale. The locale provider must be builtin. The default is the setting of locale if specified; otherwise the same setting as the template database.

The locales available for the builtin provider are C, C.UTF-8 and PG_UNICODE_FAST.

Specifies the ICU locale (see Section 23.2.2.3.2) for the database default collation order and character classification, overriding the setting locale. The locale provider must be ICU. The default is the setting of locale if specified; otherwise the same setting as the template database.

Specifies additional collation rules to customize the behavior of the default collation of this database. This is supported for ICU only. See Section 23.2.3.4 for details.

Specifies the provider to use for the default collation in this database. Possible values are builtin, icu (if the server was built with ICU support) or libc. By default, the provider is the same as that of the template. See Section 23.1.4 for details.

Specifies the collation version string to store with the database. Normally, this should be omitted, which will cause the version to be computed from the actual version of the database collation as provided by the operating system. This option is intended to be used by pg_upgrade for copying the version from an existing installation.

See also ALTER DATABASE for how to handle database collation version mismatches.

The name of the tablespace that will be associated with the new database, or DEFAULT to use the template database's tablespace. This tablespace will be the default tablespace used for objects created in this database. See CREATE TABLESPACE for more information.

If false then no one can connect to this database. The default is true, allowing connections (except as restricted by other mechanisms, such as GRANT/REVOKE CONNECT).

How many concurrent connections can be made to this database. -1 (the default) means no limit.

If true, then this database can be cloned by any user with CREATEDB privileges; if false (the default), then only superusers or the owner of the database can clone it.

The object identifier to be used for the new database. If this parameter is not specified, PostgreSQL will choose a suitable OID automatically. This parameter is primarily intended for internal use by pg_upgrade, and only pg_upgrade can specify a value less than 16384.

Optional parameters can be written in any order, not only the order illustrated above.

CREATE DATABASE cannot be executed inside a transaction block.

Errors along the line of “could not initialize database directory” are most likely related to insufficient permissions on the data directory, a full disk, or other file system problems.

Use DROP DATABASE to remove a database.

The program createdb is a wrapper program around this command, provided for convenience.

Database-level configuration parameters (set via ALTER DATABASE) and database-level permissions (set via GRANT) are not copied from the template database.

Although it is possible to copy a database other than template1 by specifying its name as the template, this is not (yet) intended as a general-purpose “COPY DATABASE” facility. The principal limitation is that no other sessions can be connected to the template database while it is being copied. CREATE DATABASE will fail if any other connection exists when it starts; otherwise, new connections to the template database are locked out until CREATE DATABASE completes. See Section 22.3 for more information.

The character set encoding specified for the new database must be compatible with the chosen locale settings (LC_COLLATE and LC_CTYPE). If the locale is C (or equivalently POSIX), then all encodings are allowed, but for other locale settings there is only one encoding that will work properly. (On Windows, however, UTF-8 encoding can be used with any locale.) CREATE DATABASE will allow superusers to specify SQL_ASCII encoding regardless of the locale settings, but this choice is deprecated and may result in misbehavior of character-string functions if data that is not encoding-compatible with the locale is stored in the database.

The encoding and locale settings must match those of the template database, except when template0 is used as template. This is because other databases might contain data that does not match the specified encoding, or might contain indexes whose sort ordering is affected by LC_COLLATE and LC_CTYPE. Copying such data would result in a database that is corrupt according to the new settings. template0, however, is known to not contain any data or indexes that would be affected.

There is currently no option to use a database locale with nondeterministic comparisons (see CREATE COLLATION for an explanation). If this is needed, then per-column collations would need to be used.

The CONNECTION LIMIT option is only enforced approximately; if two new sessions start at about the same time when just one connection “slot” remains for the database, it is possible that both will fail. Also, the limit is not enforced against superusers or background worker processes.

To create a new database:

To create a database sales owned by user salesapp with a default tablespace of salesspace:

To create a database music with a different locale:

In this example, the TEMPLATE template0 clause is required if the specified locale is different from the one in template1. (If it is not, then specifying the locale explicitly is redundant.)

To create a database music2 with a different locale and a different character set encoding:

The specified locale and encoding settings must match, or an error will be reported.

Note that locale names are specific to the operating system, so that the above commands might not work in the same way everywhere.

There is no CREATE DATABASE statement in the SQL standard. Databases are equivalent to catalogs, whose creation is implementation-defined.

**Examples:**

Example 1 (unknown):
```unknown
builtin_locale
```

Example 2 (unknown):
```unknown
locale_provider
```

Example 3 (unknown):
```unknown
collation_version
```

Example 4 (unknown):
```unknown
tablespace_name
```

---


---

