# PostgreSQL - Functions (Part 14)

## 9.16. JSON Functions and Operators # (continued)
jsonb_path_query('"2023-08-15 12:34:56"', '$.timestamp()') → "2023-08-15T12:34:56"

string . timestamp(precision) → timestamp without time zone

Timestamp without time zone value converted from a string, with fractional seconds adjusted to the given precision

jsonb_path_query('"2023-08-15 12:34:56.789"', '$.timestamp(2)') → "2023-08-15T12:34:56.79"

string . timestamp_tz() → timestamp with time zone

Timestamp with time zone value converted from a string

jsonb_path_query('"2023-08-15 12:34:56 +05:30"', '$.timestamp_tz()') → "2023-08-15T12:34:56+05:30"

string . timestamp_tz(precision) → timestamp with time zone

Timestamp with time zone value converted from a string, with fractional seconds adjusted to the given precision

jsonb_path_query('"2023-08-15 12:34:56.789 +05:30"', '$.timestamp_tz(2)') → "2023-08-15T12:34:56.79+05:30"

object . keyvalue() → array

The object's key-value pairs, represented as an array of objects containing three fields: "key", "value", and "id"; "id" is a unique identifier of the object the key-value pair belongs to

jsonb_path_query_array('{"x": "20", "y": 32}', '$.keyvalue()') → [{"id": 0, "key": "x", "value": "20"}, {"id": 0, "key": "y", "value": 32}]

The result type of the datetime() and datetime(template) methods can be date, timetz, time, timestamptz, or timestamp. Both methods determine their result type dynamically.

The datetime() method sequentially tries to match its input string to the ISO formats for date, timetz, time, timestamptz, and timestamp. It stops on the first matching format and emits the corresponding data type.

The datetime(template) method determines the result type according to the fields used in the provided template string.

The datetime() and datetime(template) methods use the same parsing rules as the to_timestamp SQL function does (see Section 9.8), with three exceptions. First, these methods don't allow unmatched template patterns. Second, only the following separators are allowed in the template string: minus sign, period, solidus (slash), comma, apostrophe, semicolon, colon and space. Third, separators in the template string must exactly match the input string.

If different date/time types need to be compared, an implicit cast is applied. A date value can be cast to timestamp or timestamptz, timestamp can be cast to timestamptz, and time to timetz. However, all but the first of these conversions depend on the current TimeZone setting, and thus can only be performed within timezone-aware jsonpath functions. Similarly, other date/time-related methods that convert strings to date/time types also do this casting, which may involve the current TimeZone setting. Therefore, these conversions can also only be performed within timezone-aware jsonpath functions.

Table 9.53 shows the available filter expression elements.

Table 9.53. jsonpath Filter Expression Elements

value == value → boolean

Equality comparison (this, and the other comparison operators, work on all JSON scalar values)

jsonb_path_query_array('[1, "a", 1, 3]', '$[*] ? (@ == 1)') → [1, 1]

jsonb_path_query_array('[1, "a", 1, 3]', '$[*] ? (@ == "a")') → ["a"]

value != value → boolean

value <> value → boolean

Non-equality comparison

jsonb_path_query_array('[1, 2, 1, 3]', '$[*] ? (@ != 1)') → [2, 3]

jsonb_path_query_array('["a", "b", "c"]', '$[*] ? (@ <> "b")') → ["a", "c"]

value < value → boolean

jsonb_path_query_array('[1, 2, 3]', '$[*] ? (@ < 2)') → [1]

value <= value → boolean

Less-than-or-equal-to comparison

jsonb_path_query_array('["a", "b", "c"]', '$[*] ? (@ <= "b")') → ["a", "b"]

value > value → boolean

Greater-than comparison

jsonb_path_query_array('[1, 2, 3]', '$[*] ? (@ > 2)') → [3]

value >= value → boolean

Greater-than-or-equal-to comparison

jsonb_path_query_array('[1, 2, 3]', '$[*] ? (@ >= 2)') → [2, 3]

jsonb_path_query('[{"name": "John", "parent": false}, {"name": "Chris", "parent": true}]', '$[*] ? (@.parent == true)') → {"name": "Chris", "parent": true}

jsonb_path_query('[{"name": "John", "parent": false}, {"name": "Chris", "parent": true}]', '$[*] ? (@.parent == false)') → {"name": "John", "parent": false}

JSON constant null (note that, unlike in SQL, comparison to null works normally)

jsonb_path_query('[{"name": "Mary", "job": null}, {"name": "Michael", "job": "driver"}]', '$[*] ? (@.job == null) .name') → "Mary"

boolean && boolean → boolean

jsonb_path_query('[1, 3, 7]', '$[*] ? (@ > 1 && @ < 5)') → 3

boolean || boolean → boolean

jsonb_path_query('[1, 3, 7]', '$[*] ? (@ < 1 || @ > 5)') → 7

jsonb_path_query('[1, 3, 7]', '$[*] ? (!(@ < 5))') → 7

boolean is unknown → boolean

Tests whether a Boolean condition is unknown.

jsonb_path_query('[-1, 2, 7, "foo"]', '$[*] ? ((@ > 0) is unknown)') → "foo"

string like_regex string [ flag string ] → boolean

Tests whether the first operand matches the regular expression given by the second operand, optionally with modifications described by a string of flag characters (see Section 9.16.2.4).

jsonb_path_query_array('["abc", "abd", "aBdC", "abdacb", "babc"]', '$[*] ? (@ like_regex "^ab.*c")') → ["abc", "abdacb"]

jsonb_path_query_array('["abc", "abd", "aBdC", "abdacb", "babc"]', '$[*] ? (@ like_regex "^ab.*c" flag "i")') → ["abc", "aBdC", "abdacb"]

string starts with string → boolean

Tests whether the second operand is an initial substring of the first operand.

jsonb_path_query('["John Smith", "Mary Stone", "Bob Johnson"]', '$[*] ? (@ starts with "John")') → "John Smith"

exists ( path_expression ) → boolean

Tests whether a path expression matches at least one SQL/JSON item. Returns unknown if the path expression would result in an error; the second example uses this to avoid a no-such-key error in strict mode.

jsonb_path_query('{"x": [1, 2], "y": [2, 4]}', 'strict $.* ? (exists (@ ? (@[*] > 2)))') → [2, 4]

jsonb_path_query_array('{"value": 41}', 'strict $ ? (exists (@.name)) .name') → []

SQL/JSON path expressions allow matching text to a regular expression with the like_regex filter. For example, the following SQL/JSON path query would case-insensitively match all strings in an array that start with an English vowel:

The optional flag string may include one or more of the characters i for case-insensitive match, m to allow ^ and $ to match at newlines, s to allow . to match a newline, and q to quote the whole pattern (reducing the behavior to a simple substring match).

The SQL/JSON standard borrows its definition for regular expressions from the LIKE_REGEX operator, which in turn uses the XQuery standard. PostgreSQL does not currently support the LIKE_REGEX operator. Therefore, the like_regex filter is implemented using the POSIX regular expression engine described in Section 9.7.3. This leads to various minor discrepancies from standard SQL/JSON behavior, which are cataloged in Section 9.7.3.8. Note, however, that the flag-letter incompatibilities described there do not apply to SQL/JSON, as it translates the XQuery flag letters to match what the POSIX engine expects.

Keep in mind that the pattern argument of like_regex is a JSON path string literal, written according to the rules given in Section 8.14.7. This means in particular that any backslashes you want to use in the regular expression must be doubled. For example, to match string values of the root document that contain only digits:

SQL/JSON functions JSON_EXISTS(), JSON_QUERY(), and JSON_VALUE() described in Table 9.54 can be used to query JSON documents. Each of these functions apply a path_expression (an SQL/JSON path query) to a context_item (the document). See Section 9.16.2 for more details on what the path_expression can contain. The path_expression can also reference variables, whose values are specified with their respective names in the PASSING clause that is supported by each function. context_item can be a jsonb value or a character string that can be successfully cast to jsonb.

Table 9.54. SQL/JSON Query Functions

Returns true if the SQL/JSON path_expression applied to the context_item yields any items, false otherwise.

The ON ERROR clause specifies the behavior if an error occurs during path_expression evaluation. Specifying ERROR will cause an error to be thrown with the appropriate message. Other options include returning boolean values FALSE or TRUE or the value UNKNOWN which is actually an SQL NULL. The default when no ON ERROR clause is specified is to return the boolean value FALSE.

JSON_EXISTS(jsonb '{"key1": [1,2,3]}', 'strict $.key1[*] ? (@ > $x)' PASSING 2 AS x) → t

JSON_EXISTS(jsonb '{"a": [1,2,3]}', 'lax $.a[5]' ERROR ON ERROR) → f

JSON_EXISTS(jsonb '{"a": [1,2,3]}', 'strict $.a[5]' ERROR ON ERROR) →

Returns the result of applying the SQL/JSON path_expression to the context_item.

By default, the result is returned as a value of type jsonb, though the RETURNING clause can be used to return as some other type to which it can be successfully coerced.

If the path expression may return multiple values, it might be necessary to wrap those values using the WITH WRAPPER clause to make it a valid JSON string, because the default behavior is to not wrap them, as if WITHOUT WRAPPER were specified. The WITH WRAPPER clause is by default taken to mean WITH UNCONDITIONAL WRAPPER, which means that even a single result value will be wrapped. To apply the wrapper only when multiple values are present, specify WITH CONDITIONAL WRAPPER. Getting multiple values in result will be treated as an error if WITHOUT WRAPPER is specified.

If the result is a scalar string, by default, the returned value will be surrounded by quotes, making it a valid JSON value. It can be made explicit by specifying KEEP QUOTES. Conversely, quotes can be omitted by specifying OMIT QUOTES. To ensure that the result is a valid JSON value, OMIT QUOTES cannot be specified when WITH WRAPPER is also specified.

The ON EMPTY clause specifies the behavior if evaluating path_expression yields an empty set. The ON ERROR clause specifies the behavior if an error occurs when evaluating path_expression, when coercing the result value to the RETURNING type, or when evaluating the ON EMPTY expression if the path_expression evaluation returns an empty set.

For both ON EMPTY and ON ERROR, specifying ERROR will cause an error to be thrown with the appropriate message. Other options include returning an SQL NULL, an empty array (EMPTY [ARRAY]), an empty object (EMPTY OBJECT), or a user-specified expression (DEFAULT expression) that can be coerced to jsonb or the type specified in RETURNING. The default when ON EMPTY or ON ERROR is not specified is to return an SQL NULL value.

JSON_QUERY(jsonb '[1,[2,3],null]', 'lax $[*][$off]' PASSING 1 AS off WITH CONDITIONAL WRAPPER) → 3

JSON_QUERY(jsonb '{"a": "[1, 2]"}', 'lax $.a' OMIT QUOTES) → [1, 2]

JSON_QUERY(jsonb '{"a": "[1, 2]"}', 'lax $.a' RETURNING int[] OMIT QUOTES ERROR ON ERROR) →

Returns the result of applying the SQL/JSON path_expression to the context_item.

Only use JSON_VALUE() if the extracted value is expected to be a single SQL/JSON scalar item; getting multiple values will be treated as an error. If you expect that extracted value might be an object or an array, use the JSON_QUERY function instead.

By default, the result, which must be a single scalar value, is returned as a value of type text, though the RETURNING clause can be used to return as some other type to which it can be successfully coerced.

The ON ERROR and ON EMPTY clauses have similar semantics as mentioned in the description of JSON_QUERY, except the set of values returned in lieu of throwing an error is different.

Note that scalar strings returned by JSON_VALUE always have their quotes removed, equivalent to specifying OMIT QUOTES in JSON_QUERY.

JSON_VALUE(jsonb '"123.45"', '$' RETURNING float) → 123.45

JSON_VALUE(jsonb '"03:04 2015-02-01"', '$.datetime("HH24:MI YYYY-MM-DD")' RETURNING date) → 2015-02-01

JSON_VALUE(jsonb '[1,2]', 'strict $[$off]' PASSING 1 as off) → 2

JSON_VALUE(jsonb '[1,2]', 'strict $[*]' DEFAULT 9 ON ERROR) → 9

The context_item expression is converted to jsonb by an implicit cast if the expression is not already of type jsonb. Note, however, that any parsing errors that occur during that conversion are thrown unconditionally, that is, are not handled according to the (specified or implicit) ON ERROR clause.

JSON_VALUE() returns an SQL NULL if path_expression returns a JSON null, whereas JSON_QUERY() returns the JSON null as is.

JSON_TABLE is an SQL/JSON function which queries JSON data and presents the results as a relational view, which can be accessed as a regular SQL table. You can use JSON_TABLE inside the FROM clause of a SELECT, UPDATE, or DELETE and as data source in a MERGE statement.

Taking JSON data as input, JSON_TABLE uses a JSON path expression to extract a part of the provided data to use as a row pattern for the constructed view. Each SQL/JSON value given by the row pattern serves as source for a separate row in the constructed view.

To split the row pattern into columns, JSON_TABLE provides the COLUMNS clause that defines the schema of the created view. For each column, a separate JSON path expression can be specified to be evaluated against the row pattern to get an SQL/JSON value that will become the value for the specified column in a given output row.

JSON data stored at a nested level of the row pattern can be extracted using the NESTED PATH clause. Each NESTED PATH clause can be used to generate one or more columns using the data from a nested level of the row pattern. Those columns can be specified using a COLUMNS clause that looks similar to the top-level COLUMNS clause. Rows constructed from NESTED COLUMNS are called child rows and are joined against the row constructed from the columns specified in the parent COLUMNS clause to get the row in the final view. Child columns themselves may contain a NESTED PATH specification thus allowing to extract data located at arbitrary nesting levels. Columns produced by multiple NESTED PATHs at the same level are considered to be siblings of each other and their rows after joining with the parent row are combined using UNION.

The rows produced by JSON_TABLE are laterally joined to the row that generated them, so you do not have to explicitly join the constructed view with the original table holding JSON data.

Each syntax element is described below in more detail.

The context_item specifies the input document to query, the path_expression is an SQL/JSON path expression defining the query, and json_path_name is an optional name for the path_expression. The optional PASSING clause provides data values for the variables mentioned in the path_expression. The result of the input data evaluation using the aforementioned elements is called the row pattern, which is used as the source for row values in the constructed view.

The COLUMNS clause defining the schema of the constructed view. In this clause, you can specify each column to be filled with an SQL/JSON value obtained by applying a JSON path expression against the row pattern. json_table_column has the following variants:

Adds an ordinality column that provides sequential row numbering starting from 1. Each NESTED PATH (see below) gets its own counter for any nested ordinality columns.

Inserts an SQL/JSON value obtained by applying path_expression against the row pattern into the view's output row after coercing it to specified type.

Specifying FORMAT JSON makes it explicit that you expect the value to be a valid json object. It only makes sense to specify FORMAT JSON if type is one of bpchar, bytea, character varying, name, json, jsonb, text, or a domain over these types.

Optionally, you can specify WRAPPER and QUOTES clauses to format the output. Note that specifying OMIT QUOTES overrides FORMAT JSON if also specified, because unquoted literals do not constitute valid json values.

Optionally, you can use ON EMPTY and ON ERROR clauses to specify whether to throw the error or return the specified value when the result of JSON path evaluation is empty and when an error occurs during JSON path evaluation or when coercing the SQL/JSON value to the specified type, respectively. The default for both is to return a NULL value.

This clause is internally turned into and has the same semantics as JSON_VALUE or JSON_QUERY. The latter if the specified type is not a scalar type or if either of FORMAT JSON, WRAPPER, or QUOTES clause is present.

Inserts a boolean value obtained by applying path_expression against the row pattern into the view's output row after coercing it to specified type.

The value corresponds to whether applying the PATH expression to the row pattern yields any values.

The specified type should have a cast from the boolean type.

Optionally, you can use ON ERROR to specify whether to throw the error or return the specified value when an error occurs during JSON path evaluation or when coercing SQL/JSON value to the specified type. The default is to return a boolean value FALSE.

This clause is internally turned into and has the same semantics as JSON_EXISTS.

Extracts SQL/JSON values from nested levels of the row pattern, generates one or more columns as defined by the COLUMNS subclause, and inserts the extracted SQL/JSON values into those columns. The json_table_column expression in the COLUMNS subclause uses the same syntax as in the parent COLUMNS clause.

The NESTED PATH syntax is recursive, so you can go down multiple nested levels by specifying several NESTED PATH subclauses within each other. It allows to unnest the hierarchy of JSON objects and arrays in a single function invocation rather than chaining several JSON_TABLE expressions in an SQL statement.

In each variant of json_table_column described above, if the PATH clause is omitted, path expression $.name is used, where name is the provided column name.

The optional json_path_name serves as an identifier of the provided path_expression. The name must be unique and distinct from the column names.

The optional ON ERROR can be used to specify how to handle errors when evaluating the top-level path_expression. Use ERROR if you want the errors to be thrown and EMPTY to return an empty table, that is, a table containing 0 rows. Note that this clause does not affect the errors that occur when evaluating columns, for which the behavior depends on whether the ON ERROR clause is specified against a given column.

In the examples that follow, the following table containing JSON data will be used:

The following query shows how to use JSON_TABLE to turn the JSON objects in the my_films table to a view containing columns for the keys kind, title, and director contained in the original JSON along with an ordinality column:

The following is a modified version of the above query to show the usage of PASSING arguments in the filter specified in the top-level JSON path expression and the various options for the individual columns:

The following is a modified version of the above query to show the usage of NESTED PATH for populating title and director columns, illustrating how they are joined to the parent columns id and kind:

The following is the same query but without the filter in the root path:

The following shows another query using a different JSON object as input. It shows the UNION "sibling join" between NESTED paths $.movies[*] and $.books[*] and also the usage of FOR ORDINALITY column at NESTED levels (columns movie_id, book_id, and author_id):

**Examples:**

Example 1 (unknown):
```unknown
json_object_agg
```

Example 2 (unknown):
```unknown
jsonb_object_agg
```

Example 3 (json):
```json
'[{"a":"foo"},{"b":"bar"},{"c":"baz"}]'::json -> 2
```

Example 4 (json):
```json
{"c":"baz"}
```

---


---

## 9.18. Conditional Expressions #


**URL:** https://www.postgresql.org/docs/18/functions-conditional.html

**Contents:**
- 9.18. Conditional Expressions #
  - Tip
  - Note
  - 9.18.1. CASE #
  - Note
  - 9.18.2. COALESCE #
  - 9.18.3. NULLIF #
  - 9.18.4. GREATEST and LEAST #

This section describes the SQL-compliant conditional expressions available in PostgreSQL.

If your needs go beyond the capabilities of these conditional expressions, you might want to consider writing a server-side function in a more expressive programming language.

Although COALESCE, GREATEST, and LEAST are syntactically similar to functions, they are not ordinary functions, and thus cannot be used with explicit VARIADIC array arguments.

The SQL CASE expression is a generic conditional expression, similar to if/else statements in other programming languages:

CASE clauses can be used wherever an expression is valid. Each condition is an expression that returns a boolean result. If the condition's result is true, the value of the CASE expression is the result that follows the condition, and the remainder of the CASE expression is not processed. If the condition's result is not true, any subsequent WHEN clauses are examined in the same manner. If no WHEN condition yields true, the value of the CASE expression is the result of the ELSE clause. If the ELSE clause is omitted and no condition is true, the result is null.

The data types of all the result expressions must be convertible to a single output type. See Section 10.5 for more details.

There is a “simple” form of CASE expression that is a variant of the general form above:

The first expression is computed, then compared to each of the value expressions in the WHEN clauses until one is found that is equal to it. If no match is found, the result of the ELSE clause (or a null value) is returned. This is similar to the switch statement in C.

The example above can be written using the simple CASE syntax:

A CASE expression does not evaluate any subexpressions that are not needed to determine the result. For example, this is a possible way of avoiding a division-by-zero failure:

As described in Section 4.2.14, there are various situations in which subexpressions of an expression are evaluated at different times, so that the principle that “CASE evaluates only necessary subexpressions” is not ironclad. For example a constant 1/0 subexpression will usually result in a division-by-zero failure at planning time, even if it's within a CASE arm that would never be entered at run time.

The COALESCE function returns the first of its arguments that is not null. Null is returned only if all arguments are null. It is often used to substitute a default value for null values when data is retrieved for display, for example:

This returns description if it is not null, otherwise short_description if it is not null, otherwise (none).

The arguments must all be convertible to a common data type, which will be the type of the result (see Section 10.5 for details).

Like a CASE expression, COALESCE only evaluates the arguments that are needed to determine the result; that is, arguments to the right of the first non-null argument are not evaluated. This SQL-standard function provides capabilities similar to NVL and IFNULL, which are used in some other database systems.

The NULLIF function returns a null value if value1 equals value2; otherwise it returns value1. This can be used to perform the inverse operation of the COALESCE example given above:

In this example, if value is (none), null is returned, otherwise the value of value is returned.

The two arguments must be of comparable types. To be specific, they are compared exactly as if you had written value1 = value2, so there must be a suitable = operator available.

The result has the same type as the first argument — but there is a subtlety. What is actually returned is the first argument of the implied = operator, and in some cases that will have been promoted to match the second argument's type. For example, NULLIF(1, 2.2) yields numeric, because there is no integer = numeric operator, only numeric = numeric.

The GREATEST and LEAST functions select the largest or smallest value from a list of any number of expressions. The expressions must all be convertible to a common data type, which will be the type of the result (see Section 10.5 for details).

NULL values in the argument list are ignored. The result will be NULL only if all the expressions evaluate to NULL. (This is a deviation from the SQL standard. According to the standard, the return value is NULL if any argument is NULL. Some other databases behave this way.)

**Examples:**

Example 1 (sql):
```sql
SELECT * FROM test;

 a
---
 1
 2
 3


SELECT a,
       CASE WHEN a=1 THEN 'one'
            WHEN a=2 THEN 'two'
            ELSE 'other'
       END
    FROM test;

 a | case
---+-------
 1 | one
 2 | two
 3 | other
```

Example 2 (sql):
```sql
SELECT a,
       CASE a WHEN 1 THEN 'one'
              WHEN 2 THEN 'two'
              ELSE 'other'
       END
    FROM test;

 a | case
---+-------
 1 | one
 2 | two
 3 | other
```

Example 3 (sql):
```sql
SELECT ... WHERE CASE WHEN x <> 0 THEN y/x > 1.5 ELSE false END;
```

Example 4 (sql):
```sql
SELECT COALESCE(description, short_description, '(none)') ...
```

---


---

