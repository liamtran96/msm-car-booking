# PostgreSQL - Plpgsql

## 41.1. Overview #


**URL:** https://www.postgresql.org/docs/18/plpgsql-overview.html

**Contents:**
- 41.1. Overview #
  - 41.1.1. Advantages of Using PL/pgSQL #
  - 41.1.2. Supported Argument and Result Data Types #

PL/pgSQL is a loadable procedural language for the PostgreSQL database system. The design goals of PL/pgSQL were to create a loadable procedural language that

can be used to create functions, procedures, and triggers,

adds control structures to the SQL language,

can perform complex computations,

inherits all user-defined types, functions, procedures, and operators,

can be defined to be trusted by the server,

Functions created with PL/pgSQL can be used anywhere that built-in functions could be used. For example, it is possible to create complex conditional computation functions and later use them to define operators or use them in index expressions.

In PostgreSQL 9.0 and later, PL/pgSQL is installed by default. However it is still a loadable module, so especially security-conscious administrators could choose to remove it.

SQL is the language PostgreSQL and most other relational databases use as query language. It's portable and easy to learn. But every SQL statement must be executed individually by the database server.

That means that your client application must send each query to the database server, wait for it to be processed, receive and process the results, do some computation, then send further queries to the server. All this incurs interprocess communication and will also incur network overhead if your client is on a different machine than the database server.

With PL/pgSQL you can group a block of computation and a series of queries inside the database server, thus having the power of a procedural language and the ease of use of SQL, but with considerable savings of client/server communication overhead.

Extra round trips between client and server are eliminated

Intermediate results that the client does not need do not have to be marshaled or transferred between server and client

Multiple rounds of query parsing can be avoided

This can result in a considerable performance increase as compared to an application that does not use stored functions.

Also, with PL/pgSQL you can use all the data types, operators and functions of SQL.

Functions written in PL/pgSQL can accept as arguments any scalar or array data type supported by the server, and they can return a result of any of these types. They can also accept or return any composite type (row type) specified by name. It is also possible to declare a PL/pgSQL function as accepting record, which means that any composite type will do as input, or as returning record, which means that the result is a row type whose columns are determined by specification in the calling query, as discussed in Section 7.2.1.4.

PL/pgSQL functions can be declared to accept a variable number of arguments by using the VARIADIC marker. This works exactly the same way as for SQL functions, as discussed in Section 36.5.6.

PL/pgSQL functions can also be declared to accept and return the polymorphic types described in Section 36.2.5, thus allowing the actual data types handled by the function to vary from call to call. Examples appear in Section 41.3.1.

PL/pgSQL functions can also be declared to return a “set” (or table) of any data type that can be returned as a single instance. Such a function generates its output by executing RETURN NEXT for each desired element of the result set, or by using RETURN QUERY to output the result of evaluating a query.

Finally, a PL/pgSQL function can be declared to return void if it has no useful return value. (Alternatively, it could be written as a procedure in that case.)

PL/pgSQL functions can also be declared with output parameters in place of an explicit specification of the return type. This does not add any fundamental capability to the language, but it is often convenient, especially for returning multiple values. The RETURNS TABLE notation can also be used in place of RETURNS SETOF.

Specific examples appear in Section 41.3.1 and Section 41.6.1.

**Examples:**

Example 1 (unknown):
```unknown
RETURN NEXT
```

Example 2 (unknown):
```unknown
RETURN QUERY
```

Example 3 (unknown):
```unknown
RETURNS TABLE
```

Example 4 (unknown):
```unknown
RETURNS SETOF
```

---


---

## 41.11. PL/pgSQL under the Hood #


**URL:** https://www.postgresql.org/docs/18/plpgsql-implementation.html

**Contents:**
- 41.11. PL/pgSQL under the Hood #
  - 41.11.1. Variable Substitution #
  - 41.11.2. Plan Caching #

This section discusses some implementation details that are frequently important for PL/pgSQL users to know.

SQL statements and expressions within a PL/pgSQL function can refer to variables and parameters of the function. Behind the scenes, PL/pgSQL substitutes query parameters for such references. Query parameters will only be substituted in places where they are syntactically permissible. As an extreme case, consider this example of poor programming style:

The first occurrence of foo must syntactically be a table name, so it will not be substituted, even if the function has a variable named foo. The second occurrence must be the name of a column of that table, so it will not be substituted either. Likewise the third occurrence must be a function name, so it also will not be substituted for. Only the last occurrence is a candidate to be a reference to a variable of the PL/pgSQL function.

Another way to understand this is that variable substitution can only insert data values into an SQL command; it cannot dynamically change which database objects are referenced by the command. (If you want to do that, you must build a command string dynamically, as explained in Section 41.5.4.)

Since the names of variables are syntactically no different from the names of table columns, there can be ambiguity in statements that also refer to tables: is a given name meant to refer to a table column, or a variable? Let's change the previous example to

Here, dest and src must be table names, and col must be a column of dest, but foo and bar might reasonably be either variables of the function or columns of src.

By default, PL/pgSQL will report an error if a name in an SQL statement could refer to either a variable or a table column. You can fix such a problem by renaming the variable or column, or by qualifying the ambiguous reference, or by telling PL/pgSQL which interpretation to prefer.

The simplest solution is to rename the variable or column. A common coding rule is to use a different naming convention for PL/pgSQL variables than you use for column names. For example, if you consistently name function variables v_something while none of your column names start with v_, no conflicts will occur.

Alternatively you can qualify ambiguous references to make them clear. In the above example, src.foo would be an unambiguous reference to the table column. To create an unambiguous reference to a variable, declare it in a labeled block and use the block's label (see Section 41.2). For example,

Here block.foo means the variable even if there is a column foo in src. Function parameters, as well as special variables such as FOUND, can be qualified by the function's name, because they are implicitly declared in an outer block labeled with the function's name.

Sometimes it is impractical to fix all the ambiguous references in a large body of PL/pgSQL code. In such cases you can specify that PL/pgSQL should resolve ambiguous references as the variable (which is compatible with PL/pgSQL's behavior before PostgreSQL 9.0), or as the table column (which is compatible with some other systems such as Oracle).

To change this behavior on a system-wide basis, set the configuration parameter plpgsql.variable_conflict to one of error, use_variable, or use_column (where error is the factory default). This parameter affects subsequent compilations of statements in PL/pgSQL functions, but not statements already compiled in the current session. Because changing this setting can cause unexpected changes in the behavior of PL/pgSQL functions, it can only be changed by a superuser.

You can also set the behavior on a function-by-function basis, by inserting one of these special commands at the start of the function text:

These commands affect only the function they are written in, and override the setting of plpgsql.variable_conflict. An example is

In the UPDATE command, curtime, comment, and id will refer to the function's variable and parameters whether or not users has columns of those names. Notice that we had to qualify the reference to users.id in the WHERE clause to make it refer to the table column. But we did not have to qualify the reference to comment as a target in the UPDATE list, because syntactically that must be a column of users. We could write the same function without depending on the variable_conflict setting in this way:

Variable substitution does not happen in a command string given to EXECUTE or one of its variants. If you need to insert a varying value into such a command, do so as part of constructing the string value, or use USING, as illustrated in Section 41.5.4.

Variable substitution currently works only in SELECT, INSERT, UPDATE, DELETE, and commands containing one of these (such as EXPLAIN and CREATE TABLE ... AS SELECT), because the main SQL engine allows query parameters only in these commands. To use a non-constant name or value in other statement types (generically called utility statements), you must construct the utility statement as a string and EXECUTE it.

The PL/pgSQL interpreter parses the function's source text and produces an internal binary instruction tree the first time the function is called (within each session). The instruction tree fully translates the PL/pgSQL statement structure, but individual SQL expressions and SQL commands used in the function are not translated immediately.

As each expression and SQL command is first executed in the function, the PL/pgSQL interpreter parses and analyzes the command to create a prepared statement, using the SPI manager's SPI_prepare function. Subsequent visits to that expression or command reuse the prepared statement. Thus, a function with conditional code paths that are seldom visited will never incur the overhead of analyzing those commands that are never executed within the current session. A disadvantage is that errors in a specific expression or command cannot be detected until that part of the function is reached in execution. (Trivial syntax errors will be detected during the initial parsing pass, but anything deeper will not be detected until execution.)

PL/pgSQL (or more precisely, the SPI manager) can furthermore attempt to cache the execution plan associated with any particular prepared statement. If a cached plan is not used, then a fresh execution plan is generated on each visit to the statement, and the current parameter values (that is, PL/pgSQL variable values) can be used to optimize the selected plan. If the statement has no parameters, or is executed many times, the SPI manager will consider creating a generic plan that is not dependent on specific parameter values, and caching that for re-use. Typically this will happen only if the execution plan is not very sensitive to the values of the PL/pgSQL variables referenced in it. If it is, generating a plan each time is a net win. See PREPARE for more information about the behavior of prepared statements.

Because PL/pgSQL saves prepared statements and sometimes execution plans in this way, SQL commands that appear directly in a PL/pgSQL function must refer to the same tables and columns on every execution; that is, you cannot use a parameter as the name of a table or column in an SQL command. To get around this restriction, you can construct dynamic commands using the PL/pgSQL EXECUTE statement — at the price of performing new parse analysis and constructing a new execution plan on every execution.

The mutable nature of record variables presents another problem in this connection. When fields of a record variable are used in expressions or statements, the data types of the fields must not change from one call of the function to the next, since each expression will be analyzed using the data type that is present when the expression is first reached. EXECUTE can be used to get around this problem when necessary.

If the same function is used as a trigger for more than one table, PL/pgSQL prepares and caches statements independently for each such table — that is, there is a cache for each trigger function and table combination, not just for each function. This alleviates some of the problems with varying data types; for instance, a trigger function will be able to work successfully with a column named key even if it happens to have different types in different tables.

Likewise, functions having polymorphic argument types have a separate statement cache for each combination of actual argument types they have been invoked for, so that data type differences do not cause unexpected failures.

Statement caching can sometimes have surprising effects on the interpretation of time-sensitive values. For example there is a difference between what these two functions do:

In the case of logfunc1, the PostgreSQL main parser knows when analyzing the INSERT that the string 'now' should be interpreted as timestamp, because the target column of logtable is of that type. Thus, 'now' will be converted to a timestamp constant when the INSERT is analyzed, and then used in all invocations of logfunc1 during the lifetime of the session. Needless to say, this isn't what the programmer wanted. A better idea is to use the now() or current_timestamp function.

In the case of logfunc2, the PostgreSQL main parser does not know what type 'now' should become and therefore it returns a data value of type text containing the string now. During the ensuing assignment to the local variable curtime, the PL/pgSQL interpreter casts this string to the timestamp type by calling the textout and timestamp_in functions for the conversion. So, the computed time stamp is updated on each execution as the programmer expects. Even though this happens to work as expected, it's not terribly efficient, so use of the now() function would still be a better idea.

**Examples:**

Example 1 (sql):
```sql
INSERT INTO foo (foo) VALUES (foo(foo));
```

Example 2 (sql):
```sql
INSERT INTO dest (col) SELECT foo + bar FROM src;
```

Example 3 (unknown):
```unknown
v_something
```

Example 4 (sql):
```sql
<<block>>
DECLARE
    foo int;
BEGIN
    foo := ...;
    INSERT INTO dest (col) SELECT block.foo + bar FROM src;
```

---


---

## 41.13. Porting from Oracle PL/SQL #


**URL:** https://www.postgresql.org/docs/18/plpgsql-porting.html

**Contents:**
- 41.13. Porting from Oracle PL/SQL #
  - 41.13.1. Porting Examples #
  - 41.13.2. Other Things to Watch For #
    - 41.13.2.1. Implicit Rollback after Exceptions #
    - 41.13.2.2. EXECUTE #
    - 41.13.2.3. Optimizing PL/pgSQL Functions #
  - 41.13.3. Appendix #

This section explains differences between PostgreSQL's PL/pgSQL language and Oracle's PL/SQL language, to help developers who port applications from Oracle® to PostgreSQL.

PL/pgSQL is similar to PL/SQL in many aspects. It is a block-structured, imperative language, and all variables have to be declared. Assignments, loops, and conditionals are similar. The main differences you should keep in mind when porting from PL/SQL to PL/pgSQL are:

If a name used in an SQL command could be either a column name of a table used in the command or a reference to a variable of the function, PL/SQL treats it as a column name. By default, PL/pgSQL will throw an error complaining that the name is ambiguous. You can specify plpgsql.variable_conflict = use_column to change this behavior to match PL/SQL, as explained in Section 41.11.1. It's often best to avoid such ambiguities in the first place, but if you have to port a large amount of code that depends on this behavior, setting variable_conflict may be the best solution.

In PostgreSQL the function body must be written as a string literal. Therefore you need to use dollar quoting or escape single quotes in the function body. (See Section 41.12.1.)

Data type names often need translation. For example, in Oracle string values are commonly declared as being of type varchar2, which is a non-SQL-standard type. In PostgreSQL, use type varchar or text instead. Similarly, replace type number with numeric, or use some other numeric data type if there's a more appropriate one.

Instead of packages, use schemas to organize your functions into groups.

Since there are no packages, there are no package-level variables either. This is somewhat annoying. You can keep per-session state in temporary tables instead.

Integer FOR loops with REVERSE work differently: PL/SQL counts down from the second number to the first, while PL/pgSQL counts down from the first number to the second, requiring the loop bounds to be swapped when porting. This incompatibility is unfortunate but is unlikely to be changed. (See Section 41.6.5.5.)

FOR loops over queries (other than cursors) also work differently: the target variable(s) must have been declared, whereas PL/SQL always declares them implicitly. An advantage of this is that the variable values are still accessible after the loop exits.

There are various notational differences for the use of cursor variables.

Example 41.9 shows how to port a simple function from PL/SQL to PL/pgSQL.

Example 41.9. Porting a Simple Function from PL/SQL to PL/pgSQL

Here is an Oracle PL/SQL function:

Let's go through this function and see the differences compared to PL/pgSQL:

The type name varchar2 has to be changed to varchar or text. In the examples in this section, we'll use varchar, but text is often a better choice if you do not need specific string length limits.

The RETURN key word in the function prototype (not the function body) becomes RETURNS in PostgreSQL. Also, IS becomes AS, and you need to add a LANGUAGE clause because PL/pgSQL is not the only possible function language.

In PostgreSQL, the function body is considered to be a string literal, so you need to use quote marks or dollar quotes around it. This substitutes for the terminating / in the Oracle approach.

The show errors command does not exist in PostgreSQL, and is not needed since errors are reported automatically.

This is how this function would look when ported to PostgreSQL:

Example 41.10 shows how to port a function that creates another function and how to handle the ensuing quoting problems.

Example 41.10. Porting a Function that Creates Another Function from PL/SQL to PL/pgSQL

The following procedure grabs rows from a SELECT statement and builds a large function with the results in IF statements, for the sake of efficiency.

This is the Oracle version:

Here is how this function would end up in PostgreSQL:

Notice how the body of the function is built separately and passed through quote_literal to double any quote marks in it. This technique is needed because we cannot safely use dollar quoting for defining the new function: we do not know for sure what strings will be interpolated from the referrer_key.key_string field. (We are assuming here that referrer_key.kind can be trusted to always be host, domain, or url, but referrer_key.key_string might be anything, in particular it might contain dollar signs.) This function is actually an improvement on the Oracle original, because it will not generate broken code when referrer_key.key_string or referrer_key.referrer_type contain quote marks.

Example 41.11 shows how to port a function with OUT parameters and string manipulation. PostgreSQL does not have a built-in instr function, but you can create one using a combination of other functions. In Section 41.13.3 there is a PL/pgSQL implementation of instr that you can use to make your porting easier.

Example 41.11. Porting a Procedure With String Manipulation and OUT Parameters from PL/SQL to PL/pgSQL

The following Oracle PL/SQL procedure is used to parse a URL and return several elements (host, path, and query).

This is the Oracle version:

Here is a possible translation into PL/pgSQL:

This function could be used like this:

Example 41.12 shows how to port a procedure that uses numerous features that are specific to Oracle.

Example 41.12. Porting a Procedure from PL/SQL to PL/pgSQL

This is how we could port this procedure to PL/pgSQL:

The syntax of RAISE is considerably different from Oracle's statement, although the basic case RAISE exception_name works similarly.

The exception names supported by PL/pgSQL are different from Oracle's. The set of built-in exception names is much larger (see Appendix A). There is not currently a way to declare user-defined exception names, although you can throw user-chosen SQLSTATE values instead.

This section explains a few other things to watch for when porting Oracle PL/SQL functions to PostgreSQL.

In PL/pgSQL, when an exception is caught by an EXCEPTION clause, all database changes since the block's BEGIN are automatically rolled back. That is, the behavior is equivalent to what you'd get in Oracle with:

If you are translating an Oracle procedure that uses SAVEPOINT and ROLLBACK TO in this style, your task is easy: just omit the SAVEPOINT and ROLLBACK TO. If you have a procedure that uses SAVEPOINT and ROLLBACK TO in a different way then some actual thought will be required.

The PL/pgSQL version of EXECUTE works similarly to the PL/SQL version, but you have to remember to use quote_literal and quote_ident as described in Section 41.5.4. Constructs of the type EXECUTE 'SELECT * FROM $1'; will not work reliably unless you use these functions.

PostgreSQL gives you two function creation modifiers to optimize execution: “volatility” (whether the function always returns the same result when given the same arguments) and “strictness” (whether the function returns null if any argument is null). Consult the CREATE FUNCTION reference page for details.

When making use of these optimization attributes, your CREATE FUNCTION statement might look something like this:

This section contains the code for a set of Oracle-compatible instr functions that you can use to simplify your porting efforts.

**Examples:**

Example 1 (unknown):
```unknown
plpgsql.variable_conflict
```

Example 2 (unknown):
```unknown
variable_conflict
```

Example 3 (julia):
```julia
CREATE OR REPLACE FUNCTION cs_fmt_browser_version(v_name varchar2,
                                                  v_version varchar2)
RETURN varchar2 IS
BEGIN
    IF v_version IS NULL THEN
        RETURN v_name;
    END IF;
    RETURN v_name || '/' || v_version;
END;
/
show errors;
```

Example 4 (unknown):
```unknown
show errors
```

---


---

