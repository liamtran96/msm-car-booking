# PostgreSQL - Ecpg (Part 11)

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-declare.html

**Contents:**
- DECLARE
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DECLARE — define a cursor

DECLARE declares a cursor for iterating over the result set of a prepared statement. This command has slightly different semantics from the direct SQL command DECLARE: Whereas the latter executes a query and prepares the result set for retrieval, this embedded SQL command merely declares a name as a “loop variable” for iterating over the result set of a query; the actual execution happens when the cursor is opened with the OPEN command.

A cursor name, case sensitive. This can be an SQL identifier or a host variable.

The name of a prepared query, either as an SQL identifier or a host variable.

A SELECT or VALUES command which will provide the rows to be returned by the cursor.

For the meaning of the cursor options, see DECLARE.

Examples declaring a cursor for a query:

An example declaring a cursor for a prepared statement:

DECLARE is specified in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
cursor_name
```

Example 2 (unknown):
```unknown
prepared_name
```

Example 3 (unknown):
```unknown
cursor_name
```

Example 4 (unknown):
```unknown
cursor_name
```

---


---

## 34.10. Processing Embedded SQL Programs #


**URL:** https://www.postgresql.org/docs/18/ecpg-process.html

**Contents:**
- 34.10. Processing Embedded SQL Programs #

Now that you have an idea how to form embedded SQL C programs, you probably want to know how to compile them. Before compiling you run the file through the embedded SQL C preprocessor, which converts the SQL statements you used to special function calls. After compiling, you must link with a special library that contains the needed functions. These functions fetch information from the arguments, perform the SQL command using the libpq interface, and put the result in the arguments specified for output.

The preprocessor program is called ecpg and is included in a normal PostgreSQL installation. Embedded SQL programs are typically named with an extension .pgc. If you have a program file called prog1.pgc, you can preprocess it by simply calling:

This will create a file called prog1.c. If your input files do not follow the suggested naming pattern, you can specify the output file explicitly using the -o option.

The preprocessed file can be compiled normally, for example:

The generated C source files include header files from the PostgreSQL installation, so if you installed PostgreSQL in a location that is not searched by default, you have to add an option such as -I/usr/local/pgsql/include to the compilation command line.

To link an embedded SQL program, you need to include the libecpg library, like so:

Again, you might have to add an option like -L/usr/local/pgsql/lib to that command line.

You can use pg_config or pkg-config with package name libecpg to get the paths for your installation.

If you manage the build process of a larger project using make, it might be convenient to include the following implicit rule to your makefiles:

The complete syntax of the ecpg command is detailed in ecpg.

The ecpg library is thread-safe by default. However, you might need to use some threading command-line options to compile your client code.

**Examples:**

Example 1 (unknown):
```unknown
ecpg prog1.pgc
```

Example 2 (unknown):
```unknown
cc -c prog1.c
```

Example 3 (unknown):
```unknown
-I/usr/local/pgsql/include
```

Example 4 (unknown):
```unknown
cc -o myprog prog1.o prog2.o ... -lecpg
```

---


---

## Chapter 34. ECPG — Embedded SQL in C


**URL:** https://www.postgresql.org/docs/18/ecpg.html

**Contents:**
- Chapter 34. ECPG — Embedded SQL in C

This chapter describes the embedded SQL package for PostgreSQL. It was written by Linus Tolke (<linus@epact.se>) and Michael Meskes (<meskes@postgresql.org>). Originally it was written to work with C. It also works with C++, but it does not recognize all C++ constructs yet.

This documentation is quite incomplete. But since this interface is standardized, additional information can be found in many resources about SQL.

**Examples:**

Example 1 (python):
```python
<linus@epact.se>
```

Example 2 (python):
```python
<meskes@postgresql.org>
```

---


---

