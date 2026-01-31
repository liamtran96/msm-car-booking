# PostgreSQL - Data Types (Part 5)

## 8.15. Arrays #


**URL:** https://www.postgresql.org/docs/18/arrays.html

**Contents:**
- 8.15. Arrays #
  - 8.15.1. Declaration of Array Types #
  - 8.15.2. Array Value Input #
  - 8.15.3. Accessing Arrays #
  - 8.15.4. Modifying Arrays #
  - 8.15.5. Searching in Arrays #
  - Tip
  - 8.15.6. Array Input and Output Syntax #
  - Tip

PostgreSQL allows columns of a table to be defined as variable-length multidimensional arrays. Arrays of any built-in or user-defined base type, enum type, composite type, range type, or domain can be created.

To illustrate the use of array types, we create this table:

As shown, an array data type is named by appending square brackets ([]) to the data type name of the array elements. The above command will create a table named sal_emp with a column of type text (name), a one-dimensional array of type integer (pay_by_quarter), which represents the employee's salary by quarter, and a two-dimensional array of text (schedule), which represents the employee's weekly schedule.

The syntax for CREATE TABLE allows the exact size of arrays to be specified, for example:

However, the current implementation ignores any supplied array size limits, i.e., the behavior is the same as for arrays of unspecified length.

The current implementation does not enforce the declared number of dimensions either. Arrays of a particular element type are all considered to be of the same type, regardless of size or number of dimensions. So, declaring the array size or number of dimensions in CREATE TABLE is simply documentation; it does not affect run-time behavior.

An alternative syntax, which conforms to the SQL standard by using the keyword ARRAY, can be used for one-dimensional arrays. pay_by_quarter could have been defined as:

Or, if no array size is to be specified:

As before, however, PostgreSQL does not enforce the size restriction in any case.

To write an array value as a literal constant, enclose the element values within curly braces and separate them by commas. (If you know C, this is not unlike the C syntax for initializing structures.) You can put double quotes around any element value, and must do so if it contains commas or curly braces. (More details appear below.) Thus, the general format of an array constant is the following:

where delim is the delimiter character for the type, as recorded in its pg_type entry. Among the standard data types provided in the PostgreSQL distribution, all use a comma (,), except for type box which uses a semicolon (;). Each val is either a constant of the array element type, or a subarray. An example of an array constant is:

This constant is a two-dimensional, 3-by-3 array consisting of three subarrays of integers.

To set an element of an array constant to NULL, write NULL for the element value. (Any upper- or lower-case variant of NULL will do.) If you want an actual string value “NULL”, you must put double quotes around it.

(These kinds of array constants are actually only a special case of the generic type constants discussed in Section 4.1.2.7. The constant is initially treated as a string and passed to the array input conversion routine. An explicit type specification might be necessary.)

Now we can show some INSERT statements:

The result of the previous two inserts looks like this:

Multidimensional arrays must have matching extents for each dimension. A mismatch causes an error, for example:

The ARRAY constructor syntax can also be used:

Notice that the array elements are ordinary SQL constants or expressions; for instance, string literals are single quoted, instead of double quoted as they would be in an array literal. The ARRAY constructor syntax is discussed in more detail in Section 4.2.12.

Now, we can run some queries on the table. First, we show how to access a single element of an array. This query retrieves the names of the employees whose pay changed in the second quarter:

The array subscript numbers are written within square brackets. By default PostgreSQL uses a one-based numbering convention for arrays, that is, an array of n elements starts with array[1] and ends with array[n].

This query retrieves the third quarter pay of all employees:

We can also access arbitrary rectangular slices of an array, or subarrays. An array slice is denoted by writing lower-bound:upper-bound for one or more array dimensions. For example, this query retrieves the first item on Bill's schedule for the first two days of the week:

If any dimension is written as a slice, i.e., contains a colon, then all dimensions are treated as slices. Any dimension that has only a single number (no colon) is treated as being from 1 to the number specified. For example, [2] is treated as [1:2], as in this example:

To avoid confusion with the non-slice case, it's best to use slice syntax for all dimensions, e.g., [1:2][1:1], not [2][1:1].

It is possible to omit the lower-bound and/or upper-bound of a slice specifier; the missing bound is replaced by the lower or upper limit of the array's subscripts. For example:

An array subscript expression will return null if either the array itself or any of the subscript expressions are null. Also, null is returned if a subscript is outside the array bounds (this case does not raise an error). For example, if schedule currently has the dimensions [1:3][1:2] then referencing schedule[3][3] yields NULL. Similarly, an array reference with the wrong number of subscripts yields a null rather than an error.

An array slice expression likewise yields null if the array itself or any of the subscript expressions are null. However, in other cases such as selecting an array slice that is completely outside the current array bounds, a slice expression yields an empty (zero-dimensional) array instead of null. (This does not match non-slice behavior and is done for historical reasons.) If the requested slice partially overlaps the array bounds, then it is silently reduced to just the overlapping region instead of returning null.

The current dimensions of any array value can be retrieved with the array_dims function:

array_dims produces a text result, which is convenient for people to read but perhaps inconvenient for programs. Dimensions can also be retrieved with array_upper and array_lower, which return the upper and lower bound of a specified array dimension, respectively:

array_length will return the length of a specified array dimension:

cardinality returns the total number of elements in an array across all dimensions. It is effectively the number of rows a call to unnest would yield:

An array value can be replaced completely:

or using the ARRAY expression syntax:

An array can also be updated at a single element:

or updated in a slice:

The slice syntaxes with omitted lower-bound and/or upper-bound can be used too, but only when updating an array value that is not NULL or zero-dimensional (otherwise, there is no existing subscript limit to substitute).

A stored array value can be enlarged by assigning to elements not already present. Any positions between those previously present and the newly assigned elements will be filled with nulls. For example, if array myarray currently has 4 elements, it will have six elements after an update that assigns to myarray[6]; myarray[5] will contain null. Currently, enlargement in this fashion is only allowed for one-dimensional arrays, not multidimensional arrays.

Subscripted assignment allows creation of arrays that do not use one-based subscripts. For example one might assign to myarray[-2:7] to create an array with subscript values from -2 to 7.

New array values can also be constructed using the concatenation operator, ||:

The concatenation operator allows a single element to be pushed onto the beginning or end of a one-dimensional array. It also accepts two N-dimensional arrays, or an N-dimensional and an N+1-dimensional array.

When a single element is pushed onto either the beginning or end of a one-dimensional array, the result is an array with the same lower bound subscript as the array operand. For example:

When two arrays with an equal number of dimensions are concatenated, the result retains the lower bound subscript of the left-hand operand's outer dimension. The result is an array comprising every element of the left-hand operand followed by every element of the right-hand operand. For example:

When an N-dimensional array is pushed onto the beginning or end of an N+1-dimensional array, the result is analogous to the element-array case above. Each N-dimensional sub-array is essentially an element of the N+1-dimensional array's outer dimension. For example:

An array can also be constructed by using the functions array_prepend, array_append, or array_cat. The first two only support one-dimensional arrays, but array_cat supports multidimensional arrays. Some examples:

In simple cases, the concatenation operator discussed above is preferred over direct use of these functions. However, because the concatenation operator is overloaded to serve all three cases, there are situations where use of one of the functions is helpful to avoid ambiguity. For example consider:

In the examples above, the parser sees an integer array on one side of the concatenation operator, and a constant of undetermined type on the other. The heuristic it uses to resolve the constant's type is to assume it's of the same type as the operator's other input — in this case, integer array. So the concatenation operator is presumed to represent array_cat, not array_append. When that's the wrong choice, it could be fixed by casting the constant to the array's element type; but explicit use of array_append might be a preferable solution.

To search for a value in an array, each value must be checked. This can be done manually, if you know the size of the array. For example:

However, this quickly becomes tedious for large arrays, and is not helpful if the size of the array is unknown. An alternative method is described in Section 9.25. The above query could be replaced by:

In addition, you can find rows where the array has all values equal to 10000 with:

Alternatively, the generate_subscripts function can be used. For example:

This function is described in Table 9.70.

You can also search an array using the && operator, which checks whether the left operand overlaps with the right operand. For instance:

This and other array operators are further described in Section 9.19. It can be accelerated by an appropriate index, as described in Section 11.2.

You can also search for specific values in an array using the array_position and array_positions functions. The former returns the subscript of the first occurrence of a value in an array; the latter returns an array with the subscripts of all occurrences of the value in the array. For example:

Arrays are not sets; searching for specific array elements can be a sign of database misdesign. Consider using a separate table with a row for each item that would be an array element. This will be easier to search, and is likely to scale better for a large number of elements.

The external text representation of an array value consists of items that are interpreted according to the I/O conversion rules for the array's element type, plus decoration that indicates the array structure. The decoration consists of curly braces ({ and }) around the array value plus delimiter characters between adjacent items. The delimiter character is usually a comma (,) but can be something else: it is determined by the typdelim setting for the array's element type. Among the standard data types provided in the PostgreSQL distribution, all use a comma, except for type box, which uses a semicolon (;). In a multidimensional array, each dimension (row, plane, cube, etc.) gets its own level of curly braces, and delimiters must be written between adjacent curly-braced entities of the same level.

The array output routine will put double quotes around element values if they are empty strings, contain curly braces, delimiter characters, double quotes, backslashes, or white space, or match the word NULL. Double quotes and backslashes embedded in element values will be backslash-escaped. For numeric data types it is safe to assume that double quotes will never appear, but for textual data types one should be prepared to cope with either the presence or absence of quotes.

By default, the lower bound index value of an array's dimensions is set to one. To represent arrays with other lower bounds, the array subscript ranges can be specified explicitly before writing the array contents. This decoration consists of square brackets ([]) around each array dimension's lower and upper bounds, with a colon (:) delimiter character in between. The array dimension decoration is followed by an equal sign (=). For example:

The array output routine will include explicit dimensions in its result only when there are one or more lower bounds different from one.

If the value written for an element is NULL (in any case variant), the element is taken to be NULL. The presence of any quotes or backslashes disables this and allows the literal string value “NULL” to be entered. Also, for backward compatibility with pre-8.2 versions of PostgreSQL, the array_nulls configuration parameter can be turned off to suppress recognition of NULL as a NULL.

As shown previously, when writing an array value you can use double quotes around any individual array element. You must do so if the element value would otherwise confuse the array-value parser. For example, elements containing curly braces, commas (or the data type's delimiter character), double quotes, backslashes, or leading or trailing whitespace must be double-quoted. Empty strings and strings matching the word NULL must be quoted, too. To put a double quote or backslash in a quoted array element value, precede it with a backslash. Alternatively, you can avoid quotes and use backslash-escaping to protect all data characters that would otherwise be taken as array syntax.

You can add whitespace before a left brace or after a right brace. You can also add whitespace before or after any individual item string. In all of these cases the whitespace will be ignored. However, whitespace within double-quoted elements, or surrounded on both sides by non-whitespace characters of an element, is not ignored.

The ARRAY constructor syntax (see Section 4.2.12) is often easier to work with than the array-literal syntax when writing array values in SQL commands. In ARRAY, individual element values are written the same way they would be written when not members of an array.

**Examples:**

Example 1 (sql):
```sql
CREATE TABLE sal_emp (
    name            text,
    pay_by_quarter  integer[],
    schedule        text[][]
);
```

Example 2 (unknown):
```unknown
pay_by_quarter
```

Example 3 (sql):
```sql
CREATE TABLE
```

Example 4 (sql):
```sql
CREATE TABLE tictactoe (
    squares   integer[3][3]
);
```

---


---

## Chapter 8. Data Types


**URL:** https://www.postgresql.org/docs/18/datatype.html

**Contents:**
- Chapter 8. Data Types
  - Compatibility

PostgreSQL has a rich set of native data types available to users. Users can add new types to PostgreSQL using the CREATE TYPE command.

Table 8.1 shows all the built-in general-purpose data types. Most of the alternative names listed in the “Aliases” column are the names used internally by PostgreSQL for historical reasons. In addition, some internally used or deprecated types are available, but are not listed here.

Table 8.1. Data Types

The following types (or spellings thereof) are specified by SQL: bigint, bit, bit varying, boolean, char, character varying, character, varchar, date, double precision, integer, interval, numeric, decimal, real, smallint, time (with or without time zone), timestamp (with or without time zone), xml.

Each data type has an external representation determined by its input and output functions. Many of the built-in types have obvious external formats. However, several types are either unique to PostgreSQL, such as geometric paths, or have several possible formats, such as the date and time types. Some of the input and output functions are not invertible, i.e., the result of an output function might lose accuracy when compared to the original input.

**Examples:**

Example 1 (unknown):
```unknown
bit [ (n) ]
```

Example 2 (unknown):
```unknown
bit varying [ (n) ]
```

Example 3 (unknown):
```unknown
varbit [ (n) ]
```

Example 4 (unknown):
```unknown
character [ (n) ]
```

---


---

