# PostgreSQL - Contrib Modules (Part 4)

## F.15. file_fdw — access data files in the server's file system #


**URL:** https://www.postgresql.org/docs/18/file-fdw.html

**Contents:**
- F.15. file_fdw — access data files in the server's file system #

The file_fdw module provides the foreign-data wrapper file_fdw, which can be used to access data files in the server's file system, or to execute programs on the server and read their output. The data file or program output must be in a format that can be read by COPY FROM; see COPY for details. Access to data files is currently read-only.

A foreign table created using this wrapper can have the following options:

Specifies the file to be read. Relative paths are relative to the data directory. Either filename or program must be specified, but not both.

Specifies the command to be executed. The standard output of this command will be read as though COPY FROM PROGRAM were used. Either program or filename must be specified, but not both.

Specifies the data format, the same as COPY's FORMAT option.

Specifies whether the data has a header line, the same as COPY's HEADER option.

Specifies the data delimiter character, the same as COPY's DELIMITER option.

Specifies the data quote character, the same as COPY's QUOTE option.

Specifies the data escape character, the same as COPY's ESCAPE option.

Specifies the data null string, the same as COPY's NULL option.

Specifies the data encoding, the same as COPY's ENCODING option.

Specifies how to behave when encountering an error converting a column's input value into its data type, the same as COPY's ON_ERROR option.

Specifies the maximum number of errors tolerated while converting a column's input value to its data type, the same as COPY's REJECT_LIMIT option.

Specifies the amount of messages emitted by file_fdw, the same as COPY's LOG_VERBOSITY option.

Note that while COPY allows options such as HEADER to be specified without a corresponding value, the foreign table option syntax requires a value to be present in all cases. To activate COPY options typically written without a value, you can pass the value TRUE, since all such options are Booleans.

A column of a foreign table created using this wrapper can have the following options:

This is a Boolean option. If true, it specifies that values of the column should not be matched against the null string (that is, the table-level null option). This has the same effect as listing the column in COPY's FORCE_NOT_NULL option.

This is a Boolean option. If true, it specifies that values of the column which match the null string are returned as NULL even if the value is quoted. Without this option, only unquoted values matching the null string are returned as NULL. This has the same effect as listing the column in COPY's FORCE_NULL option.

COPY's FORCE_QUOTE option is currently not supported by file_fdw.

These options can only be specified for a foreign table or its columns, not in the options of the file_fdw foreign-data wrapper, nor in the options of a server or user mapping using the wrapper.

Changing table-level options requires being a superuser or having the privileges of the role pg_read_server_files (to use a filename) or the role pg_execute_server_program (to use a program), for security reasons: only certain users should be able to control which file is read or which program is run. In principle regular users could be allowed to change the other options, but that's not supported at present.

When specifying the program option, keep in mind that the option string is executed by the shell. If you need to pass any arguments to the command that come from an untrusted source, you must be careful to strip or escape any characters that might have special meaning to the shell. For security reasons, it is best to use a fixed command string, or at least avoid passing any user input in it.

For a foreign table using file_fdw, EXPLAIN shows the name of the file to be read or program to be run. For a file, unless COSTS OFF is specified, the file size (in bytes) is shown as well.

Example F.1. Create a Foreign Table for PostgreSQL CSV Logs

One of the obvious uses for file_fdw is to make the PostgreSQL activity log available as a table for querying. To do this, first you must be logging to a CSV file, which here we will call pglog.csv. First, install file_fdw as an extension:

Then create a foreign server:

Now you are ready to create the foreign data table. Using the CREATE FOREIGN TABLE command, you will need to define the columns for the table, the CSV file name, and its format:

That's it — now you can query your log directly. In production, of course, you would need to define some way to deal with log rotation.

Example F.2. Create a Foreign Table with an Option on a Column

To set the force_null option for a column, use the OPTIONS keyword.

**Examples:**

Example 1 (sql):
```sql
COPY FROM PROGRAM
```

Example 2 (unknown):
```unknown
reject_limit
```

Example 3 (unknown):
```unknown
REJECT_LIMIT
```

Example 4 (unknown):
```unknown
log_verbosity
```

---


---

## F.41. spi — Server Programming Interface features/examples #


**URL:** https://www.postgresql.org/docs/18/contrib-spi.html

**Contents:**
- F.41. spi — Server Programming Interface features/examples #
  - F.41.1. refint — Functions for Implementing Referential Integrity #
  - F.41.2. autoinc — Functions for Autoincrementing Fields #
  - F.41.3. insert_username — Functions for Tracking Who Changed a Table #
  - F.41.4. moddatetime — Functions for Tracking Last Modification Time #

The spi module provides several workable examples of using the Server Programming Interface (SPI) and triggers. While these functions are of some value in their own right, they are even more useful as examples to modify for your own purposes. The functions are general enough to be used with any table, but you have to specify table and field names (as described below) while creating a trigger.

Each of the groups of functions described below is provided as a separately-installable extension.

check_primary_key() and check_foreign_key() are used to check foreign key constraints. (This functionality is long since superseded by the built-in foreign key mechanism, of course, but the module is still useful as an example.)

check_primary_key() checks the referencing table. To use, create an AFTER INSERT OR UPDATE trigger using this function on a table referencing another table. Specify as the trigger arguments: the referencing table's column name(s) which form the foreign key, the referenced table name, and the column names in the referenced table which form the primary/unique key. To handle multiple foreign keys, create a trigger for each reference.

check_foreign_key() checks the referenced table. To use, create an AFTER DELETE OR UPDATE trigger using this function on a table referenced by other table(s). Specify as the trigger arguments: the number of referencing tables for which the function has to perform checking, the action if a referencing key is found (cascade — to delete the referencing row, restrict — to abort transaction if referencing keys exist, setnull — to set referencing key fields to null), the triggered table's column names which form the primary/unique key, then the referencing table name and column names (repeated for as many referencing tables as were specified by first argument). Note that the primary/unique key columns should be marked NOT NULL and should have a unique index.

Note that if these triggers are executed from another BEFORE trigger, they can fail unexpectedly. For example, if a user inserts row1 and then the BEFORE trigger inserts row2 and calls a trigger with the check_foreign_key(), the check_foreign_key() function will not see row1 and will fail.

There are examples in refint.example.

autoinc() is a trigger that stores the next value of a sequence into an integer field. This has some overlap with the built-in “serial column” feature, but it is not the same. The trigger will replace the field's value only if that value is initially zero or null (after the action of the SQL statement that inserted or updated the row). Also, if the sequence's next value is zero, nextval() will be called a second time in order to obtain a non-zero value.

To use, create a BEFORE INSERT (or optionally BEFORE INSERT OR UPDATE) trigger using this function. Specify two trigger arguments: the name of the integer column to be modified, and the name of the sequence object that will supply values. (Actually, you can specify any number of pairs of such names, if you'd like to update more than one autoincrementing column.)

There is an example in autoinc.example.

insert_username() is a trigger that stores the current user's name into a text field. This can be useful for tracking who last modified a particular row within a table.

To use, create a BEFORE INSERT and/or UPDATE trigger using this function. Specify a single trigger argument: the name of the text column to be modified.

There is an example in insert_username.example.

moddatetime() is a trigger that stores the current time into a timestamp field. This can be useful for tracking the last modification time of a particular row within a table.

To use, create a BEFORE UPDATE trigger using this function. Specify a single trigger argument: the name of the column to be modified. The column must be of type timestamp or timestamp with time zone.

There is an example in moddatetime.example.

**Examples:**

Example 1 (unknown):
```unknown
check_primary_key()
```

Example 2 (unknown):
```unknown
check_foreign_key()
```

Example 3 (unknown):
```unknown
check_primary_key()
```

Example 4 (unknown):
```unknown
AFTER INSERT OR UPDATE
```

---


---

