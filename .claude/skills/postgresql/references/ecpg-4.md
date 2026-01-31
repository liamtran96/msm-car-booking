# PostgreSQL - Ecpg (Part 4)

## 34.7. Using Descriptor Areas #


**URL:** https://www.postgresql.org/docs/18/ecpg-descriptors.html

**Contents:**
- 34.7. Using Descriptor Areas #
  - 34.7.1. Named SQL Descriptor Areas #
  - 34.7.2. SQLDA Descriptor Areas #
    - 34.7.2.1. SQLDA Data Structure #
  - Tip
      - 34.7.2.1.1. sqlda_t Structure #
      - 34.7.2.1.2. sqlvar_t Structure #
      - 34.7.2.1.3. struct sqlname Structure #
    - 34.7.2.2. Retrieving a Result Set Using an SQLDA #
    - 34.7.2.3. Passing Query Parameters Using an SQLDA #

An SQL descriptor area is a more sophisticated method for processing the result of a SELECT, FETCH or a DESCRIBE statement. An SQL descriptor area groups the data of one row of data together with metadata items into one data structure. The metadata is particularly useful when executing dynamic SQL statements, where the nature of the result columns might not be known ahead of time. PostgreSQL provides two ways to use Descriptor Areas: the named SQL Descriptor Areas and the C-structure SQLDAs.

A named SQL descriptor area consists of a header, which contains information concerning the entire descriptor, and one or more item descriptor areas, which basically each describe one column in the result row.

Before you can use an SQL descriptor area, you need to allocate one:

The identifier serves as the “variable name” of the descriptor area. When you don't need the descriptor anymore, you should deallocate it:

To use a descriptor area, specify it as the storage target in an INTO clause, instead of listing host variables:

If the result set is empty, the Descriptor Area will still contain the metadata from the query, i.e., the field names.

For not yet executed prepared queries, the DESCRIBE statement can be used to get the metadata of the result set:

Before PostgreSQL 9.0, the SQL keyword was optional, so using DESCRIPTOR and SQL DESCRIPTOR produced named SQL Descriptor Areas. Now it is mandatory, omitting the SQL keyword produces SQLDA Descriptor Areas, see Section 34.7.2.

In DESCRIBE and FETCH statements, the INTO and USING keywords can be used to similarly: they produce the result set and the metadata in a Descriptor Area.

Now how do you get the data out of the descriptor area? You can think of the descriptor area as a structure with named fields. To retrieve the value of a field from the header and store it into a host variable, use the following command:

Currently, there is only one header field defined: COUNT, which tells how many item descriptor areas exist (that is, how many columns are contained in the result). The host variable needs to be of an integer type. To get a field from the item descriptor area, use the following command:

num can be a literal integer or a host variable containing an integer. Possible fields are:

number of rows in the result set

actual data item (therefore, the data type of this field depends on the query)

When TYPE is 9, DATETIME_INTERVAL_CODE will have a value of 1 for DATE, 2 for TIME, 3 for TIMESTAMP, 4 for TIME WITH TIME ZONE, or 5 for TIMESTAMP WITH TIME ZONE.

the indicator (indicating a null value or a value truncation)

length of the datum in characters

length of the character representation of the datum in bytes

precision (for type numeric)

length of the datum in characters

length of the character representation of the datum in bytes

scale (for type numeric)

numeric code of the data type of the column

In EXECUTE, DECLARE and OPEN statements, the effect of the INTO and USING keywords are different. A Descriptor Area can also be manually built to provide the input parameters for a query or a cursor and USING SQL DESCRIPTOR name is the way to pass the input parameters into a parameterized query. The statement to build a named SQL Descriptor Area is below:

PostgreSQL supports retrieving more that one record in one FETCH statement and storing the data in host variables in this case assumes that the variable is an array. E.g.:

An SQLDA Descriptor Area is a C language structure which can be also used to get the result set and the metadata of a query. One structure stores one record from the result set.

Note that the SQL keyword is omitted. The paragraphs about the use cases of the INTO and USING keywords in Section 34.7.1 also apply here with an addition. In a DESCRIBE statement the DESCRIPTOR keyword can be completely omitted if the INTO keyword is used:

The general flow of a program that uses SQLDA is:

Prepare a query, and declare a cursor for it.

Declare an SQLDA for the result rows.

Declare an SQLDA for the input parameters, and initialize them (memory allocation, parameter settings).

Open a cursor with the input SQLDA.

Fetch rows from the cursor, and store them into an output SQLDA.

Read values from the output SQLDA into the host variables (with conversion if necessary).

Free the memory area allocated for the input SQLDA.

SQLDA uses three data structure types: sqlda_t, sqlvar_t, and struct sqlname.

PostgreSQL's SQLDA has a similar data structure to the one in IBM DB2 Universal Database, so some technical information on DB2's SQLDA could help understanding PostgreSQL's one better.

The structure type sqlda_t is the type of the actual SQLDA. It holds one record. And two or more sqlda_t structures can be connected in a linked list with the pointer in the desc_next field, thus representing an ordered collection of rows. So, when two or more rows are fetched, the application can read them by following the desc_next pointer in each sqlda_t node.

The definition of sqlda_t is:

The meaning of the fields is:

It contains the literal string "SQLDA ".

It contains the size of the allocated space in bytes.

It contains the number of input parameters for a parameterized query in case it's passed into OPEN, DECLARE or EXECUTE statements using the USING keyword. In case it's used as output of SELECT, EXECUTE or FETCH statements, its value is the same as sqld statement

It contains the number of fields in a result set.

If the query returns more than one record, multiple linked SQLDA structures are returned, and desc_next holds a pointer to the next entry in the list.

This is the array of the columns in the result set.

The structure type sqlvar_t holds a column value and metadata such as type and length. The definition of the type is:

The meaning of the fields is:

Contains the type identifier of the field. For values, see enum ECPGttype in ecpgtype.h.

Contains the binary length of the field. e.g., 4 bytes for ECPGt_int.

Points to the data. The format of the data is described in Section 34.4.4.

Points to the null indicator. 0 means not null, -1 means null.

The name of the field.

A struct sqlname structure holds a column name. It is used as a member of the sqlvar_t structure. The definition of the structure is:

The meaning of the fields is:

Contains the length of the field name.

Contains the actual field name.

The general steps to retrieve a query result set through an SQLDA are:

Declare an sqlda_t structure to receive the result set.

Execute FETCH/EXECUTE/DESCRIBE commands to process a query specifying the declared SQLDA.

Check the number of records in the result set by looking at sqln, a member of the sqlda_t structure.

Get the values of each column from sqlvar[0], sqlvar[1], etc., members of the sqlda_t structure.

Go to next row (sqlda_t structure) by following the desc_next pointer, a member of the sqlda_t structure.

Repeat above as you need.

Here is an example retrieving a result set through an SQLDA.

First, declare a sqlda_t structure to receive the result set.

Next, specify the SQLDA in a command. This is a FETCH command example.

Run a loop following the linked list to retrieve the rows.

Inside the loop, run another loop to retrieve each column data (sqlvar_t structure) of the row.

To get a column value, check the sqltype value, a member of the sqlvar_t structure. Then, switch to an appropriate way, depending on the column type, to copy data from the sqlvar field to a host variable.

The general steps to use an SQLDA to pass input parameters to a prepared query are:

Create a prepared query (prepared statement)

Declare an sqlda_t structure as an input SQLDA.

Allocate memory area (as sqlda_t structure) for the input SQLDA.

Set (copy) input values in the allocated memory.

Open a cursor with specifying the input SQLDA.

First, create a prepared statement.

Next, allocate memory for an SQLDA, and set the number of input parameters in sqln, a member variable of the sqlda_t structure. When two or more input parameters are required for the prepared query, the application has to allocate additional memory space which is calculated by (nr. of params - 1) * sizeof(sqlvar_t). The example shown here allocates memory space for two input parameters.

After memory allocation, store the parameter values into the sqlvar[] array. (This is same array used for retrieving column values when the SQLDA is receiving a result set.) In this example, the input parameters are "postgres", having a string type, and 1, having an integer type.

By opening a cursor and specifying the SQLDA that was set up beforehand, the input parameters are passed to the prepared statement.

Finally, after using input SQLDAs, the allocated memory space must be freed explicitly, unlike SQLDAs used for receiving query results.

Here is an example program, which describes how to fetch access statistics of the databases, specified by the input parameters, from the system catalogs.

This application joins two system tables, pg_database and pg_stat_database on the database OID, and also fetches and shows the database statistics which are retrieved by two input parameters (a database postgres, and OID 1).

First, declare an SQLDA for input and an SQLDA for output.

Next, connect to the database, prepare a statement, and declare a cursor for the prepared statement.

Next, put some values in the input SQLDA for the input parameters. Allocate memory for the input SQLDA, and set the number of input parameters to sqln. Store type, value, and value length into sqltype, sqldata, and sqllen in the sqlvar structure.

After setting up the input SQLDA, open a cursor with the input SQLDA.

Fetch rows into the output SQLDA from the opened cursor. (Generally, you have to call FETCH repeatedly in the loop, to fetch all rows in the result set.)

Next, retrieve the fetched records from the SQLDA, by following the linked list of the sqlda_t structure.

Read each columns in the first record. The number of columns is stored in sqld, the actual data of the first column is stored in sqlvar[0], both members of the sqlda_t structure.

Now, the column data is stored in the variable v. Copy every datum into host variables, looking at v.sqltype for the type of the column.

Close the cursor after processing all of records, and disconnect from the database.

The whole program is shown in Example 34.1.

Example 34.1. Example SQLDA Program

The output of this example should look something like the following (some numbers will vary).

**Examples:**

Example 1 (unknown):
```unknown
EXEC SQL ALLOCATE DESCRIPTOR identifier;
```

Example 2 (unknown):
```unknown
EXEC SQL DEALLOCATE DESCRIPTOR identifier;
```

Example 3 (sql):
```sql
EXEC SQL FETCH NEXT FROM mycursor INTO SQL DESCRIPTOR mydesc;
```

Example 4 (sql):
```sql
EXEC SQL BEGIN DECLARE SECTION;
char *sql_stmt = "SELECT * FROM table1";
EXEC SQL END DECLARE SECTION;

EXEC SQL PREPARE stmt1 FROM :sql_stmt;
EXEC SQL DESCRIBE stmt1 INTO SQL DESCRIPTOR mydesc;
```

---


---

