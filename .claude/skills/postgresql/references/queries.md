# PostgreSQL - Queries

## 7.1. Overview #


**URL:** https://www.postgresql.org/docs/18/queries-overview.html

**Contents:**
- 7.1. Overview #

The process of retrieving or the command to retrieve data from a database is called a query. In SQL the SELECT command is used to specify queries. The general syntax of the SELECT command is

The following sections describe the details of the select list, the table expression, and the sort specification. WITH queries are treated last since they are an advanced feature.

A simple kind of query has the form:

Assuming that there is a table called table1, this command would retrieve all rows and all user-defined columns from table1. (The method of retrieval depends on the client application. For example, the psql program will display an ASCII-art table on the screen, while client libraries will offer functions to extract individual values from the query result.) The select list specification * means all columns that the table expression happens to provide. A select list can also select a subset of the available columns or make calculations using the columns. For example, if table1 has columns named a, b, and c (and perhaps others) you can make the following query:

(assuming that b and c are of a numerical data type). See Section 7.3 for more details.

FROM table1 is a simple kind of table expression: it reads just one table. In general, table expressions can be complex constructs of base tables, joins, and subqueries. But you can also omit the table expression entirely and use the SELECT command as a calculator:

This is more useful if the expressions in the select list return varying results. For example, you could call a function this way:

**Examples:**

Example 1 (unknown):
```unknown
with_queries
```

Example 2 (unknown):
```unknown
select_list
```

Example 3 (unknown):
```unknown
table_expression
```

Example 4 (unknown):
```unknown
sort_specification
```

---


---

## Chapter 7. Queries


**URL:** https://www.postgresql.org/docs/18/queries.html

**Contents:**
- Chapter 7. Queries

The previous chapters explained how to create tables, how to fill them with data, and how to manipulate that data. Now we finally discuss how to retrieve the data from the database.

**Examples:**

Example 1 (unknown):
```unknown
GROUPING SETS
```

---


---

## 6.2. Updating Data #


**URL:** https://www.postgresql.org/docs/18/dml-update.html

**Contents:**
- 6.2. Updating Data #

The modification of data that is already in the database is referred to as updating. You can update individual rows, all the rows in a table, or a subset of all rows. Each column can be updated separately; the other columns are not affected.

To update existing rows, use the UPDATE command. This requires three pieces of information:

The name of the table and column to update

The new value of the column

Which row(s) to update

Recall from Chapter 5 that SQL does not, in general, provide a unique identifier for rows. Therefore it is not always possible to directly specify which row to update. Instead, you specify which conditions a row must meet in order to be updated. Only if you have a primary key in the table (independent of whether you declared it or not) can you reliably address individual rows by choosing a condition that matches the primary key. Graphical database access tools rely on this fact to allow you to update rows individually.

For example, this command updates all products that have a price of 5 to have a price of 10:

This might cause zero, one, or many rows to be updated. It is not an error to attempt an update that does not match any rows.

Let's look at that command in detail. First is the key word UPDATE followed by the table name. As usual, the table name can be schema-qualified, otherwise it is looked up in the path. Next is the key word SET followed by the column name, an equal sign, and the new column value. The new column value can be any scalar expression, not just a constant. For example, if you want to raise the price of all products by 10% you could use:

As you see, the expression for the new value can refer to the existing value(s) in the row. We also left out the WHERE clause. If it is omitted, it means that all rows in the table are updated. If it is present, only those rows that match the WHERE condition are updated. Note that the equals sign in the SET clause is an assignment while the one in the WHERE clause is a comparison, but this does not create any ambiguity. Of course, the WHERE condition does not have to be an equality test. Many other operators are available (see Chapter 9). But the expression needs to evaluate to a Boolean result.

You can update more than one column in an UPDATE command by listing more than one assignment in the SET clause. For example:

**Examples:**

Example 1 (sql):
```sql
UPDATE products SET price = 10 WHERE price = 5;
```

Example 2 (sql):
```sql
UPDATE products SET price = price * 1.10;
```

Example 3 (sql):
```sql
UPDATE mytable SET a = 5, b = 3, c = 1 WHERE a > 0;
```

---


---

## 6.1. Inserting Data #


**URL:** https://www.postgresql.org/docs/18/dml-insert.html

**Contents:**
- 6.1. Inserting Data #
  - Tip

When a table is created, it contains no data. The first thing to do before a database can be of much use is to insert data. Data is inserted one row at a time. You can also insert more than one row in a single command, but it is not possible to insert something that is not a complete row. Even if you know only some column values, a complete row must be created.

To create a new row, use the INSERT command. The command requires the table name and column values. For example, consider the products table from Chapter 5:

An example command to insert a row would be:

The data values are listed in the order in which the columns appear in the table, separated by commas. Usually, the data values will be literals (constants), but scalar expressions are also allowed.

The above syntax has the drawback that you need to know the order of the columns in the table. To avoid this you can also list the columns explicitly. For example, both of the following commands have the same effect as the one above:

Many users consider it good practice to always list the column names.

If you don't have values for all the columns, you can omit some of them. In that case, the columns will be filled with their default values. For example:

The second form is a PostgreSQL extension. It fills the columns from the left with as many values as are given, and the rest will be defaulted.

For clarity, you can also request default values explicitly, for individual columns or for the entire row:

You can insert multiple rows in a single command:

It is also possible to insert the result of a query (which might be no rows, one row, or many rows):

This provides the full power of the SQL query mechanism (Chapter 7) for computing the rows to be inserted.

When inserting a lot of data at the same time, consider using the COPY command. It is not as flexible as the INSERT command, but is more efficient. Refer to Section 14.4 for more information on improving bulk loading performance.

**Examples:**

Example 1 (sql):
```sql
CREATE TABLE products (
    product_no integer,
    name text,
    price numeric
);
```

Example 2 (sql):
```sql
INSERT INTO products VALUES (1, 'Cheese', 9.99);
```

Example 3 (sql):
```sql
INSERT INTO products (product_no, name, price) VALUES (1, 'Cheese', 9.99);
INSERT INTO products (name, price, product_no) VALUES ('Cheese', 9.99, 1);
```

Example 4 (sql):
```sql
INSERT INTO products (product_no, name) VALUES (1, 'Cheese');
INSERT INTO products VALUES (1, 'Cheese');
```

---


---

## Chapter 6. Data Manipulation


**URL:** https://www.postgresql.org/docs/18/dml.html

**Contents:**
- Chapter 6. Data Manipulation

The previous chapter discussed how to create tables and other structures to hold your data. Now it is time to fill the tables with data. This chapter covers how to insert, update, and delete table data. The chapter after this will finally explain how to extract your long-lost data from the database.

---


---

## 7.4. Combining Queries (UNION, INTERSECT, EXCEPT) #


**URL:** https://www.postgresql.org/docs/18/queries-union.html

**Contents:**
- 7.4. Combining Queries (UNION, INTERSECT, EXCEPT) #

The results of two queries can be combined using the set operations union, intersection, and difference. The syntax is

where query1 and query2 are queries that can use any of the features discussed up to this point.

UNION effectively appends the result of query2 to the result of query1 (although there is no guarantee that this is the order in which the rows are actually returned). Furthermore, it eliminates duplicate rows from its result, in the same way as DISTINCT, unless UNION ALL is used.

INTERSECT returns all rows that are both in the result of query1 and in the result of query2. Duplicate rows are eliminated unless INTERSECT ALL is used.

EXCEPT returns all rows that are in the result of query1 but not in the result of query2. (This is sometimes called the difference between two queries.) Again, duplicates are eliminated unless EXCEPT ALL is used.

In order to calculate the union, intersection, or difference of two queries, the two queries must be “union compatible”, which means that they return the same number of columns and the corresponding columns have compatible data types, as described in Section 10.5.

Set operations can be combined, for example

which is equivalent to

As shown here, you can use parentheses to control the order of evaluation. Without parentheses, UNION and EXCEPT associate left-to-right, but INTERSECT binds more tightly than those two operators. Thus

You can also surround an individual query with parentheses. This is important if the query needs to use any of the clauses discussed in following sections, such as LIMIT. Without parentheses, you'll get a syntax error, or else the clause will be understood as applying to the output of the set operation rather than one of its inputs. For example,

is accepted, but it means

**Examples:**

Example 1 (unknown):
```unknown
INTERSECT ALL
```

---


---

## 6.4. Returning Data from Modified Rows #


**URL:** https://www.postgresql.org/docs/18/dml-returning.html

**Contents:**
- 6.4. Returning Data from Modified Rows #

Sometimes it is useful to obtain data from modified rows while they are being manipulated. The INSERT, UPDATE, DELETE, and MERGE commands all have an optional RETURNING clause that supports this. Use of RETURNING avoids performing an extra database query to collect the data, and is especially valuable when it would otherwise be difficult to identify the modified rows reliably.

The allowed contents of a RETURNING clause are the same as a SELECT command's output list (see Section 7.3). It can contain column names of the command's target table, or value expressions using those columns. A common shorthand is RETURNING *, which selects all columns of the target table in order.

In an INSERT, the default data available to RETURNING is the row as it was inserted. This is not so useful in trivial inserts, since it would just repeat the data provided by the client. But it can be very handy when relying on computed default values. For example, when using a serial column to provide unique identifiers, RETURNING can return the ID assigned to a new row:

The RETURNING clause is also very useful with INSERT ... SELECT.

In an UPDATE, the default data available to RETURNING is the new content of the modified row. For example:

In a DELETE, the default data available to RETURNING is the content of the deleted row. For example:

In a MERGE, the default data available to RETURNING is the content of the source row plus the content of the inserted, updated, or deleted target row. Since it is quite common for the source and target to have many of the same columns, specifying RETURNING * can lead to a lot of duplicated columns, so it is often more useful to qualify it so as to return just the source or target row. For example:

In each of these commands, it is also possible to explicitly return the old and new content of the modified row. For example:

In this example, writing new.price is the same as just writing price, but it makes the meaning clearer.

This syntax for returning old and new values is available in INSERT, UPDATE, DELETE, and MERGE commands, but typically old values will be NULL for an INSERT, and new values will be NULL for a DELETE. However, there are situations where it can still be useful for those commands. For example, in an INSERT with an ON CONFLICT DO UPDATE clause, the old values will be non-NULL for conflicting rows. Similarly, if a DELETE is turned into an UPDATE by a rewrite rule, the new values may be non-NULL.

If there are triggers (Chapter 37) on the target table, the data available to RETURNING is the row as modified by the triggers. Thus, inspecting columns computed by triggers is another common use-case for RETURNING.

**Examples:**

Example 1 (unknown):
```unknown
RETURNING *
```

Example 2 (sql):
```sql
CREATE TABLE users (firstname text, lastname text, id serial primary key);

INSERT INTO users (firstname, lastname) VALUES ('Joe', 'Cool') RETURNING id;
```

Example 3 (unknown):
```unknown
INSERT ... SELECT
```

Example 4 (sql):
```sql
UPDATE products SET price = price * 1.10
  WHERE price <= 99.99
  RETURNING name, price AS new_price;
```

---


---

## 7.3. Select Lists #


**URL:** https://www.postgresql.org/docs/18/queries-select-lists.html

**Contents:**
- 7.3. Select Lists #
  - 7.3.1. Select-List Items #
  - 7.3.2. Column Labels #
  - Note
  - 7.3.3. DISTINCT #

As shown in the previous section, the table expression in the SELECT command constructs an intermediate virtual table by possibly combining tables, views, eliminating rows, grouping, etc. This table is finally passed on to processing by the select list. The select list determines which columns of the intermediate table are actually output.

The simplest kind of select list is * which emits all columns that the table expression produces. Otherwise, a select list is a comma-separated list of value expressions (as defined in Section 4.2). For instance, it could be a list of column names:

The columns names a, b, and c are either the actual names of the columns of tables referenced in the FROM clause, or the aliases given to them as explained in Section 7.2.1.2. The name space available in the select list is the same as in the WHERE clause, unless grouping is used, in which case it is the same as in the HAVING clause.

If more than one table has a column of the same name, the table name must also be given, as in:

When working with multiple tables, it can also be useful to ask for all the columns of a particular table:

See Section 8.16.5 for more about the table_name.* notation.

If an arbitrary value expression is used in the select list, it conceptually adds a new virtual column to the returned table. The value expression is evaluated once for each result row, with the row's values substituted for any column references. But the expressions in the select list do not have to reference any columns in the table expression of the FROM clause; they can be constant arithmetic expressions, for instance.

The entries in the select list can be assigned names for subsequent processing, such as for use in an ORDER BY clause or for display by the client application. For example:

If no output column name is specified using AS, the system assigns a default column name. For simple column references, this is the name of the referenced column. For function calls, this is the name of the function. For complex expressions, the system will generate a generic name.

The AS key word is usually optional, but in some cases where the desired column name matches a PostgreSQL key word, you must write AS or double-quote the column name in order to avoid ambiguity. (Appendix C shows which key words require AS to be used as a column label.) For example, FROM is one such key word, so this does not work:

but either of these do:

For greatest safety against possible future key word additions, it is recommended that you always either write AS or double-quote the output column name.

The naming of output columns here is different from that done in the FROM clause (see Section 7.2.1.2). It is possible to rename the same column twice, but the name assigned in the select list is the one that will be passed on.

After the select list has been processed, the result table can optionally be subject to the elimination of duplicate rows. The DISTINCT key word is written directly after SELECT to specify this:

(Instead of DISTINCT the key word ALL can be used to specify the default behavior of retaining all rows.)

Obviously, two rows are considered distinct if they differ in at least one column value. Null values are considered equal in this comparison.

Alternatively, an arbitrary expression can determine what rows are to be considered distinct:

Here expression is an arbitrary value expression that is evaluated for all rows. A set of rows for which all the expressions are equal are considered duplicates, and only the first row of the set is kept in the output. Note that the “first row” of a set is unpredictable unless the query is sorted on enough columns to guarantee a unique ordering of the rows arriving at the DISTINCT filter. (DISTINCT ON processing occurs after ORDER BY sorting.)

The DISTINCT ON clause is not part of the SQL standard and is sometimes considered bad style because of the potentially indeterminate nature of its results. With judicious use of GROUP BY and subqueries in FROM, this construct can be avoided, but it is often the most convenient alternative.

**Examples:**

Example 1 (sql):
```sql
SELECT a, b, c FROM ...
```

Example 2 (sql):
```sql
SELECT tbl1.a, tbl2.a, tbl1.b FROM ...
```

Example 3 (sql):
```sql
SELECT tbl1.*, tbl2.a FROM ...
```

Example 4 (sql):
```sql
SELECT a AS value, b + c AS sum FROM ...
```

---


---

