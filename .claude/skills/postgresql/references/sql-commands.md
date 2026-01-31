# PostgreSQL - Sql Commands

## 


**URL:** https://www.postgresql.org/docs/18/sql-security-label.html

**Contents:**
- SECURITY LABEL
- Synopsis
- Description
  - Note
- Parameters
- Examples
- Compatibility
- See Also

SECURITY LABEL — define or change a security label applied to an object

SECURITY LABEL applies a security label to a database object. An arbitrary number of security labels, one per label provider, can be associated with a given database object. Label providers are loadable modules which register themselves by using the function register_label_provider.

register_label_provider is not an SQL function; it can only be called from C code loaded into the backend.

The label provider determines whether a given label is valid and whether it is permissible to assign that label to a given object. The meaning of a given label is likewise at the discretion of the label provider. PostgreSQL places no restrictions on whether or how a label provider must interpret security labels; it merely provides a mechanism for storing them. In practice, this facility is intended to allow integration with label-based mandatory access control (MAC) systems such as SELinux. Such systems make all access control decisions based on object labels, rather than traditional discretionary access control (DAC) concepts such as users and groups.

You must own the database object to use SECURITY LABEL.

The name of the object to be labeled. Names of objects that reside in schemas (tables, functions, etc.) can be schema-qualified.

The name of the provider with which this label is to be associated. The named provider must be loaded and must consent to the proposed labeling operation. If exactly one provider is loaded, the provider name may be omitted for brevity.

The mode of a function, procedure, or aggregate argument: IN, OUT, INOUT, or VARIADIC. If omitted, the default is IN. Note that SECURITY LABEL does not actually pay any attention to OUT arguments, since only the input arguments are needed to determine the function's identity. So it is sufficient to list the IN, INOUT, and VARIADIC arguments.

The name of a function, procedure, or aggregate argument. Note that SECURITY LABEL does not actually pay any attention to argument names, since only the argument data types are needed to determine the function's identity.

The data type of a function, procedure, or aggregate argument.

The OID of the large object.

This is a noise word.

The new setting of the security label, written as a string literal.

Write NULL to drop the security label.

The following example shows how the security label of a table could be set or changed:

There is no SECURITY LABEL command in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
object_name
```

Example 2 (unknown):
```unknown
column_name
```

Example 3 (unknown):
```unknown
aggregate_name
```

Example 4 (unknown):
```unknown
aggregate_signature
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterlanguage.html

**Contents:**
- ALTER LANGUAGE
- Synopsis
- Description
- Parameters
- Compatibility
- See Also

ALTER LANGUAGE — change the definition of a procedural language

ALTER LANGUAGE changes the definition of a procedural language. The only functionality is to rename the language or assign a new owner. You must be superuser or owner of the language to use ALTER LANGUAGE.

The new name of the language

The new owner of the language

There is no ALTER LANGUAGE statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
ALTER LANGUAGE
```

Example 2 (unknown):
```unknown
ALTER LANGUAGE
```

Example 3 (unknown):
```unknown
ALTER LANGUAGE
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-set-session-authorization.html

**Contents:**
- SET SESSION AUTHORIZATION
- Synopsis
- Description
- Notes
- Examples
- Compatibility
- See Also

SET SESSION AUTHORIZATION — set the session user identifier and the current user identifier of the current session

This command sets the session user identifier and the current user identifier of the current SQL session to be user_name. The user name can be written as either an identifier or a string literal. Using this command, it is possible, for example, to temporarily become an unprivileged user and later switch back to being a superuser.

The session user identifier is initially set to be the (possibly authenticated) user name provided by the client. The current user identifier is normally equal to the session user identifier, but might change temporarily in the context of SECURITY DEFINER functions and similar mechanisms; it can also be changed by SET ROLE. The current user identifier is relevant for permission checking.

The session user identifier can be changed only if the initial session user (the authenticated user) has the superuser privilege. Otherwise, the command is accepted only if it specifies the authenticated user name.

The SESSION and LOCAL modifiers act the same as for the regular SET command.

The DEFAULT and RESET forms reset the session and current user identifiers to be the originally authenticated user name. These forms can be executed by any user.

SET SESSION AUTHORIZATION cannot be used within a SECURITY DEFINER function.

The SQL standard allows some other expressions to appear in place of the literal user_name, but these options are not important in practice. PostgreSQL allows identifier syntax ("username"), which SQL does not. SQL does not allow this command during a transaction; PostgreSQL does not make this restriction because there is no reason to. The SESSION and LOCAL modifiers are a PostgreSQL extension, as is the RESET syntax.

The privileges necessary to execute this command are left implementation-defined by the standard.

**Examples:**

Example 1 (unknown):
```unknown
SECURITY DEFINER
```

Example 2 (unknown):
```unknown
SET SESSION AUTHORIZATION
```

Example 3 (unknown):
```unknown
SECURITY DEFINER
```

Example 4 (sql):
```sql
SELECT SESSION_USER, CURRENT_USER;

 session_user | current_user
--------------+--------------
 peter        | peter

SET SESSION AUTHORIZATION 'paul';

SELECT SESSION_USER, CURRENT_USER;

 session_user | current_user
--------------+--------------
 paul         | paul
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropextension.html

**Contents:**
- DROP EXTENSION
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP EXTENSION — remove an extension

DROP EXTENSION removes extensions from the database. Dropping an extension causes its member objects, and other explicitly dependent routines (see ALTER ROUTINE, the DEPENDS ON EXTENSION extension_name action), to be dropped as well.

You must own the extension to use DROP EXTENSION.

Do not throw an error if the extension does not exist. A notice is issued in this case.

The name of an installed extension.

Automatically drop objects that depend on the extension, and in turn all objects that depend on those objects (see Section 5.15).

This option prevents the specified extensions from being dropped if other objects, besides these extensions, their members, and their explicitly dependent routines, depend on them. This is the default.

To remove the extension hstore from the current database:

This command will fail if any of hstore's objects are in use in the database, for example if any tables have columns of the hstore type. Add the CASCADE option to forcibly remove those dependent objects as well.

DROP EXTENSION is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
DROP EXTENSION
```

Example 2 (unknown):
```unknown
DEPENDS ON EXTENSION extension_name
```

Example 3 (unknown):
```unknown
extension_name
```

Example 4 (unknown):
```unknown
DROP EXTENSION
```

---


---

