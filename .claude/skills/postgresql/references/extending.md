# PostgreSQL - Extending

## 36.4. User-Defined Procedures #


**URL:** https://www.postgresql.org/docs/18/xproc.html

**Contents:**
- 36.4. User-Defined Procedures #

A procedure is a database object similar to a function. The key differences are:

Procedures are defined with the CREATE PROCEDURE command, not CREATE FUNCTION.

Procedures do not return a function value; hence CREATE PROCEDURE lacks a RETURNS clause. However, procedures can instead return data to their callers via output parameters.

While a function is called as part of a query or DML command, a procedure is called in isolation using the CALL command.

A procedure can commit or roll back transactions during its execution (then automatically beginning a new transaction), so long as the invoking CALL command is not part of an explicit transaction block. A function cannot do that.

Certain function attributes, such as strictness, don't apply to procedures. Those attributes control how the function is used in a query, which isn't relevant to procedures.

The explanations in the following sections about how to define user-defined functions apply to procedures as well, except for the points made above.

Collectively, functions and procedures are also known as routines. There are commands such as ALTER ROUTINE and DROP ROUTINE that can operate on functions and procedures without having to know which kind it is. Note, however, that there is no CREATE ROUTINE command.

**Examples:**

Example 1 (unknown):
```unknown
CREATE PROCEDURE
```

Example 2 (unknown):
```unknown
CREATE FUNCTION
```

Example 3 (unknown):
```unknown
CREATE PROCEDURE
```

Example 4 (unknown):
```unknown
ALTER ROUTINE
```

---


---

## 36.5. Query Language (SQL) Functions #


**URL:** https://www.postgresql.org/docs/18/xfunc-sql.html

**Contents:**
- 36.5. Query Language (SQL) Functions #
  - 36.5.1. Arguments for SQL Functions #
  - Note
  - 36.5.2. SQL Functions on Base Types #
  - 36.5.3. SQL Functions on Composite Types #
  - 36.5.4. SQL Functions with Output Parameters #
  - 36.5.5. SQL Procedures with Output Parameters #
  - 36.5.6. SQL Functions with Variable Numbers of Arguments #
  - 36.5.7. SQL Functions with Default Values for Arguments #
  - 36.5.8. SQL Functions as Table Sources #

SQL functions execute an arbitrary list of SQL statements, returning the result of the last query in the list. In the simple (non-set) case, the first row of the last query's result will be returned. (Bear in mind that “the first row” of a multirow result is not well-defined unless you use ORDER BY.) If the last query happens to return no rows at all, the null value will be returned.

Alternatively, an SQL function can be declared to return a set (that is, multiple rows) by specifying the function's return type as SETOF sometype, or equivalently by declaring it as RETURNS TABLE(columns). In this case all rows of the last query's result are returned. Further details appear below.

The body of an SQL function must be a list of SQL statements separated by semicolons. A semicolon after the last statement is optional. Unless the function is declared to return void, the last statement must be a SELECT, or an INSERT, UPDATE, DELETE, or MERGE that has a RETURNING clause.

Any collection of commands in the SQL language can be packaged together and defined as a function. Besides SELECT queries, the commands can include data modification queries (INSERT, UPDATE, DELETE, and MERGE), as well as other SQL commands. (You cannot use transaction control commands, e.g., COMMIT, SAVEPOINT, and some utility commands, e.g., VACUUM, in SQL functions.) However, the final command must be a SELECT or have a RETURNING clause that returns whatever is specified as the function's return type. Alternatively, if you want to define an SQL function that performs actions but has no useful value to return, you can define it as returning void. For example, this function removes rows with negative salaries from the emp table:

You can also write this as a procedure, thus avoiding the issue of the return type. For example:

In simple cases like this, the difference between a function returning void and a procedure is mostly stylistic. However, procedures offer additional functionality such as transaction control that is not available in functions. Also, procedures are SQL standard whereas returning void is a PostgreSQL extension.

The syntax of the CREATE FUNCTION command requires the function body to be written as a string constant. It is usually most convenient to use dollar quoting (see Section 4.1.2.4) for the string constant. If you choose to use regular single-quoted string constant syntax, you must double single quote marks (') and backslashes (\) (assuming escape string syntax) in the body of the function (see Section 4.1.2.1).

Arguments of an SQL function can be referenced in the function body using either names or numbers. Examples of both methods appear below.

To use a name, declare the function argument as having a name, and then just write that name in the function body. If the argument name is the same as any column name in the current SQL command within the function, the column name will take precedence. To override this, qualify the argument name with the name of the function itself, that is function_name.argument_name. (If this would conflict with a qualified column name, again the column name wins. You can avoid the ambiguity by choosing a different alias for the table within the SQL command.)

In the older numeric approach, arguments are referenced using the syntax $n: $1 refers to the first input argument, $2 to the second, and so on. This will work whether or not the particular argument was declared with a name.

If an argument is of a composite type, then the dot notation, e.g., argname.fieldname or $1.fieldname, can be used to access attributes of the argument. Again, you might need to qualify the argument's name with the function name to make the form with an argument name unambiguous.

SQL function arguments can only be used as data values, not as identifiers. Thus for example this is reasonable:

but this will not work:

The ability to use names to reference SQL function arguments was added in PostgreSQL 9.2. Functions to be used in older servers must use the $n notation.

The simplest possible SQL function has no arguments and simply returns a base type, such as integer:

Notice that we defined a column alias within the function body for the result of the function (with the name result), but this column alias is not visible outside the function. Hence, the result is labeled one instead of result.

It is almost as easy to define SQL functions that take base types as arguments:

Alternatively, we could dispense with names for the arguments and use numbers:

Here is a more useful function, which might be used to debit a bank account:

A user could execute this function to debit account 17 by $100.00 as follows:

In this example, we chose the name accountno for the first argument, but this is the same as the name of a column in the bank table. Within the UPDATE command, accountno refers to the column bank.accountno, so tf1.accountno must be used to refer to the argument. We could of course avoid this by using a different name for the argument.

In practice one would probably like a more useful result from the function than a constant 1, so a more likely definition is:

which adjusts the balance and returns the new balance. The same thing could be done in one command using RETURNING:

If the final SELECT or RETURNING clause in an SQL function does not return exactly the function's declared result type, PostgreSQL will automatically cast the value to the required type, if that is possible with an implicit or assignment cast. Otherwise, you must write an explicit cast. For example, suppose we wanted the previous add_em function to return type float8 instead. It's sufficient to write

since the integer sum can be implicitly cast to float8. (See Chapter 10 or CREATE CAST for more about casts.)

When writing functions with arguments of composite types, we must not only specify which argument we want but also the desired attribute (field) of that argument. For example, suppose that emp is a table containing employee data, and therefore also the name of the composite type of each row of the table. Here is a function double_salary that computes what someone's salary would be if it were doubled:

Notice the use of the syntax $1.salary to select one field of the argument row value. Also notice how the calling SELECT command uses table_name.* to select the entire current row of a table as a composite value. The table row can alternatively be referenced using just the table name, like this:

but this usage is deprecated since it's easy to get confused. (See Section 8.16.5 for details about these two notations for the composite value of a table row.)

Sometimes it is handy to construct a composite argument value on-the-fly. This can be done with the ROW construct. For example, we could adjust the data being passed to the function:

It is also possible to build a function that returns a composite type. This is an example of a function that returns a single emp row:

In this example we have specified each of the attributes with a constant value, but any computation could have been substituted for these constants.

Note two important things about defining the function:

The select list order in the query must be exactly the same as that in which the columns appear in the composite type. (Naming the columns, as we did above, is irrelevant to the system.)

We must ensure each expression's type can be cast to that of the corresponding column of the composite type. Otherwise we'll get errors like this:

As with the base-type case, the system will not insert explicit casts automatically, only implicit or assignment casts.

A different way to define the same function is:

Here we wrote a SELECT that returns just a single column of the correct composite type. This isn't really better in this situation, but it is a handy alternative in some cases — for example, if we need to compute the result by calling another function that returns the desired composite value. Another example is that if we are trying to write a function that returns a domain over composite, rather than a plain composite type, it is always necessary to write it as returning a single column, since there is no way to cause a coercion of the whole row result.

We could call this function directly either by using it in a value expression:

or by calling it as a table function:

The second way is described more fully in Section 36.5.8.

When you use a function that returns a composite type, you might want only one field (attribute) from its result. You can do that with syntax like this:

The extra parentheses are needed to keep the parser from getting confused. If you try to do it without them, you get something like this:

Another option is to use functional notation for extracting an attribute:

As explained in Section 8.16.5, the field notation and functional notation are equivalent.

Another way to use a function returning a composite type is to pass the result to another function that accepts the correct row type as input:

An alternative way of describing a function's results is to define it with output parameters, as in this example:

This is not essentially different from the version of add_em shown in Section 36.5.2. The real value of output parameters is that they provide a convenient way of defining functions that return several columns. For example,

What has essentially happened here is that we have created an anonymous composite type for the result of the function. The above example has the same end result as

but not having to bother with the separate composite type definition is often handy. Notice that the names attached to the output parameters are not just decoration, but determine the column names of the anonymous composite type. (If you omit a name for an output parameter, the system will choose a name on its own.)

Notice that output parameters are not included in the calling argument list when invoking such a function from SQL. This is because PostgreSQL considers only the input parameters to define the function's calling signature. That means also that only the input parameters matter when referencing the function for purposes such as dropping it. We could drop the above function with either of

Parameters can be marked as IN (the default), OUT, INOUT, or VARIADIC. An INOUT parameter serves as both an input parameter (part of the calling argument list) and an output parameter (part of the result record type). VARIADIC parameters are input parameters, but are treated specially as described below.

Output parameters are also supported in procedures, but they work a bit differently from functions. In CALL commands, output parameters must be included in the argument list. For example, the bank account debiting routine from earlier could be written like this:

To call this procedure, an argument matching the OUT parameter must be included. It's customary to write NULL:

If you write something else, it must be an expression that is implicitly coercible to the declared type of the parameter, just as for input parameters. Note however that such an expression will not be evaluated.

When calling a procedure from PL/pgSQL, instead of writing NULL you must write a variable that will receive the procedure's output. See Section 41.6.3 for details.

SQL functions can be declared to accept variable numbers of arguments, so long as all the “optional” arguments are of the same data type. The optional arguments will be passed to the function as an array. The function is declared by marking the last parameter as VARIADIC; this parameter must be declared as being of an array type. For example:

Effectively, all the actual arguments at or beyond the VARIADIC position are gathered up into a one-dimensional array, as if you had written

You can't actually write that, though — or at least, it will not match this function definition. A parameter marked VARIADIC matches one or more occurrences of its element type, not of its own type.

Sometimes it is useful to be able to pass an already-constructed array to a variadic function; this is particularly handy when one variadic function wants to pass on its array parameter to another one. Also, this is the only secure way to call a variadic function found in a schema that permits untrusted users to create objects; see Section 10.3. You can do this by specifying VARIADIC in the call:

This prevents expansion of the function's variadic parameter into its element type, thereby allowing the array argument value to match normally. VARIADIC can only be attached to the last actual argument of a function call.

Specifying VARIADIC in the call is also the only way to pass an empty array to a variadic function, for example:

Simply writing SELECT mleast() does not work because a variadic parameter must match at least one actual argument. (You could define a second function also named mleast, with no parameters, if you wanted to allow such calls.)

The array element parameters generated from a variadic parameter are treated as not having any names of their own. This means it is not possible to call a variadic function using named arguments (Section 4.3), except when you specify VARIADIC. For example, this will work:

Functions can be declared with default values for some or all input arguments. The default values are inserted whenever the function is called with insufficiently many actual arguments. Since arguments can only be omitted from the end of the actual argument list, all parameters after a parameter with a default value have to have default values as well. (Although the use of named argument notation could allow this restriction to be relaxed, it's still enforced so that positional argument notation works sensibly.) Whether or not you use it, this capability creates a need for precautions when calling functions in databases where some users mistrust other users; see Section 10.3.

The = sign can also be used in place of the key word DEFAULT.

All SQL functions can be used in the FROM clause of a query, but it is particularly useful for functions returning composite types. If the function is defined to return a base type, the table function produces a one-column table. If the function is defined to return a composite type, the table function produces a column for each attribute of the composite type.

As the example shows, we can work with the columns of the function's result just the same as if they were columns of a regular table.

Note that we only got one row out of the function. This is because we did not use SETOF. That is described in the next section.

When an SQL function is declared as returning SETOF sometype, the function's final query is executed to completion, and each row it outputs is returned as an element of the result set.

This feature is normally used when calling the function in the FROM clause. In this case each row returned by the function becomes a row of the table seen by the query. For example, assume that table foo has the same contents as above, and we say:

It is also possible to return multiple rows with the columns defined by output parameters, like this:

The key point here is that you must write RETURNS SETOF record to indicate that the function returns multiple rows instead of just one. If there is only one output parameter, write that parameter's type instead of record.

It is frequently useful to construct a query's result by invoking a set-returning function multiple times, with the parameters for each invocation coming from successive rows of a table or subquery. The preferred way to do this is to use the LATERAL key word, which is described in Section 7.2.1.5. Here is an example using a set-returning function to enumerate elements of a tree structure:

This example does not do anything that we couldn't have done with a simple join, but in more complex calculations the option to put some of the work into a function can be quite convenient.

Functions returning sets can also be called in the select list of a query. For each row that the query generates by itself, the set-returning function is invoked, and an output row is generated for each element of the function's result set. The previous example could also be done with queries like these:

In the last SELECT, notice that no output row appears for Child2, Child3, etc. This happens because listchildren returns an empty set for those arguments, so no result rows are generated. This is the same behavior as we got from an inner join to the function result when using the LATERAL syntax.

PostgreSQL's behavior for a set-returning function in a query's select list is almost exactly the same as if the set-returning function had been written in a LATERAL FROM-clause item instead. For example,

is almost equivalent to

It would be exactly the same, except that in this specific example, the planner could choose to put g on the outside of the nested-loop join, since g has no actual lateral dependency on tab. That would result in a different output row order. Set-returning functions in the select list are always evaluated as though they are on the inside of a nested-loop join with the rest of the FROM clause, so that the function(s) are run to completion before the next row from the FROM clause is considered.

If there is more than one set-returning function in the query's select list, the behavior is similar to what you get from putting the functions into a single LATERAL ROWS FROM( ... ) FROM-clause item. For each row from the underlying query, there is an output row using the first result from each function, then an output row using the second result, and so on. If some of the set-returning functions produce fewer outputs than others, null values are substituted for the missing data, so that the total number of rows emitted for one underlying row is the same as for the set-returning function that produced the most outputs. Thus the set-returning functions run “in lockstep” until they are all exhausted, and then execution continues with the next underlying row.

Set-returning functions can be nested in a select list, although that is not allowed in FROM-clause items. In such cases, each level of nesting is treated separately, as though it were a separate LATERAL ROWS FROM( ... ) item. For example, in

the set-returning functions srf2, srf3, and srf5 would be run in lockstep for each row of tab, and then srf1 and srf4 would be applied in lockstep to each row produced by the lower functions.

Set-returning functions cannot be used within conditional-evaluation constructs, such as CASE or COALESCE. For example, consider

It might seem that this should produce five repetitions of input rows that have x > 0, and a single repetition of those that do not; but actually, because generate_series(1, 5) would be run in an implicit LATERAL FROM item before the CASE expression is ever evaluated, it would produce five repetitions of every input row. To reduce confusion, such cases produce a parse-time error instead.

If a function's last command is INSERT, UPDATE, DELETE, or MERGE with RETURNING, that command will always be executed to completion, even if the function is not declared with SETOF or the calling query does not fetch all the result rows. Any extra rows produced by the RETURNING clause are silently dropped, but the commanded table modifications still happen (and are all completed before returning from the function).

Before PostgreSQL 10, putting more than one set-returning function in the same select list did not behave very sensibly unless they always produced equal numbers of rows. Otherwise, what you got was a number of output rows equal to the least common multiple of the numbers of rows produced by the set-returning functions. Also, nested set-returning functions did not work as described above; instead, a set-returning function could have at most one set-returning argument, and each nest of set-returning functions was run independently. Also, conditional execution (set-returning functions inside CASE etc.) was previously allowed, complicating things even more. Use of the LATERAL syntax is recommended when writing queries that need to work in older PostgreSQL versions, because that will give consistent results across different versions. If you have a query that is relying on conditional execution of a set-returning function, you may be able to fix it by moving the conditional test into a custom set-returning function. For example,

This formulation will work the same in all versions of PostgreSQL.

There is another way to declare a function as returning a set, which is to use the syntax RETURNS TABLE(columns). This is equivalent to using one or more OUT parameters plus marking the function as returning SETOF record (or SETOF a single output parameter's type, as appropriate). This notation is specified in recent versions of the SQL standard, and thus may be more portable than using SETOF.

For example, the preceding sum-and-product example could also be done this way:

It is not allowed to use explicit OUT or INOUT parameters with the RETURNS TABLE notation — you must put all the output columns in the TABLE list.

SQL functions can be declared to accept and return the polymorphic types described in Section 36.2.5. Here is a polymorphic function make_array that builds up an array from two arbitrary data type elements:

Notice the use of the typecast 'a'::text to specify that the argument is of type text. This is required if the argument is just a string literal, since otherwise it would be treated as type unknown, and array of unknown is not a valid type. Without the typecast, you will get errors like this:

With make_array declared as above, you must provide two arguments that are of exactly the same data type; the system will not attempt to resolve any type differences. Thus for example this does not work:

An alternative approach is to use the “common” family of polymorphic types, which allows the system to try to identify a suitable common type:

Because the rules for common type resolution default to choosing type text when all inputs are of unknown types, this also works:

It is permitted to have polymorphic arguments with a fixed return type, but the converse is not. For example:

Polymorphism can be used with functions that have output arguments. For example:

Polymorphism can also be used with variadic functions. For example:

When an SQL function has one or more parameters of collatable data types, a collation is identified for each function call depending on the collations assigned to the actual arguments, as described in Section 23.2. If a collation is successfully identified (i.e., there are no conflicts of implicit collations among the arguments) then all the collatable parameters are treated as having that collation implicitly. This will affect the behavior of collation-sensitive operations within the function. For example, using the anyleast function described above, the result of

will depend on the database's default collation. In C locale the result will be ABC, but in many other locales it will be abc. The collation to use can be forced by adding a COLLATE clause to any of the arguments, for example

Alternatively, if you wish a function to operate with a particular collation regardless of what it is called with, insert COLLATE clauses as needed in the function definition. This version of anyleast would always use en_US locale to compare strings:

But note that this will throw an error if applied to a non-collatable data type.

If no common collation can be identified among the actual arguments, then an SQL function treats its parameters as having their data types' default collation (which is usually the database's default collation, but could be different for parameters of domain types).

The behavior of collatable parameters can be thought of as a limited form of polymorphism, applicable only to textual data types.

**Examples:**

Example 1 (unknown):
```unknown
SETOF sometype
```

Example 2 (unknown):
```unknown
RETURNS TABLE(columns)
```

Example 3 (sql):
```sql
CREATE FUNCTION clean_emp() RETURNS void AS '
    DELETE FROM emp
        WHERE salary < 0;
' LANGUAGE SQL;

SELECT clean_emp();

 clean_emp
-----------

(1 row)
```

Example 4 (sql):
```sql
CREATE PROCEDURE clean_emp() AS '
    DELETE FROM emp
        WHERE salary < 0;
' LANGUAGE SQL;

CALL clean_emp();
```

---


---

