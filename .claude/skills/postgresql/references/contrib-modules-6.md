# PostgreSQL - Contrib Modules (Part 6)

## F.21. lo — manage large objects #


**URL:** https://www.postgresql.org/docs/18/lo.html

**Contents:**
- F.21. lo — manage large objects #
  - F.21.1. Rationale #
  - F.21.2. How to Use It #
  - F.21.3. Limitations #
  - F.21.4. Author #

The lo module provides support for managing Large Objects (also called LOs or BLOBs). This includes a data type lo and a trigger lo_manage.

This module is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database.

One of the problems with the JDBC driver (and this affects the ODBC driver also), is that the specification assumes that references to BLOBs (Binary Large OBjects) are stored within a table, and if that entry is changed, the associated BLOB is deleted from the database.

As PostgreSQL stands, this doesn't occur. Large objects are treated as objects in their own right; a table entry can reference a large object by OID, but there can be multiple table entries referencing the same large object OID, so the system doesn't delete the large object just because you change or remove one such entry.

Now this is fine for PostgreSQL-specific applications, but standard code using JDBC or ODBC won't delete the objects, resulting in orphan objects — objects that are not referenced by anything, and simply occupy disk space.

The lo module allows fixing this by attaching a trigger to tables that contain LO reference columns. The trigger essentially just does a lo_unlink whenever you delete or modify a value referencing a large object. When you use this trigger, you are assuming that there is only one database reference to any large object that is referenced in a trigger-controlled column!

The module also provides a data type lo, which is really just a domain over the oid type. This is useful for differentiating database columns that hold large object references from those that are OIDs of other things. You don't have to use the lo type to use the trigger, but it may be convenient to use it to keep track of which columns in your database represent large objects that you are managing with the trigger. It is also rumored that the ODBC driver gets confused if you don't use lo for BLOB columns.

Here's a simple example of usage:

For each column that will contain unique references to large objects, create a BEFORE UPDATE OR DELETE trigger, and give the column name as the sole trigger argument. You can also restrict the trigger to only execute on updates to the column by using BEFORE UPDATE OF column_name. If you need multiple lo columns in the same table, create a separate trigger for each one, remembering to give a different name to each trigger on the same table.

Dropping a table will still orphan any objects it contains, as the trigger is not executed. You can avoid this by preceding the DROP TABLE with DELETE FROM table.

TRUNCATE has the same hazard.

If you already have, or suspect you have, orphaned large objects, see the vacuumlo module to help you clean them up. It's a good idea to run vacuumlo occasionally as a back-stop to the lo_manage trigger.

Some frontends may create their own tables, and will not create the associated trigger(s). Also, users may not remember (or know) to create the triggers.

Peter Mount <peter@retep.org.uk>

**Examples:**

Example 1 (sql):
```sql
CREATE TABLE image (title text, raster lo);

CREATE TRIGGER t_raster BEFORE UPDATE OR DELETE ON image
    FOR EACH ROW EXECUTE FUNCTION lo_manage(raster);
```

Example 2 (sql):
```sql
BEFORE UPDATE OR DELETE
```

Example 3 (sql):
```sql
BEFORE UPDATE OF
```

Example 4 (unknown):
```unknown
column_name
```

---


---

## F.28. pg_logicalinspect — logical decoding components inspection #


**URL:** https://www.postgresql.org/docs/18/pglogicalinspect.html

**Contents:**
- F.28. pg_logicalinspect — logical decoding components inspection #
  - F.28.1. Functions #
  - F.28.2. Author #

The pg_logicalinspect module provides SQL functions that allow you to inspect the contents of logical decoding components. It allows the inspection of serialized logical snapshots of a running PostgreSQL database cluster, which is useful for debugging or educational purposes.

By default, use of these functions is restricted to superusers and members of the pg_read_server_files role. Access may be granted by superusers to others using GRANT.

Gets logical snapshot metadata about a snapshot file that is located in the server's pg_logical/snapshots directory. The filename argument represents the snapshot file name. For example:

If filename does not match a snapshot file, the function raises an error.

Gets logical snapshot information about a snapshot file that is located in the server's pg_logical/snapshots directory. The filename argument represents the snapshot file name. For example:

If filename does not match a snapshot file, the function raises an error.

Bertrand Drouvot <bertranddrouvot.pg@gmail.com>

**Examples:**

Example 1 (unknown):
```unknown
pg_logicalinspect
```

Example 2 (unknown):
```unknown
pg_read_server_files
```

Example 3 (unknown):
```unknown
pg_get_logical_snapshot_meta(filename text) returns record
```

Example 4 (unknown):
```unknown
pg_logical/snapshots
```

---


---

## F.43. tablefunc — functions that return tables (crosstab and others) #


**URL:** https://www.postgresql.org/docs/18/tablefunc.html

**Contents:**
- F.43. tablefunc — functions that return tables (crosstab and others) #
  - F.43.1. Functions Provided #
    - F.43.1.1. normal_rand #
    - F.43.1.2. crosstab(text) #
  - Note
    - F.43.1.3. crosstabN(text) #
    - F.43.1.4. crosstab(text, text) #
    - F.43.1.5. connectby #
  - F.43.2. Author #

The tablefunc module includes various functions that return tables (that is, multiple rows). These functions are useful both in their own right and as examples of how to write C functions that return multiple rows.

This module is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database.

Table F.33 summarizes the functions provided by the tablefunc module.

Table F.33. tablefunc Functions

normal_rand ( numvals integer, mean float8, stddev float8 ) → setof float8

Produces a set of normally distributed random values.

crosstab ( sql text ) → setof record

Produces a “pivot table” containing row names plus N value columns, where N is determined by the row type specified in the calling query.

crosstabN ( sql text ) → setof table_crosstab_N

Produces a “pivot table” containing row names plus N value columns. crosstab2, crosstab3, and crosstab4 are predefined, but you can create additional crosstabN functions as described below.

crosstab ( source_sql text, category_sql text ) → setof record

Produces a “pivot table” with the value columns specified by a second query.

crosstab ( sql text, N integer ) → setof record

Obsolete version of crosstab(text). The parameter N is now ignored, since the number of value columns is always determined by the calling query.

connectby ( relname text, keyid_fld text, parent_keyid_fld text [, orderby_fld text ], start_with text, max_depth integer [, branch_delim text ] ) → setof record

Produces a representation of a hierarchical tree structure.

normal_rand produces a set of normally distributed random values (Gaussian distribution).

numvals is the number of values to be returned from the function. mean is the mean of the normal distribution of values and stddev is the standard deviation of the normal distribution of values.

For example, this call requests 1000 values with a mean of 5 and a standard deviation of 3:

The crosstab function is used to produce “pivot” displays, wherein data is listed across the page rather than down. For example, we might have data like

which we wish to display like

The crosstab function takes a text parameter that is an SQL query producing raw data formatted in the first way, and produces a table formatted in the second way.

The sql parameter is an SQL statement that produces the source set of data. This statement must return one row_name column, one category column, and one value column. N is an obsolete parameter, ignored if supplied (formerly this had to match the number of output value columns, but now that is determined by the calling query).

For example, the provided query might produce a set something like:

The crosstab function is declared to return setof record, so the actual names and types of the output columns must be defined in the FROM clause of the calling SELECT statement, for example:

This example produces a set something like:

The FROM clause must define the output as one row_name column (of the same data type as the first result column of the SQL query) followed by N value columns (all of the same data type as the third result column of the SQL query). You can set up as many output value columns as you wish. The names of the output columns are up to you.

The crosstab function produces one output row for each consecutive group of input rows with the same row_name value. It fills the output value columns, left to right, with the value fields from these rows. If there are fewer rows in a group than there are output value columns, the extra output columns are filled with nulls; if there are more rows, the extra input rows are skipped.

In practice the SQL query should always specify ORDER BY 1,2 to ensure that the input rows are properly ordered, that is, values with the same row_name are brought together and correctly ordered within the row. Notice that crosstab itself does not pay any attention to the second column of the query result; it's just there to be ordered by, to control the order in which the third-column values appear across the page.

Here is a complete example:

You can avoid always having to write out a FROM clause to define the output columns, by setting up a custom crosstab function that has the desired output row type wired into its definition. This is described in the next section. Another possibility is to embed the required FROM clause in a view definition.

See also the \crosstabview command in psql, which provides functionality similar to crosstab().

The crosstabN functions are examples of how to set up custom wrappers for the general crosstab function, so that you need not write out column names and types in the calling SELECT query. The tablefunc module includes crosstab2, crosstab3, and crosstab4, whose output row types are defined as

Thus, these functions can be used directly when the input query produces row_name and value columns of type text, and you want 2, 3, or 4 output values columns. In all other ways they behave exactly as described above for the general crosstab function.

For instance, the example given in the previous section would also work as

These functions are provided mostly for illustration purposes. You can create your own return types and functions based on the underlying crosstab() function. There are two ways to do it:

Create a composite type describing the desired output columns, similar to the examples in contrib/tablefunc/tablefunc--1.0.sql. Then define a unique function name accepting one text parameter and returning setof your_type_name, but linking to the same underlying crosstab C function. For example, if your source data produces row names that are text, and values that are float8, and you want 5 value columns:

Use OUT parameters to define the return type implicitly. The same example could also be done this way:

The main limitation of the single-parameter form of crosstab is that it treats all values in a group alike, inserting each value into the first available column. If you want the value columns to correspond to specific categories of data, and some groups might not have data for some of the categories, that doesn't work well. The two-parameter form of crosstab handles this case by providing an explicit list of the categories corresponding to the output columns.

source_sql is an SQL statement that produces the source set of data. This statement must return one row_name column, one category column, and one value column. It may also have one or more “extra” columns. The row_name column must be first. The category and value columns must be the last two columns, in that order. Any columns between row_name and category are treated as “extra”. The “extra” columns are expected to be the same for all rows with the same row_name value.

For example, source_sql might produce a set something like:

category_sql is an SQL statement that produces the set of categories. This statement must return only one column. It must produce at least one row, or an error will be generated. Also, it must not produce duplicate values, or an error will be generated. category_sql might be something like:

The crosstab function is declared to return setof record, so the actual names and types of the output columns must be defined in the FROM clause of the calling SELECT statement, for example:

This will produce a result something like:

The FROM clause must define the proper number of output columns of the proper data types. If there are N columns in the source_sql query's result, the first N-2 of them must match up with the first N-2 output columns. The remaining output columns must have the type of the last column of the source_sql query's result, and there must be exactly as many of them as there are rows in the category_sql query's result.

The crosstab function produces one output row for each consecutive group of input rows with the same row_name value. The output row_name column, plus any “extra” columns, are copied from the first row of the group. The output value columns are filled with the value fields from rows having matching category values. If a row's category does not match any output of the category_sql query, its value is ignored. Output columns whose matching category is not present in any input row of the group are filled with nulls.

In practice the source_sql query should always specify ORDER BY 1 to ensure that values with the same row_name are brought together. However, ordering of the categories within a group is not important. Also, it is essential to be sure that the order of the category_sql query's output matches the specified output column order.

Here are two complete examples:

You can create predefined functions to avoid having to write out the result column names and types in each query. See the examples in the previous section. The underlying C function for this form of crosstab is named crosstab_hash.

The connectby function produces a display of hierarchical data that is stored in a table. The table must have a key field that uniquely identifies rows, and a parent-key field that references the parent (if any) of each row. connectby can display the sub-tree descending from any row.

Table F.34 explains the parameters.

Table F.34. connectby Parameters

The key and parent-key fields can be any data type, but they must be the same type. Note that the start_with value must be entered as a text string, regardless of the type of the key field.

The connectby function is declared to return setof record, so the actual names and types of the output columns must be defined in the FROM clause of the calling SELECT statement, for example:

The first two output columns are used for the current row's key and its parent row's key; they must match the type of the table's key field. The third output column is the depth in the tree and must be of type integer. If a branch_delim parameter was given, the next output column is the branch display and must be of type text. Finally, if an orderby_fld parameter was given, the last output column is a serial number, and must be of type integer.

The “branch” output column shows the path of keys taken to reach the current row. The keys are separated by the specified branch_delim string. If no branch display is wanted, omit both the branch_delim parameter and the branch column in the output column list.

If the ordering of siblings of the same parent is important, include the orderby_fld parameter to specify which field to order siblings by. This field can be of any sortable data type. The output column list must include a final integer serial-number column, if and only if orderby_fld is specified.

The parameters representing table and field names are copied as-is into the SQL queries that connectby generates internally. Therefore, include double quotes if the names are mixed-case or contain special characters. You may also need to schema-qualify the table name.

In large tables, performance will be poor unless there is an index on the parent-key field.

It is important that the branch_delim string not appear in any key values, else connectby may incorrectly report an infinite-recursion error. Note that if branch_delim is not provided, a default value of ~ is used for recursion detection purposes.

**Examples:**

Example 1 (unknown):
```unknown
normal_rand
```

Example 2 (unknown):
```unknown
setof float8
```

Example 3 (unknown):
```unknown
setof record
```

Example 4 (unknown):
```unknown
setof table_crosstab_N
```

---


---

## F.27. pg_freespacemap — examine the free space map #


**URL:** https://www.postgresql.org/docs/18/pgfreespacemap.html

**Contents:**
- F.27. pg_freespacemap — examine the free space map #
  - F.27.1. Functions #
  - F.27.2. Sample Output #
  - F.27.3. Author #

The pg_freespacemap module provides a means for examining the free space map (FSM). It provides a function called pg_freespace, or two overloaded functions, to be precise. The functions show the value recorded in the free space map for a given page, or for all pages in the relation.

By default use is restricted to superusers and roles with privileges of the pg_stat_scan_tables role. Access may be granted to others using GRANT.

Returns the amount of free space on the page of the relation, specified by blkno, according to the FSM.

Displays the amount of free space on each page of the relation, according to the FSM. A set of (blkno bigint, avail int2) tuples is returned, one tuple for each page in the relation.

The values stored in the free space map are not exact. They're rounded to precision of 1/256th of BLCKSZ (32 bytes with default BLCKSZ), and they're not kept fully up-to-date as tuples are inserted and updated.

For indexes, what is tracked is entirely-unused pages, rather than free space within pages. Therefore, the values are not meaningful, just whether a page is in-use or empty.

Original version by Mark Kirkwood <markir@paradise.net.nz>. Rewritten in version 8.4 to suit new FSM implementation by Heikki Linnakangas <heikki@enterprisedb.com>

**Examples:**

Example 1 (unknown):
```unknown
pg_freespacemap
```

Example 2 (unknown):
```unknown
pg_freespace
```

Example 3 (unknown):
```unknown
pg_stat_scan_tables
```

Example 4 (unknown):
```unknown
pg_freespace(rel regclass IN, blkno bigint IN) returns int2
```

---


---

## F.4. basebackup_to_shell — example "shell" pg_basebackup module #


**URL:** https://www.postgresql.org/docs/18/basebackup-to-shell.html

**Contents:**
- F.4. basebackup_to_shell — example "shell" pg_basebackup module #
  - F.4.1. Configuration Parameters #
  - F.4.2. Author #

basebackup_to_shell adds a custom basebackup target called shell. This makes it possible to run pg_basebackup --target=shell or, depending on how this module is configured, pg_basebackup --target=shell:DETAIL_STRING, and cause a server command chosen by the server administrator to be executed for each tar archive generated by the backup process. The command will receive the contents of the archive via standard input.

This module is primarily intended as an example of how to create a new backup targets via an extension module, but in some scenarios it may be useful for its own sake. In order to function, this module must be loaded via shared_preload_libraries or local_preload_libraries.

The command which the server should execute for each archive generated by the backup process. If %f occurs in the command string, it will be replaced by the name of the archive (e.g. base.tar). If %d occurs in the command string, it will be replaced by the target detail provided by the user. A target detail is required if %d is used in the command string, and prohibited otherwise. For security reasons, it may contain only alphanumeric characters. If %% occurs in the command string, it will be replaced by a single %. If % occurs in the command string followed by any other character or at the end of the string, an error occurs.

The role required in order to make use of the shell backup target. If this is not set, any replication user may make use of the shell backup target.

Robert Haas <rhaas@postgresql.org>

**Examples:**

Example 1 (unknown):
```unknown
basebackup_to_shell
```

Example 2 (unknown):
```unknown
pg_basebackup --target=shell
```

Example 3 (unknown):
```unknown
pg_basebackup --target=shell:DETAIL_STRING
```

Example 4 (unknown):
```unknown
DETAIL_STRING
```

---


---

