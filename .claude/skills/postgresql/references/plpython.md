# PostgreSQL - Plpython

## 44.3. Sharing Data #


**URL:** https://www.postgresql.org/docs/18/plpython-sharing.html

**Contents:**
- 44.3. Sharing Data #

The global dictionary SD is available to store private data between repeated calls to the same function. The global dictionary GD is public data, that is available to all Python functions within a session; use with care.

Each function gets its own execution environment in the Python interpreter, so that global data and function arguments from myfunc are not available to myfunc2. The exception is the data in the GD dictionary, as mentioned above.

---


---

## 44.9. Utility Functions #


**URL:** https://www.postgresql.org/docs/18/plpython-util.html

**Contents:**
- 44.9. Utility Functions #

The plpy module also provides the functions

plpy.error and plpy.fatal actually raise a Python exception which, if uncaught, propagates out to the calling query, causing the current transaction or subtransaction to be aborted. raise plpy.Error(msg) and raise plpy.Fatal(msg) are equivalent to calling plpy.error(msg) and plpy.fatal(msg), respectively but the raise form does not allow passing keyword arguments. The other functions only generate messages of different priority levels. Whether messages of a particular priority are reported to the client, written to the server log, or both is controlled by the log_min_messages and client_min_messages configuration variables. See Chapter 19 for more information.

The msg argument is given as a positional argument. For backward compatibility, more than one positional argument can be given. In that case, the string representation of the tuple of positional arguments becomes the message reported to the client.

The following keyword-only arguments are accepted:

The string representation of the objects passed as keyword-only arguments is used to enrich the messages reported to the client. For example:

Another set of utility functions are plpy.quote_literal(string), plpy.quote_nullable(string), and plpy.quote_ident(string). They are equivalent to the built-in quoting functions described in Section 9.4. They are useful when constructing ad-hoc queries. A PL/Python equivalent of dynamic SQL from Example 41.1 would be:

**Examples:**

Example 1 (unknown):
```unknown
plpy.debug(msg, **kwargs)
```

Example 2 (unknown):
```unknown
msg, **kwargs
```

Example 3 (unknown):
```unknown
plpy.log(msg, **kwargs)
```

Example 4 (unknown):
```unknown
msg, **kwargs
```

---


---

## 44.6. Database Access #


**URL:** https://www.postgresql.org/docs/18/plpython-database.html

**Contents:**
- 44.6. Database Access #
  - 44.6.1. Database Access Functions #
  - Tip
  - 44.6.2. Trapping Errors #

The PL/Python language module automatically imports a Python module called plpy. The functions and constants in this module are available to you in the Python code as plpy.foo.

The plpy module provides several functions to execute database commands:

Calling plpy.execute with a query string and an optional row limit argument causes that query to be run and the result to be returned in a result object.

If limit is specified and is greater than zero, then plpy.execute retrieves at most limit rows, much as if the query included a LIMIT clause. Omitting limit or specifying it as zero results in no row limit.

The result object emulates a list or dictionary object. The result object can be accessed by row number and column name. For example:

returns up to 5 rows from my_table. If my_table has a column my_column, it would be accessed as:

The number of rows returned can be obtained using the built-in len function.

The result object has these additional methods:

Returns the number of rows processed by the command. Note that this is not necessarily the same as the number of rows returned. For example, an UPDATE command will set this value but won't return any rows (unless RETURNING is used).

The SPI_execute() return value.

Return a list of column names, list of column type OIDs, and list of type-specific type modifiers for the columns, respectively.

These methods raise an exception when called on a result object from a command that did not produce a result set, e.g., UPDATE without RETURNING, or DROP TABLE. But it is OK to use these methods on a result set containing zero rows.

The standard __str__ method is defined so that it is possible for example to debug query execution results using plpy.debug(rv).

The result object can be modified.

Note that calling plpy.execute will cause the entire result set to be read into memory. Only use that function when you are sure that the result set will be relatively small. If you don't want to risk excessive memory usage when fetching large results, use plpy.cursor rather than plpy.execute.

plpy.prepare prepares the execution plan for a query. It is called with a query string and a list of parameter types, if you have parameter references in the query. For example:

text is the type of the variable you will be passing for $1. The second argument is optional if you don't want to pass any parameters to the query.

After preparing a statement, you use a variant of the function plpy.execute to run it:

Pass the plan as the first argument (instead of the query string), and a list of values to substitute into the query as the second argument. The second argument is optional if the query does not expect any parameters. The third argument is the optional row limit as before.

Alternatively, you can call the execute method on the plan object:

Query parameters and result row fields are converted between PostgreSQL and Python data types as described in Section 44.2.

When you prepare a plan using the PL/Python module it is automatically saved. Read the SPI documentation (Chapter 45) for a description of what this means. In order to make effective use of this across function calls one needs to use one of the persistent storage dictionaries SD or GD (see Section 44.3). For example:

The plpy.cursor function accepts the same arguments as plpy.execute (except for the row limit) and returns a cursor object, which allows you to process large result sets in smaller chunks. As with plpy.execute, either a query string or a plan object along with a list of arguments can be used, or the cursor function can be called as a method of the plan object.

The cursor object provides a fetch method that accepts an integer parameter and returns a result object. Each time you call fetch, the returned object will contain the next batch of rows, never larger than the parameter value. Once all rows are exhausted, fetch starts returning an empty result object. Cursor objects also provide an iterator interface, yielding one row at a time until all rows are exhausted. Data fetched that way is not returned as result objects, but rather as dictionaries, each dictionary corresponding to a single result row.

An example of two ways of processing data from a large table is:

Cursors are automatically disposed of. But if you want to explicitly release all resources held by a cursor, use the close method. Once closed, a cursor cannot be fetched from anymore.

Do not confuse objects created by plpy.cursor with DB-API cursors as defined by the Python Database API specification. They don't have anything in common except for the name.

Functions accessing the database might encounter errors, which will cause them to abort and raise an exception. Both plpy.execute and plpy.prepare can raise an instance of a subclass of plpy.SPIError, which by default will terminate the function. This error can be handled just like any other Python exception, by using the try/except construct. For example:

The actual class of the exception being raised corresponds to the specific condition that caused the error. Refer to Table A.1 for a list of possible conditions. The module plpy.spiexceptions defines an exception class for each PostgreSQL condition, deriving their names from the condition name. For instance, division_by_zero becomes DivisionByZero, unique_violation becomes UniqueViolation, fdw_error becomes FdwError, and so on. Each of these exception classes inherits from SPIError. This separation makes it easier to handle specific errors, for instance:

Note that because all exceptions from the plpy.spiexceptions module inherit from SPIError, an except clause handling it will catch any database access error.

As an alternative way of handling different error conditions, you can catch the SPIError exception and determine the specific error condition inside the except block by looking at the sqlstate attribute of the exception object. This attribute is a string value containing the “SQLSTATE” error code. This approach provides approximately the same functionality

**Examples:**

Example 1 (unknown):
```unknown
plpy.execute(query [, limit])
```

Example 2 (unknown):
```unknown
plpy.execute
```

Example 3 (unknown):
```unknown
plpy.execute
```

Example 4 (sql):
```sql
rv = plpy.execute("SELECT * FROM my_table", 5)
```

---


---

## 44.1. PL/Python Functions #


**URL:** https://www.postgresql.org/docs/18/plpython-funcs.html

**Contents:**
- 44.1. PL/Python Functions #

Functions in PL/Python are declared via the standard CREATE FUNCTION syntax:

The body of a function is simply a Python script. When the function is called, its arguments are passed as elements of the list args; named arguments are also passed as ordinary variables to the Python script. Use of named arguments is usually more readable. The result is returned from the Python code in the usual way, with return or yield (in case of a result-set statement). If you do not provide a return value, Python returns the default None. PL/Python translates Python's None into the SQL null value. In a procedure, the result from the Python code must be None (typically achieved by ending the procedure without a return statement or by using a return statement without argument); otherwise, an error will be raised.

For example, a function to return the greater of two integers can be defined as:

The Python code that is given as the body of the function definition is transformed into a Python function. For example, the above results in:

assuming that 23456 is the OID assigned to the function by PostgreSQL.

The arguments are set as global variables. Because of the scoping rules of Python, this has the subtle consequence that an argument variable cannot be reassigned inside the function to the value of an expression that involves the variable name itself, unless the variable is redeclared as global in the block. For example, the following won't work:

because assigning to x makes x a local variable for the entire block, and so the x on the right-hand side of the assignment refers to a not-yet-assigned local variable x, not the PL/Python function parameter. Using the global statement, this can be made to work:

But it is advisable not to rely on this implementation detail of PL/Python. It is better to treat the function parameters as read-only.

**Examples:**

Example 1 (javascript):
```javascript
CREATE FUNCTION funcname (argument-list)
  RETURNS return-type
AS $$
  # PL/Python function body
$$ LANGUAGE plpython3u;
```

Example 2 (unknown):
```unknown
argument-list
```

Example 3 (unknown):
```unknown
return-type
```

Example 4 (javascript):
```javascript
CREATE FUNCTION pymax (a integer, b integer)
  RETURNS integer
AS $$
  if a > b:
    return a
  return b
$$ LANGUAGE plpython3u;
```

---


---

## 44.5. Trigger Functions #


**URL:** https://www.postgresql.org/docs/18/plpython-trigger.html

**Contents:**
- 44.5. Trigger Functions #

When a function is used as a trigger, the dictionary TD contains trigger-related values:

contains the event as a string: INSERT, UPDATE, DELETE, or TRUNCATE.

contains one of BEFORE, AFTER, or INSTEAD OF.

contains ROW or STATEMENT.

For a row-level trigger, one or both of these fields contain the respective trigger rows, depending on the trigger event.

contains the trigger name.

contains the name of the table on which the trigger occurred.

contains the schema of the table on which the trigger occurred.

contains the OID of the table on which the trigger occurred.

If the CREATE TRIGGER command included arguments, they are available in TD["args"][0] to TD["args"][n-1].

If TD["when"] is BEFORE or INSTEAD OF and TD["level"] is ROW, you can return None or "OK" from the Python function to indicate the row is unmodified, "SKIP" to abort the event, or if TD["event"] is INSERT or UPDATE you can return "MODIFY" to indicate you've modified the new row. Otherwise the return value is ignored.

**Examples:**

Example 1 (unknown):
```unknown
TD["event"]
```

Example 2 (unknown):
```unknown
TD["level"]
```

Example 3 (unknown):
```unknown
TD["table_name"]
```

Example 4 (unknown):
```unknown
TD["table_schema"]
```

---


---

## 44.10. Python 2 vs. Python 3 #


**URL:** https://www.postgresql.org/docs/18/plpython-python23.html

**Contents:**
- 44.10. Python 2 vs. Python 3 #

PL/Python supports only Python 3. Past versions of PostgreSQL supported Python 2, using the plpythonu and plpython2u language names.

---


---

## 44.11. Environment Variables #


**URL:** https://www.postgresql.org/docs/18/plpython-envar.html

**Contents:**
- 44.11. Environment Variables #

Some of the environment variables that are accepted by the Python interpreter can also be used to affect PL/Python behavior. They would need to be set in the environment of the main PostgreSQL server process, for example in a start script. The available environment variables depend on the version of Python; see the Python documentation for details. At the time of this writing, the following environment variables have an affect on PL/Python, assuming an adequate Python version:

PYTHONDONTWRITEBYTECODE

(It appears to be a Python implementation detail beyond the control of PL/Python that some of the environment variables listed on the python man page are only effective in a command-line interpreter and not an embedded Python interpreter.)

**Examples:**

Example 1 (unknown):
```unknown
PYTHONOPTIMIZE
```

Example 2 (unknown):
```unknown
PYTHONDEBUG
```

Example 3 (unknown):
```unknown
PYTHONVERBOSE
```

Example 4 (unknown):
```unknown
PYTHONCASEOK
```

---


---

## 44.4. Anonymous Code Blocks #


**URL:** https://www.postgresql.org/docs/18/plpython-do.html

**Contents:**
- 44.4. Anonymous Code Blocks #

PL/Python also supports anonymous code blocks called with the DO statement:

An anonymous code block receives no arguments, and whatever value it might return is discarded. Otherwise it behaves just like a function.

**Examples:**

Example 1 (unknown):
```unknown
DO $$
    # PL/Python code
$$ LANGUAGE plpython3u;
```

---


---

