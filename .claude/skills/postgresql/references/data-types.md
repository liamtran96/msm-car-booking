# PostgreSQL - Data Types

## 8.19. Object Identifier Types #


**URL:** https://www.postgresql.org/docs/18/datatype-oid.html

**Contents:**
- 8.19. Object Identifier Types #
  - Note

Object identifiers (OIDs) are used internally by PostgreSQL as primary keys for various system tables. Type oid represents an object identifier. There are also several alias types for oid, each named regsomething. Table 8.26 shows an overview.

The oid type is currently implemented as an unsigned four-byte integer. Therefore, it is not large enough to provide database-wide uniqueness in large databases, or even in large individual tables.

The oid type itself has few operations beyond comparison. It can be cast to integer, however, and then manipulated using the standard integer operators. (Beware of possible signed-versus-unsigned confusion if you do this.)

The OID alias types have no operations of their own except for specialized input and output routines. These routines are able to accept and display symbolic names for system objects, rather than the raw numeric value that type oid would use. The alias types allow simplified lookup of OID values for objects. For example, to examine the pg_attribute rows related to a table mytable, one could write:

While that doesn't look all that bad by itself, it's still oversimplified. A far more complicated sub-select would be needed to select the right OID if there are multiple tables named mytable in different schemas. The regclass input converter handles the table lookup according to the schema path setting, and so it does the “right thing” automatically. Similarly, casting a table's OID to regclass is handy for symbolic display of a numeric OID.

Table 8.26. Object Identifier Types

All of the OID alias types for objects that are grouped by namespace accept schema-qualified names, and will display schema-qualified names on output if the object would not be found in the current search path without being qualified. For example, myschema.mytable is acceptable input for regclass (if there is such a table). That value might be output as myschema.mytable, or just mytable, depending on the current search path. The regproc and regoper alias types will only accept input names that are unique (not overloaded), so they are of limited use; for most uses regprocedure or regoperator are more appropriate. For regoperator, unary operators are identified by writing NONE for the unused operand.

The input functions for these types allow whitespace between tokens, and will fold upper-case letters to lower case, except within double quotes; this is done to make the syntax rules similar to the way object names are written in SQL. Conversely, the output functions will use double quotes if needed to make the output be a valid SQL identifier. For example, the OID of a function named Foo (with upper case F) taking two integer arguments could be entered as ' "Foo" ( int, integer ) '::regprocedure. The output would look like "Foo"(integer,integer). Both the function name and the argument type names could be schema-qualified, too.

Many built-in PostgreSQL functions accept the OID of a table, or another kind of database object, and for convenience are declared as taking regclass (or the appropriate OID alias type). This means you do not have to look up the object's OID by hand, but can just enter its name as a string literal. For example, the nextval(regclass) function takes a sequence relation's OID, so you could call it like this:

When you write the argument of such a function as an unadorned literal string, it becomes a constant of type regclass (or the appropriate type). Since this is really just an OID, it will track the originally identified object despite later renaming, schema reassignment, etc. This “early binding” behavior is usually desirable for object references in column defaults and views. But sometimes you might want “late binding” where the object reference is resolved at run time. To get late-binding behavior, force the constant to be stored as a text constant instead of regclass:

The to_regclass() function and its siblings can also be used to perform run-time lookups. See Table 9.76.

Another practical example of use of regclass is to look up the OID of a table listed in the information_schema views, which don't supply such OIDs directly. One might for example wish to call the pg_relation_size() function, which requires the table OID. Taking the above rules into account, the correct way to do that is

The quote_ident() function will take care of double-quoting the identifiers where needed. The seemingly easier

is not recommended, because it will fail for tables that are outside your search path or have names that require quoting.

An additional property of most of the OID alias types is the creation of dependencies. If a constant of one of these types appears in a stored expression (such as a column default expression or view), it creates a dependency on the referenced object. For example, if a column has a default expression nextval('my_seq'::regclass), PostgreSQL understands that the default expression depends on the sequence my_seq, so the system will not let the sequence be dropped without first removing the default expression. The alternative of nextval('my_seq'::text) does not create a dependency. (regrole is an exception to this property. Constants of this type are not allowed in stored expressions.)

Another identifier type used by the system is xid, or transaction (abbreviated xact) identifier. This is the data type of the system columns xmin and xmax. Transaction identifiers are 32-bit quantities. In some contexts, a 64-bit variant xid8 is used. Unlike xid values, xid8 values increase strictly monotonically and cannot be reused in the lifetime of a database cluster. See Section 67.1 for more details.

A third identifier type used by the system is cid, or command identifier. This is the data type of the system columns cmin and cmax. Command identifiers are also 32-bit quantities.

A final identifier type used by the system is tid, or tuple identifier (row identifier). This is the data type of the system column ctid. A tuple ID is a pair (block number, tuple index within block) that identifies the physical location of the row within its table.

(The system columns are further explained in Section 5.6.)

**Examples:**

Example 1 (unknown):
```unknown
regsomething
```

Example 2 (unknown):
```unknown
pg_attribute
```

Example 3 (sql):
```sql
SELECT * FROM pg_attribute WHERE attrelid = 'mytable'::regclass;
```

Example 4 (sql):
```sql
SELECT * FROM pg_attribute
  WHERE attrelid = (SELECT oid FROM pg_class WHERE relname = 'mytable');
```

---


---

## 8.6. Boolean Type #


**URL:** https://www.postgresql.org/docs/18/datatype-boolean.html

**Contents:**
- 8.6. Boolean Type #

PostgreSQL provides the standard SQL type boolean; see Table 8.19. The boolean type can have several states: “true”, “false”, and a third state, “unknown”, which is represented by the SQL null value.

Table 8.19. Boolean Data Type

Boolean constants can be represented in SQL queries by the SQL key words TRUE, FALSE, and NULL.

The datatype input function for type boolean accepts these string representations for the “true” state:

and these representations for the “false” state:

Unique prefixes of these strings are also accepted, for example t or n. Leading or trailing whitespace is ignored, and case does not matter.

The datatype output function for type boolean always emits either t or f, as shown in Example 8.2.

Example 8.2. Using the boolean Type

The key words TRUE and FALSE are the preferred (SQL-compliant) method for writing Boolean constants in SQL queries. But you can also use the string representations by following the generic string-literal constant syntax described in Section 4.1.2.7, for example 'yes'::boolean.

Note that the parser automatically understands that TRUE and FALSE are of type boolean, but this is not so for NULL because that can have any type. So in some contexts you might have to cast NULL to boolean explicitly, for example NULL::boolean. Conversely, the cast can be omitted from a string-literal Boolean value in contexts where the parser can deduce that the literal must be of type boolean.

**Examples:**

Example 1 (sql):
```sql
CREATE TABLE test1 (a boolean, b text);
INSERT INTO test1 VALUES (TRUE, 'sic est');
INSERT INTO test1 VALUES (FALSE, 'non est');
SELECT * FROM test1;
 a |    b
---+---------
 t | sic est
 f | non est

SELECT * FROM test1 WHERE a;
 a |    b
---+---------
 t | sic est
```

Example 2 (julia):
```julia
'yes'::boolean
```

Example 3 (yaml):
```yaml
NULL::boolean
```

---


---

## 8.1. Numeric Types #


**URL:** https://www.postgresql.org/docs/18/datatype-numeric.html

**Contents:**
- 8.1. Numeric Types #
  - 8.1.1. Integer Types #
  - 8.1.2. Arbitrary Precision Numbers #
  - Note
  - Note
  - Note
  - 8.1.3. Floating-Point Types #
  - Note
  - Note
  - Note

Numeric types consist of two-, four-, and eight-byte integers, four- and eight-byte floating-point numbers, and selectable-precision decimals. Table 8.2 lists the available types.

Table 8.2. Numeric Types

The syntax of constants for the numeric types is described in Section 4.1.2. The numeric types have a full set of corresponding arithmetic operators and functions. Refer to Chapter 9 for more information. The following sections describe the types in detail.

The types smallint, integer, and bigint store whole numbers, that is, numbers without fractional components, of various ranges. Attempts to store values outside of the allowed range will result in an error.

The type integer is the common choice, as it offers the best balance between range, storage size, and performance. The smallint type is generally only used if disk space is at a premium. The bigint type is designed to be used when the range of the integer type is insufficient.

SQL only specifies the integer types integer (or int), smallint, and bigint. The type names int2, int4, and int8 are extensions, which are also used by some other SQL database systems.

The type numeric can store numbers with a very large number of digits. It is especially recommended for storing monetary amounts and other quantities where exactness is required. Calculations with numeric values yield exact results where possible, e.g., addition, subtraction, multiplication. However, calculations on numeric values are very slow compared to the integer types, or to the floating-point types described in the next section.

We use the following terms below: The precision of a numeric is the total count of significant digits in the whole number, that is, the number of digits to both sides of the decimal point. The scale of a numeric is the count of decimal digits in the fractional part, to the right of the decimal point. So the number 23.5141 has a precision of 6 and a scale of 4. Integers can be considered to have a scale of zero.

Both the maximum precision and the maximum scale of a numeric column can be configured. To declare a column of type numeric use the syntax:

The precision must be positive, while the scale may be positive or negative (see below). Alternatively:

selects a scale of 0. Specifying:

without any precision or scale creates an “unconstrained numeric” column in which numeric values of any length can be stored, up to the implementation limits. A column of this kind will not coerce input values to any particular scale, whereas numeric columns with a declared scale will coerce input values to that scale. (The SQL standard requires a default scale of 0, i.e., coercion to integer precision. We find this a bit useless. If you're concerned about portability, always specify the precision and scale explicitly.)

The maximum precision that can be explicitly specified in a numeric type declaration is 1000. An unconstrained numeric column is subject to the limits described in Table 8.2.

If the scale of a value to be stored is greater than the declared scale of the column, the system will round the value to the specified number of fractional digits. Then, if the number of digits to the left of the decimal point exceeds the declared precision minus the declared scale, an error is raised. For example, a column declared as

will round values to 1 decimal place and can store values between -99.9 and 99.9, inclusive.

Beginning in PostgreSQL 15, it is allowed to declare a numeric column with a negative scale. Then values will be rounded to the left of the decimal point. The precision still represents the maximum number of non-rounded digits. Thus, a column declared as

will round values to the nearest thousand and can store values between -99000 and 99000, inclusive. It is also allowed to declare a scale larger than the declared precision. Such a column can only hold fractional values, and it requires the number of zero digits just to the right of the decimal point to be at least the declared scale minus the declared precision. For example, a column declared as

will round values to 5 decimal places and can store values between -0.00999 and 0.00999, inclusive.

PostgreSQL permits the scale in a numeric type declaration to be any value in the range -1000 to 1000. However, the SQL standard requires the scale to be in the range 0 to precision. Using scales outside that range may not be portable to other database systems.

Numeric values are physically stored without any extra leading or trailing zeroes. Thus, the declared precision and scale of a column are maximums, not fixed allocations. (In this sense the numeric type is more akin to varchar(n) than to char(n).) The actual storage requirement is two bytes for each group of four decimal digits, plus three to eight bytes overhead.

In addition to ordinary numeric values, the numeric type has several special values:

Infinity -Infinity NaN

These are adapted from the IEEE 754 standard, and represent “infinity”, “negative infinity”, and “not-a-number”, respectively. When writing these values as constants in an SQL command, you must put quotes around them, for example UPDATE table SET x = '-Infinity'. On input, these strings are recognized in a case-insensitive manner. The infinity values can alternatively be spelled inf and -inf.

The infinity values behave as per mathematical expectations. For example, Infinity plus any finite value equals Infinity, as does Infinity plus Infinity; but Infinity minus Infinity yields NaN (not a number), because it has no well-defined interpretation. Note that an infinity can only be stored in an unconstrained numeric column, because it notionally exceeds any finite precision limit.

The NaN (not a number) value is used to represent undefined calculational results. In general, any operation with a NaN input yields another NaN. The only exception is when the operation's other inputs are such that the same output would be obtained if the NaN were to be replaced by any finite or infinite numeric value; then, that output value is used for NaN too. (An example of this principle is that NaN raised to the zero power yields one.)

In most implementations of the “not-a-number” concept, NaN is not considered equal to any other numeric value (including NaN). In order to allow numeric values to be sorted and used in tree-based indexes, PostgreSQL treats NaN values as equal, and greater than all non-NaN values.

The types decimal and numeric are equivalent. Both types are part of the SQL standard.

When rounding values, the numeric type rounds ties away from zero, while (on most machines) the real and double precision types round ties to the nearest even number. For example:

The data types real and double precision are inexact, variable-precision numeric types. On all currently supported platforms, these types are implementations of IEEE Standard 754 for Binary Floating-Point Arithmetic (single and double precision, respectively), to the extent that the underlying processor, operating system, and compiler support it.

Inexact means that some values cannot be converted exactly to the internal format and are stored as approximations, so that storing and retrieving a value might show slight discrepancies. Managing these errors and how they propagate through calculations is the subject of an entire branch of mathematics and computer science and will not be discussed here, except for the following points:

If you require exact storage and calculations (such as for monetary amounts), use the numeric type instead.

If you want to do complicated calculations with these types for anything important, especially if you rely on certain behavior in boundary cases (infinity, underflow), you should evaluate the implementation carefully.

Comparing two floating-point values for equality might not always work as expected.

On all currently supported platforms, the real type has a range of around 1E-37 to 1E+37 with a precision of at least 6 decimal digits. The double precision type has a range of around 1E-307 to 1E+308 with a precision of at least 15 digits. Values that are too large or too small will cause an error. Rounding might take place if the precision of an input number is too high. Numbers too close to zero that are not representable as distinct from zero will cause an underflow error.

By default, floating point values are output in text form in their shortest precise decimal representation; the decimal value produced is closer to the true stored binary value than to any other value representable in the same binary precision. (However, the output value is currently never exactly midway between two representable values, in order to avoid a widespread bug where input routines do not properly respect the round-to-nearest-even rule.) This value will use at most 17 significant decimal digits for float8 values, and at most 9 digits for float4 values.

This shortest-precise output format is much faster to generate than the historical rounded format.

For compatibility with output generated by older versions of PostgreSQL, and to allow the output precision to be reduced, the extra_float_digits parameter can be used to select rounded decimal output instead. Setting a value of 0 restores the previous default of rounding the value to 6 (for float4) or 15 (for float8) significant decimal digits. Setting a negative value reduces the number of digits further; for example -2 would round output to 4 or 13 digits respectively.

Any value of extra_float_digits greater than 0 selects the shortest-precise format.

Applications that wanted precise values have historically had to set extra_float_digits to 3 to obtain them. For maximum compatibility between versions, they should continue to do so.

In addition to ordinary numeric values, the floating-point types have several special values:

Infinity -Infinity NaN

These represent the IEEE 754 special values “infinity”, “negative infinity”, and “not-a-number”, respectively. When writing these values as constants in an SQL command, you must put quotes around them, for example UPDATE table SET x = '-Infinity'. On input, these strings are recognized in a case-insensitive manner. The infinity values can alternatively be spelled inf and -inf.

IEEE 754 specifies that NaN should not compare equal to any other floating-point value (including NaN). In order to allow floating-point values to be sorted and used in tree-based indexes, PostgreSQL treats NaN values as equal, and greater than all non-NaN values.

PostgreSQL also supports the SQL-standard notations float and float(p) for specifying inexact numeric types. Here, p specifies the minimum acceptable precision in binary digits. PostgreSQL accepts float(1) to float(24) as selecting the real type, while float(25) to float(53) select double precision. Values of p outside the allowed range draw an error. float with no precision specified is taken to mean double precision.

This section describes a PostgreSQL-specific way to create an autoincrementing column. Another way is to use the SQL-standard identity column feature, described at Section 5.3.

The data types smallserial, serial and bigserial are not true types, but merely a notational convenience for creating unique identifier columns (similar to the AUTO_INCREMENT property supported by some other databases). In the current implementation, specifying:

is equivalent to specifying:

Thus, we have created an integer column and arranged for its default values to be assigned from a sequence generator. A NOT NULL constraint is applied to ensure that a null value cannot be inserted. (In most cases you would also want to attach a UNIQUE or PRIMARY KEY constraint to prevent duplicate values from being inserted by accident, but this is not automatic.) Lastly, the sequence is marked as “owned by” the column, so that it will be dropped if the column or table is dropped.

Because smallserial, serial and bigserial are implemented using sequences, there may be "holes" or gaps in the sequence of values which appears in the column, even if no rows are ever deleted. A value allocated from the sequence is still "used up" even if a row containing that value is never successfully inserted into the table column. This may happen, for example, if the inserting transaction rolls back. See nextval() in Section 9.17 for details.

To insert the next value of the sequence into the serial column, specify that the serial column should be assigned its default value. This can be done either by excluding the column from the list of columns in the INSERT statement, or through the use of the DEFAULT key word.

The type names serial and serial4 are equivalent: both create integer columns. The type names bigserial and serial8 work the same way, except that they create a bigint column. bigserial should be used if you anticipate the use of more than 231 identifiers over the lifetime of the table. The type names smallserial and serial2 also work the same way, except that they create a smallint column.

The sequence created for a serial column is automatically dropped when the owning column is dropped. You can drop the sequence without dropping the column, but this will force removal of the column default expression.

**Examples:**

Example 1 (unknown):
```unknown
double precision
```

Example 2 (unknown):
```unknown
smallserial
```

Example 3 (unknown):
```unknown
NUMERIC(precision, scale)
```

Example 4 (unknown):
```unknown
NUMERIC(precision)
```

---


---

