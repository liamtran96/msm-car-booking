# PostgreSQL - System Views

## 53.7. pg_cursors #


**URL:** https://www.postgresql.org/docs/18/view-pg-cursors.html

**Contents:**
- 53.7. pg_cursors #
  - Note

The pg_cursors view lists the cursors that are currently available. Cursors can be defined in several ways:

via the DECLARE statement in SQL

via the Bind message in the frontend/backend protocol, as described in Section 54.2.3

via the Server Programming Interface (SPI), as described in Section 45.1

The pg_cursors view displays cursors created by any of these means. Cursors only exist for the duration of the transaction that defines them, unless they have been declared WITH HOLD. Therefore non-holdable cursors are only present in the view until the end of their creating transaction.

Cursors are used internally to implement some of the components of PostgreSQL, such as procedural languages. Therefore, the pg_cursors view might include cursors that have not been explicitly created by the user.

Table 53.7. pg_cursors Columns

The name of the cursor

The verbatim query string submitted to declare this cursor

true if the cursor is holdable (that is, it can be accessed after the transaction that declared the cursor has committed); false otherwise

true if the cursor was declared BINARY; false otherwise

true if the cursor is scrollable (that is, it allows rows to be retrieved in a nonsequential manner); false otherwise

creation_time timestamptz

The time at which the cursor was declared

The pg_cursors view is read-only.

**Examples:**

Example 1 (unknown):
```unknown
is_holdable
```

Example 2 (unknown):
```unknown
is_scrollable
```

Example 3 (unknown):
```unknown
creation_time
```

Example 4 (unknown):
```unknown
timestamptz
```

---


---

## 53.21. pg_roles #


**URL:** https://www.postgresql.org/docs/18/view-pg-roles.html

**Contents:**
- 53.21. pg_roles #

The view pg_roles provides access to information about database roles. This is simply a publicly readable view of pg_authid that blanks out the password field.

Table 53.21. pg_roles Columns

Role has superuser privileges

Role automatically inherits privileges of roles it is a member of

Role can create more roles

Role can create databases

Role can log in. That is, this role can be given as the initial session authorization identifier

Role is a replication role. A replication role can initiate replication connections and create and drop replication slots.

For roles that can log in, this sets maximum number of concurrent connections this role can make. -1 means no limit.

Not the password (always reads as ********)

rolvaliduntil timestamptz

Password expiry time (only used for password authentication); null if no expiration

Role bypasses every row-level security policy, see Section 5.9 for more information.

Role-specific defaults for run-time configuration variables

oid oid (references pg_authid.oid)

**Examples:**

Example 1 (unknown):
```unknown
rolcreaterole
```

Example 2 (unknown):
```unknown
rolcreatedb
```

Example 3 (unknown):
```unknown
rolcanlogin
```

Example 4 (unknown):
```unknown
rolreplication
```

---


---

## 53.23. pg_seclabels #


**URL:** https://www.postgresql.org/docs/18/view-pg-seclabels.html

**Contents:**
- 53.23. pg_seclabels #

The view pg_seclabels provides information about security labels. It as an easier-to-query version of the pg_seclabel catalog.

Table 53.23. pg_seclabels Columns

objoid oid (references any OID column)

The OID of the object this security label pertains to

classoid oid (references pg_class.oid)

The OID of the system catalog this object appears in

For a security label on a table column, this is the column number (the objoid and classoid refer to the table itself). For all other object types, this column is zero.

The type of object to which this label applies, as text.

objnamespace oid (references pg_namespace.oid)

The OID of the namespace for this object, if applicable; otherwise NULL.

The name of the object to which this label applies, as text.

provider text (references pg_seclabel.provider)

The label provider associated with this label.

label text (references pg_seclabel.label)

The security label applied to this object.

**Examples:**

Example 1 (unknown):
```unknown
pg_seclabels
```

Example 2 (unknown):
```unknown
pg_seclabels
```

Example 3 (unknown):
```unknown
pg_seclabels
```

Example 4 (unknown):
```unknown
pg_seclabel
```

---


---

## 53.15. pg_policies #


**URL:** https://www.postgresql.org/docs/18/view-pg-policies.html

**Contents:**
- 53.15. pg_policies #

The view pg_policies provides access to useful information about each row-level security policy in the database.

Table 53.15. pg_policies Columns

schemaname name (references pg_namespace.nspname)

Name of schema containing table policy is on

tablename name (references pg_class.relname)

Name of table policy is on

policyname name (references pg_policy.polname)

Is the policy permissive or restrictive?

The roles to which this policy applies

The command type to which the policy is applied

The expression added to the security barrier qualifications for queries that this policy applies to

The expression added to the WITH CHECK qualifications for queries that attempt to add rows to this table

**Examples:**

Example 1 (unknown):
```unknown
pg_policies
```

Example 2 (unknown):
```unknown
pg_policies
```

Example 3 (unknown):
```unknown
pg_policies
```

Example 4 (unknown):
```unknown
pg_policies
```

---


---

## 53.25. pg_settings #


**URL:** https://www.postgresql.org/docs/18/view-pg-settings.html

**Contents:**
- 53.25. pg_settings #

The view pg_settings provides access to run-time parameters of the server. It is essentially an alternative interface to the SHOW and SET commands. It also provides access to some facts about each parameter that are not directly available from SHOW, such as minimum and maximum values.

Table 53.25. pg_settings Columns

Run-time configuration parameter name

Current value of the parameter

Implicit unit of the parameter

Logical group of the parameter

A brief description of the parameter

Additional, more detailed, description of the parameter

Context required to set the parameter's value (see below)

Parameter type (bool, enum, integer, real, or string)

Source of the current parameter value

Minimum allowed value of the parameter (null for non-numeric values)

Maximum allowed value of the parameter (null for non-numeric values)

Allowed values of an enum parameter (null for non-enum values)

Parameter value assumed at server startup if the parameter is not otherwise set

Value that RESET would reset the parameter to in the current session

Configuration file the current value was set in (null for values set from sources other than configuration files, or when examined by a user who neither is a superuser nor has privileges of pg_read_all_settings); helpful when using include directives in configuration files

Line number within the configuration file the current value was set at (null for values set from sources other than configuration files, or when examined by a user who neither is a superuser nor has privileges of pg_read_all_settings).

true if the value has been changed in the configuration file but needs a restart; or false otherwise.

There are several possible values of context. In order of decreasing difficulty of changing the setting, they are:

These settings cannot be changed directly; they reflect internally determined values. Some of them may be adjustable by rebuilding the server with different configuration options, or by changing options supplied to initdb.

These settings can only be applied when the server starts, so any change requires restarting the server. Values for these settings are typically stored in the postgresql.conf file, or passed on the command line when starting the server. Of course, settings with any of the lower context types can also be set at server start time.

Changes to these settings can be made in postgresql.conf without restarting the server. Send a SIGHUP signal to the postmaster to cause it to re-read postgresql.conf and apply the changes. The postmaster will also forward the SIGHUP signal to its child processes so that they all pick up the new value.

Changes to these settings can be made in postgresql.conf without restarting the server. They can also be set for a particular session in the connection request packet (for example, via libpq's PGOPTIONS environment variable), but only if the connecting user is a superuser or has been granted the appropriate SET privilege. However, these settings never change in a session after it is started. If you change them in postgresql.conf, send a SIGHUP signal to the postmaster to cause it to re-read postgresql.conf. The new values will only affect subsequently-launched sessions.

Changes to these settings can be made in postgresql.conf without restarting the server. They can also be set for a particular session in the connection request packet (for example, via libpq's PGOPTIONS environment variable); any user can make such a change for their session. However, these settings never change in a session after it is started. If you change them in postgresql.conf, send a SIGHUP signal to the postmaster to cause it to re-read postgresql.conf. The new values will only affect subsequently-launched sessions.

These settings can be set from postgresql.conf, or within a session via the SET command; but only superusers and users with the appropriate SET privilege can change them via SET. Changes in postgresql.conf will affect existing sessions only if no session-local value has been established with SET.

These settings can be set from postgresql.conf, or within a session via the SET command. Any user is allowed to change their session-local value. Changes in postgresql.conf will affect existing sessions only if no session-local value has been established with SET.

See Section 19.1 for more information about the various ways to change these parameters.

This view cannot be inserted into or deleted from, but it can be updated. An UPDATE applied to a row of pg_settings is equivalent to executing the SET command on that named parameter. The change only affects the value used by the current session. If an UPDATE is issued within a transaction that is later aborted, the effects of the UPDATE command disappear when the transaction is rolled back. Once the surrounding transaction is committed, the effects will persist until the end of the session, unless overridden by another UPDATE or SET.

This view does not display customized options unless the extension module that defines them has been loaded by the backend process executing the query (e.g., via a mention in shared_preload_libraries, a call to a C function in the extension, or the LOAD command). For example, since archive modules are normally loaded only by the archiver process not regular sessions, this view will not display any customized options defined by such modules unless special action is taken to load them into the backend process executing the query.

**Examples:**

Example 1 (unknown):
```unknown
pg_settings
```

Example 2 (unknown):
```unknown
pg_settings
```

Example 3 (unknown):
```unknown
pg_settings
```

Example 4 (unknown):
```unknown
pg_settings
```

---


---

