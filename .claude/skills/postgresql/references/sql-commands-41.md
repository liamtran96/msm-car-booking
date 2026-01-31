# PostgreSQL - Sql Commands (Part 41)

## 


**URL:** https://www.postgresql.org/docs/18/sql-do.html

**Contents:**
- DO
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

DO — execute an anonymous code block

DO executes an anonymous code block, or in other words a transient anonymous function in a procedural language.

The code block is treated as though it were the body of a function with no parameters, returning void. It is parsed and executed a single time.

The optional LANGUAGE clause can be written either before or after the code block.

The procedural language code to be executed. This must be specified as a string literal, just as in CREATE FUNCTION. Use of a dollar-quoted literal is recommended.

The name of the procedural language the code is written in. If omitted, the default is plpgsql.

The procedural language to be used must already have been installed into the current database by means of CREATE EXTENSION. plpgsql is installed by default, but other languages are not.

The user must have USAGE privilege for the procedural language, or must be a superuser if the language is untrusted. This is the same privilege requirement as for creating a function in the language.

If DO is executed in a transaction block, then the procedure code cannot execute transaction control statements. Transaction control statements are only allowed if DO is executed in its own transaction.

Grant all privileges on all views in schema public to role webuser:

There is no DO statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
CREATE FUNCTION
```

Example 2 (unknown):
```unknown
CREATE EXTENSION
```

Example 3 (sql):
```sql
DO $$DECLARE r record;
BEGIN
    FOR r IN SELECT table_schema, table_name FROM information_schema.tables
             WHERE table_type = 'VIEW' AND table_schema = 'public'
    LOOP
        EXECUTE 'GRANT ALL ON ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || ' TO webuser';
    END LOOP;
END$$;
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-droppolicy.html

**Contents:**
- DROP POLICY
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP POLICY — remove a row-level security policy from a table

DROP POLICY removes the specified policy from the table. Note that if the last policy is removed for a table and the table still has row-level security enabled via ALTER TABLE, then the default-deny policy will be used. ALTER TABLE ... DISABLE ROW LEVEL SECURITY can be used to disable row-level security for a table, whether policies for the table exist or not.

Do not throw an error if the policy does not exist. A notice is issued in this case.

The name of the policy to drop.

The name (optionally schema-qualified) of the table that the policy is on.

These key words do not have any effect, since there are no dependencies on policies.

To drop the policy called p1 on the table named my_table:

DROP POLICY is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
DROP POLICY
```

Example 2 (unknown):
```unknown
ALTER TABLE
```

Example 3 (unknown):
```unknown
ALTER TABLE ... DISABLE ROW LEVEL SECURITY
```

Example 4 (unknown):
```unknown
DROP POLICY p1 ON my_table;
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-createpolicy.html

**Contents:**
- CREATE POLICY
- Synopsis
- Description
- Parameters
  - Per-Command Policies
  - Application of Multiple Policies
- Notes
- Compatibility
- See Also

CREATE POLICY — define a new row-level security policy for a table

The CREATE POLICY command defines a new row-level security policy for a table. Note that row-level security must be enabled on the table (using ALTER TABLE ... ENABLE ROW LEVEL SECURITY) in order for created policies to be applied.

A policy grants the permission to select, insert, update, or delete rows that match the relevant policy expression. Existing table rows are checked against the expression specified in USING, while new rows that would be created via INSERT or UPDATE are checked against the expression specified in WITH CHECK. When a USING expression returns true for a given row then that row is visible to the user, while if false or null is returned then the row is not visible. When a WITH CHECK expression returns true for a row then that row is inserted or updated, while if false or null is returned then an error occurs.

For INSERT, UPDATE, and MERGE statements, WITH CHECK expressions are enforced after BEFORE triggers are fired, and before any actual data modifications are made. Thus a BEFORE ROW trigger may modify the data to be inserted, affecting the result of the security policy check. WITH CHECK expressions are enforced before any other constraints.

Policy names are per-table. Therefore, one policy name can be used for many different tables and have a definition for each table which is appropriate to that table.

Policies can be applied for specific commands or for specific roles. The default for newly created policies is that they apply for all commands and roles, unless otherwise specified. Multiple policies may apply to a single command; see below for more details. Table 300 summarizes how the different types of policy apply to specific commands.

For policies that can have both USING and WITH CHECK expressions (ALL and UPDATE), if no WITH CHECK expression is defined, then the USING expression will be used both to determine which rows are visible (normal USING case) and which new rows will be allowed to be added (WITH CHECK case).

If row-level security is enabled for a table, but no applicable policies exist, a “default deny” policy is assumed, so that no rows will be visible or updatable.

The name of the policy to be created. This must be distinct from the name of any other policy for the table.

The name (optionally schema-qualified) of the table the policy applies to.

Specify that the policy is to be created as a permissive policy. All permissive policies which are applicable to a given query will be combined together using the Boolean “OR” operator. By creating permissive policies, administrators can add to the set of records which can be accessed. Policies are permissive by default.

Specify that the policy is to be created as a restrictive policy. All restrictive policies which are applicable to a given query will be combined together using the Boolean “AND” operator. By creating restrictive policies, administrators can reduce the set of records which can be accessed as all restrictive policies must be passed for each record.

Note that there needs to be at least one permissive policy to grant access to records before restrictive policies can be usefully used to reduce that access. If only restrictive policies exist, then no records will be accessible. When a mix of permissive and restrictive policies are present, a record is only accessible if at least one of the permissive policies passes, in addition to all the restrictive policies.

The command to which the policy applies. Valid options are ALL, SELECT, INSERT, UPDATE, and DELETE. ALL is the default. See below for specifics regarding how these are applied.

The role(s) to which the policy is to be applied. The default is PUBLIC, which will apply the policy to all roles.

Any SQL conditional expression (returning boolean). The conditional expression cannot contain any aggregate or window functions. This expression will be added to queries that refer to the table if row-level security is enabled. Rows for which the expression returns true will be visible. Any rows for which the expression returns false or null will not be visible to the user (in a SELECT), and will not be available for modification (in an UPDATE or DELETE). Such rows are silently suppressed; no error is reported.

Any SQL conditional expression (returning boolean). The conditional expression cannot contain any aggregate or window functions. This expression will be used in INSERT and UPDATE queries against the table if row-level security is enabled. Only rows for which the expression evaluates to true will be allowed. An error will be thrown if the expression evaluates to false or null for any of the records inserted or any of the records that result from the update. Note that the check_expression is evaluated against the proposed new contents of the row, not the original contents.

Using ALL for a policy means that it will apply to all commands, regardless of the type of command. If an ALL policy exists and more specific policies exist, then both the ALL policy and the more specific policy (or policies) will be applied. Additionally, ALL policies will be applied to both the selection side of a query and the modification side, using the USING expression for both cases if only a USING expression has been defined.

As an example, if an UPDATE is issued, then the ALL policy will be applicable both to what the UPDATE will be able to select as rows to be updated (applying the USING expression), and to the resulting updated rows, to check if they are permitted to be added to the table (applying the WITH CHECK expression, if defined, and the USING expression otherwise). If an INSERT or UPDATE command attempts to add rows to the table that do not pass the ALL policy's WITH CHECK expression, the entire command will be aborted.

Using SELECT for a policy means that it will apply to SELECT queries and whenever SELECT permissions are required on the relation the policy is defined for. The result is that only those records from the relation that pass the SELECT policy will be returned during a SELECT query, and that queries that require SELECT permissions, such as UPDATE, will also only see those records that are allowed by the SELECT policy. A SELECT policy cannot have a WITH CHECK expression, as it only applies in cases where records are being retrieved from the relation.

Using INSERT for a policy means that it will apply to INSERT commands and MERGE commands that contain INSERT actions. Rows being inserted that do not pass this policy will result in a policy violation error, and the entire INSERT command will be aborted. An INSERT policy cannot have a USING expression, as it only applies in cases where records are being added to the relation.

Note that INSERT with ON CONFLICT DO UPDATE checks INSERT policies' WITH CHECK expressions only for rows appended to the relation by the INSERT path.

Using UPDATE for a policy means that it will apply to UPDATE, SELECT FOR UPDATE and SELECT FOR SHARE commands, as well as auxiliary ON CONFLICT DO UPDATE clauses of INSERT commands. MERGE commands containing UPDATE actions are affected as well. Since UPDATE involves pulling an existing record and replacing it with a new modified record, UPDATE policies accept both a USING expression and a WITH CHECK expression. The USING expression determines which records the UPDATE command will see to operate against, while the WITH CHECK expression defines which modified rows are allowed to be stored back into the relation.

Any rows whose updated values do not pass the WITH CHECK expression will cause an error, and the entire command will be aborted. If only a USING clause is specified, then that clause will be used for both USING and WITH CHECK cases.

Typically an UPDATE command also needs to read data from columns in the relation being updated (e.g., in a WHERE clause or a RETURNING clause, or in an expression on the right hand side of the SET clause). In this case, SELECT rights are also required on the relation being updated, and the appropriate SELECT or ALL policies will be applied in addition to the UPDATE policies. Thus the user must have access to the row(s) being updated through a SELECT or ALL policy in addition to being granted permission to update the row(s) via an UPDATE or ALL policy.

When an INSERT command has an auxiliary ON CONFLICT DO UPDATE clause, if the UPDATE path is taken, the row to be updated is first checked against the USING expressions of any UPDATE policies, and then the new updated row is checked against the WITH CHECK expressions. Note, however, that unlike a standalone UPDATE command, if the existing row does not pass the USING expressions, an error will be thrown (the UPDATE path will never be silently avoided).

Using DELETE for a policy means that it will apply to DELETE commands. Only rows that pass this policy will be seen by a DELETE command. There can be rows that are visible through a SELECT that are not available for deletion, if they do not pass the USING expression for the DELETE policy.

In most cases a DELETE command also needs to read data from columns in the relation that it is deleting from (e.g., in a WHERE clause or a RETURNING clause). In this case, SELECT rights are also required on the relation, and the appropriate SELECT or ALL policies will be applied in addition to the DELETE policies. Thus the user must have access to the row(s) being deleted through a SELECT or ALL policy in addition to being granted permission to delete the row(s) via a DELETE or ALL policy.

A DELETE policy cannot have a WITH CHECK expression, as it only applies in cases where records are being deleted from the relation, so that there is no new row to check.

Table 300. Policies Applied by Command Type

[a] If read access is required to the existing or new row (for example, a WHERE or RETURNING clause that refers to columns from the relation).

When multiple policies of different command types apply to the same command (for example, SELECT and UPDATE policies applied to an UPDATE command), then the user must have both types of permissions (for example, permission to select rows from the relation as well as permission to update them). Thus the expressions for one type of policy are combined with the expressions for the other type of policy using the AND operator.

When multiple policies of the same command type apply to the same command, then there must be at least one PERMISSIVE policy granting access to the relation, and all of the RESTRICTIVE policies must pass. Thus all the PERMISSIVE policy expressions are combined using OR, all the RESTRICTIVE policy expressions are combined using AND, and the results are combined using AND. If there are no PERMISSIVE policies, then access is denied.

Note that, for the purposes of combining multiple policies, ALL policies are treated as having the same type as whichever other type of policy is being applied.

For example, in an UPDATE command requiring both SELECT and UPDATE permissions, if there are multiple applicable policies of each type, they will be combined as follows:

You must be the owner of a table to create or change policies for it.

While policies will be applied for explicit queries against tables in the database, they are not applied when the system is performing internal referential integrity checks or validating constraints. This means there are indirect ways to determine that a given value exists. An example of this is attempting to insert a duplicate value into a column that is a primary key or has a unique constraint. If the insert fails then the user can infer that the value already exists. (This example assumes that the user is permitted by policy to insert records which they are not allowed to see.) Another example is where a user is allowed to insert into a table which references another, otherwise hidden table. Existence can be determined by the user inserting values into the referencing table, where success would indicate that the value exists in the referenced table. These issues can be addressed by carefully crafting policies to prevent users from being able to insert, delete, or update records at all which might possibly indicate a value they are not otherwise able to see, or by using generated values (e.g., surrogate keys) instead of keys with external meanings.

Generally, the system will enforce filter conditions imposed using security policies prior to qualifications that appear in user queries, in order to prevent inadvertent exposure of the protected data to user-defined functions which might not be trustworthy. However, functions and operators marked by the system (or the system administrator) as LEAKPROOF may be evaluated before policy expressions, as they are assumed to be trustworthy.

Since policy expressions are added to the user's query directly, they will be run with the rights of the user running the overall query. Therefore, users who are using a given policy must be able to access any tables or functions referenced in the expression or they will simply receive a permission denied error when attempting to query the table that has row-level security enabled. This does not change how views work, however. As with normal queries and views, permission checks and policies for the tables which are referenced by a view will use the view owner's rights and any policies which apply to the view owner, except if the view is defined using the security_invoker option (see CREATE VIEW).

No separate policy exists for MERGE. Instead, the policies defined for SELECT, INSERT, UPDATE, and DELETE are applied while executing MERGE, depending on the actions that are performed.

Additional discussion and practical examples can be found in Section 5.9.

CREATE POLICY is a PostgreSQL extension.

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
CREATE POLICY
```

Example 4 (unknown):
```unknown
ALTER TABLE ... ENABLE ROW LEVEL SECURITY
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropopclass.html

**Contents:**
- DROP OPERATOR CLASS
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

DROP OPERATOR CLASS — remove an operator class

DROP OPERATOR CLASS drops an existing operator class. To execute this command you must be the owner of the operator class.

DROP OPERATOR CLASS does not drop any of the operators or functions referenced by the class. If there are any indexes depending on the operator class, you will need to specify CASCADE for the drop to complete.

Do not throw an error if the operator class does not exist. A notice is issued in this case.

The name (optionally schema-qualified) of an existing operator class.

The name of the index access method the operator class is for.

Automatically drop objects that depend on the operator class (such as indexes), and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the operator class if any objects depend on it. This is the default.

DROP OPERATOR CLASS will not drop the operator family containing the class, even if there is nothing else left in the family (in particular, in the case where the family was implicitly created by CREATE OPERATOR CLASS). An empty operator family is harmless, but for the sake of tidiness you might wish to remove the family with DROP OPERATOR FAMILY; or perhaps better, use DROP OPERATOR FAMILY in the first place.

Remove the B-tree operator class widget_ops:

This command will not succeed if there are any existing indexes that use the operator class. Add CASCADE to drop such indexes along with the operator class.

There is no DROP OPERATOR CLASS statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
index_method
```

Example 2 (unknown):
```unknown
DROP OPERATOR CLASS
```

Example 3 (unknown):
```unknown
DROP OPERATOR CLASS
```

Example 4 (unknown):
```unknown
index_method
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-altertsconfig.html

**Contents:**
- ALTER TEXT SEARCH CONFIGURATION
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

ALTER TEXT SEARCH CONFIGURATION — change the definition of a text search configuration

ALTER TEXT SEARCH CONFIGURATION changes the definition of a text search configuration. You can modify its mappings from token types to dictionaries, or change the configuration's name or owner.

You must be the owner of the configuration to use ALTER TEXT SEARCH CONFIGURATION.

The name (optionally schema-qualified) of an existing text search configuration.

The name of a token type that is emitted by the configuration's parser.

The name of a text search dictionary to be consulted for the specified token type(s). If multiple dictionaries are listed, they are consulted in the specified order.

The name of a text search dictionary to be replaced in the mapping.

The name of a text search dictionary to be substituted for old_dictionary.

The new name of the text search configuration.

The new owner of the text search configuration.

The new schema for the text search configuration.

The ADD MAPPING FOR form installs a list of dictionaries to be consulted for the specified token type(s); it is an error if there is already a mapping for any of the token types. The ALTER MAPPING FOR form does the same, but first removing any existing mapping for those token types. The ALTER MAPPING REPLACE forms substitute new_dictionary for old_dictionary anywhere the latter appears. This is done for only the specified token types when FOR appears, or for all mappings of the configuration when it doesn't. The DROP MAPPING form removes all dictionaries for the specified token type(s), causing tokens of those types to be ignored by the text search configuration. It is an error if there is no mapping for the token types, unless IF EXISTS appears.

The following example replaces the english dictionary with the swedish dictionary anywhere that english is used within my_config.

There is no ALTER TEXT SEARCH CONFIGURATION statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
dictionary_name
```

Example 2 (unknown):
```unknown
dictionary_name
```

Example 3 (unknown):
```unknown
old_dictionary
```

Example 4 (unknown):
```unknown
new_dictionary
```

---


---

