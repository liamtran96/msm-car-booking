# PostgreSQL - Sql Commands (Part 2)

## 


**URL:** https://www.postgresql.org/docs/18/sql-createpublication.html

**Contents:**
- CREATE PUBLICATION
- Synopsis
- Description
- Parameters
  - Note
- Notes
- Examples
- Compatibility
- See Also

CREATE PUBLICATION — define a new publication

CREATE PUBLICATION adds a new publication into the current database. The publication name must be distinct from the name of any existing publication in the current database.

A publication is essentially a group of tables whose data changes are intended to be replicated through logical replication. See Section 29.1 for details about how publications fit into the logical replication setup.

The name of the new publication.

Specifies a list of tables to add to the publication. If ONLY is specified before the table name, only that table is added to the publication. If ONLY is not specified, the table and all its descendant tables (if any) are added. Optionally, * can be specified after the table name to explicitly indicate that descendant tables are included. This does not apply to a partitioned table, however. The partitions of a partitioned table are always implicitly considered part of the publication, so they are never explicitly added to the publication.

If the optional WHERE clause is specified, it defines a row filter expression. Rows for which the expression evaluates to false or null will not be published. Note that parentheses are required around the expression. It has no effect on TRUNCATE commands.

When a column list is specified, only the named columns are replicated. The column list can contain stored generated columns as well. If the column list is omitted, the publication will replicate all non-generated columns (including any added in the future) by default. Stored generated columns can also be replicated if publish_generated_columns is set to stored. Specifying a column list has no effect on TRUNCATE commands. See Section 29.5 for details about column lists.

Only persistent base tables and partitioned tables can be part of a publication. Temporary tables, unlogged tables, foreign tables, materialized views, and regular views cannot be part of a publication.

Specifying a column list when the publication also publishes FOR TABLES IN SCHEMA is not supported.

When a partitioned table is added to a publication, all of its existing and future partitions are implicitly considered to be part of the publication. So, even operations that are performed directly on a partition are also published via publications that its ancestors are part of.

Marks the publication as one that replicates changes for all tables in the database, including tables created in the future.

Marks the publication as one that replicates changes for all tables in the specified list of schemas, including tables created in the future.

Specifying a schema when the publication also publishes a table with a column list is not supported.

Only persistent base tables and partitioned tables present in the schema will be included as part of the publication. Temporary tables, unlogged tables, foreign tables, materialized views, and regular views from the schema will not be part of the publication.

When a partitioned table is published via schema level publication, all of its existing and future partitions are implicitly considered to be part of the publication, regardless of whether they are from the publication schema or not. So, even operations that are performed directly on a partition are also published via publications that its ancestors are part of.

This clause specifies optional parameters for a publication. The following parameters are supported:

This parameter determines which DML operations will be published by the new publication to the subscribers. The value is comma-separated list of operations. The allowed operations are insert, update, delete, and truncate. The default is to publish all actions, and so the default value for this option is 'insert, update, delete, truncate'.

This parameter only affects DML operations. In particular, the initial data synchronization (see Section 29.9.1) for logical replication does not take this parameter into account when copying existing table data.

Specifies whether the generated columns present in the tables associated with the publication should be replicated. Possible values are none and stored.

The default is none meaning the generated columns present in the tables associated with publication will not be replicated.

If set to stored, the stored generated columns present in the tables associated with publication will be replicated.

If the subscriber is from a release prior to 18, then initial table synchronization won't copy generated columns even if parameter publish_generated_columns is stored in the publisher.

See Section 29.6 for more details about logical replication of generated columns.

This parameter determines whether changes in a partitioned table (or on its partitions) contained in the publication will be published using the identity and schema of the partitioned table rather than that of the individual partitions that are actually changed; the latter is the default. Enabling this allows the changes to be replicated into a non-partitioned table or a partitioned table consisting of a different set of partitions.

There can be a case where a subscription combines multiple publications. If a partitioned table is published by any subscribed publications which set publish_via_partition_root = true, changes on this partitioned table (or on its partitions) will be published using the identity and schema of this partitioned table rather than that of the individual partitions.

This parameter also affects how row filters and column lists are chosen for partitions; see below for details.

If this is enabled, TRUNCATE operations performed directly on partitions are not replicated.

When specifying a parameter of type boolean, the = value part can be omitted, which is equivalent to specifying TRUE.

If FOR TABLE, FOR ALL TABLES or FOR TABLES IN SCHEMA are not specified, then the publication starts out with an empty set of tables. That is useful if tables or schemas are to be added later.

The creation of a publication does not start replication. It only defines a grouping and filtering logic for future subscribers.

To create a publication, the invoking user must have the CREATE privilege for the current database. (Of course, superusers bypass this check.)

To add a table to a publication, the invoking user must have ownership rights on the table. The FOR ALL TABLES and FOR TABLES IN SCHEMA clauses require the invoking user to be a superuser.

The tables added to a publication that publishes UPDATE and/or DELETE operations must have REPLICA IDENTITY defined. Otherwise those operations will be disallowed on those tables.

Any column list must include the REPLICA IDENTITY columns in order for UPDATE or DELETE operations to be published. There are no column list restrictions if the publication publishes only INSERT operations.

A row filter expression (i.e., the WHERE clause) must contain only columns that are covered by the REPLICA IDENTITY, in order for UPDATE and DELETE operations to be published. For publication of INSERT operations, any column may be used in the WHERE expression. The row filter allows simple expressions that don't have user-defined functions, user-defined operators, user-defined types, user-defined collations, non-immutable built-in functions, or references to system columns.

The generated columns that are part of REPLICA IDENTITY must be published explicitly either by listing them in the column list or by enabling the publish_generated_columns option, in order for UPDATE and DELETE operations to be published.

The row filter on a table becomes redundant if FOR TABLES IN SCHEMA is specified and the table belongs to the referred schema.

For published partitioned tables, the row filter for each partition is taken from the published partitioned table if the publication parameter publish_via_partition_root is true, or from the partition itself if it is false (the default). See Section 29.4 for details about row filters. Similarly, for published partitioned tables, the column list for each partition is taken from the published partitioned table if the publication parameter publish_via_partition_root is true, or from the partition itself if it is false.

For an INSERT ... ON CONFLICT command, the publication will publish the operation that results from the command. Depending on the outcome, it may be published as either INSERT or UPDATE, or it may not be published at all.

For a MERGE command, the publication will publish an INSERT, UPDATE, or DELETE for each row inserted, updated, or deleted.

ATTACHing a table into a partition tree whose root is published using a publication with publish_via_partition_root set to true does not result in the table's existing contents being replicated.

COPY ... FROM commands are published as INSERT operations.

DDL operations are not published.

The WHERE clause expression is executed with the role used for the replication connection.

Create a publication that publishes all changes in two tables:

Create a publication that publishes all changes from active departments:

Create a publication that publishes all changes in all tables:

Create a publication that only publishes INSERT operations in one table:

Create a publication that publishes all changes for tables users, departments and all changes for all the tables present in the schema production:

Create a publication that publishes all changes for all the tables present in the schemas marketing and sales:

Create a publication that publishes all changes for table users, but replicates only columns user_id and firstname:

CREATE PUBLICATION is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
publication_object
```

Example 2 (unknown):
```unknown
publication_parameter
```

Example 3 (unknown):
```unknown
publication_object
```

Example 4 (unknown):
```unknown
column_name
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-abort.html

**Contents:**
- ABORT
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

ABORT — abort the current transaction

ABORT rolls back the current transaction and causes all the updates made by the transaction to be discarded. This command is identical in behavior to the standard SQL command ROLLBACK, and is present only for historical reasons.

Optional key words. They have no effect.

If AND CHAIN is specified, a new transaction is immediately started with the same transaction characteristics (see SET TRANSACTION) as the just finished one. Otherwise, no new transaction is started.

Use COMMIT to successfully terminate a transaction.

Issuing ABORT outside of a transaction block emits a warning and otherwise has no effect.

To abort all changes:

This command is a PostgreSQL extension present for historical reasons. ROLLBACK is the equivalent standard SQL command.

**Examples:**

Example 1 (unknown):
```unknown
TRANSACTION
```

Example 2 (unknown):
```unknown
SET TRANSACTION
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-createview.html

**Contents:**
- CREATE VIEW
- Synopsis
- Description
- Parameters
- Notes
  - Updatable Views
- Examples
- Compatibility
- See Also

CREATE VIEW — define a new view

CREATE VIEW defines a view of a query. The view is not physically materialized. Instead, the query is run every time the view is referenced in a query.

CREATE OR REPLACE VIEW is similar, but if a view of the same name already exists, it is replaced. The new query must generate the same columns that were generated by the existing view query (that is, the same column names in the same order and with the same data types), but it may add additional columns to the end of the list. The calculations giving rise to the output columns may be completely different.

If a schema name is given (for example, CREATE VIEW myschema.myview ...) then the view is created in the specified schema. Otherwise it is created in the current schema. Temporary views exist in a special schema, so a schema name cannot be given when creating a temporary view. The name of the view must be distinct from the name of any other relation (table, sequence, index, view, materialized view, or foreign table) in the same schema.

If specified, the view is created as a temporary view. Temporary views are automatically dropped at the end of the current session. Existing permanent relations with the same name are not visible to the current session while the temporary view exists, unless they are referenced with schema-qualified names.

If any of the tables referenced by the view are temporary, the view is created as a temporary view (whether TEMPORARY is specified or not).

Creates a recursive view. The syntax

A view column name list must be specified for a recursive view.

The name (optionally schema-qualified) of a view to be created.

An optional list of names to be used for columns of the view. If not given, the column names are deduced from the query.

This clause specifies optional parameters for a view; the following parameters are supported:

This parameter may be either local or cascaded, and is equivalent to specifying WITH [ CASCADED | LOCAL ] CHECK OPTION (see below).

This should be used if the view is intended to provide row-level security. See Section 39.5 for full details.

This option causes the underlying base relations to be checked against the privileges of the user of the view rather than the view owner. See the notes below for full details.

All of the above options can be changed on existing views using ALTER VIEW.

A SELECT or VALUES command which will provide the columns and rows of the view.

This option controls the behavior of automatically updatable views. When this option is specified, INSERT, UPDATE, and MERGE commands on the view will be checked to ensure that new rows satisfy the view-defining condition (that is, the new rows are checked to ensure that they are visible through the view). If they are not, the update will be rejected. If the CHECK OPTION is not specified, INSERT, UPDATE, and MERGE commands on the view are allowed to create rows that are not visible through the view. The following check options are supported:

New rows are only checked against the conditions defined directly in the view itself. Any conditions defined on underlying base views are not checked (unless they also specify the CHECK OPTION).

New rows are checked against the conditions of the view and all underlying base views. If the CHECK OPTION is specified, and neither LOCAL nor CASCADED is specified, then CASCADED is assumed.

The CHECK OPTION may not be used with RECURSIVE views.

Note that the CHECK OPTION is only supported on views that are automatically updatable, and do not have INSTEAD OF triggers or INSTEAD rules. If an automatically updatable view is defined on top of a base view that has INSTEAD OF triggers, then the LOCAL CHECK OPTION may be used to check the conditions on the automatically updatable view, but the conditions on the base view with INSTEAD OF triggers will not be checked (a cascaded check option will not cascade down to a trigger-updatable view, and any check options defined directly on a trigger-updatable view will be ignored). If the view or any of its base relations has an INSTEAD rule that causes the INSERT or UPDATE command to be rewritten, then all check options will be ignored in the rewritten query, including any checks from automatically updatable views defined on top of the relation with the INSTEAD rule. MERGE is not supported if the view or any of its base relations have rules.

Use the DROP VIEW statement to drop views.

Be careful that the names and types of the view's columns will be assigned the way you want. For example:

is bad form because the column name defaults to ?column?; also, the column data type defaults to text, which might not be what you wanted. Better style for a string literal in a view's result is something like:

By default, access to the underlying base relations referenced in the view is determined by the permissions of the view owner. In some cases, this can be used to provide secure but restricted access to the underlying tables. However, not all views are secure against tampering; see Section 39.5 for details.

If the view has the security_invoker property set to true, access to the underlying base relations is determined by the permissions of the user executing the query, rather than the view owner. Thus, the user of a security invoker view must have the relevant permissions on the view and its underlying base relations.

If any of the underlying base relations is a security invoker view, it will be treated as if it had been accessed directly from the original query. Thus, a security invoker view will always check its underlying base relations using the permissions of the current user, even if it is accessed from a view without the security_invoker property.

If any of the underlying base relations has row-level security enabled, then by default, the row-level security policies of the view owner are applied, and access to any additional relations referred to by those policies is determined by the permissions of the view owner. However, if the view has security_invoker set to true, then the policies and permissions of the invoking user are used instead, as if the base relations had been referenced directly from the query using the view.

Functions called in the view are treated the same as if they had been called directly from the query using the view. Therefore, the user of a view must have permissions to call all functions used by the view. Functions in the view are executed with the privileges of the user executing the query or the function owner, depending on whether the functions are defined as SECURITY INVOKER or SECURITY DEFINER. Thus, for example, calling CURRENT_USER directly in a view will always return the invoking user, not the view owner. This is not affected by the view's security_invoker setting, and so a view with security_invoker set to false is not equivalent to a SECURITY DEFINER function and those concepts should not be confused.

The user creating or replacing a view must have USAGE privileges on any schemas referred to in the view query, in order to look up the referenced objects in those schemas. Note, however, that this lookup only happens when the view is created or replaced. Therefore, the user of the view only requires the USAGE privilege on the schema containing the view, not on the schemas referred to in the view query, even for a security invoker view.

When CREATE OR REPLACE VIEW is used on an existing view, only the view's defining SELECT rule, plus any WITH ( ... ) parameters and its CHECK OPTION are changed. Other view properties, including ownership, permissions, and non-SELECT rules, remain unchanged. You must own the view to replace it (this includes being a member of the owning role).

Simple views are automatically updatable: the system will allow INSERT, UPDATE, DELETE, and MERGE statements to be used on the view in the same way as on a regular table. A view is automatically updatable if it satisfies all of the following conditions:

The view must have exactly one entry in its FROM list, which must be a table or another updatable view.

The view definition must not contain WITH, DISTINCT, GROUP BY, HAVING, LIMIT, or OFFSET clauses at the top level.

The view definition must not contain set operations (UNION, INTERSECT or EXCEPT) at the top level.

The view's select list must not contain any aggregates, window functions or set-returning functions.

An automatically updatable view may contain a mix of updatable and non-updatable columns. A column is updatable if it is a simple reference to an updatable column of the underlying base relation; otherwise the column is read-only, and an error will be raised if an INSERT, UPDATE, or MERGE statement attempts to assign a value to it.

If the view is automatically updatable the system will convert any INSERT, UPDATE, DELETE, or MERGE statement on the view into the corresponding statement on the underlying base relation. INSERT statements that have an ON CONFLICT UPDATE clause are fully supported.

If an automatically updatable view contains a WHERE condition, the condition restricts which rows of the base relation are available to be modified by UPDATE, DELETE, and MERGE statements on the view. However, an UPDATE or MERGE is allowed to change a row so that it no longer satisfies the WHERE condition, and thus is no longer visible through the view. Similarly, an INSERT or MERGE command can potentially insert base-relation rows that do not satisfy the WHERE condition and thus are not visible through the view (ON CONFLICT UPDATE may similarly affect an existing row not visible through the view). The CHECK OPTION may be used to prevent INSERT, UPDATE, and MERGE commands from creating such rows that are not visible through the view.

If an automatically updatable view is marked with the security_barrier property then all the view's WHERE conditions (and any conditions using operators which are marked as LEAKPROOF) will always be evaluated before any conditions that a user of the view has added. See Section 39.5 for full details. Note that, due to this, rows which are not ultimately returned (because they do not pass the user's WHERE conditions) may still end up being locked. EXPLAIN can be used to see which conditions are applied at the relation level (and therefore do not lock rows) and which are not.

A more complex view that does not satisfy all these conditions is read-only by default: the system will not allow an INSERT, UPDATE, DELETE, or MERGE on the view. You can get the effect of an updatable view by creating INSTEAD OF triggers on the view, which must convert attempted inserts, etc. on the view into appropriate actions on other tables. For more information see CREATE TRIGGER. Another possibility is to create rules (see CREATE RULE), but in practice triggers are easier to understand and use correctly. Also note that MERGE is not supported on relations with rules.

Note that the user performing the insert, update or delete on the view must have the corresponding insert, update or delete privilege on the view. In addition, by default, the view's owner must have the relevant privileges on the underlying base relations, whereas the user performing the update does not need any permissions on the underlying base relations (see Section 39.5). However, if the view has security_invoker set to true, the user performing the update, rather than the view owner, must have the relevant privileges on the underlying base relations.

Create a view consisting of all comedy films:

This will create a view containing the columns that are in the film table at the time of view creation. Though * was used to create the view, columns added later to the table will not be part of the view.

Create a view with LOCAL CHECK OPTION:

This will create a view based on the comedies view, showing only films with kind = 'Comedy' and classification = 'U'. Any attempt to INSERT or UPDATE a row in the view will be rejected if the new row doesn't have classification = 'U', but the film kind will not be checked.

Create a view with CASCADED CHECK OPTION:

This will create a view that checks both the kind and classification of new rows.

Create a view with a mix of updatable and non-updatable columns:

This view will support INSERT, UPDATE and DELETE. All the columns from the films table will be updatable, whereas the computed columns country and avg_rating will be read-only.

Create a recursive view consisting of the numbers from 1 to 100:

Notice that although the recursive view's name is schema-qualified in this CREATE, its internal self-reference is not schema-qualified. This is because the implicitly-created CTE's name cannot be schema-qualified.

CREATE OR REPLACE VIEW is a PostgreSQL language extension. So is the concept of a temporary view. The WITH ( ... ) clause is an extension as well, as are security barrier views and security invoker views.

**Examples:**

Example 1 (unknown):
```unknown
column_name
```

Example 2 (unknown):
```unknown
view_option_name
```

Example 3 (unknown):
```unknown
view_option_value
```

Example 4 (unknown):
```unknown
CREATE VIEW
```

---


---

