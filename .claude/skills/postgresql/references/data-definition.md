# PostgreSQL - Data Definition

## 5.1. Table Basics #


**URL:** https://www.postgresql.org/docs/18/ddl-basics.html

**Contents:**
- 5.1. Table Basics #
  - Tip

A table in a relational database is much like a table on paper: It consists of rows and columns. The number and order of the columns is fixed, and each column has a name. The number of rows is variable — it reflects how much data is stored at a given moment. SQL does not make any guarantees about the order of the rows in a table. When a table is read, the rows will appear in an unspecified order, unless sorting is explicitly requested. This is covered in Chapter 7. Furthermore, SQL does not assign unique identifiers to rows, so it is possible to have several completely identical rows in a table. This is a consequence of the mathematical model that underlies SQL but is usually not desirable. Later in this chapter we will see how to deal with this issue.

Each column has a data type. The data type constrains the set of possible values that can be assigned to a column and assigns semantics to the data stored in the column so that it can be used for computations. For instance, a column declared to be of a numerical type will not accept arbitrary text strings, and the data stored in such a column can be used for mathematical computations. By contrast, a column declared to be of a character string type will accept almost any kind of data but it does not lend itself to mathematical calculations, although other operations such as string concatenation are available.

PostgreSQL includes a sizable set of built-in data types that fit many applications. Users can also define their own data types. Most built-in data types have obvious names and semantics, so we defer a detailed explanation to Chapter 8. Some of the frequently used data types are integer for whole numbers, numeric for possibly fractional numbers, text for character strings, date for dates, time for time-of-day values, and timestamp for values containing both date and time.

To create a table, you use the aptly named CREATE TABLE command. In this command you specify at least a name for the new table, the names of the columns and the data type of each column. For example:

This creates a table named my_first_table with two columns. The first column is named first_column and has a data type of text; the second column has the name second_column and the type integer. The table and column names follow the identifier syntax explained in Section 4.1.1. The type names are usually also identifiers, but there are some exceptions. Note that the column list is comma-separated and surrounded by parentheses.

Of course, the previous example was heavily contrived. Normally, you would give names to your tables and columns that convey what kind of data they store. So let's look at a more realistic example:

(The numeric type can store fractional components, as would be typical of monetary amounts.)

When you create many interrelated tables it is wise to choose a consistent naming pattern for the tables and columns. For instance, there is a choice of using singular or plural nouns for table names, both of which are favored by some theorist or other.

There is a limit on how many columns a table can contain. Depending on the column types, it is between 250 and 1600. However, defining a table with anywhere near this many columns is highly unusual and often a questionable design.

If you no longer need a table, you can remove it using the DROP TABLE command. For example:

Attempting to drop a table that does not exist is an error. Nevertheless, it is common in SQL script files to unconditionally try to drop each table before creating it, ignoring any error messages, so that the script works whether or not the table exists. (If you like, you can use the DROP TABLE IF EXISTS variant to avoid the error messages, but this is not standard SQL.)

If you need to modify a table that already exists, see Section 5.7 later in this chapter.

With the tools discussed so far you can create fully functional tables. The remainder of this chapter is concerned with adding features to the table definition to ensure data integrity, security, or convenience. If you are eager to fill your tables with data now you can skip ahead to Chapter 6 and read the rest of this chapter later.

**Examples:**

Example 1 (sql):
```sql
CREATE TABLE my_first_table (
    first_column text,
    second_column integer
);
```

Example 2 (unknown):
```unknown
my_first_table
```

Example 3 (unknown):
```unknown
first_column
```

Example 4 (unknown):
```unknown
second_column
```

---


---

## 5.15. Dependency Tracking #


**URL:** https://www.postgresql.org/docs/18/ddl-depend.html

**Contents:**
- 5.15. Dependency Tracking #
  - Note

When you create complex database structures involving many tables with foreign key constraints, views, triggers, functions, etc. you implicitly create a net of dependencies between the objects. For instance, a table with a foreign key constraint depends on the table it references.

To ensure the integrity of the entire database structure, PostgreSQL makes sure that you cannot drop objects that other objects still depend on. For example, attempting to drop the products table we considered in Section 5.5.5, with the orders table depending on it, would result in an error message like this:

The error message contains a useful hint: if you do not want to bother deleting all the dependent objects individually, you can run:

and all the dependent objects will be removed, as will any objects that depend on them, recursively. In this case, it doesn't remove the orders table, it only removes the foreign key constraint. It stops there because nothing depends on the foreign key constraint. (If you want to check what DROP ... CASCADE will do, run DROP without CASCADE and read the DETAIL output.)

Almost all DROP commands in PostgreSQL support specifying CASCADE. Of course, the nature of the possible dependencies varies with the type of the object. You can also write RESTRICT instead of CASCADE to get the default behavior, which is to prevent dropping objects that any other objects depend on.

According to the SQL standard, specifying either RESTRICT or CASCADE is required in a DROP command. No database system actually enforces that rule, but whether the default behavior is RESTRICT or CASCADE varies across systems.

If a DROP command lists multiple objects, CASCADE is only required when there are dependencies outside the specified group. For example, when saying DROP TABLE tab1, tab2 the existence of a foreign key referencing tab1 from tab2 would not mean that CASCADE is needed to succeed.

For a user-defined function or procedure whose body is defined as a string literal, PostgreSQL tracks dependencies associated with the function's externally-visible properties, such as its argument and result types, but not dependencies that could only be known by examining the function body. As an example, consider this situation:

(See Section 36.5 for an explanation of SQL-language functions.) PostgreSQL will be aware that the get_color_note function depends on the rainbow type: dropping the type would force dropping the function, because its argument type would no longer be defined. But PostgreSQL will not consider get_color_note to depend on the my_colors table, and so will not drop the function if the table is dropped. While there are disadvantages to this approach, there are also benefits. The function is still valid in some sense if the table is missing, though executing it would cause an error; creating a new table of the same name would allow the function to work again.

On the other hand, for an SQL-language function or procedure whose body is written in SQL-standard style, the body is parsed at function definition time and all dependencies recognized by the parser are stored. Thus, if we write the function above as

then the function's dependency on the my_colors table will be known and enforced by DROP.

**Examples:**

Example 1 (yaml):
```yaml
DROP TABLE products;

ERROR:  cannot drop table products because other objects depend on it
DETAIL:  constraint orders_product_no_fkey on table orders depends on table products
HINT:  Use DROP ... CASCADE to drop the dependent objects too.
```

Example 2 (unknown):
```unknown
DROP TABLE products CASCADE;
```

Example 3 (unknown):
```unknown
DROP ... CASCADE
```

Example 4 (unknown):
```unknown
DROP TABLE tab1, tab2
```

---


---

## 5.7. Modifying Tables #


**URL:** https://www.postgresql.org/docs/18/ddl-alter.html

**Contents:**
- 5.7. Modifying Tables #
  - 5.7.1. Adding a Column #
  - Tip
  - 5.7.2. Removing a Column #
  - 5.7.3. Adding a Constraint #
  - 5.7.4. Removing a Constraint #
  - 5.7.5. Changing a Column's Default Value #
  - 5.7.6. Changing a Column's Data Type #
  - 5.7.7. Renaming a Column #
  - 5.7.8. Renaming a Table #

When you create a table and you realize that you made a mistake, or the requirements of the application change, you can drop the table and create it again. But this is not a convenient option if the table is already filled with data, or if the table is referenced by other database objects (for instance a foreign key constraint). Therefore PostgreSQL provides a family of commands to make modifications to existing tables. Note that this is conceptually distinct from altering the data contained in the table: here we are interested in altering the definition, or structure, of the table.

Change default values

Change column data types

All these actions are performed using the ALTER TABLE command, whose reference page contains details beyond those given here.

To add a column, use a command like:

The new column is initially filled with whatever default value is given (null if you don't specify a DEFAULT clause).

Adding a column with a constant default value does not require each row of the table to be updated when the ALTER TABLE statement is executed. Instead, the default value will be returned the next time the row is accessed, and applied when the table is rewritten, making the ALTER TABLE very fast even on large tables.

If the default value is volatile (e.g., clock_timestamp()) each row will need to be updated with the value calculated at the time ALTER TABLE is executed. To avoid a potentially lengthy update operation, particularly if you intend to fill the column with mostly nondefault values anyway, it may be preferable to add the column with no default, insert the correct values using UPDATE, and then add any desired default as described below.

You can also define constraints on the column at the same time, using the usual syntax:

In fact all the options that can be applied to a column description in CREATE TABLE can be used here. Keep in mind however that the default value must satisfy the given constraints, or the ADD will fail. Alternatively, you can add constraints later (see below) after you've filled in the new column correctly.

To remove a column, use a command like:

Whatever data was in the column disappears. Table constraints involving the column are dropped, too. However, if the column is referenced by a foreign key constraint of another table, PostgreSQL will not silently drop that constraint. You can authorize dropping everything that depends on the column by adding CASCADE:

See Section 5.15 for a description of the general mechanism behind this.

To add a constraint, the table constraint syntax is used. For example:

To add a not-null constraint, which is normally not written as a table constraint, this special syntax is available:

This command silently does nothing if the column already has a not-null constraint.

The constraint will be checked immediately, so the table data must satisfy the constraint before it can be added.

To remove a constraint you need to know its name. If you gave it a name then that's easy. Otherwise the system assigned a generated name, which you need to find out. The psql command \d tablename can be helpful here; other interfaces might also provide a way to inspect table details. Then the command is:

As with dropping a column, you need to add CASCADE if you want to drop a constraint that something else depends on. An example is that a foreign key constraint depends on a unique or primary key constraint on the referenced column(s).

Simplified syntax is available to drop a not-null constraint:

This mirrors the SET NOT NULL syntax for adding a not-null constraint. This command will silently do nothing if the column does not have a not-null constraint. (Recall that a column can have at most one not-null constraint, so it is never ambiguous which constraint this command acts on.)

To set a new default for a column, use a command like:

Note that this doesn't affect any existing rows in the table, it just changes the default for future INSERT commands.

To remove any default value, use:

This is effectively the same as setting the default to null. As a consequence, it is not an error to drop a default where one hadn't been defined, because the default is implicitly the null value.

To convert a column to a different data type, use a command like:

This will succeed only if each existing entry in the column can be converted to the new type by an implicit cast. If a more complex conversion is needed, you can add a USING clause that specifies how to compute the new values from the old.

PostgreSQL will attempt to convert the column's default value (if any) to the new type, as well as any constraints that involve the column. But these conversions might fail, or might produce surprising results. It's often best to drop any constraints on the column before altering its type, and then add back suitably modified constraints afterwards.

**Examples:**

Example 1 (unknown):
```unknown
ALTER TABLE products ADD COLUMN description text;
```

Example 2 (unknown):
```unknown
ALTER TABLE
```

Example 3 (unknown):
```unknown
ALTER TABLE
```

Example 4 (unknown):
```unknown
clock_timestamp()
```

---


---

## Chapter 5. Data Definition


**URL:** https://www.postgresql.org/docs/18/ddl.html

**Contents:**
- Chapter 5. Data Definition

This chapter covers how one creates the database structures that will hold one's data. In a relational database, the raw data is stored in tables, so the majority of this chapter is devoted to explaining how tables are created and modified and what features are available to control what data is stored in the tables. Subsequently, we discuss how tables can be organized into schemas, and how privileges can be assigned to tables. Finally, we will briefly look at other features that affect the data storage, such as inheritance, table partitioning, views, functions, and triggers.

---


---

## 5.13. Foreign Data #


**URL:** https://www.postgresql.org/docs/18/ddl-foreign-data.html

**Contents:**
- 5.13. Foreign Data #

PostgreSQL implements portions of the SQL/MED specification, allowing you to access data that resides outside PostgreSQL using regular SQL queries. Such data is referred to as foreign data. (Note that this usage is not to be confused with foreign keys, which are a type of constraint within the database.)

Foreign data is accessed with help from a foreign data wrapper. A foreign data wrapper is a library that can communicate with an external data source, hiding the details of connecting to the data source and obtaining data from it. There are some foreign data wrappers available as contrib modules; see Appendix F. Other kinds of foreign data wrappers might be found as third party products. If none of the existing foreign data wrappers suit your needs, you can write your own; see Chapter 58.

To access foreign data, you need to create a foreign server object, which defines how to connect to a particular external data source according to the set of options used by its supporting foreign data wrapper. Then you need to create one or more foreign tables, which define the structure of the remote data. A foreign table can be used in queries just like a normal table, but a foreign table has no storage in the PostgreSQL server. Whenever it is used, PostgreSQL asks the foreign data wrapper to fetch data from the external source, or transmit data to the external source in the case of update commands.

Accessing remote data may require authenticating to the external data source. This information can be provided by a user mapping, which can provide additional data such as user names and passwords based on the current PostgreSQL role.

For additional information, see CREATE FOREIGN DATA WRAPPER, CREATE SERVER, CREATE USER MAPPING, CREATE FOREIGN TABLE, and IMPORT FOREIGN SCHEMA.

---


---

