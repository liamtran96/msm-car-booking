# PostgreSQL - Functions (Part 13)

## 9.16. JSON Functions and Operators # (continued)
While the example below uses a constant JSON value, typical use would be to reference a json or jsonb column laterally from another table in the query's FROM clause. Writing json_populate_record in the FROM clause is good practice, since all of the extracted columns are available for use without duplicate function calls.

create type subrowtype as (d int, e text); create type myrowtype as (a int, b text[], c subrowtype);

select * from json_populate_record(null::myrowtype, '{"a": 1, "b": ["2", "a b"], "c": {"d": 4, "e": "a b c"}, "x": "foo"}') →

jsonb_populate_record_valid ( base anyelement, from_json json ) → boolean

Function for testing jsonb_populate_record. Returns true if the input jsonb_populate_record would finish without an error for the given input JSON object; that is, it's valid input, false otherwise.

create type jsb_char2 as (a char(2));

select jsonb_populate_record_valid(NULL::jsb_char2, '{"a": "aaa"}'); →

select * from jsonb_populate_record(NULL::jsb_char2, '{"a": "aaa"}') q; →

select jsonb_populate_record_valid(NULL::jsb_char2, '{"a": "aa"}'); →

select * from jsonb_populate_record(NULL::jsb_char2, '{"a": "aa"}') q; →

json_populate_recordset ( base anyelement, from_json json ) → setof anyelement

jsonb_populate_recordset ( base anyelement, from_json jsonb ) → setof anyelement

Expands the top-level JSON array of objects to a set of rows having the composite type of the base argument. Each element of the JSON array is processed as described above for json[b]_populate_record.

create type twoints as (a int, b int);

select * from json_populate_recordset(null::twoints, '[{"a":1,"b":2}, {"a":3,"b":4}]') →

json_to_record ( json ) → record

jsonb_to_record ( jsonb ) → record

Expands the top-level JSON object to a row having the composite type defined by an AS clause. (As with all functions returning record, the calling query must explicitly define the structure of the record with an AS clause.) The output record is filled from fields of the JSON object, in the same way as described above for json[b]_populate_record. Since there is no input record value, unmatched columns are always filled with nulls.

create type myrowtype as (a int, b text);

select * from json_to_record('{"a":1,"b":[1,2,3],"c":[1,2,3],"e":"bar","r": {"a": 123, "b": "a b c"}}') as x(a int, b text, c int[], d text, r myrowtype) →

json_to_recordset ( json ) → setof record

jsonb_to_recordset ( jsonb ) → setof record

Expands the top-level JSON array of objects to a set of rows having the composite type defined by an AS clause. (As with all functions returning record, the calling query must explicitly define the structure of the record with an AS clause.) Each element of the JSON array is processed as described above for json[b]_populate_record.

select * from json_to_recordset('[{"a":1,"b":"foo"}, {"a":"2","c":"bar"}]') as x(a int, b text) →

jsonb_set ( target jsonb, path text[], new_value jsonb [, create_if_missing boolean ] ) → jsonb

Returns target with the item designated by path replaced by new_value, or with new_value added if create_if_missing is true (which is the default) and the item designated by path does not exist. All earlier steps in the path must exist, or the target is returned unchanged. As with the path oriented operators, negative integers that appear in the path count from the end of JSON arrays. If the last path step is an array index that is out of range, and create_if_missing is true, the new value is added at the beginning of the array if the index is negative, or at the end of the array if it is positive.

jsonb_set('[{"f1":1,"f2":null},2,null,3]', '{0,f1}', '[2,3,4]', false) → [{"f1": [2, 3, 4], "f2": null}, 2, null, 3]

jsonb_set('[{"f1":1,"f2":null},2]', '{0,f3}', '[2,3,4]') → [{"f1": 1, "f2": null, "f3": [2, 3, 4]}, 2]

jsonb_set_lax ( target jsonb, path text[], new_value jsonb [, create_if_missing boolean [, null_value_treatment text ]] ) → jsonb

If new_value is not NULL, behaves identically to jsonb_set. Otherwise behaves according to the value of null_value_treatment which must be one of 'raise_exception', 'use_json_null', 'delete_key', or 'return_target'. The default is 'use_json_null'.

jsonb_set_lax('[{"f1":1,"f2":null},2,null,3]', '{0,f1}', null) → [{"f1": null, "f2": null}, 2, null, 3]

jsonb_set_lax('[{"f1":99,"f2":null},2]', '{0,f3}', null, true, 'return_target') → [{"f1": 99, "f2": null}, 2]

jsonb_insert ( target jsonb, path text[], new_value jsonb [, insert_after boolean ] ) → jsonb

Returns target with new_value inserted. If the item designated by the path is an array element, new_value will be inserted before that item if insert_after is false (which is the default), or after it if insert_after is true. If the item designated by the path is an object field, new_value will be inserted only if the object does not already contain that key. All earlier steps in the path must exist, or the target is returned unchanged. As with the path oriented operators, negative integers that appear in the path count from the end of JSON arrays. If the last path step is an array index that is out of range, the new value is added at the beginning of the array if the index is negative, or at the end of the array if it is positive.

jsonb_insert('{"a": [0,1,2]}', '{a, 1}', '"new_value"') → {"a": [0, "new_value", 1, 2]}

jsonb_insert('{"a": [0,1,2]}', '{a, 1}', '"new_value"', true) → {"a": [0, 1, "new_value", 2]}

json_strip_nulls ( target json [,strip_in_arrays boolean ] ) → json

jsonb_strip_nulls ( target jsonb [,strip_in_arrays boolean ] ) → jsonb

Deletes all object fields that have null values from the given JSON value, recursively. If strip_in_arrays is true (the default is false), null array elements are also stripped. Otherwise they are not stripped. Bare null values are never stripped.

json_strip_nulls('[{"f1":1, "f2":null}, 2, null, 3]') → [{"f1":1},2,null,3]

jsonb_strip_nulls('[1,2,null,3,4]', true) → [1,2,3,4]

jsonb_path_exists ( target jsonb, path jsonpath [, vars jsonb [, silent boolean ]] ) → boolean

Checks whether the JSON path returns any item for the specified JSON value. (This is useful only with SQL-standard JSON path expressions, not predicate check expressions, since those always return a value.) If the vars argument is specified, it must be a JSON object, and its fields provide named values to be substituted into the jsonpath expression. If the silent argument is specified and is true, the function suppresses the same errors as the @? and @@ operators do.

jsonb_path_exists('{"a":[1,2,3,4,5]}', '$.a[*] ? (@ >= $min && @ <= $max)', '{"min":2, "max":4}') → t

jsonb_path_match ( target jsonb, path jsonpath [, vars jsonb [, silent boolean ]] ) → boolean

Returns the SQL boolean result of a JSON path predicate check for the specified JSON value. (This is useful only with predicate check expressions, not SQL-standard JSON path expressions, since it will either fail or return NULL if the path result is not a single boolean value.) The optional vars and silent arguments act the same as for jsonb_path_exists.

jsonb_path_match('{"a":[1,2,3,4,5]}', 'exists($.a[*] ? (@ >= $min && @ <= $max))', '{"min":2, "max":4}') → t

jsonb_path_query ( target jsonb, path jsonpath [, vars jsonb [, silent boolean ]] ) → setof jsonb

Returns all JSON items returned by the JSON path for the specified JSON value. For SQL-standard JSON path expressions it returns the JSON values selected from target. For predicate check expressions it returns the result of the predicate check: true, false, or null. The optional vars and silent arguments act the same as for jsonb_path_exists.

select * from jsonb_path_query('{"a":[1,2,3,4,5]}', '$.a[*] ? (@ >= $min && @ <= $max)', '{"min":2, "max":4}') →

jsonb_path_query_array ( target jsonb, path jsonpath [, vars jsonb [, silent boolean ]] ) → jsonb

Returns all JSON items returned by the JSON path for the specified JSON value, as a JSON array. The parameters are the same as for jsonb_path_query.

jsonb_path_query_array('{"a":[1,2,3,4,5]}', '$.a[*] ? (@ >= $min && @ <= $max)', '{"min":2, "max":4}') → [2, 3, 4]

jsonb_path_query_first ( target jsonb, path jsonpath [, vars jsonb [, silent boolean ]] ) → jsonb

Returns the first JSON item returned by the JSON path for the specified JSON value, or NULL if there are no results. The parameters are the same as for jsonb_path_query.

jsonb_path_query_first('{"a":[1,2,3,4,5]}', '$.a[*] ? (@ >= $min && @ <= $max)', '{"min":2, "max":4}') → 2

jsonb_path_exists_tz ( target jsonb, path jsonpath [, vars jsonb [, silent boolean ]] ) → boolean

jsonb_path_match_tz ( target jsonb, path jsonpath [, vars jsonb [, silent boolean ]] ) → boolean

jsonb_path_query_tz ( target jsonb, path jsonpath [, vars jsonb [, silent boolean ]] ) → setof jsonb

jsonb_path_query_array_tz ( target jsonb, path jsonpath [, vars jsonb [, silent boolean ]] ) → jsonb

jsonb_path_query_first_tz ( target jsonb, path jsonpath [, vars jsonb [, silent boolean ]] ) → jsonb

These functions act like their counterparts described above without the _tz suffix, except that these functions support comparisons of date/time values that require timezone-aware conversions. The example below requires interpretation of the date-only value 2015-08-02 as a timestamp with time zone, so the result depends on the current TimeZone setting. Due to this dependency, these functions are marked as stable, which means these functions cannot be used in indexes. Their counterparts are immutable, and so can be used in indexes; but they will throw errors if asked to make such comparisons.

jsonb_path_exists_tz('["2015-08-01 12:00:00-05"]', '$[*] ? (@.datetime() < "2015-08-02".datetime())') → t

jsonb_pretty ( jsonb ) → text

Converts the given JSON value to pretty-printed, indented text.

jsonb_pretty('[{"f1":1,"f2":null}, 2]') →

json_typeof ( json ) → text

jsonb_typeof ( jsonb ) → text

Returns the type of the top-level JSON value as a text string. Possible types are object, array, string, number, boolean, and null. (The null result should not be confused with an SQL NULL; see the examples.)

json_typeof('-123.4') → number

json_typeof('null'::json) → null

json_typeof(NULL::json) IS NULL → t

SQL/JSON path expressions specify item(s) to be retrieved from a JSON value, similarly to XPath expressions used for access to XML content. In PostgreSQL, path expressions are implemented as the jsonpath data type and can use any elements described in Section 8.14.7.

JSON query functions and operators pass the provided path expression to the path engine for evaluation. If the expression matches the queried JSON data, the corresponding JSON item, or set of items, is returned. If there is no match, the result will be NULL, false, or an error, depending on the function. Path expressions are written in the SQL/JSON path language and can include arithmetic expressions and functions.

A path expression consists of a sequence of elements allowed by the jsonpath data type. The path expression is normally evaluated from left to right, but you can use parentheses to change the order of operations. If the evaluation is successful, a sequence of JSON items is produced, and the evaluation result is returned to the JSON query function that completes the specified computation.

To refer to the JSON value being queried (the context item), use the $ variable in the path expression. The first element of a path must always be $. It can be followed by one or more accessor operators, which go down the JSON structure level by level to retrieve sub-items of the context item. Each accessor operator acts on the result(s) of the previous evaluation step, producing zero, one, or more output items from each input item.

For example, suppose you have some JSON data from a GPS tracker that you would like to parse, such as:

(The above example can be copied-and-pasted into psql to set things up for the following examples. Then psql will expand :'json' into a suitably-quoted string constant containing the JSON value.)

To retrieve the available track segments, you need to use the .key accessor operator to descend through surrounding JSON objects, for example:

To retrieve the contents of an array, you typically use the [*] operator. The following example will return the location coordinates for all the available track segments:

Here we started with the whole JSON input value ($), then the .track accessor selected the JSON object associated with the "track" object key, then the .segments accessor selected the JSON array associated with the "segments" key within that object, then the [*] accessor selected each element of that array (producing a series of items), then the .location accessor selected the JSON array associated with the "location" key within each of those objects. In this example, each of those objects had a "location" key; but if any of them did not, the .location accessor would have simply produced no output for that input item.

To return the coordinates of the first segment only, you can specify the corresponding subscript in the [] accessor operator. Recall that JSON array indexes are 0-relative:

The result of each path evaluation step can be processed by one or more of the jsonpath operators and methods listed in Section 9.16.2.3. Each method name must be preceded by a dot. For example, you can get the size of an array:

More examples of using jsonpath operators and methods within path expressions appear below in Section 9.16.2.3.

A path can also contain filter expressions that work similarly to the WHERE clause in SQL. A filter expression begins with a question mark and provides a condition in parentheses:

Filter expressions must be written just after the path evaluation step to which they should apply. The result of that step is filtered to include only those items that satisfy the provided condition. SQL/JSON defines three-valued logic, so the condition can produce true, false, or unknown. The unknown value plays the same role as SQL NULL and can be tested for with the is unknown predicate. Further path evaluation steps use only those items for which the filter expression returned true.

The functions and operators that can be used in filter expressions are listed in Table 9.53. Within a filter expression, the @ variable denotes the value being considered (i.e., one result of the preceding path step). You can write accessor operators after @ to retrieve component items.

For example, suppose you would like to retrieve all heart rate values higher than 130. You can achieve this as follows:

To get the start times of segments with such values, you have to filter out irrelevant segments before selecting the start times, so the filter expression is applied to the previous step, and the path used in the condition is different:

You can use several filter expressions in sequence, if required. The following example selects start times of all segments that contain locations with relevant coordinates and high heart rate values:

Using filter expressions at different nesting levels is also allowed. The following example first filters all segments by location, and then returns high heart rate values for these segments, if available:

You can also nest filter expressions within each other. This example returns the size of the track if it contains any segments with high heart rate values, or an empty sequence otherwise:

PostgreSQL's implementation of the SQL/JSON path language has the following deviations from the SQL/JSON standard.

As an extension to the SQL standard, a PostgreSQL path expression can be a Boolean predicate, whereas the SQL standard allows predicates only within filters. While SQL-standard path expressions return the relevant element(s) of the queried JSON value, predicate check expressions return the single three-valued jsonb result of the predicate: true, false, or null. For example, we could write this SQL-standard filter expression:

The similar predicate check expression simply returns true, indicating that a match exists:

Predicate check expressions are required in the @@ operator (and the jsonb_path_match function), and should not be used with the @? operator (or the jsonb_path_exists function).

There are minor differences in the interpretation of regular expression patterns used in like_regex filters, as described in Section 9.16.2.4.

When you query JSON data, the path expression may not match the actual JSON data structure. An attempt to access a non-existent member of an object or element of an array is defined as a structural error. SQL/JSON path expressions have two modes of handling structural errors:

lax (default) — the path engine implicitly adapts the queried data to the specified path. Any structural errors that cannot be fixed as described below are suppressed, producing no match.

strict — if a structural error occurs, an error is raised.

Lax mode facilitates matching of a JSON document and path expression when the JSON data does not conform to the expected schema. If an operand does not match the requirements of a particular operation, it can be automatically wrapped as an SQL/JSON array, or unwrapped by converting its elements into an SQL/JSON sequence before performing the operation. Also, comparison operators automatically unwrap their operands in lax mode, so you can compare SQL/JSON arrays out-of-the-box. An array of size 1 is considered equal to its sole element. Automatic unwrapping is not performed when:

The path expression contains type() or size() methods that return the type and the number of elements in the array, respectively.

The queried JSON data contain nested arrays. In this case, only the outermost array is unwrapped, while all the inner arrays remain unchanged. Thus, implicit unwrapping can only go one level down within each path evaluation step.

For example, when querying the GPS data listed above, you can abstract from the fact that it stores an array of segments when using lax mode:

In strict mode, the specified path must exactly match the structure of the queried JSON document, so using this path expression will cause an error:

To get the same result as in lax mode, you have to explicitly unwrap the segments array:

The unwrapping behavior of lax mode can lead to surprising results. For instance, the following query using the .** accessor selects every HR value twice:

This happens because the .** accessor selects both the segments array and each of its elements, while the .HR accessor automatically unwraps arrays when using lax mode. To avoid surprising results, we recommend using the .** accessor only in strict mode. The following query selects each HR value just once:

The unwrapping of arrays can also lead to unexpected results. Consider this example, which selects all the location arrays:

As expected it returns the full arrays. But applying a filter expression causes the arrays to be unwrapped to evaluate each item, returning only the items that match the expression:

This despite the fact that the full arrays are selected by the path expression. Use strict mode to restore selecting the arrays:

Table 9.52 shows the operators and methods available in jsonpath. Note that while the unary operators and methods can be applied to multiple values resulting from a preceding path step, the binary operators (addition etc.) can only be applied to single values. In lax mode, methods applied to an array will be executed for each value in the array. The exceptions are .type() and .size(), which apply to the array itself.

Table 9.52. jsonpath Operators and Methods

number + number → number

jsonb_path_query('[2]', '$[0] + 3') → 5

Unary plus (no operation); unlike addition, this can iterate over multiple values

jsonb_path_query_array('{"x": [2,3,4]}', '+ $.x') → [2, 3, 4]

number - number → number

jsonb_path_query('[2]', '7 - $[0]') → 5

Negation; unlike subtraction, this can iterate over multiple values

jsonb_path_query_array('{"x": [2,3,4]}', '- $.x') → [-2, -3, -4]

number * number → number

jsonb_path_query('[4]', '2 * $[0]') → 8

number / number → number

jsonb_path_query('[8.5]', '$[0] / 2') → 4.2500000000000000

number % number → number

jsonb_path_query('[32]', '$[0] % 10') → 2

value . type() → string

Type of the JSON item (see json_typeof)

jsonb_path_query_array('[1, "2", {}]', '$[*].type()') → ["number", "string", "object"]

value . size() → number

Size of the JSON item (number of array elements, or 1 if not an array)

jsonb_path_query('{"m": [11, 15]}', '$.m.size()') → 2

value . boolean() → boolean

Boolean value converted from a JSON boolean, number, or string

jsonb_path_query_array('[1, "yes", false]', '$[*].boolean()') → [true, true, false]

value . string() → string

String value converted from a JSON boolean, number, string, or datetime

jsonb_path_query_array('[1.23, "xyz", false]', '$[*].string()') → ["1.23", "xyz", "false"]

jsonb_path_query('"2023-08-15 12:34:56"', '$.timestamp().string()') → "2023-08-15T12:34:56"

value . double() → number

Approximate floating-point number converted from a JSON number or string

jsonb_path_query('{"len": "1.9"}', '$.len.double() * 2') → 3.8

number . ceiling() → number

Nearest integer greater than or equal to the given number

jsonb_path_query('{"h": 1.3}', '$.h.ceiling()') → 2

number . floor() → number

Nearest integer less than or equal to the given number

jsonb_path_query('{"h": 1.7}', '$.h.floor()') → 1

number . abs() → number

Absolute value of the given number

jsonb_path_query('{"z": -0.3}', '$.z.abs()') → 0.3

value . bigint() → bigint

Big integer value converted from a JSON number or string

jsonb_path_query('{"len": "9876543219"}', '$.len.bigint()') → 9876543219

value . decimal( [ precision [ , scale ] ] ) → decimal

Rounded decimal value converted from a JSON number or string (precision and scale must be integer values)

jsonb_path_query('1234.5678', '$.decimal(6, 2)') → 1234.57

value . integer() → integer

Integer value converted from a JSON number or string

jsonb_path_query('{"len": "12345"}', '$.len.integer()') → 12345

value . number() → numeric

Numeric value converted from a JSON number or string

jsonb_path_query('{"len": "123.45"}', '$.len.number()') → 123.45

string . datetime() → datetime_type (see note)

Date/time value converted from a string

jsonb_path_query('["2015-8-1", "2015-08-12"]', '$[*] ? (@.datetime() < "2015-08-2".datetime())') → "2015-8-1"

string . datetime(template) → datetime_type (see note)

Date/time value converted from a string using the specified to_timestamp template

jsonb_path_query_array('["12:30", "18:40"]', '$[*].datetime("HH24:MI")') → ["12:30:00", "18:40:00"]

string . date() → date

Date value converted from a string

jsonb_path_query('"2023-08-15"', '$.date()') → "2023-08-15"

string . time() → time without time zone

Time without time zone value converted from a string

jsonb_path_query('"12:34:56"', '$.time()') → "12:34:56"

string . time(precision) → time without time zone

Time without time zone value converted from a string, with fractional seconds adjusted to the given precision

jsonb_path_query('"12:34:56.789"', '$.time(2)') → "12:34:56.79"

string . time_tz() → time with time zone

Time with time zone value converted from a string

jsonb_path_query('"12:34:56 +05:30"', '$.time_tz()') → "12:34:56+05:30"

string . time_tz(precision) → time with time zone

Time with time zone value converted from a string, with fractional seconds adjusted to the given precision

jsonb_path_query('"12:34:56.789 +05:30"', '$.time_tz(2)') → "12:34:56.79+05:30"

string . timestamp() → timestamp without time zone

Timestamp without time zone value converted from a string


*(continued...)*
---

