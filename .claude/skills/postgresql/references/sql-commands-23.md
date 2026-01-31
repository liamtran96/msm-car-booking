# PostgreSQL - Sql Commands (Part 23)

## 


**URL:** https://www.postgresql.org/docs/18/sql-createrule.html

**Contents:**
- CREATE RULE
- Synopsis
- Description
  - Note
- Parameters
- Notes
- Compatibility
- See Also

CREATE RULE — define a new rewrite rule

CREATE RULE defines a new rule applying to a specified table or view. CREATE OR REPLACE RULE will either create a new rule, or replace an existing rule of the same name for the same table.

The PostgreSQL rule system allows one to define an alternative action to be performed on insertions, updates, or deletions in database tables. Roughly speaking, a rule causes additional commands to be executed when a given command on a given table is executed. Alternatively, an INSTEAD rule can replace a given command by another, or cause a command not to be executed at all. Rules are used to implement SQL views as well. It is important to realize that a rule is really a command transformation mechanism, or command macro. The transformation happens before the execution of the command starts. If you actually want an operation that fires independently for each physical row, you probably want to use a trigger, not a rule. More information about the rules system is in Chapter 39.

Presently, ON SELECT rules can only be attached to views. Such a rule must be named "_RETURN", must be an unconditional INSTEAD rule, and must have an action that consists of a single SELECT command. This command defines the visible contents of the view. (The view itself is basically a dummy table with no storage.) It's best to regard such a rule as an implementation detail. While a view can be redefined via CREATE OR REPLACE RULE "_RETURN" AS ..., it's better style to use CREATE OR REPLACE VIEW.

You can create the illusion of an updatable view by defining ON INSERT, ON UPDATE, and ON DELETE rules (or any subset of those that's sufficient for your purposes) to replace update actions on the view with appropriate updates on other tables. If you want to support INSERT RETURNING and so on, then be sure to put a suitable RETURNING clause into each of these rules.

There is a catch if you try to use conditional rules for complex view updates: there must be an unconditional INSTEAD rule for each action you wish to allow on the view. If the rule is conditional, or is not INSTEAD, then the system will still reject attempts to perform the update action, because it thinks it might end up trying to perform the action on the dummy table of the view in some cases. If you want to handle all the useful cases in conditional rules, add an unconditional DO INSTEAD NOTHING rule to ensure that the system understands it will never be called on to update the dummy table. Then make the conditional rules non-INSTEAD; in the cases where they are applied, they add to the default INSTEAD NOTHING action. (This method does not currently work to support RETURNING queries, however.)

A view that is simple enough to be automatically updatable (see CREATE VIEW) does not require a user-created rule in order to be updatable. While you can create an explicit rule anyway, the automatic update transformation will generally outperform an explicit rule.

Another alternative worth considering is to use INSTEAD OF triggers (see CREATE TRIGGER) in place of rules.

The name of a rule to create. This must be distinct from the name of any other rule for the same table. Multiple rules on the same table and same event type are applied in alphabetical name order.

The event is one of SELECT, INSERT, UPDATE, or DELETE. Note that an INSERT containing an ON CONFLICT clause cannot be used on tables that have either INSERT or UPDATE rules. Consider using an updatable view instead.

The name (optionally schema-qualified) of the table or view the rule applies to.

Any SQL conditional expression (returning boolean). The condition expression cannot refer to any tables except NEW and OLD, and cannot contain aggregate functions.

INSTEAD indicates that the commands should be executed instead of the original command.

ALSO indicates that the commands should be executed in addition to the original command.

If neither ALSO nor INSTEAD is specified, ALSO is the default.

The command or commands that make up the rule action. Valid commands are SELECT, INSERT, UPDATE, DELETE, or NOTIFY.

Within condition and command, the special table names NEW and OLD can be used to refer to values in the referenced table. NEW is valid in ON INSERT and ON UPDATE rules to refer to the new row being inserted or updated. OLD is valid in ON UPDATE and ON DELETE rules to refer to the existing row being updated or deleted.

You must be the owner of a table to create or change rules for it.

In a rule for INSERT, UPDATE, or DELETE on a view, you can add a RETURNING clause that emits the view's columns. This clause will be used to compute the outputs if the rule is triggered by an INSERT RETURNING, UPDATE RETURNING, or DELETE RETURNING command respectively. When the rule is triggered by a command without RETURNING, the rule's RETURNING clause will be ignored. The current implementation allows only unconditional INSTEAD rules to contain RETURNING; furthermore there can be at most one RETURNING clause among all the rules for the same event. (This ensures that there is only one candidate RETURNING clause to be used to compute the results.) RETURNING queries on the view will be rejected if there is no RETURNING clause in any available rule.

It is very important to take care to avoid circular rules. For example, though each of the following two rule definitions are accepted by PostgreSQL, the SELECT command would cause PostgreSQL to report an error because of recursive expansion of a rule:

Presently, if a rule action contains a NOTIFY command, the NOTIFY command will be executed unconditionally, that is, the NOTIFY will be issued even if there are not any rows that the rule should apply to. For example, in:

one NOTIFY event will be sent during the UPDATE, whether or not there are any rows that match the condition id = 42. This is an implementation restriction that might be fixed in future releases.

CREATE RULE is a PostgreSQL language extension, as is the entire query rewrite system.

**Examples:**

Example 1 (unknown):
```unknown
CREATE RULE
```

Example 2 (unknown):
```unknown
CREATE OR REPLACE RULE
```

Example 3 (unknown):
```unknown
CREATE OR REPLACE RULE "_RETURN" AS ...
```

Example 4 (unknown):
```unknown
CREATE OR REPLACE VIEW
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterpublication.html

**Contents:**
- ALTER PUBLICATION
- Synopsis
- Description
- Parameters
  - Caution
- Examples
- Compatibility
- See Also

ALTER PUBLICATION — change the definition of a publication

The command ALTER PUBLICATION can change the attributes of a publication.

The first three variants change which tables/schemas are part of the publication. The SET clause will replace the list of tables/schemas in the publication with the specified list; the existing tables/schemas that were present in the publication will be removed. The ADD and DROP clauses will add and remove one or more tables/schemas from the publication. Note that adding tables/schemas to a publication that is already subscribed to will require an ALTER SUBSCRIPTION ... REFRESH PUBLICATION action on the subscribing side in order to become effective. Note also that DROP TABLES IN SCHEMA will not drop any schema tables that were specified using FOR TABLE/ ADD TABLE, and the combination of DROP with a WHERE clause is not allowed.

The fourth variant of this command listed in the synopsis can change all of the publication properties specified in CREATE PUBLICATION. Properties not mentioned in the command retain their previous settings.

The remaining variants change the owner and the name of the publication.

You must own the publication to use ALTER PUBLICATION. Adding a table to a publication additionally requires owning that table. The ADD TABLES IN SCHEMA and SET TABLES IN SCHEMA to a publication requires the invoking user to be a superuser. To alter the owner, you must be able to SET ROLE to the new owning role, and that role must have CREATE privilege on the database. Also, the new owner of a FOR ALL TABLES or FOR TABLES IN SCHEMA publication must be a superuser. However, a superuser can change the ownership of a publication regardless of these restrictions.

Adding/Setting any schema when the publication also publishes a table with a column list, and vice versa is not supported.

The name of an existing publication whose definition is to be altered.

Name of an existing table. If ONLY is specified before the table name, only that table is affected. If ONLY is not specified, the table and all its descendant tables (if any) are affected. Optionally, * can be specified after the table name to explicitly indicate that descendant tables are included.

Optionally, a column list can be specified. See CREATE PUBLICATION for details. Note that a subscription having several publications in which the same table has been published with different column lists is not supported. See Warning: Combining Column Lists from Multiple Publications for details of potential problems when altering column lists.

If the optional WHERE clause is specified, rows for which the expression evaluates to false or null will not be published. Note that parentheses are required around the expression. The expression is evaluated with the role used for the replication connection.

Name of an existing schema.

This clause alters publication parameters originally set by CREATE PUBLICATION. See there for more information.

Altering the publish_via_partition_root parameter can lead to data loss or duplication at the subscriber because it changes the identity and schema of the published tables. Note this happens only when a partition root table is specified as the replication target.

This problem can be avoided by refraining from modifying partition leaf tables after the ALTER PUBLICATION ... SET until the ALTER SUBSCRIPTION ... REFRESH PUBLICATION is executed and by only refreshing using the copy_data = off option.

The user name of the new owner of the publication.

The new name for the publication.

Change the publication to publish only deletes and updates:

Add some tables to the publication:

Change the set of columns published for a table:

Add schemas marketing and sales to the publication sales_publication:

Add tables users, departments and schema production to the publication production_publication:

ALTER PUBLICATION is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
publication_object
```

Example 2 (unknown):
```unknown
publication_object
```

Example 3 (unknown):
```unknown
publication_object
```

Example 4 (unknown):
```unknown
publication_parameter
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterforeigntable.html

**Contents:**
- ALTER FOREIGN TABLE
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

ALTER FOREIGN TABLE — change the definition of a foreign table

ALTER FOREIGN TABLE changes the definition of an existing foreign table. There are several subforms:

This form adds a new column to the foreign table, using the same syntax as CREATE FOREIGN TABLE. Unlike the case when adding a column to a regular table, nothing happens to the underlying storage: this action simply declares that some new column is now accessible through the foreign table.

This form drops a column from a foreign table. You will need to say CASCADE if anything outside the table depends on the column; for example, views. If IF EXISTS is specified and the column does not exist, no error is thrown. In this case a notice is issued instead.

This form changes the type of a column of a foreign table. Again, this has no effect on any underlying storage: this action simply changes the type that PostgreSQL believes the column to have.

These forms set or remove the default value for a column. Default values only apply in subsequent INSERT or UPDATE commands; they do not cause rows already in the table to change.

Mark a column as allowing, or not allowing, null values.

This form sets the per-column statistics-gathering target for subsequent ANALYZE operations. See the similar form of ALTER TABLE for more details.

This form sets or resets per-attribute options. See the similar form of ALTER TABLE for more details.

This form sets the storage mode for a column. See the similar form of ALTER TABLE for more details. Note that the storage mode has no effect unless the table's foreign-data wrapper chooses to pay attention to it.

This form adds a new constraint to a foreign table, using the same syntax as CREATE FOREIGN TABLE. Currently only CHECK and NOT NULL constraints are supported.

Unlike the case when adding a constraint to a regular table, nothing is done to verify the constraint is correct; rather, this action simply declares that some new condition should be assumed to hold for all rows in the foreign table. (See the discussion in CREATE FOREIGN TABLE.) If the constraint is marked NOT VALID (allowed only for the CHECK case), then it isn't assumed to hold, but is only recorded for possible future use.

This form marks as valid a constraint that was previously marked as NOT VALID. No action is taken to verify the constraint, but future queries will assume that it holds.

This form drops the specified constraint on a foreign table. If IF EXISTS is specified and the constraint does not exist, no error is thrown. In this case a notice is issued instead.

These forms configure the firing of trigger(s) belonging to the foreign table. See the similar form of ALTER TABLE for more details.

Backward compatibility syntax for removing the oid system column. As oid system columns cannot be added anymore, this never has an effect.

This form adds the target foreign table as a new child of the specified parent table. See the similar form of ALTER TABLE for more details.

This form removes the target foreign table from the list of children of the specified parent table.

This form changes the owner of the foreign table to the specified user.

Change options for the foreign table or one of its columns. ADD, SET, and DROP specify the action to be performed. ADD is assumed if no operation is explicitly specified. Duplicate option names are not allowed (although it's OK for a table option and a column option to have the same name). Option names and values are also validated using the foreign data wrapper library.

The RENAME forms change the name of a foreign table or the name of an individual column in a foreign table.

This form moves the foreign table into another schema.

All the actions except RENAME and SET SCHEMA can be combined into a list of multiple alterations to apply in parallel. For example, it is possible to add several columns and/or alter the type of several columns in a single command.

If the command is written as ALTER FOREIGN TABLE IF EXISTS ... and the foreign table does not exist, no error is thrown. A notice is issued in this case.

You must own the table to use ALTER FOREIGN TABLE. To change the schema of a foreign table, you must also have CREATE privilege on the new schema. To alter the owner, you must be able to SET ROLE to the new owning role, and that role must have CREATE privilege on the table's schema. (These restrictions enforce that altering the owner doesn't do anything you couldn't do by dropping and recreating the table. However, a superuser can alter ownership of any table anyway.) To add a column or alter a column type, you must also have USAGE privilege on the data type.

The name (possibly schema-qualified) of an existing foreign table to alter. If ONLY is specified before the table name, only that table is altered. If ONLY is not specified, the table and all its descendant tables (if any) are altered. Optionally, * can be specified after the table name to explicitly indicate that descendant tables are included.

Name of a new or existing column.

New name for an existing column.

New name for the table.

Data type of the new column, or new data type for an existing column.

New table constraint for the foreign table.

Name of an existing constraint to drop.

Automatically drop objects that depend on the dropped column or constraint (for example, views referencing the column), and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the column or constraint if there are any dependent objects. This is the default behavior.

Name of a single trigger to disable or enable.

Disable or enable all triggers belonging to the foreign table. (This requires superuser privilege if any of the triggers are internally generated triggers. The core system does not add such triggers to foreign tables, but add-on code could do so.)

Disable or enable all triggers belonging to the foreign table except for internally generated triggers.

A parent table to associate or de-associate with this foreign table.

The user name of the new owner of the table.

The name of the schema to which the table will be moved.

The key word COLUMN is noise and can be omitted.

Consistency with the foreign server is not checked when a column is added or removed with ADD COLUMN or DROP COLUMN, a NOT NULL or CHECK constraint is added, or a column type is changed with SET DATA TYPE. It is the user's responsibility to ensure that the table definition matches the remote side.

Refer to CREATE FOREIGN TABLE for a further description of valid parameters.

To mark a column as not-null:

To change options of a foreign table:

The forms ADD, DROP, and SET DATA TYPE conform with the SQL standard. The other forms are PostgreSQL extensions of the SQL standard. Also, the ability to specify more than one manipulation in a single ALTER FOREIGN TABLE command is an extension.

ALTER FOREIGN TABLE DROP COLUMN can be used to drop the only column of a foreign table, leaving a zero-column table. This is an extension of SQL, which disallows zero-column foreign tables.

**Examples:**

Example 1 (unknown):
```unknown
column_name
```

Example 2 (unknown):
```unknown
new_column_name
```

Example 3 (unknown):
```unknown
column_name
```

Example 4 (unknown):
```unknown
column_constraint
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterschema.html

**Contents:**
- ALTER SCHEMA
- Synopsis
- Description
- Parameters
- Compatibility
- See Also

ALTER SCHEMA — change the definition of a schema

ALTER SCHEMA changes the definition of a schema.

You must own the schema to use ALTER SCHEMA. To rename a schema you must also have the CREATE privilege for the database. To alter the owner, you must be able to SET ROLE to the new owning role, and that role must have the CREATE privilege for the database. (Note that superusers have all these privileges automatically.)

The name of an existing schema.

The new name of the schema. The new name cannot begin with pg_, as such names are reserved for system schemas.

The new owner of the schema.

There is no ALTER SCHEMA statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
ALTER SCHEMA
```

Example 2 (unknown):
```unknown
ALTER SCHEMA
```

Example 3 (unknown):
```unknown
ALTER SCHEMA
```

---


---

