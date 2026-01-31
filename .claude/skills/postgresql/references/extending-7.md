# PostgreSQL - Extending (Part 7)

## 36.10. C-Language Functions # (continued)
Place the extension module implementing the custom cumulative statistics type in shared_preload_libraries so that it will be loaded early during PostgreSQL startup.

An example describing how to register and use custom statistics can be found in src/test/modules/injection_points.

Although the PostgreSQL backend is written in C, it is possible to write extensions in C++ if these guidelines are followed:

All functions accessed by the backend must present a C interface to the backend; these C functions can then call C++ functions. For example, extern C linkage is required for backend-accessed functions. This is also necessary for any functions that are passed as pointers between the backend and C++ code.

Free memory using the appropriate deallocation method. For example, most backend memory is allocated using palloc(), so use pfree() to free it. Using C++ delete in such cases will fail.

Prevent exceptions from propagating into the C code (use a catch-all block at the top level of all extern C functions). This is necessary even if the C++ code does not explicitly throw any exceptions, because events like out-of-memory can still throw exceptions. Any exceptions must be caught and appropriate errors passed back to the C interface. If possible, compile C++ with -fno-exceptions to eliminate exceptions entirely; in such cases, you must check for failures in your C++ code, e.g., check for NULL returned by new().

If calling backend functions from C++ code, be sure that the C++ call stack contains only plain old data structures (POD). This is necessary because backend errors generate a distant longjmp() that does not properly unroll a C++ call stack with non-POD objects.

In summary, it is best to place C++ code behind a wall of extern C functions that interface to the backend, and avoid exception, memory, and call stack leakage.

**Examples:**

Example 1 (unknown):
```unknown
PG_FUNCTION_INFO_V1()
```

Example 2 (unknown):
```unknown
CREATE FUNCTION
```

Example 3 (unknown):
```unknown
CREATE FUNCTION
```

Example 4 (unknown):
```unknown
pg_config --pkglibdir
```

---


---

## 36.9. Internal Functions #


**URL:** https://www.postgresql.org/docs/18/xfunc-internal.html

**Contents:**
- 36.9. Internal Functions #
  - Note

Internal functions are functions written in C that have been statically linked into the PostgreSQL server. The “body” of the function definition specifies the C-language name of the function, which need not be the same as the name being declared for SQL use. (For reasons of backward compatibility, an empty body is accepted as meaning that the C-language function name is the same as the SQL name.)

Normally, all internal functions present in the server are declared during the initialization of the database cluster (see Section 18.2), but a user could use CREATE FUNCTION to create additional alias names for an internal function. Internal functions are declared in CREATE FUNCTION with language name internal. For instance, to create an alias for the sqrt function:

(Most internal functions expect to be declared “strict”.)

Not all “predefined” functions are “internal” in the above sense. Some predefined functions are written in SQL.

**Examples:**

Example 1 (unknown):
```unknown
CREATE FUNCTION
```

Example 2 (unknown):
```unknown
CREATE FUNCTION
```

Example 3 (javascript):
```javascript
CREATE FUNCTION square_root(double precision) RETURNS double precision
    AS 'dsqrt'
    LANGUAGE internal
    STRICT;
```

---


---

## 36.14. User-Defined Operators #


**URL:** https://www.postgresql.org/docs/18/xoper.html

**Contents:**
- 36.14. User-Defined Operators #

Every operator is “syntactic sugar” for a call to an underlying function that does the real work; so you must first create the underlying function before you can create the operator. However, an operator is not merely syntactic sugar, because it carries additional information that helps the query planner optimize queries that use the operator. The next section will be devoted to explaining that additional information.

PostgreSQL supports prefix and infix operators. Operators can be overloaded; that is, the same operator name can be used for different operators that have different numbers and types of operands. When a query is executed, the system determines the operator to call from the number and types of the provided operands.

Here is an example of creating an operator for adding two complex numbers. We assume we've already created the definition of type complex (see Section 36.13). First we need a function that does the work, then we can define the operator:

Now we could execute a query like this:

We've shown how to create a binary operator here. To create a prefix operator, just omit the leftarg. The function clause and the argument clauses are the only required items in CREATE OPERATOR. The commutator clause shown in the example is an optional hint to the query optimizer. Further details about commutator and other optimizer hints appear in the next section.

**Examples:**

Example 1 (javascript):
```javascript
CREATE FUNCTION complex_add(complex, complex)
    RETURNS complex
    AS 'filename', 'complex_add'
    LANGUAGE C IMMUTABLE STRICT;

CREATE OPERATOR + (
    leftarg = complex,
    rightarg = complex,
    function = complex_add,
    commutator = +
);
```

Example 2 (sql):
```sql
SELECT (a + b) AS c FROM test_complex;

        c
-----------------
 (5.2,6.05)
 (133.42,144.95)
```

Example 3 (unknown):
```unknown
CREATE OPERATOR
```

---


---

