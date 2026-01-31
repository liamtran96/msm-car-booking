# PostgreSQL - Plpython (Part 2)

## 44.7. Explicit Subtransactions #


**URL:** https://www.postgresql.org/docs/18/plpython-subtransaction.html

**Contents:**
- 44.7. Explicit Subtransactions #
  - 44.7.1. Subtransaction Context Managers #

Recovering from errors caused by database access as described in Section 44.6.2 can lead to an undesirable situation where some operations succeed before one of them fails, and after recovering from that error the data is left in an inconsistent state. PL/Python offers a solution to this problem in the form of explicit subtransactions.

Consider a function that implements a transfer between two accounts:

If the second UPDATE statement results in an exception being raised, this function will report the error, but the result of the first UPDATE will nevertheless be committed. In other words, the funds will be withdrawn from Joe's account, but will not be transferred to Mary's account.

To avoid such issues, you can wrap your plpy.execute calls in an explicit subtransaction. The plpy module provides a helper object to manage explicit subtransactions that gets created with the plpy.subtransaction() function. Objects created by this function implement the context manager interface. Using explicit subtransactions we can rewrite our function as:

Note that the use of try/except is still required. Otherwise the exception would propagate to the top of the Python stack and would cause the whole function to abort with a PostgreSQL error, so that the operations table would not have any row inserted into it. The subtransaction context manager does not trap errors, it only assures that all database operations executed inside its scope will be atomically committed or rolled back. A rollback of the subtransaction block occurs on any kind of exception exit, not only ones caused by errors originating from database access. A regular Python exception raised inside an explicit subtransaction block would also cause the subtransaction to be rolled back.

**Examples:**

Example 1 (sql):
```sql
CREATE FUNCTION transfer_funds() RETURNS void AS $$
try:
    plpy.execute("UPDATE accounts SET balance = balance - 100 WHERE account_name = 'joe'")
    plpy.execute("UPDATE accounts SET balance = balance + 100 WHERE account_name = 'mary'")
except plpy.SPIError as e:
    result = "error transferring funds: %s" % e.args
else:
    result = "funds transferred correctly"
plan = plpy.prepare("INSERT INTO operations (result) VALUES ($1)", ["text"])
plpy.execute(plan, [result])
$$ LANGUAGE plpython3u;
```

Example 2 (unknown):
```unknown
plpy.execute
```

Example 3 (unknown):
```unknown
plpy.subtransaction()
```

Example 4 (sql):
```sql
CREATE FUNCTION transfer_funds2() RETURNS void AS $$
try:
    with plpy.subtransaction():
        plpy.execute("UPDATE accounts SET balance = balance - 100 WHERE account_name = 'joe'")
        plpy.execute("UPDATE accounts SET balance = balance + 100 WHERE account_name = 'mary'")
except plpy.SPIError as e:
    result = "error transferring funds: %s" % e.args
else:
    result = "funds transferred correctly"
plan = plpy.prepare("INSERT INTO operations (result) VALUES ($1)", ["text"])
plpy.execute(plan, [result])
$$ LANGUAGE plpython3u;
```

---


---

## 44.8. Transaction Management #


**URL:** https://www.postgresql.org/docs/18/plpython-transactions.html

**Contents:**
- 44.8. Transaction Management #

In a procedure called from the top level or an anonymous code block (DO command) called from the top level it is possible to control transactions. To commit the current transaction, call plpy.commit(). To roll back the current transaction, call plpy.rollback(). (Note that it is not possible to run the SQL commands COMMIT or ROLLBACK via plpy.execute or similar. It has to be done using these functions.) After a transaction is ended, a new transaction is automatically started, so there is no separate function for that.

Transactions cannot be ended when an explicit subtransaction is active.

**Examples:**

Example 1 (unknown):
```unknown
plpy.commit()
```

Example 2 (unknown):
```unknown
plpy.rollback()
```

Example 3 (unknown):
```unknown
plpy.execute
```

Example 4 (sql):
```sql
CREATE PROCEDURE transaction_test1()
LANGUAGE plpython3u
AS $$
for i in range(0, 10):
    plpy.execute("INSERT INTO test1 (a) VALUES (%d)" % i)
    if i % 2 == 0:
        plpy.commit()
    else:
        plpy.rollback()
$$;

CALL transaction_test1();
```

---


---

## Chapter 44. PL/Python — Python Procedural Language


**URL:** https://www.postgresql.org/docs/18/plpython.html

**Contents:**
- Chapter 44. PL/Python — Python Procedural Language
  - Tip
  - Note

The PL/Python procedural language allows PostgreSQL functions and procedures to be written in the Python language.

To install PL/Python in a particular database, use CREATE EXTENSION plpython3u.

If a language is installed into template1, all subsequently created databases will have the language installed automatically.

PL/Python is only available as an “untrusted” language, meaning it does not offer any way of restricting what users can do in it and is therefore named plpython3u. A trusted variant plpython might become available in the future if a secure execution mechanism is developed in Python. The writer of a function in untrusted PL/Python must take care that the function cannot be used to do anything unwanted, since it will be able to do anything that could be done by a user logged in as the database administrator. Only superusers can create functions in untrusted languages such as plpython3u.

Users of source packages must specially enable the build of PL/Python during the installation process. (Refer to the installation instructions for more information.) Users of binary packages might find PL/Python in a separate subpackage.

**Examples:**

Example 1 (unknown):
```unknown
CREATE EXTENSION plpython3u
```

---


---

## 44.2. Data Values #


**URL:** https://www.postgresql.org/docs/18/plpython-data.html

**Contents:**
- 44.2. Data Values #
  - 44.2.1. Data Type Mapping #
  - 44.2.2. Null, None #
  - 44.2.3. Arrays, Lists #
  - 44.2.4. Composite Types #
  - 44.2.5. Set-Returning Functions #

Generally speaking, the aim of PL/Python is to provide a “natural” mapping between the PostgreSQL and the Python worlds. This informs the data mapping rules described below.

When a PL/Python function is called, its arguments are converted from their PostgreSQL data type to a corresponding Python type:

PostgreSQL boolean is converted to Python bool.

PostgreSQL smallint, int, bigint and oid are converted to Python int.

PostgreSQL real and double are converted to Python float.

PostgreSQL numeric is converted to Python Decimal. This type is imported from the cdecimal package if that is available. Otherwise, decimal.Decimal from the standard library will be used. cdecimal is significantly faster than decimal. In Python 3.3 and up, however, cdecimal has been integrated into the standard library under the name decimal, so there is no longer any difference.

PostgreSQL bytea is converted to Python bytes.

All other data types, including the PostgreSQL character string types, are converted to a Python str (in Unicode like all Python strings).

For nonscalar data types, see below.

When a PL/Python function returns, its return value is converted to the function's declared PostgreSQL return data type as follows:

When the PostgreSQL return type is boolean, the return value will be evaluated for truth according to the Python rules. That is, 0 and empty string are false, but notably 'f' is true.

When the PostgreSQL return type is bytea, the return value will be converted to Python bytes using the respective Python built-ins, with the result being converted to bytea.

For all other PostgreSQL return types, the return value is converted to a string using the Python built-in str, and the result is passed to the input function of the PostgreSQL data type. (If the Python value is a float, it is converted using the repr built-in instead of str, to avoid loss of precision.)

Strings are automatically converted to the PostgreSQL server encoding when they are passed to PostgreSQL.

For nonscalar data types, see below.

Note that logical mismatches between the declared PostgreSQL return type and the Python data type of the actual return object are not flagged; the value will be converted in any case.

If an SQL null value is passed to a function, the argument value will appear as None in Python. For example, the function definition of pymax shown in Section 44.1 will return the wrong answer for null inputs. We could add STRICT to the function definition to make PostgreSQL do something more reasonable: if a null value is passed, the function will not be called at all, but will just return a null result automatically. Alternatively, we could check for null inputs in the function body:

As shown above, to return an SQL null value from a PL/Python function, return the value None. This can be done whether the function is strict or not.

SQL array values are passed into PL/Python as a Python list. To return an SQL array value out of a PL/Python function, return a Python list:

Multidimensional arrays are passed into PL/Python as nested Python lists. A 2-dimensional array is a list of lists, for example. When returning a multi-dimensional SQL array out of a PL/Python function, the inner lists at each level must all be of the same size. For example:

Other Python sequences, like tuples, are also accepted for backwards-compatibility with PostgreSQL versions 9.6 and below, when multi-dimensional arrays were not supported. However, they are always treated as one-dimensional arrays, because they are ambiguous with composite types. For the same reason, when a composite type is used in a multi-dimensional array, it must be represented by a tuple, rather than a list.

Note that in Python, strings are sequences, which can have undesirable effects that might be familiar to Python programmers:

Composite-type arguments are passed to the function as Python mappings. The element names of the mapping are the attribute names of the composite type. If an attribute in the passed row has the null value, it has the value None in the mapping. Here is an example:

There are multiple ways to return row or composite types from a Python function. The following examples assume we have:

A composite result can be returned as a:

Returned sequence objects must have the same number of items as the composite result type has fields. The item with index 0 is assigned to the first field of the composite type, 1 to the second and so on. For example:

To return an SQL null for any column, insert None at the corresponding position.

When an array of composite types is returned, it cannot be returned as a list, because it is ambiguous whether the Python list represents a composite type, or another array dimension.

The value for each result type column is retrieved from the mapping with the column name as key. Example:

Any extra dictionary key/value pairs are ignored. Missing keys are treated as errors. To return an SQL null value for any column, insert None with the corresponding column name as the key.

This works the same as a mapping. Example:

Functions with OUT parameters are also supported. For example:

Output parameters of procedures are passed back the same way. For example:

A PL/Python function can also return sets of scalar or composite types. There are several ways to achieve this because the returned object is internally turned into an iterator. The following examples assume we have composite type:

A set result can be returned from a:

Set-returning functions with OUT parameters (using RETURNS SETOF record) are also supported. For example:

**Examples:**

Example 1 (unknown):
```unknown
decimal.Decimal
```

Example 2 (javascript):
```javascript
CREATE FUNCTION pymax (a integer, b integer)
  RETURNS integer
AS $$
  if (a is None) or (b is None):
    return None
  if a > b:
    return a
  return b
$$ LANGUAGE plpython3u;
```

Example 3 (sql):
```sql
CREATE FUNCTION return_arr()
  RETURNS int[]
AS $$
return [1, 2, 3, 4, 5]
$$ LANGUAGE plpython3u;

SELECT return_arr();
 return_arr
-------------
 {1,2,3,4,5}
(1 row)
```

Example 4 (sql):
```sql
CREATE FUNCTION test_type_conversion_array_int4(x int4[]) RETURNS int4[] AS $$
plpy.info(x, type(x))
return x
$$ LANGUAGE plpython3u;

SELECT * FROM test_type_conversion_array_int4(ARRAY[[1,2,3],[4,5,6]]);
INFO:  ([[1, 2, 3], [4, 5, 6]], <type 'list'>)
 test_type_conversion_array_int4
---------------------------------
 {{1,2,3},{4,5,6}}
(1 row)
```

---


---

