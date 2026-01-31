# PostgreSQL - Plpgsql (Part 4)

## 41.9. Errors and Messages #


**URL:** https://www.postgresql.org/docs/18/plpgsql-errors-and-messages.html

**Contents:**
- 41.9. Errors and Messages #
  - 41.9.1. Reporting Errors and Messages #
  - Note
  - Note
  - 41.9.2. Checking Assertions #

Use the RAISE statement to report messages and raise errors.

The level option specifies the error severity. Allowed levels are DEBUG, LOG, INFO, NOTICE, WARNING, and EXCEPTION, with EXCEPTION being the default. EXCEPTION raises an error (which normally aborts the current transaction); the other levels only generate messages of different priority levels. Whether messages of a particular priority are reported to the client, written to the server log, or both is controlled by the log_min_messages and client_min_messages configuration variables. See Chapter 19 for more information.

In the first syntax variant, after the level if any, write a format string (which must be a simple string literal, not an expression). The format string specifies the error message text to be reported. The format string can be followed by optional argument expressions to be inserted into the message. Inside the format string, % is replaced by the string representation of the next optional argument's value. Write %% to emit a literal %. The number of arguments must match the number of % placeholders in the format string, or an error is raised during the compilation of the function.

In this example, the value of v_job_id will replace the % in the string:

In the second and third syntax variants, condition_name and sqlstate specify an error condition name or a five-character SQLSTATE code, respectively. See Appendix A for the valid error condition names and the predefined SQLSTATE codes.

Here are examples of condition_name and sqlstate usage:

In any of these syntax variants, you can attach additional information to the error report by writing USING followed by option = expression items. Each expression can be any string-valued expression. The allowed option key words are:

Sets the error message text. This option can't be used in the first syntax variant, since the message is already supplied.

Supplies an error detail message.

Supplies a hint message.

Specifies the error code (SQLSTATE) to report, either by condition name, as shown in Appendix A, or directly as a five-character SQLSTATE code. This option can't be used in the second or third syntax variant, since the error code is already supplied.

Supplies the name of a related object.

This example will abort the transaction with the given error message and hint:

These two examples show equivalent ways of setting the SQLSTATE:

Another way to produce the same result is:

As shown in the fourth syntax variant, it is also possible to write RAISE USING or RAISE level USING and put everything else into the USING list.

The last variant of RAISE has no parameters at all. This form can only be used inside a BEGIN block's EXCEPTION clause; it causes the error currently being handled to be re-thrown.

Before PostgreSQL 9.1, RAISE without parameters was interpreted as re-throwing the error from the block containing the active exception handler. Thus an EXCEPTION clause nested within that handler could not catch it, even if the RAISE was within the nested EXCEPTION clause's block. This was deemed surprising as well as being incompatible with Oracle's PL/SQL.

If no condition name nor SQLSTATE is specified in a RAISE EXCEPTION command, the default is to use raise_exception (P0001). If no message text is specified, the default is to use the condition name or SQLSTATE as message text.

When specifying an error code by SQLSTATE code, you are not limited to the predefined error codes, but can select any error code consisting of five digits and/or upper-case ASCII letters, other than 00000. It is recommended that you avoid throwing error codes that end in three zeroes, because these are category codes and can only be trapped by trapping the whole category.

The ASSERT statement is a convenient shorthand for inserting debugging checks into PL/pgSQL functions.

The condition is a Boolean expression that is expected to always evaluate to true; if it does, the ASSERT statement does nothing further. If the result is false or null, then an ASSERT_FAILURE exception is raised. (If an error occurs while evaluating the condition, it is reported as a normal error.)

If the optional message is provided, it is an expression whose result (if not null) replaces the default error message text “assertion failed”, should the condition fail. The message expression is not evaluated in the normal case where the assertion succeeds.

Testing of assertions can be enabled or disabled via the configuration parameter plpgsql.check_asserts, which takes a Boolean value; the default is on. If this parameter is off then ASSERT statements do nothing.

Note that ASSERT is meant for detecting program bugs, not for reporting ordinary error conditions. Use the RAISE statement, described above, for that.

**Examples:**

Example 1 (unknown):
```unknown
condition_name
```

Example 2 (unknown):
```unknown
RAISE NOTICE 'Calling cs_create_job(%)', v_job_id;
```

Example 3 (unknown):
```unknown
condition_name
```

Example 4 (unknown):
```unknown
condition_name
```

---


---

## 41.3. Declarations #


**URL:** https://www.postgresql.org/docs/18/plpgsql-declarations.html

**Contents:**
- 41.3. Declarations #
  - 41.3.1. Declaring Function Parameters #
  - Note
  - 41.3.2. ALIAS #
  - 41.3.3. Copying Types #
  - 41.3.4. Row Types #
  - 41.3.5. Record Types #
  - 41.3.6. Collation of PL/pgSQL Variables #

All variables used in a block must be declared in the declarations section of the block. (The only exceptions are that the loop variable of a FOR loop iterating over a range of integer values is automatically declared as an integer variable, and likewise the loop variable of a FOR loop iterating over a cursor's result is automatically declared as a record variable.)

PL/pgSQL variables can have any SQL data type, such as integer, varchar, and char.

Here are some examples of variable declarations:

The general syntax of a variable declaration is:

The DEFAULT clause, if given, specifies the initial value assigned to the variable when the block is entered. If the DEFAULT clause is not given then the variable is initialized to the SQL null value. The CONSTANT option prevents the variable from being assigned to after initialization, so that its value will remain constant for the duration of the block. The COLLATE option specifies a collation to use for the variable (see Section 41.3.6). If NOT NULL is specified, an assignment of a null value results in a run-time error. All variables declared as NOT NULL must have a nonnull default value specified. Equal (=) can be used instead of PL/SQL-compliant :=.

A variable's default value is evaluated and assigned to the variable each time the block is entered (not just once per function call). So, for example, assigning now() to a variable of type timestamp causes the variable to have the time of the current function call, not the time when the function was precompiled.

Once declared, a variable's value can be used in later initialization expressions in the same block, for example:

Parameters passed to functions are named with the identifiers $1, $2, etc. Optionally, aliases can be declared for $n parameter names for increased readability. Either the alias or the numeric identifier can then be used to refer to the parameter value.

There are two ways to create an alias. The preferred way is to give a name to the parameter in the CREATE FUNCTION command, for example:

The other way is to explicitly declare an alias, using the declaration syntax

The same example in this style looks like:

These two examples are not perfectly equivalent. In the first case, subtotal could be referenced as sales_tax.subtotal, but in the second case it could not. (Had we attached a label to the inner block, subtotal could be qualified with that label, instead.)

When a PL/pgSQL function is declared with output parameters, the output parameters are given $n names and optional aliases in just the same way as the normal input parameters. An output parameter is effectively a variable that starts out NULL; it should be assigned to during the execution of the function. The final value of the parameter is what is returned. For instance, the sales-tax example could also be done this way:

Notice that we omitted RETURNS real — we could have included it, but it would be redundant.

To call a function with OUT parameters, omit the output parameter(s) in the function call:

Output parameters are most useful when returning multiple values. A trivial example is:

As discussed in Section 36.5.4, this effectively creates an anonymous record type for the function's results. If a RETURNS clause is given, it must say RETURNS record.

This also works with procedures, for example:

In a call to a procedure, all the parameters must be specified. For output parameters, NULL may be specified when calling the procedure from plain SQL:

However, when calling a procedure from PL/pgSQL, you should instead write a variable for any output parameter; the variable will receive the result of the call. See Section 41.6.3 for details.

Another way to declare a PL/pgSQL function is with RETURNS TABLE, for example:

This is exactly equivalent to declaring one or more OUT parameters and specifying RETURNS SETOF sometype.

When the return type of a PL/pgSQL function is declared as a polymorphic type (see Section 36.2.5), a special parameter $0 is created. Its data type is the actual return type of the function, as deduced from the actual input types. This allows the function to access its actual return type as shown in Section 41.3.3. $0 is initialized to null and can be modified by the function, so it can be used to hold the return value if desired, though that is not required. $0 can also be given an alias. For example, this function works on any data type that has a + operator:

The same effect can be obtained by declaring one or more output parameters as polymorphic types. In this case the special $0 parameter is not used; the output parameters themselves serve the same purpose. For example:

In practice it might be more useful to declare a polymorphic function using the anycompatible family of types, so that automatic promotion of the input arguments to a common type will occur. For example:

With this example, a call such as

will work, automatically promoting the integer inputs to numeric. The function using anyelement would require you to cast the three inputs to the same type manually.

The ALIAS syntax is more general than is suggested in the previous section: you can declare an alias for any variable, not just function parameters. The main practical use for this is to assign a different name for variables with predetermined names, such as NEW or OLD within a trigger function.

Since ALIAS creates two different ways to name the same object, unrestricted use can be confusing. It's best to use it only for the purpose of overriding predetermined names.

%TYPE provides the data type of a table column or a previously-declared PL/pgSQL variable. You can use this to declare variables that will hold database values. For example, let's say you have a column named user_id in your users table. To declare a variable with the same data type as users.user_id you write:

It is also possible to write array decoration after %TYPE, thereby creating a variable that holds an array of the referenced type:

Just as when declaring table columns that are arrays, it doesn't matter whether you write multiple bracket pairs or specific array dimensions: PostgreSQL treats all arrays of a given element type as the same type, regardless of dimensionality. (See Section 8.15.1.)

By using %TYPE you don't need to know the data type of the structure you are referencing, and most importantly, if the data type of the referenced item changes in the future (for instance: you change the type of user_id from integer to real), you might not need to change your function definition.

%TYPE is particularly valuable in polymorphic functions, since the data types needed for internal variables can change from one call to the next. Appropriate variables can be created by applying %TYPE to the function's arguments or result placeholders.

A variable of a composite type is called a row variable (or row-type variable). Such a variable can hold a whole row of a SELECT or FOR query result, so long as that query's column set matches the declared type of the variable. The individual fields of the row value are accessed using the usual dot notation, for example rowvar.field.

A row variable can be declared to have the same type as the rows of an existing table or view, by using the table_name%ROWTYPE notation; or it can be declared by giving a composite type's name. (Since every table has an associated composite type of the same name, it actually does not matter in PostgreSQL whether you write %ROWTYPE or not. But the form with %ROWTYPE is more portable.)

As with %TYPE, %ROWTYPE can be followed by array decoration to declare a variable that holds an array of the referenced composite type.

Parameters to a function can be composite types (complete table rows). In that case, the corresponding identifier $n will be a row variable, and fields can be selected from it, for example $1.user_id.

Here is an example of using composite types. table1 and table2 are existing tables having at least the mentioned fields:

Record variables are similar to row-type variables, but they have no predefined structure. They take on the actual row structure of the row they are assigned during a SELECT or FOR command. The substructure of a record variable can change each time it is assigned to. A consequence of this is that until a record variable is first assigned to, it has no substructure, and any attempt to access a field in it will draw a run-time error.

Note that RECORD is not a true data type, only a placeholder. One should also realize that when a PL/pgSQL function is declared to return type record, this is not quite the same concept as a record variable, even though such a function might use a record variable to hold its result. In both cases the actual row structure is unknown when the function is written, but for a function returning record the actual structure is determined when the calling query is parsed, whereas a record variable can change its row structure on-the-fly.

When a PL/pgSQL function has one or more parameters of collatable data types, a collation is identified for each function call depending on the collations assigned to the actual arguments, as described in Section 23.2. If a collation is successfully identified (i.e., there are no conflicts of implicit collations among the arguments) then all the collatable parameters are treated as having that collation implicitly. This will affect the behavior of collation-sensitive operations within the function. For example, consider

The first use of less_than will use the common collation of text_field_1 and text_field_2 for the comparison, while the second use will use C collation.

Furthermore, the identified collation is also assumed as the collation of any local variables that are of collatable types. Thus this function would not work any differently if it were written as

If there are no parameters of collatable data types, or no common collation can be identified for them, then parameters and local variables use the default collation of their data type (which is usually the database's default collation, but could be different for variables of domain types).

A local variable of a collatable data type can have a different collation associated with it by including the COLLATE option in its declaration, for example

This option overrides the collation that would otherwise be given to the variable according to the rules above.

Also, of course explicit COLLATE clauses can be written inside a function if it is desired to force a particular collation to be used in a particular operation. For example,

This overrides the collations associated with the table columns, parameters, or local variables used in the expression, just as would happen in a plain SQL command.

**Examples:**

Example 1 (unknown):
```unknown
user_id integer;
quantity numeric(5);
url varchar;
myrow tablename%ROWTYPE;
myfield tablename.columnname%TYPE;
arow RECORD;
```

Example 2 (unknown):
```unknown
collation_name
```

Example 3 (go):
```go
quantity integer DEFAULT 32;
url varchar := 'http://mysite.com';
transaction_time CONSTANT timestamp with time zone := now();
```

Example 4 (go):
```go
DECLARE
  x integer := 1;
  y integer := x + 1;
```

---


---

## 41.7. Cursors #


**URL:** https://www.postgresql.org/docs/18/plpgsql-cursors.html

**Contents:**
- 41.7. Cursors #
  - 41.7.1. Declaring Cursor Variables #
  - 41.7.2. Opening Cursors #
  - Note
    - 41.7.2.1. OPEN FOR query #
    - 41.7.2.2. OPEN FOR EXECUTE #
    - 41.7.2.3. Opening a Bound Cursor #
  - 41.7.3. Using Cursors #
    - 41.7.3.1. FETCH #
    - 41.7.3.2. MOVE #

Rather than executing a whole query at once, it is possible to set up a cursor that encapsulates the query, and then read the query result a few rows at a time. One reason for doing this is to avoid memory overrun when the result contains a large number of rows. (However, PL/pgSQL users do not normally need to worry about that, since FOR loops automatically use a cursor internally to avoid memory problems.) A more interesting usage is to return a reference to a cursor that a function has created, allowing the caller to read the rows. This provides an efficient way to return large row sets from functions.

All access to cursors in PL/pgSQL goes through cursor variables, which are always of the special data type refcursor. One way to create a cursor variable is just to declare it as a variable of type refcursor. Another way is to use the cursor declaration syntax, which in general is:

(FOR can be replaced by IS for Oracle compatibility.) If SCROLL is specified, the cursor will be capable of scrolling backward; if NO SCROLL is specified, backward fetches will be rejected; if neither specification appears, it is query-dependent whether backward fetches will be allowed. arguments, if specified, is a comma-separated list of pairs name datatype that define names to be replaced by parameter values in the given query. The actual values to substitute for these names will be specified later, when the cursor is opened.

All three of these variables have the data type refcursor, but the first can be used with any query, while the second has a fully specified query already bound to it, and the last has a parameterized query bound to it. (key will be replaced by an integer parameter value when the cursor is opened.) The variable curs1 is said to be unbound since it is not bound to any particular query.

The SCROLL option cannot be used when the cursor's query uses FOR UPDATE/SHARE. Also, it is best to use NO SCROLL with a query that involves volatile functions. The implementation of SCROLL assumes that re-reading the query's output will give consistent results, which a volatile function might not do.

Before a cursor can be used to retrieve rows, it must be opened. (This is the equivalent action to the SQL command DECLARE CURSOR.) PL/pgSQL has three forms of the OPEN statement, two of which use unbound cursor variables while the third uses a bound cursor variable.

Bound cursor variables can also be used without explicitly opening the cursor, via the FOR statement described in Section 41.7.4. A FOR loop will open the cursor and then close it again when the loop completes.

Opening a cursor involves creating a server-internal data structure called a portal, which holds the execution state for the cursor's query. A portal has a name, which must be unique within the session for the duration of the portal's existence. By default, PL/pgSQL will assign a unique name to each portal it creates. However, if you assign a non-null string value to a cursor variable, that string will be used as its portal name. This feature can be used as described in Section 41.7.3.5.

The cursor variable is opened and given the specified query to execute. The cursor cannot be open already, and it must have been declared as an unbound cursor variable (that is, as a simple refcursor variable). The query must be a SELECT, or something else that returns rows (such as EXPLAIN). The query is treated in the same way as other SQL commands in PL/pgSQL: PL/pgSQL variable names are substituted, and the query plan is cached for possible reuse. When a PL/pgSQL variable is substituted into the cursor query, the value that is substituted is the one it has at the time of the OPEN; subsequent changes to the variable will not affect the cursor's behavior. The SCROLL and NO SCROLL options have the same meanings as for a bound cursor.

The cursor variable is opened and given the specified query to execute. The cursor cannot be open already, and it must have been declared as an unbound cursor variable (that is, as a simple refcursor variable). The query is specified as a string expression, in the same way as in the EXECUTE command. As usual, this gives flexibility so the query plan can vary from one run to the next (see Section 41.11.2), and it also means that variable substitution is not done on the command string. As with EXECUTE, parameter values can be inserted into the dynamic command via format() and USING. The SCROLL and NO SCROLL options have the same meanings as for a bound cursor.

In this example, the table name is inserted into the query via format(). The comparison value for col1 is inserted via a USING parameter, so it needs no quoting.

This form of OPEN is used to open a cursor variable whose query was bound to it when it was declared. The cursor cannot be open already. A list of actual argument value expressions must appear if and only if the cursor was declared to take arguments. These values will be substituted in the query.

The query plan for a bound cursor is always considered cacheable; there is no equivalent of EXECUTE in this case. Notice that SCROLL and NO SCROLL cannot be specified in OPEN, as the cursor's scrolling behavior was already determined.

Argument values can be passed using either positional or named notation. In positional notation, all arguments are specified in order. In named notation, each argument's name is specified using := or => to separate it from the argument expression. Similar to calling functions, described in Section 4.3, it is also allowed to mix positional and named notation.

Examples (these use the cursor declaration examples above):

Because variable substitution is done on a bound cursor's query, there are really two ways to pass values into the cursor: either with an explicit argument to OPEN, or implicitly by referencing a PL/pgSQL variable in the query. However, only variables declared before the bound cursor was declared will be substituted into it. In either case the value to be passed is determined at the time of the OPEN. For example, another way to get the same effect as the curs3 example above is

Once a cursor has been opened, it can be manipulated with the statements described here.

These manipulations need not occur in the same function that opened the cursor to begin with. You can return a refcursor value out of a function and let the caller operate on the cursor. (Internally, a refcursor value is simply the string name of the portal containing the active query for the cursor. This name can be passed around, assigned to other refcursor variables, and so on, without disturbing the portal.)

All portals are implicitly closed at transaction end. Therefore a refcursor value is usable to reference an open cursor only until the end of the transaction.

FETCH retrieves the next row (in the indicated direction) from the cursor into a target, which might be a row variable, a record variable, or a comma-separated list of simple variables, just like SELECT INTO. If there is no suitable row, the target is set to NULL(s). As with SELECT INTO, the special variable FOUND can be checked to see whether a row was obtained or not. If no row is obtained, the cursor is positioned after the last row or before the first row, depending on the movement direction.

The direction clause can be any of the variants allowed in the SQL FETCH command except the ones that can fetch more than one row; namely, it can be NEXT, PRIOR, FIRST, LAST, ABSOLUTE count, RELATIVE count, FORWARD, or BACKWARD. Omitting direction is the same as specifying NEXT. In the forms using a count, the count can be any integer-valued expression (unlike the SQL FETCH command, which only allows an integer constant). direction values that require moving backward are likely to fail unless the cursor was declared or opened with the SCROLL option.

cursor must be the name of a refcursor variable that references an open cursor portal.

MOVE repositions a cursor without retrieving any data. MOVE works like the FETCH command, except it only repositions the cursor and does not return the row moved to. The direction clause can be any of the variants allowed in the SQL FETCH command, including those that can fetch more than one row; the cursor is positioned to the last such row. (However, the case in which the direction clause is simply a count expression with no key word is deprecated in PL/pgSQL. That syntax is ambiguous with the case where the direction clause is omitted altogether, and hence it may fail if the count is not a constant.) As with SELECT INTO, the special variable FOUND can be checked to see whether there was a row to move to. If there is no such row, the cursor is positioned after the last row or before the first row, depending on the movement direction.

When a cursor is positioned on a table row, that row can be updated or deleted using the cursor to identify the row. There are restrictions on what the cursor's query can be (in particular, no grouping) and it's best to use FOR UPDATE in the cursor. For more information see the DECLARE reference page.

CLOSE closes the portal underlying an open cursor. This can be used to release resources earlier than end of transaction, or to free up the cursor variable to be opened again.

PL/pgSQL functions can return cursors to the caller. This is useful to return multiple rows or columns, especially with very large result sets. To do this, the function opens the cursor and returns the cursor name to the caller (or simply opens the cursor using a portal name specified by or otherwise known to the caller). The caller can then fetch rows from the cursor. The cursor can be closed by the caller, or it will be closed automatically when the transaction closes.

The portal name used for a cursor can be specified by the programmer or automatically generated. To specify a portal name, simply assign a string to the refcursor variable before opening it. The string value of the refcursor variable will be used by OPEN as the name of the underlying portal. However, if the refcursor variable's value is null (as it will be by default), then OPEN automatically generates a name that does not conflict with any existing portal, and assigns it to the refcursor variable.

Prior to PostgreSQL 16, bound cursor variables were initialized to contain their own names, rather than being left as null, so that the underlying portal name would be the same as the cursor variable's name by default. This was changed because it created too much risk of conflicts between similarly-named cursors in different functions.

The following example shows one way a cursor name can be supplied by the caller:

The following example uses automatic cursor name generation:

The following example shows one way to return multiple cursors from a single function:

There is a variant of the FOR statement that allows iterating through the rows returned by a cursor. The syntax is:

The cursor variable must have been bound to some query when it was declared, and it cannot be open already. The FOR statement automatically opens the cursor, and it closes the cursor again when the loop exits. A list of actual argument value expressions must appear if and only if the cursor was declared to take arguments. These values will be substituted in the query, in just the same way as during an OPEN (see Section 41.7.2.3).

The variable recordvar is automatically defined as type record and exists only inside the loop (any existing definition of the variable name is ignored within the loop). Each row returned by the cursor is successively assigned to this record variable and the loop body is executed.

**Examples:**

Example 1 (unknown):
```unknown
name datatype
```

Example 2 (sql):
```sql
DECLARE
    curs1 refcursor;
    curs2 CURSOR FOR SELECT * FROM tenk1;
    curs3 CURSOR (key integer) FOR SELECT * FROM tenk1 WHERE unique1 = key;
```

Example 3 (unknown):
```unknown
FOR UPDATE/SHARE
```

Example 4 (unknown):
```unknown
DECLARE CURSOR
```

---


---

