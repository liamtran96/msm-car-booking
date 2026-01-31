# PostgreSQL - Sql Commands (Part 28)

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterdomain.html

**Contents:**
- ALTER DOMAIN
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

ALTER DOMAIN — change the definition of a domain

ALTER DOMAIN changes the definition of an existing domain. There are several sub-forms:

These forms set or remove the default value for a domain. Note that defaults only apply to subsequent INSERT commands; they do not affect rows already in a table using the domain.

These forms change whether a domain is marked to allow NULL values or to reject NULL values. You can only SET NOT NULL when the columns using the domain contain no null values.

This form adds a new constraint to a domain. When a new constraint is added to a domain, all columns using that domain will be checked against the newly added constraint. These checks can be suppressed by adding the new constraint using the NOT VALID option; the constraint can later be made valid using ALTER DOMAIN ... VALIDATE CONSTRAINT. Newly inserted or updated rows are always checked against all constraints, even those marked NOT VALID. NOT VALID is only accepted for CHECK constraints.

This form drops constraints on a domain. If IF EXISTS is specified and the constraint does not exist, no error is thrown. In this case a notice is issued instead.

This form changes the name of a constraint on a domain.

This form validates a constraint previously added as NOT VALID, that is, it verifies that all values in table columns of the domain type satisfy the specified constraint.

This form changes the owner of the domain to the specified user.

This form changes the name of the domain.

This form changes the schema of the domain. Any constraints associated with the domain are moved into the new schema as well.

You must own the domain to use ALTER DOMAIN. To change the schema of a domain, you must also have CREATE privilege on the new schema. To alter the owner, you must be able to SET ROLE to the new owning role, and that role must have CREATE privilege on the domain's schema. (These restrictions enforce that altering the owner doesn't do anything you couldn't do by dropping and recreating the domain. However, a superuser can alter ownership of any domain anyway.)

The name (possibly schema-qualified) of an existing domain to alter.

New domain constraint for the domain.

Name of an existing constraint to drop or rename.

Do not verify existing stored data for constraint validity.

Automatically drop objects that depend on the constraint, and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the constraint if there are any dependent objects. This is the default behavior.

The new name for the domain.

The new name for the constraint.

The user name of the new owner of the domain.

The new schema for the domain.

Although ALTER DOMAIN ADD CONSTRAINT attempts to verify that existing stored data satisfies the new constraint, this check is not bulletproof, because the command cannot “see” table rows that are newly inserted or updated and not yet committed. If there is a hazard that concurrent operations might insert bad data, the way to proceed is to add the constraint using the NOT VALID option, commit that command, wait until all transactions started before that commit have finished, and then issue ALTER DOMAIN VALIDATE CONSTRAINT to search for data violating the constraint. This method is reliable because once the constraint is committed, all new transactions are guaranteed to enforce it against new values of the domain type.

Currently, ALTER DOMAIN ADD CONSTRAINT, ALTER DOMAIN VALIDATE CONSTRAINT, and ALTER DOMAIN SET NOT NULL will fail if the named domain or any derived domain is used within a container-type column (a composite, array, or range column) in any table in the database. They should eventually be improved to be able to verify the new constraint for such nested values.

To add a NOT NULL constraint to a domain:

To remove a NOT NULL constraint from a domain:

To add a check constraint to a domain:

To remove a check constraint from a domain:

To rename a check constraint on a domain:

To move the domain into a different schema:

ALTER DOMAIN conforms to the SQL standard, except for the OWNER, RENAME, SET SCHEMA, and VALIDATE CONSTRAINT variants, which are PostgreSQL extensions. The NOT VALID clause of the ADD CONSTRAINT variant is also a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
domain_constraint
```

Example 2 (unknown):
```unknown
constraint_name
```

Example 3 (unknown):
```unknown
constraint_name
```

Example 4 (unknown):
```unknown
new_constraint_name
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropaggregate.html

**Contents:**
- DROP AGGREGATE
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

DROP AGGREGATE — remove an aggregate function

DROP AGGREGATE removes an existing aggregate function. To execute this command the current user must be the owner of the aggregate function.

Do not throw an error if the aggregate does not exist. A notice is issued in this case.

The name (optionally schema-qualified) of an existing aggregate function.

The mode of an argument: IN or VARIADIC. If omitted, the default is IN.

The name of an argument. Note that DROP AGGREGATE does not actually pay any attention to argument names, since only the argument data types are needed to determine the aggregate function's identity.

An input data type on which the aggregate function operates. To reference a zero-argument aggregate function, write * in place of the list of argument specifications. To reference an ordered-set aggregate function, write ORDER BY between the direct and aggregated argument specifications.

Automatically drop objects that depend on the aggregate function (such as views using it), and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the aggregate function if any objects depend on it. This is the default.

Alternative syntaxes for referencing ordered-set aggregates are described under ALTER AGGREGATE.

To remove the aggregate function myavg for type integer:

To remove the hypothetical-set aggregate function myrank, which takes an arbitrary list of ordering columns and a matching list of direct arguments:

To remove multiple aggregate functions in one command:

There is no DROP AGGREGATE statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
aggregate_signature
```

Example 2 (unknown):
```unknown
aggregate_signature
```

Example 3 (unknown):
```unknown
DROP AGGREGATE
```

Example 4 (unknown):
```unknown
DROP AGGREGATE
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterconversion.html

**Contents:**
- ALTER CONVERSION
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

ALTER CONVERSION — change the definition of a conversion

ALTER CONVERSION changes the definition of a conversion.

You must own the conversion to use ALTER CONVERSION. To alter the owner, you must be able to SET ROLE to the new owning role, and that role must have CREATE privilege on the conversion's schema. (These restrictions enforce that altering the owner doesn't do anything you couldn't do by dropping and recreating the conversion. However, a superuser can alter ownership of any conversion anyway.)

The name (optionally schema-qualified) of an existing conversion.

The new name of the conversion.

The new owner of the conversion.

The new schema for the conversion.

To rename the conversion iso_8859_1_to_utf8 to latin1_to_unicode:

To change the owner of the conversion iso_8859_1_to_utf8 to joe:

There is no ALTER CONVERSION statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
ALTER CONVERSION
```

Example 2 (unknown):
```unknown
ALTER CONVERSION
```

Example 3 (unknown):
```unknown
iso_8859_1_to_utf8
```

Example 4 (unknown):
```unknown
latin1_to_unicode
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-move.html

**Contents:**
- MOVE
- Synopsis
- Description
- Outputs
- Examples
- Compatibility
- See Also

MOVE — position a cursor

MOVE repositions a cursor without retrieving any data. MOVE works exactly like the FETCH command, except it only positions the cursor and does not return rows.

The parameters for the MOVE command are identical to those of the FETCH command; refer to FETCH for details on syntax and usage.

On successful completion, a MOVE command returns a command tag of the form

The count is the number of rows that a FETCH command with the same parameters would have returned (possibly zero).

There is no MOVE statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
cursor_name
```

Example 2 (sql):
```sql
BEGIN WORK;
DECLARE liahona CURSOR FOR SELECT * FROM films;

-- Skip the first 5 rows:
MOVE FORWARD 5 IN liahona;
MOVE 5

-- Fetch the 6th row from the cursor liahona:
FETCH 1 FROM liahona;
 code  | title  | did | date_prod  |  kind  |  len
-------+--------+-----+------------+--------+-------
 P_303 | 48 Hrs | 103 | 1982-10-22 | Action | 01:37
(1 row)

-- Close the cursor liahona and end the transaction:
CLOSE liahona;
COMMIT WORK;
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-droptrigger.html

**Contents:**
- DROP TRIGGER
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP TRIGGER — remove a trigger

DROP TRIGGER removes an existing trigger definition. To execute this command, the current user must be the owner of the table for which the trigger is defined.

Do not throw an error if the trigger does not exist. A notice is issued in this case.

The name of the trigger to remove.

The name (optionally schema-qualified) of the table for which the trigger is defined.

Automatically drop objects that depend on the trigger, and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the trigger if any objects depend on it. This is the default.

Destroy the trigger if_dist_exists on the table films:

The DROP TRIGGER statement in PostgreSQL is incompatible with the SQL standard. In the SQL standard, trigger names are not local to tables, so the command is simply DROP TRIGGER name.

**Examples:**

Example 1 (unknown):
```unknown
DROP TRIGGER
```

Example 2 (unknown):
```unknown
if_dist_exists
```

Example 3 (unknown):
```unknown
DROP TRIGGER if_dist_exists ON films;
```

Example 4 (unknown):
```unknown
DROP TRIGGER
```

---


---

