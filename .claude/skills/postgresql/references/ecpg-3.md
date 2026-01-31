# PostgreSQL - Ecpg (Part 3)

## 34.13. C++ Applications #


**URL:** https://www.postgresql.org/docs/18/ecpg-cpp.html

**Contents:**
- 34.13. C++ Applications #
  - 34.13.1. Scope for Host Variables #
  - 34.13.2. C++ Application Development with External C Module #

ECPG has some limited support for C++ applications. This section describes some caveats.

The ecpg preprocessor takes an input file written in C (or something like C) and embedded SQL commands, converts the embedded SQL commands into C language chunks, and finally generates a .c file. The header file declarations of the library functions used by the C language chunks that ecpg generates are wrapped in extern "C" { ... } blocks when used under C++, so they should work seamlessly in C++.

In general, however, the ecpg preprocessor only understands C; it does not handle the special syntax and reserved words of the C++ language. So, some embedded SQL code written in C++ application code that uses complicated features specific to C++ might fail to be preprocessed correctly or might not work as expected.

A safe way to use the embedded SQL code in a C++ application is hiding the ECPG calls in a C module, which the C++ application code calls into to access the database, and linking that together with the rest of the C++ code. See Section 34.13.2 about that.

The ecpg preprocessor understands the scope of variables in C. In the C language, this is rather simple because the scopes of variables is based on their code blocks. In C++, however, the class member variables are referenced in a different code block from the declared position, so the ecpg preprocessor will not understand the scope of the class member variables.

For example, in the following case, the ecpg preprocessor cannot find any declaration for the variable dbname in the test method, so an error will occur.

This code will result in an error like this:

To avoid this scope issue, the test method could be modified to use a local variable as intermediate storage. But this approach is only a poor workaround, because it uglifies the code and reduces performance.

If you understand these technical limitations of the ecpg preprocessor in C++, you might come to the conclusion that linking C objects and C++ objects at the link stage to enable C++ applications to use ECPG features could be better than writing some embedded SQL commands in C++ code directly. This section describes a way to separate some embedded SQL commands from C++ application code with a simple example. In this example, the application is implemented in C++, while C and ECPG is used to connect to the PostgreSQL server.

Three kinds of files have to be created: a C file (*.pgc), a header file, and a C++ file:

A sub-routine module to execute SQL commands embedded in C. It is going to be converted into test_mod.c by the preprocessor.

A header file with declarations of the functions in the C module (test_mod.pgc). It is included by test_cpp.cpp. This file has to have an extern "C" block around the declarations, because it will be linked from the C++ module.

The main code for the application, including the main routine, and in this example a C++ class.

To build the application, proceed as follows. Convert test_mod.pgc into test_mod.c by running ecpg, and generate test_mod.o by compiling test_mod.c with the C compiler:

Next, generate test_cpp.o by compiling test_cpp.cpp with the C++ compiler:

Finally, link these object files, test_cpp.o and test_mod.o, into one executable, using the C++ compiler driver:

**Examples:**

Example 1 (unknown):
```unknown
extern "C" { ... }
```

Example 2 (c):
```c
class TestCpp
{
    EXEC SQL BEGIN DECLARE SECTION;
    char dbname[1024];
    EXEC SQL END DECLARE SECTION;

  public:
    TestCpp();
    void test();
    ~TestCpp();
};

TestCpp::TestCpp()
{
    EXEC SQL CONNECT TO testdb1;
    EXEC SQL SELECT pg_catalog.set_config('search_path', '', false); EXEC SQL COMMIT;
}

void Test::test()
{
    EXEC SQL SELECT current_database() INTO :dbname;
    printf("current_database = %s\n", dbname);
}

TestCpp::~TestCpp()
{
    EXEC SQL DISCONNECT ALL;
}
```

Example 3 (json):
```json
ecpg test_cpp.pgc
test_cpp.pgc:28: ERROR: variable "dbname" is not declared
```

Example 4 (unknown):
```unknown
ecpg test_cpp.pgc
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-connect.html

**Contents:**
- CONNECT
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

CONNECT — establish a database connection

The CONNECT command establishes a connection between the client and the PostgreSQL server.

connection_target specifies the target server of the connection on one of several forms.

Connect over Unix-domain sockets

containing a value in one of the above forms

host variable of type char[] or VARCHAR[] containing a value in one of the above forms

An optional identifier for the connection, so that it can be referred to in other commands. This can be an SQL identifier or a host variable.

The user name for the database connection.

This parameter can also specify user name and password, using one the forms user_name/password, user_name IDENTIFIED BY password, or user_name USING password.

User name and password can be SQL identifiers, string constants, or host variables.

Use all default connection parameters, as defined by libpq.

Here a several variants for specifying connection parameters:

Here is an example program that illustrates the use of host variables to specify connection parameters:

CONNECT is specified in the SQL standard, but the format of the connection parameters is implementation-specific.

**Examples:**

Example 1 (unknown):
```unknown
connection_target
```

Example 2 (unknown):
```unknown
connection_name
```

Example 3 (unknown):
```unknown
connection_user
```

Example 4 (unknown):
```unknown
connection_user
```

---


---

