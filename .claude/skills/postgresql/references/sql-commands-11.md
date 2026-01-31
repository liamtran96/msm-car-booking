# PostgreSQL - Sql Commands (Part 11)

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterpolicy.html

**Contents:**
- ALTER POLICY
- Synopsis
- Description
- Parameters
- Compatibility
- See Also

ALTER POLICY — change the definition of a row-level security policy

ALTER POLICY changes the definition of an existing row-level security policy. Note that ALTER POLICY only allows the set of roles to which the policy applies and the USING and WITH CHECK expressions to be modified. To change other properties of a policy, such as the command to which it applies or whether it is permissive or restrictive, the policy must be dropped and recreated.

To use ALTER POLICY, you must own the table that the policy applies to.

In the second form of ALTER POLICY, the role list, using_expression, and check_expression are replaced independently if specified. When one of those clauses is omitted, the corresponding part of the policy is unchanged.

The name of an existing policy to alter.

The name (optionally schema-qualified) of the table that the policy is on.

The new name for the policy.

The role(s) to which the policy applies. Multiple roles can be specified at one time. To apply the policy to all roles, use PUBLIC.

The USING expression for the policy. See CREATE POLICY for details.

The WITH CHECK expression for the policy. See CREATE POLICY for details.

ALTER POLICY is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
using_expression
```

Example 2 (unknown):
```unknown
check_expression
```

Example 3 (unknown):
```unknown
ALTER POLICY
```

Example 4 (unknown):
```unknown
ALTER POLICY
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropview.html

**Contents:**
- DROP VIEW
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP VIEW — remove a view

DROP VIEW drops an existing view. To execute this command you must be the owner of the view.

Do not throw an error if the view does not exist. A notice is issued in this case.

The name (optionally schema-qualified) of the view to remove.

Automatically drop objects that depend on the view (such as other views), and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the view if any objects depend on it. This is the default.

This command will remove the view called kinds:

This command conforms to the SQL standard, except that the standard only allows one view to be dropped per command, and apart from the IF EXISTS option, which is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
DROP VIEW kinds;
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterdefaultprivileges.html

**Contents:**
- ALTER DEFAULT PRIVILEGES
- Synopsis
- Description
  - Parameters
- Notes
- Examples
- Compatibility
- See Also

ALTER DEFAULT PRIVILEGES — define default access privileges

ALTER DEFAULT PRIVILEGES allows you to set the privileges that will be applied to objects created in the future. (It does not affect privileges assigned to already-existing objects.) Privileges can be set globally (i.e., for all objects created in the current database), or just for objects created in specified schemas.

While you can change your own default privileges and the defaults of roles that you are a member of, at object creation time, new object permissions are only affected by the default privileges of the current role, and are not inherited from any roles in which the current role is a member.

As explained in Section 5.8, the default privileges for any object type normally grant all grantable permissions to the object owner, and may grant some privileges to PUBLIC as well. However, this behavior can be changed by altering the global default privileges with ALTER DEFAULT PRIVILEGES.

Currently, only the privileges for schemas, tables (including views and foreign tables), sequences, functions, types (including domains), and large objects can be altered. For this command, functions include aggregates and procedures. The words FUNCTIONS and ROUTINES are equivalent in this command. (ROUTINES is preferred going forward as the standard term for functions and procedures taken together. In earlier PostgreSQL releases, only the word FUNCTIONS was allowed. It is not possible to set default privileges for functions and procedures separately.)

Default privileges that are specified per-schema are added to whatever the global default privileges are for the particular object type. This means you cannot revoke privileges per-schema if they are granted globally (either by default, or according to a previous ALTER DEFAULT PRIVILEGES command that did not specify a schema). Per-schema REVOKE is only useful to reverse the effects of a previous per-schema GRANT.

Change default privileges for objects created by the target_role, or the current role if unspecified.

The name of an existing schema. If specified, the default privileges are altered for objects later created in that schema. If IN SCHEMA is omitted, the global default privileges are altered. IN SCHEMA is not allowed when setting privileges for schemas and large objects, since schemas can't be nested and large objects don't belong to a schema.

The name of an existing role to grant or revoke privileges for. This parameter, and all the other parameters in abbreviated_grant_or_revoke, act as described under GRANT or REVOKE, except that one is setting permissions for a whole class of objects rather than specific named objects.

Use psql's \ddp command to obtain information about existing assignments of default privileges. The meaning of the privilege display is the same as explained for \dp in Section 5.8.

If you wish to drop a role for which the default privileges have been altered, it is necessary to reverse the changes in its default privileges or use DROP OWNED BY to get rid of the default privileges entry for the role.

Grant SELECT privilege to everyone for all tables (and views) you subsequently create in schema myschema, and allow role webuser to INSERT into them too:

Undo the above, so that subsequently-created tables won't have any more permissions than normal:

Remove the public EXECUTE permission that is normally granted on functions, for all functions subsequently created by role admin:

Note however that you cannot accomplish that effect with a command limited to a single schema. This command has no effect, unless it is undoing a matching GRANT:

That's because per-schema default privileges can only add privileges to the global setting, not remove privileges granted by it.

There is no ALTER DEFAULT PRIVILEGES statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
target_role
```

Example 2 (unknown):
```unknown
schema_name
```

Example 3 (unknown):
```unknown
abbreviated_grant_or_revoke
```

Example 4 (unknown):
```unknown
abbreviated_grant_or_revoke
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-createeventtrigger.html

**Contents:**
- CREATE EVENT TRIGGER
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

CREATE EVENT TRIGGER — define a new event trigger

CREATE EVENT TRIGGER creates a new event trigger. Whenever the designated event occurs and the WHEN condition associated with the trigger, if any, is satisfied, the trigger function will be executed. For a general introduction to event triggers, see Chapter 38. The user who creates an event trigger becomes its owner.

The name to give the new trigger. This name must be unique within the database.

The name of the event that triggers a call to the given function. See Section 38.1 for more information on event names.

The name of a variable used to filter events. This makes it possible to restrict the firing of the trigger to a subset of the cases in which it is supported. Currently the only supported filter_variable is TAG.

A list of values for the associated filter_variable for which the trigger should fire. For TAG, this means a list of command tags (e.g., 'DROP FUNCTION').

A user-supplied function that is declared as taking no argument and returning type event_trigger.

In the syntax of CREATE EVENT TRIGGER, the keywords FUNCTION and PROCEDURE are equivalent, but the referenced function must in any case be a function, not a procedure. The use of the keyword PROCEDURE here is historical and deprecated.

Only superusers can create event triggers.

Event triggers are disabled in single-user mode (see postgres) as well as when event_triggers is set to false. If an erroneous event trigger disables the database so much that you can't even drop the trigger, restart with event_triggers set to false to temporarily disable event triggers, or in single-user mode, and you'll be able to do that.

Forbid the execution of any DDL command:

There is no CREATE EVENT TRIGGER statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
filter_variable
```

Example 2 (unknown):
```unknown
filter_value
```

Example 3 (unknown):
```unknown
function_name
```

Example 4 (unknown):
```unknown
CREATE EVENT TRIGGER
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropcast.html

**Contents:**
- DROP CAST
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP CAST — remove a cast

DROP CAST removes a previously defined cast.

To be able to drop a cast, you must own the source or the target data type. These are the same privileges that are required to create a cast.

Do not throw an error if the cast does not exist. A notice is issued in this case.

The name of the source data type of the cast.

The name of the target data type of the cast.

These key words do not have any effect, since there are no dependencies on casts.

To drop the cast from type text to type int:

The DROP CAST command conforms to the SQL standard.

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
source_type
```

Example 4 (unknown):
```unknown
target_type
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-deallocate.html

**Contents:**
- DEALLOCATE
- Synopsis
- Description
- Parameters
- Compatibility
- See Also

DEALLOCATE — deallocate a prepared statement

DEALLOCATE is used to deallocate a previously prepared SQL statement. If you do not explicitly deallocate a prepared statement, it is deallocated when the session ends.

For more information on prepared statements, see PREPARE.

This key word is ignored.

The name of the prepared statement to deallocate.

Deallocate all prepared statements.

The SQL standard includes a DEALLOCATE statement, but it is only for use in embedded SQL.

---


---

