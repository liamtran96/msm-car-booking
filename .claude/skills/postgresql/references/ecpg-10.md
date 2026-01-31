# PostgreSQL - Ecpg (Part 10)

## 34.6. pgtypes Library # (continued)

A value of type timestamp representing an invalid time stamp. This is returned by the function PGTYPEStimestamp_from_asc on parse error. Note that due to the internal representation of the timestamp data type, PGTYPESInvalidTimestamp is also a valid timestamp at the same time. It is set to 1899-12-31 23:59:59. In order to detect errors, make sure that your application does not only test for PGTYPESInvalidTimestamp but also for errno != 0 after each call to PGTYPEStimestamp_from_asc.

**Examples:**

Example 1 (sql):
```sql
EXEC SQL BEGIN DECLARE SECTION;
   date date1;
   timestamp ts1, tsout;
   interval iv1;
   char *out;
EXEC SQL END DECLARE SECTION;

PGTYPESdate_today(&date1);
EXEC SQL SELECT started, duration INTO :ts1, :iv1 FROM datetbl WHERE d=:date1;
PGTYPEStimestamp_add_interval(&ts1, &iv1, &tsout);
out = PGTYPEStimestamp_to_asc(&tsout);
printf("Started + duration: %s\n", out);
PGTYPESchar_free(out);
```

Example 2 (unknown):
```unknown
PGTYPESnumeric_to_asc
```

Example 3 (unknown):
```unknown
PGTYPESchar_free
```

Example 4 (unknown):
```unknown
PGTYPESnumeric_new
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-prepare.html

**Contents:**
- PREPARE
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

PREPARE — prepare a statement for execution

PREPARE prepares a statement dynamically specified as a string for execution. This is different from the direct SQL statement PREPARE, which can also be used in embedded programs. The EXECUTE command is used to execute either kind of prepared statement.

An identifier for the prepared query.

A literal string or a host variable containing a preparable SQL statement, one of SELECT, INSERT, UPDATE, or DELETE. Use question marks (?) for parameter values to be supplied at execution.

In typical usage, the string is a host variable reference to a string containing a dynamically-constructed SQL statement. The case of a literal string is not very useful; you might as well just write a direct SQL PREPARE statement.

If you do use a literal string, keep in mind that any double quotes you might wish to include in the SQL statement must be written as octal escapes (\042) not the usual C idiom \". This is because the string is inside an EXEC SQL section, so the ECPG lexer parses it according to SQL rules not C rules. Any embedded backslashes will later be handled according to C rules; but \" causes an immediate syntax error because it is seen as ending the literal.

PREPARE is specified in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
prepared_name
```

Example 2 (unknown):
```unknown
prepared_name
```

Example 3 (sql):
```sql
char *stmt = "SELECT * FROM test1 WHERE a = ? AND b = ?";

EXEC SQL ALLOCATE DESCRIPTOR outdesc;
EXEC SQL PREPARE foo FROM :stmt;

EXEC SQL EXECUTE foo USING SQL DESCRIPTOR indesc INTO SQL DESCRIPTOR outdesc;
```

---


---

## 34.4. Using Host Variables #


**URL:** https://www.postgresql.org/docs/18/ecpg-variables.html

**Contents:**
- 34.4. Using Host Variables #
  - 34.4.1. Overview #
  - 34.4.2. Declare Sections #
  - 34.4.3. Retrieving Query Results #
  - 34.4.4. Type Mapping #
    - 34.4.4.1. Handling Character Strings #
    - 34.4.4.2. Accessing Special Data Types #
      - 34.4.4.2.1. timestamp, date #
      - 34.4.4.2.2. interval #
      - 34.4.4.2.3. numeric, decimal #

In Section 34.3 you saw how you can execute SQL statements from an embedded SQL program. Some of those statements only used fixed values and did not provide a way to insert user-supplied values into statements or have the program process the values returned by the query. Those kinds of statements are not really useful in real applications. This section explains in detail how you can pass data between your C program and the embedded SQL statements using a simple mechanism called host variables. In an embedded SQL program we consider the SQL statements to be guests in the C program code which is the host language. Therefore the variables of the C program are called host variables.

Another way to exchange values between PostgreSQL backends and ECPG applications is the use of SQL descriptors, described in Section 34.7.

Passing data between the C program and the SQL statements is particularly simple in embedded SQL. Instead of having the program paste the data into the statement, which entails various complications, such as properly quoting the value, you can simply write the name of a C variable into the SQL statement, prefixed by a colon. For example:

This statement refers to two C variables named v1 and v2 and also uses a regular SQL string literal, to illustrate that you are not restricted to use one kind of data or the other.

This style of inserting C variables in SQL statements works anywhere a value expression is expected in an SQL statement.

To pass data from the program to the database, for example as parameters in a query, or to pass data from the database back to the program, the C variables that are intended to contain this data need to be declared in specially marked sections, so the embedded SQL preprocessor is made aware of them.

This section starts with:

Between those lines, there must be normal C variable declarations, such as:

As you can see, you can optionally assign an initial value to the variable. The variable's scope is determined by the location of its declaring section within the program. You can also declare variables with the following syntax which implicitly creates a declare section:

You can have as many declare sections in a program as you like.

The declarations are also echoed to the output file as normal C variables, so there's no need to declare them again. Variables that are not intended to be used in SQL commands can be declared normally outside these special sections.

The definition of a structure or union also must be listed inside a DECLARE section. Otherwise the preprocessor cannot handle these types since it does not know the definition.

Now you should be able to pass data generated by your program into an SQL command. But how do you retrieve the results of a query? For that purpose, embedded SQL provides special variants of the usual commands SELECT and FETCH. These commands have a special INTO clause that specifies which host variables the retrieved values are to be stored in. SELECT is used for a query that returns only single row, and FETCH is used for a query that returns multiple rows, using a cursor.

So the INTO clause appears between the select list and the FROM clause. The number of elements in the select list and the list after INTO (also called the target list) must be equal.

Here is an example using the command FETCH:

Here the INTO clause appears after all the normal clauses.

When ECPG applications exchange values between the PostgreSQL server and the C application, such as when retrieving query results from the server or executing SQL statements with input parameters, the values need to be converted between PostgreSQL data types and host language variable types (C language data types, concretely). One of the main points of ECPG is that it takes care of this automatically in most cases.

In this respect, there are two kinds of data types: Some simple PostgreSQL data types, such as integer and text, can be read and written by the application directly. Other PostgreSQL data types, such as timestamp and numeric can only be accessed through special library functions; see Section 34.4.4.2.

Table 34.1 shows which PostgreSQL data types correspond to which C data types. When you wish to send or receive a value of a given PostgreSQL data type, you should declare a C variable of the corresponding C data type in the declare section.

Table 34.1. Mapping Between PostgreSQL Data Types and C Variable Types

[a] This type can only be accessed through special library functions; see Section 34.4.4.2.

[b] declared in ecpglib.h if not native

To handle SQL character string data types, such as varchar and text, there are two possible ways to declare the host variables.

One way is using char[], an array of char, which is the most common way to handle character data in C.

Note that you have to take care of the length yourself. If you use this host variable as the target variable of a query which returns a string with more than 49 characters, a buffer overflow occurs.

The other way is using the VARCHAR type, which is a special type provided by ECPG. The definition on an array of type VARCHAR is converted into a named struct for every variable. A declaration like:

The member arr hosts the string including a terminating zero byte. Thus, to store a string in a VARCHAR host variable, the host variable has to be declared with the length including the zero byte terminator. The member len holds the length of the string stored in the arr without the terminating zero byte. When a host variable is used as input for a query, if strlen(arr) and len are different, the shorter one is used.

VARCHAR can be written in upper or lower case, but not in mixed case.

char and VARCHAR host variables can also hold values of other SQL types, which will be stored in their string forms.

ECPG contains some special types that help you to interact easily with some special data types from the PostgreSQL server. In particular, it has implemented support for the numeric, decimal, date, timestamp, and interval types. These data types cannot usefully be mapped to primitive host variable types (such as int, long long int, or char[]), because they have a complex internal structure. Applications deal with these types by declaring host variables in special types and accessing them using functions in the pgtypes library. The pgtypes library, described in detail in Section 34.6 contains basic functions to deal with those types, such that you do not need to send a query to the SQL server just for adding an interval to a time stamp for example.

The follow subsections describe these special data types. For more details about pgtypes library functions, see Section 34.6.

Here is a pattern for handling timestamp variables in the ECPG host application.

First, the program has to include the header file for the timestamp type:

Next, declare a host variable as type timestamp in the declare section:

And after reading a value into the host variable, process it using pgtypes library functions. In following example, the timestamp value is converted into text (ASCII) form with the PGTYPEStimestamp_to_asc() function:

This example will show some result like following:

In addition, the DATE type can be handled in the same way. The program has to include pgtypes_date.h, declare a host variable as the date type and convert a DATE value into a text form using PGTYPESdate_to_asc() function. For more details about the pgtypes library functions, see Section 34.6.

The handling of the interval type is also similar to the timestamp and date types. It is required, however, to allocate memory for an interval type value explicitly. In other words, the memory space for the variable has to be allocated in the heap memory, not in the stack memory.

Here is an example program:

The handling of the numeric and decimal types is similar to the interval type: It requires defining a pointer, allocating some memory space on the heap, and accessing the variable using the pgtypes library functions. For more details about the pgtypes library functions, see Section 34.6.

No functions are provided specifically for the decimal type. An application has to convert it to a numeric variable using a pgtypes library function to do further processing.

Here is an example program handling numeric and decimal type variables.

The handling of the bytea type is similar to that of VARCHAR. The definition on an array of type bytea is converted into a named struct for every variable. A declaration like:

The member arr hosts binary format data. It can also handle '\0' as part of data, unlike VARCHAR. The data is converted from/to hex format and sent/received by ecpglib.

bytea variable can be used only when bytea_output is set to hex.

As a host variable you can also use arrays, typedefs, structs, and pointers.

There are two use cases for arrays as host variables. The first is a way to store some text string in char[] or VARCHAR[], as explained in Section 34.4.4.1. The second use case is to retrieve multiple rows from a query result without using a cursor. Without an array, to process a query result consisting of multiple rows, it is required to use a cursor and the FETCH command. But with array host variables, multiple rows can be received at once. The length of the array has to be defined to be able to accommodate all rows, otherwise a buffer overflow will likely occur.

Following example scans the pg_database system table and shows all OIDs and names of the available databases:

This example shows following result. (The exact values depend on local circumstances.)

A structure whose member names match the column names of a query result, can be used to retrieve multiple columns at once. The structure enables handling multiple column values in a single host variable.

The following example retrieves OIDs, names, and sizes of the available databases from the pg_database system table and using the pg_database_size() function. In this example, a structure variable dbinfo_t with members whose names match each column in the SELECT result is used to retrieve one result row without putting multiple host variables in the FETCH statement.

This example shows following result. (The exact values depend on local circumstances.)

Structure host variables “absorb” as many columns as the structure as fields. Additional columns can be assigned to other host variables. For example, the above program could also be restructured like this, with the size variable outside the structure:

Use the typedef keyword to map new types to already existing types.

Note that you could also use:

This declaration does not need to be part of a declare section; that is, you can also write typedefs as normal C statements.

Any word you declare as a typedef cannot be used as an SQL keyword in EXEC SQL commands later in the same program. For example, this won't work:

ECPG will report a syntax error for START TRANSACTION, because it no longer recognizes START as an SQL keyword, only as a typedef. (If you have such a conflict, and renaming the typedef seems impractical, you could write the SQL command using dynamic SQL.)

In PostgreSQL releases before v16, use of SQL keywords as typedef names was likely to result in syntax errors associated with use of the typedef itself, rather than use of the name as an SQL keyword. The new behavior is less likely to cause problems when an existing ECPG application is recompiled in a new PostgreSQL release with new keywords.

You can declare pointers to the most common types. Note however that you cannot use pointers as target variables of queries without auto-allocation. See Section 34.7 for more information on auto-allocation.

This section contains information on how to handle nonscalar and user-defined SQL-level data types in ECPG applications. Note that this is distinct from the handling of host variables of nonprimitive types, described in the previous section.

Multi-dimensional SQL-level arrays are not directly supported in ECPG. One-dimensional SQL-level arrays can be mapped into C array host variables and vice-versa. However, when creating a statement ecpg does not know the types of the columns, so that it cannot check if a C array is input into a corresponding SQL-level array. When processing the output of an SQL statement, ecpg has the necessary information and thus checks if both are arrays.

If a query accesses elements of an array separately, then this avoids the use of arrays in ECPG. Then, a host variable with a type that can be mapped to the element type should be used. For example, if a column type is array of integer, a host variable of type int can be used. Also if the element type is varchar or text, a host variable of type char[] or VARCHAR[] can be used.

Here is an example. Assume the following table:

The following example program retrieves the 4th element of the array and stores it into a host variable of type int:

This example shows the following result:

To map multiple array elements to the multiple elements in an array type host variables each element of array column and each element of the host variable array have to be managed separately, for example:

would not work correctly in this case, because you cannot map an array type column to an array host variable directly.

Another workaround is to store arrays in their external string representation in host variables of type char[] or VARCHAR[]. For more details about this representation, see Section 8.15.2. Note that this means that the array cannot be accessed naturally as an array in the host program (without further processing that parses the text representation).

Composite types are not directly supported in ECPG, but an easy workaround is possible. The available workarounds are similar to the ones described for arrays above: Either access each attribute separately or use the external string representation.

For the following examples, assume the following type and table:

The most obvious solution is to access each attribute separately. The following program retrieves data from the example table by selecting each attribute of the type comp_t separately:

To enhance this example, the host variables to store values in the FETCH command can be gathered into one structure. For more details about the host variable in the structure form, see Section 34.4.4.3.2. To switch to the structure, the example can be modified as below. The two host variables, intval and textval, become members of the comp_t structure, and the structure is specified on the FETCH command.

Although a structure is used in the FETCH command, the attribute names in the SELECT clause are specified one by one. This can be enhanced by using a * to ask for all attributes of the composite type value.

This way, composite types can be mapped into structures almost seamlessly, even though ECPG does not understand the composite type itself.

Finally, it is also possible to store composite type values in their external string representation in host variables of type char[] or VARCHAR[]. But that way, it is not easily possible to access the fields of the value from the host program.

New user-defined base types are not directly supported by ECPG. You can use the external string representation and host variables of type char[] or VARCHAR[], and this solution is indeed appropriate and sufficient for many types.

Here is an example using the data type complex from the example in Section 36.13. The external string representation of that type is (%f,%f), which is defined in the functions complex_in() and complex_out() functions in Section 36.13. The following example inserts the complex type values (1,1) and (3,3) into the columns a and b, and select them from the table after that.

This example shows following result:

Another workaround is avoiding the direct use of the user-defined types in ECPG and instead create a function or cast that converts between the user-defined type and a primitive type that ECPG can handle. Note, however, that type casts, especially implicit ones, should be introduced into the type system very carefully.

After this definition, the following

has the same effect as

The examples above do not handle null values. In fact, the retrieval examples will raise an error if they fetch a null value from the database. To be able to pass null values to the database or retrieve null values from the database, you need to append a second host variable specification to each host variable that contains data. This second host variable is called the indicator and contains a flag that tells whether the datum is null, in which case the value of the real host variable is ignored. Here is an example that handles the retrieval of null values correctly:

The indicator variable val_ind will be zero if the value was not null, and it will be negative if the value was null. (See Section 34.16 to enable Oracle-specific behavior.)

The indicator has another function: if the indicator value is positive, it means that the value is not null, but it was truncated when it was stored in the host variable.

If the argument -r no_indicator is passed to the preprocessor ecpg, it works in “no-indicator” mode. In no-indicator mode, if no indicator variable is specified, null values are signaled (on input and output) for character string types as empty string and for integer types as the lowest possible value for type (for example, INT_MIN for int).

**Examples:**

Example 1 (sql):
```sql
EXEC SQL INSERT INTO sometable VALUES (:v1, 'foo', :v2);
```

Example 2 (unknown):
```unknown
EXEC SQL BEGIN DECLARE SECTION;
```

Example 3 (julia):
```julia
EXEC SQL END DECLARE SECTION;
```

Example 4 (unknown):
```unknown
int   x = 4;
char  foo[16], bar[16];
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-set-autocommit.html

**Contents:**
- SET AUTOCOMMIT
- Synopsis
- Description
- Compatibility

SET AUTOCOMMIT — set the autocommit behavior of the current session

SET AUTOCOMMIT sets the autocommit behavior of the current database session. By default, embedded SQL programs are not in autocommit mode, so COMMIT needs to be issued explicitly when desired. This command can change the session to autocommit mode, where each individual statement is committed implicitly.

SET AUTOCOMMIT is an extension of PostgreSQL ECPG.

**Examples:**

Example 1 (unknown):
```unknown
SET AUTOCOMMIT
```

Example 2 (unknown):
```unknown
SET AUTOCOMMIT
```

---


---

