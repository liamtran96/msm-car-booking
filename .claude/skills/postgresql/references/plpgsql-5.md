# PostgreSQL - Plpgsql (Part 5)

## 41.8. Transaction Management #


**URL:** https://www.postgresql.org/docs/18/plpgsql-transactions.html

**Contents:**
- 41.8. Transaction Management #

In procedures invoked by the CALL command as well as in anonymous code blocks (DO command), it is possible to end transactions using the commands COMMIT and ROLLBACK. A new transaction is started automatically after a transaction is ended using these commands, so there is no separate START TRANSACTION command. (Note that BEGIN and END have different meanings in PL/pgSQL.)

Here is a simple example:

A new transaction starts out with default transaction characteristics such as transaction isolation level. In cases where transactions are committed in a loop, it might be desirable to start new transactions automatically with the same characteristics as the previous one. The commands COMMIT AND CHAIN and ROLLBACK AND CHAIN accomplish this.

Transaction control is only possible in CALL or DO invocations from the top level or nested CALL or DO invocations without any other intervening command. For example, if the call stack is CALL proc1() → CALL proc2() → CALL proc3(), then the second and third procedures can perform transaction control actions. But if the call stack is CALL proc1() → SELECT func2() → CALL proc3(), then the last procedure cannot do transaction control, because of the SELECT in between.

PL/pgSQL does not support savepoints (SAVEPOINT/ROLLBACK TO SAVEPOINT/RELEASE SAVEPOINT commands). Typical usage patterns for savepoints can be replaced by blocks with exception handlers (see Section 41.6.8). Under the hood, a block with exception handlers forms a subtransaction, which means that transactions cannot be ended inside such a block.

Special considerations apply to cursor loops. Consider this example:

Normally, cursors are automatically closed at transaction commit. However, a cursor created as part of a loop like this is automatically converted to a holdable cursor by the first COMMIT or ROLLBACK. That means that the cursor is fully evaluated at the first COMMIT or ROLLBACK rather than row by row. The cursor is still removed automatically after the loop, so this is mostly invisible to the user. But one must keep in mind that any table or row locks taken by the cursor's query will no longer be held after the first COMMIT or ROLLBACK.

Transaction commands are not allowed in cursor loops driven by commands that are not read-only (for example UPDATE ... RETURNING).

**Examples:**

Example 1 (unknown):
```unknown
START TRANSACTION
```

Example 2 (sql):
```sql
CREATE PROCEDURE transaction_test1()
LANGUAGE plpgsql
AS $$
BEGIN
    FOR i IN 0..9 LOOP
        INSERT INTO test1 (a) VALUES (i);
        IF i % 2 = 0 THEN
            COMMIT;
        ELSE
            ROLLBACK;
        END IF;
    END LOOP;
END;
$$;

CALL transaction_test1();
```

Example 3 (unknown):
```unknown
COMMIT AND CHAIN
```

Example 4 (unknown):
```unknown
ROLLBACK AND CHAIN
```

---


---

## 41.2. Structure of PL/pgSQL #


**URL:** https://www.postgresql.org/docs/18/plpgsql-structure.html

**Contents:**
- 41.2. Structure of PL/pgSQL #
  - Tip
  - Note

Functions written in PL/pgSQL are defined to the server by executing CREATE FUNCTION commands. Such a command would normally look like, say,

The function body is simply a string literal so far as CREATE FUNCTION is concerned. It is often helpful to use dollar quoting (see Section 4.1.2.4) to write the function body, rather than the normal single quote syntax. Without dollar quoting, any single quotes or backslashes in the function body must be escaped by doubling them. Almost all the examples in this chapter use dollar-quoted literals for their function bodies.

PL/pgSQL is a block-structured language. The complete text of a function body must be a block. A block is defined as:

Each declaration and each statement within a block is terminated by a semicolon. A block that appears within another block must have a semicolon after END, as shown above; however the final END that concludes a function body does not require a semicolon.

A common mistake is to write a semicolon immediately after BEGIN. This is incorrect and will result in a syntax error.

A label is only needed if you want to identify the block for use in an EXIT statement, or to qualify the names of the variables declared in the block. If a label is given after END, it must match the label at the block's beginning.

All key words are case-insensitive. Identifiers are implicitly converted to lower case unless double-quoted, just as they are in ordinary SQL commands.

Comments work the same way in PL/pgSQL code as in ordinary SQL. A double dash (--) starts a comment that extends to the end of the line. A /* starts a block comment that extends to the matching occurrence of */. Block comments nest.

Any statement in the statement section of a block can be a subblock. Subblocks can be used for logical grouping or to localize variables to a small group of statements. Variables declared in a subblock mask any similarly-named variables of outer blocks for the duration of the subblock; but you can access the outer variables anyway if you qualify their names with their block's label. For example:

There is actually a hidden “outer block” surrounding the body of any PL/pgSQL function. This block provides the declarations of the function's parameters (if any), as well as some special variables such as FOUND (see Section 41.5.5). The outer block is labeled with the function's name, meaning that parameters and special variables can be qualified with the function's name.

It is important not to confuse the use of BEGIN/END for grouping statements in PL/pgSQL with the similarly-named SQL commands for transaction control. PL/pgSQL's BEGIN/END are only for grouping; they do not start or end a transaction. See Section 41.8 for information on managing transactions in PL/pgSQL. Also, a block containing an EXCEPTION clause effectively forms a subtransaction that can be rolled back without affecting the outer transaction. For more about that see Section 41.6.8.

**Examples:**

Example 1 (javascript):
```javascript
CREATE FUNCTION somefunc(integer, text) RETURNS integer
AS 'function body text'
LANGUAGE plpgsql;
```

Example 2 (unknown):
```unknown
function body text
```

Example 3 (unknown):
```unknown
CREATE FUNCTION
```

Example 4 (unknown):
```unknown
declarations
```

---


---

## 41.12. Tips for Developing in PL/pgSQL #


**URL:** https://www.postgresql.org/docs/18/plpgsql-development-tips.html

**Contents:**
- 41.12. Tips for Developing in PL/pgSQL #
  - 41.12.1. Handling of Quotation Marks #
  - 41.12.2. Additional Compile-Time and Run-Time Checks #

One good way to develop in PL/pgSQL is to use the text editor of your choice to create your functions, and in another window, use psql to load and test those functions. If you are doing it this way, it is a good idea to write the function using CREATE OR REPLACE FUNCTION. That way you can just reload the file to update the function definition. For example:

While running psql, you can load or reload such a function definition file with:

and then immediately issue SQL commands to test the function.

Another good way to develop in PL/pgSQL is with a GUI database access tool that facilitates development in a procedural language. One example of such a tool is pgAdmin, although others exist. These tools often provide convenient features such as escaping single quotes and making it easier to recreate and debug functions.

The code of a PL/pgSQL function is specified in CREATE FUNCTION as a string literal. If you write the string literal in the ordinary way with surrounding single quotes, then any single quotes inside the function body must be doubled; likewise any backslashes must be doubled (assuming escape string syntax is used). Doubling quotes is at best tedious, and in more complicated cases the code can become downright incomprehensible, because you can easily find yourself needing half a dozen or more adjacent quote marks. It's recommended that you instead write the function body as a “dollar-quoted” string literal (see Section 4.1.2.4). In the dollar-quoting approach, you never double any quote marks, but instead take care to choose a different dollar-quoting delimiter for each level of nesting you need. For example, you might write the CREATE FUNCTION command as:

Within this, you might use quote marks for simple literal strings in SQL commands and $$ to delimit fragments of SQL commands that you are assembling as strings. If you need to quote text that includes $$, you could use $Q$, and so on.

The following chart shows what you have to do when writing quote marks without dollar quoting. It might be useful when translating pre-dollar quoting code into something more comprehensible.

To begin and end the function body, for example:

Anywhere within a single-quoted function body, quote marks must appear in pairs.

For string literals inside the function body, for example:

In the dollar-quoting approach, you'd just write:

which is exactly what the PL/pgSQL parser would see in either case.

When you need a single quotation mark in a string constant inside the function body, for example:

The value actually appended to a_output would be: AND name LIKE 'foobar' AND xyz.

In the dollar-quoting approach, you'd write:

being careful that any dollar-quote delimiters around this are not just $$.

When a single quotation mark in a string inside the function body is adjacent to the end of that string constant, for example:

The value appended to a_output would then be: AND name LIKE 'foobar'.

In the dollar-quoting approach, this becomes:

When you want two single quotation marks in a string constant (which accounts for 8 quotation marks) and this is adjacent to the end of that string constant (2 more). You will probably only need that if you are writing a function that generates other functions, as in Example 41.10. For example:

The value of a_output would then be:

In the dollar-quoting approach, this becomes:

where we assume we only need to put single quote marks into a_output, because it will be re-quoted before use.

To aid the user in finding instances of simple but common problems before they cause harm, PL/pgSQL provides additional checks. When enabled, depending on the configuration, they can be used to emit either a WARNING or an ERROR during the compilation of a function. A function which has received a WARNING can be executed without producing further messages, so you are advised to test in a separate development environment.

Setting plpgsql.extra_warnings, or plpgsql.extra_errors, as appropriate, to "all" is encouraged in development and/or testing environments.

These additional checks are enabled through the configuration variables plpgsql.extra_warnings for warnings and plpgsql.extra_errors for errors. Both can be set either to a comma-separated list of checks, "none" or "all". The default is "none". Currently the list of available checks includes:

Checks if a declaration shadows a previously defined variable.

Some PL/pgSQL commands allow assigning values to more than one variable at a time, such as SELECT INTO. Typically, the number of target variables and the number of source variables should match, though PL/pgSQL will use NULL for missing values and extra variables are ignored. Enabling this check will cause PL/pgSQL to throw a WARNING or ERROR whenever the number of target variables and the number of source variables are different.

Enabling this check will cause PL/pgSQL to check if a given query returns more than one row when an INTO clause is used. As an INTO statement will only ever use one row, having a query return multiple rows is generally either inefficient and/or nondeterministic and therefore is likely an error.

The following example shows the effect of plpgsql.extra_warnings set to shadowed_variables:

The below example shows the effects of setting plpgsql.extra_warnings to strict_multi_assignment:

**Examples:**

Example 1 (unknown):
```unknown
CREATE OR REPLACE FUNCTION
```

Example 2 (javascript):
```javascript
CREATE OR REPLACE FUNCTION testfunc(integer) RETURNS integer AS $$
          ....
$$ LANGUAGE plpgsql;
```

Example 3 (unknown):
```unknown
\i filename.sql
```

Example 4 (unknown):
```unknown
CREATE FUNCTION
```

---


---

## 41.4. Expressions #


**URL:** https://www.postgresql.org/docs/18/plpgsql-expressions.html

**Contents:**
- 41.4. Expressions #

All expressions used in PL/pgSQL statements are processed using the server's main SQL executor. For example, when you write a PL/pgSQL statement like

PL/pgSQL will evaluate the expression by feeding a query like

to the main SQL engine. While forming the SELECT command, any occurrences of PL/pgSQL variable names are replaced by query parameters, as discussed in detail in Section 41.11.1. This allows the query plan for the SELECT to be prepared just once and then reused for subsequent evaluations with different values of the variables. Thus, what really happens on first use of an expression is essentially a PREPARE command. For example, if we have declared two integer variables x and y, and we write

what happens behind the scenes is equivalent to

and then this prepared statement is EXECUTEd for each execution of the IF statement, with the current values of the PL/pgSQL variables supplied as parameter values. Normally these details are not important to a PL/pgSQL user, but they are useful to know when trying to diagnose a problem. More information appears in Section 41.11.2.

Since an expression is converted to a SELECT command, it can contain the same clauses that an ordinary SELECT would, except that it cannot include a top-level UNION, INTERSECT, or EXCEPT clause. Thus for example one could test whether a table is non-empty with

since the expression between IF and THEN is parsed as though it were SELECT count(*) > 0 FROM my_table. The SELECT must produce a single column, and not more than one row. (If it produces no rows, the result is taken as NULL.)

**Examples:**

Example 1 (unknown):
```unknown
IF x < y THEN ...
```

Example 2 (sql):
```sql
PREPARE statement_name(integer, integer) AS SELECT $1 < $2;
```

Example 3 (unknown):
```unknown
statement_name
```

Example 4 (sql):
```sql
IF count(*) > 0 FROM my_table THEN ...
```

---


---

