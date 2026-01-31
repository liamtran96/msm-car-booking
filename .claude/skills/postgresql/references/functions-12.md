# PostgreSQL - Functions (Part 12)

## 9.16. JSON Functions and Operators #


**URL:** https://www.postgresql.org/docs/18/functions-json.html

**Contents:**
- 9.16. JSON Functions and Operators #
  - 9.16.1. Processing and Creating JSON Data #
  - Note
  - Note
  - 9.16.2. The SQL/JSON Path Language #
    - 9.16.2.1. Deviations from the SQL Standard #
      - 9.16.2.1.1. Boolean Predicate Check Expressions #
  - Note
      - 9.16.2.1.2. Regular Expression Interpretation #
    - 9.16.2.2. Strict and Lax Modes #

This section describes:

functions and operators for processing and creating JSON data

the SQL/JSON path language

the SQL/JSON query functions

To provide native support for JSON data types within the SQL environment, PostgreSQL implements the SQL/JSON data model. This model comprises sequences of items. Each item can hold SQL scalar values, with an additional SQL/JSON null value, and composite data structures that use JSON arrays and objects. The model is a formalization of the implied data model in the JSON specification RFC 7159.

SQL/JSON allows you to handle JSON data alongside regular SQL data, with transaction support, including:

Uploading JSON data into the database and storing it in regular SQL columns as character or binary strings.

Generating JSON objects and arrays from relational data.

Querying JSON data using SQL/JSON query functions and SQL/JSON path language expressions.

To learn more about the SQL/JSON standard, see [sqltr-19075-6]. For details on JSON types supported in PostgreSQL, see Section 8.14.

Table 9.47 shows the operators that are available for use with JSON data types (see Section 8.14). In addition, the usual comparison operators shown in Table 9.1 are available for jsonb, though not for json. The comparison operators follow the ordering rules for B-tree operations outlined in Section 8.14.4. See also Section 9.21 for the aggregate function json_agg which aggregates record values as JSON, the aggregate function json_object_agg which aggregates pairs of values into a JSON object, and their jsonb equivalents, jsonb_agg and jsonb_object_agg.

Table 9.47. json and jsonb Operators

json -> integer → json

jsonb -> integer → jsonb

Extracts n'th element of JSON array (array elements are indexed from zero, but negative integers count from the end).

'[{"a":"foo"},{"b":"bar"},{"c":"baz"}]'::json -> 2 → {"c":"baz"}

'[{"a":"foo"},{"b":"bar"},{"c":"baz"}]'::json -> -3 → {"a":"foo"}

jsonb -> text → jsonb

Extracts JSON object field with the given key.

'{"a": {"b":"foo"}}'::json -> 'a' → {"b":"foo"}

json ->> integer → text

jsonb ->> integer → text

Extracts n'th element of JSON array, as text.

'[1,2,3]'::json ->> 2 → 3

jsonb ->> text → text

Extracts JSON object field with the given key, as text.

'{"a":1,"b":2}'::json ->> 'b' → 2

json #> text[] → json

jsonb #> text[] → jsonb

Extracts JSON sub-object at the specified path, where path elements can be either field keys or array indexes.

'{"a": {"b": ["foo","bar"]}}'::json #> '{a,b,1}' → "bar"

json #>> text[] → text

jsonb #>> text[] → text

Extracts JSON sub-object at the specified path as text.

'{"a": {"b": ["foo","bar"]}}'::json #>> '{a,b,1}' → bar

The field/element/path extraction operators return NULL, rather than failing, if the JSON input does not have the right structure to match the request; for example if no such key or array element exists.

Some further operators exist only for jsonb, as shown in Table 9.48. Section 8.14.4 describes how these operators can be used to effectively search indexed jsonb data.

Table 9.48. Additional jsonb Operators

jsonb @> jsonb → boolean

Does the first JSON value contain the second? (See Section 8.14.3 for details about containment.)

'{"a":1, "b":2}'::jsonb @> '{"b":2}'::jsonb → t

jsonb <@ jsonb → boolean

Is the first JSON value contained in the second?

'{"b":2}'::jsonb <@ '{"a":1, "b":2}'::jsonb → t

jsonb ? text → boolean

Does the text string exist as a top-level key or array element within the JSON value?

'{"a":1, "b":2}'::jsonb ? 'b' → t

'["a", "b", "c"]'::jsonb ? 'b' → t

jsonb ?| text[] → boolean

Do any of the strings in the text array exist as top-level keys or array elements?

'{"a":1, "b":2, "c":3}'::jsonb ?| array['b', 'd'] → t

jsonb ?& text[] → boolean

Do all of the strings in the text array exist as top-level keys or array elements?

'["a", "b", "c"]'::jsonb ?& array['a', 'b'] → t

jsonb || jsonb → jsonb

Concatenates two jsonb values. Concatenating two arrays generates an array containing all the elements of each input. Concatenating two objects generates an object containing the union of their keys, taking the second object's value when there are duplicate keys. All other cases are treated by converting a non-array input into a single-element array, and then proceeding as for two arrays. Does not operate recursively: only the top-level array or object structure is merged.

'["a", "b"]'::jsonb || '["a", "d"]'::jsonb → ["a", "b", "a", "d"]

'{"a": "b"}'::jsonb || '{"c": "d"}'::jsonb → {"a": "b", "c": "d"}

'[1, 2]'::jsonb || '3'::jsonb → [1, 2, 3]

'{"a": "b"}'::jsonb || '42'::jsonb → [{"a": "b"}, 42]

To append an array to another array as a single entry, wrap it in an additional layer of array, for example:

'[1, 2]'::jsonb || jsonb_build_array('[3, 4]'::jsonb) → [1, 2, [3, 4]]

Deletes a key (and its value) from a JSON object, or matching string value(s) from a JSON array.

'{"a": "b", "c": "d"}'::jsonb - 'a' → {"c": "d"}

'["a", "b", "c", "b"]'::jsonb - 'b' → ["a", "c"]

jsonb - text[] → jsonb

Deletes all matching keys or array elements from the left operand.

'{"a": "b", "c": "d"}'::jsonb - '{a,c}'::text[] → {}

jsonb - integer → jsonb

Deletes the array element with specified index (negative integers count from the end). Throws an error if JSON value is not an array.

'["a", "b"]'::jsonb - 1 → ["a"]

jsonb #- text[] → jsonb

Deletes the field or array element at the specified path, where path elements can be either field keys or array indexes.

'["a", {"b":1}]'::jsonb #- '{1,b}' → ["a", {}]

jsonb @? jsonpath → boolean

Does JSON path return any item for the specified JSON value? (This is useful only with SQL-standard JSON path expressions, not predicate check expressions, since those always return a value.)

'{"a":[1,2,3,4,5]}'::jsonb @? '$.a[*] ? (@ > 2)' → t

jsonb @@ jsonpath → boolean

Returns the result of a JSON path predicate check for the specified JSON value. (This is useful only with predicate check expressions, not SQL-standard JSON path expressions, since it will return NULL if the path result is not a single boolean value.)

'{"a":[1,2,3,4,5]}'::jsonb @@ '$.a[*] > 2' → t

The jsonpath operators @? and @@ suppress the following errors: missing object field or array element, unexpected JSON item type, datetime and numeric errors. The jsonpath-related functions described below can also be told to suppress these types of errors. This behavior might be helpful when searching JSON document collections of varying structure.

Table 9.49 shows the functions that are available for constructing json and jsonb values. Some functions in this table have a RETURNING clause, which specifies the data type returned. It must be one of json, jsonb, bytea, a character string type (text, char, or varchar), or a type that can be cast to json. By default, the json type is returned.

Table 9.49. JSON Creation Functions

to_json ( anyelement ) → json

to_jsonb ( anyelement ) → jsonb

Converts any SQL value to json or jsonb. Arrays and composites are converted recursively to arrays and objects (multidimensional arrays become arrays of arrays in JSON). Otherwise, if there is a cast from the SQL data type to json, the cast function will be used to perform the conversion;[a] otherwise, a scalar JSON value is produced. For any scalar other than a number, a Boolean, or a null value, the text representation will be used, with escaping as necessary to make it a valid JSON string value.

to_json('Fred said "Hi."'::text) → "Fred said \"Hi.\""

to_jsonb(row(42, 'Fred said "Hi."'::text)) → {"f1": 42, "f2": "Fred said \"Hi.\""}

array_to_json ( anyarray [, boolean ] ) → json

Converts an SQL array to a JSON array. The behavior is the same as to_json except that line feeds will be added between top-level array elements if the optional boolean parameter is true.

array_to_json('{{1,5},{99,100}}'::int[]) → [[1,5],[99,100]]

json_array ( [ { value_expression [ FORMAT JSON ] } [, ...] ] [ { NULL | ABSENT } ON NULL ] [ RETURNING data_type [ FORMAT JSON [ ENCODING UTF8 ] ] ])

json_array ( [ query_expression ] [ RETURNING data_type [ FORMAT JSON [ ENCODING UTF8 ] ] ])

Constructs a JSON array from either a series of value_expression parameters or from the results of query_expression, which must be a SELECT query returning a single column. If ABSENT ON NULL is specified, NULL values are ignored. This is always the case if a query_expression is used.

json_array(1,true,json '{"a":null}') → [1, true, {"a":null}]

json_array(SELECT * FROM (VALUES(1),(2)) t) → [1, 2]

row_to_json ( record [, boolean ] ) → json

Converts an SQL composite value to a JSON object. The behavior is the same as to_json except that line feeds will be added between top-level elements if the optional boolean parameter is true.

row_to_json(row(1,'foo')) → {"f1":1,"f2":"foo"}

json_build_array ( VARIADIC "any" ) → json

jsonb_build_array ( VARIADIC "any" ) → jsonb

Builds a possibly-heterogeneously-typed JSON array out of a variadic argument list. Each argument is converted as per to_json or to_jsonb.

json_build_array(1, 2, 'foo', 4, 5) → [1, 2, "foo", 4, 5]

json_build_object ( VARIADIC "any" ) → json

jsonb_build_object ( VARIADIC "any" ) → jsonb

Builds a JSON object out of a variadic argument list. By convention, the argument list consists of alternating keys and values. Key arguments are coerced to text; value arguments are converted as per to_json or to_jsonb.

json_build_object('foo', 1, 2, row(3,'bar')) → {"foo" : 1, "2" : {"f1":3,"f2":"bar"}}

json_object ( [ { key_expression { VALUE | ':' } value_expression [ FORMAT JSON [ ENCODING UTF8 ] ] }[, ...] ] [ { NULL | ABSENT } ON NULL ] [ { WITH | WITHOUT } UNIQUE [ KEYS ] ] [ RETURNING data_type [ FORMAT JSON [ ENCODING UTF8 ] ] ])

Constructs a JSON object of all the key/value pairs given, or an empty object if none are given. key_expression is a scalar expression defining the JSON key, which is converted to the text type. It cannot be NULL nor can it belong to a type that has a cast to the json type. If WITH UNIQUE KEYS is specified, there must not be any duplicate key_expression. Any pair for which the value_expression evaluates to NULL is omitted from the output if ABSENT ON NULL is specified; if NULL ON NULL is specified or the clause omitted, the key is included with value NULL.

json_object('code' VALUE 'P123', 'title': 'Jaws') → {"code" : "P123", "title" : "Jaws"}

json_object ( text[] ) → json

jsonb_object ( text[] ) → jsonb

Builds a JSON object out of a text array. The array must have either exactly one dimension with an even number of members, in which case they are taken as alternating key/value pairs, or two dimensions such that each inner array has exactly two elements, which are taken as a key/value pair. All values are converted to JSON strings.

json_object('{a, 1, b, "def", c, 3.5}') → {"a" : "1", "b" : "def", "c" : "3.5"}

json_object('{{a, 1}, {b, "def"}, {c, 3.5}}') → {"a" : "1", "b" : "def", "c" : "3.5"}

json_object ( keys text[], values text[] ) → json

jsonb_object ( keys text[], values text[] ) → jsonb

This form of json_object takes keys and values pairwise from separate text arrays. Otherwise it is identical to the one-argument form.

json_object('{a,b}', '{1,2}') → {"a": "1", "b": "2"}

json ( expression [ FORMAT JSON [ ENCODING UTF8 ]] [ { WITH | WITHOUT } UNIQUE [ KEYS ]] ) → json

Converts a given expression specified as text or bytea string (in UTF8 encoding) into a JSON value. If expression is NULL, an SQL null value is returned. If WITH UNIQUE is specified, the expression must not contain any duplicate object keys.

json('{"a":123, "b":[true,"foo"], "a":"bar"}') → {"a":123, "b":[true,"foo"], "a":"bar"}

json_scalar ( expression )

Converts a given SQL scalar value into a JSON scalar value. If the input is NULL, an SQL null is returned. If the input is number or a boolean value, a corresponding JSON number or boolean value is returned. For any other value, a JSON string is returned.

json_scalar(123.45) → 123.45

json_scalar(CURRENT_TIMESTAMP) → "2022-05-10T10:51:04.62128-04:00"

json_serialize ( expression [ FORMAT JSON [ ENCODING UTF8 ] ] [ RETURNING data_type [ FORMAT JSON [ ENCODING UTF8 ] ] ] )

Converts an SQL/JSON expression into a character or binary string. The expression can be of any JSON type, any character string type, or bytea in UTF8 encoding. The returned type used in RETURNING can be any character string type or bytea. The default is text.

json_serialize('{ "a" : 1 } ' RETURNING bytea) → \x7b20226122203a2031207d20

[a] For example, the hstore extension has a cast from hstore to json, so that hstore values converted via the JSON creation functions will be represented as JSON objects, not as primitive string values.

Table 9.50 details SQL/JSON facilities for testing JSON.

Table 9.50. SQL/JSON Testing Functions

expression IS [ NOT ] JSON [ { VALUE | SCALAR | ARRAY | OBJECT } ] [ { WITH | WITHOUT } UNIQUE [ KEYS ] ]

This predicate tests whether expression can be parsed as JSON, possibly of a specified type. If SCALAR or ARRAY or OBJECT is specified, the test is whether or not the JSON is of that particular type. If WITH UNIQUE KEYS is specified, then any object in the expression is also tested to see if it has duplicate keys.

Table 9.51 shows the functions that are available for processing json and jsonb values.

Table 9.51. JSON Processing Functions

json_array_elements ( json ) → setof json

jsonb_array_elements ( jsonb ) → setof jsonb

Expands the top-level JSON array into a set of JSON values.

select * from json_array_elements('[1,true, [2,false]]') →

json_array_elements_text ( json ) → setof text

jsonb_array_elements_text ( jsonb ) → setof text

Expands the top-level JSON array into a set of text values.

select * from json_array_elements_text('["foo", "bar"]') →

json_array_length ( json ) → integer

jsonb_array_length ( jsonb ) → integer

Returns the number of elements in the top-level JSON array.

json_array_length('[1,2,3,{"f1":1,"f2":[5,6]},4]') → 5

jsonb_array_length('[]') → 0

json_each ( json ) → setof record ( key text, value json )

jsonb_each ( jsonb ) → setof record ( key text, value jsonb )

Expands the top-level JSON object into a set of key/value pairs.

select * from json_each('{"a":"foo", "b":"bar"}') →

json_each_text ( json ) → setof record ( key text, value text )

jsonb_each_text ( jsonb ) → setof record ( key text, value text )

Expands the top-level JSON object into a set of key/value pairs. The returned values will be of type text.

select * from json_each_text('{"a":"foo", "b":"bar"}') →

json_extract_path ( from_json json, VARIADIC path_elems text[] ) → json

jsonb_extract_path ( from_json jsonb, VARIADIC path_elems text[] ) → jsonb

Extracts JSON sub-object at the specified path. (This is functionally equivalent to the #> operator, but writing the path out as a variadic list can be more convenient in some cases.)

json_extract_path('{"f2":{"f3":1},"f4":{"f5":99,"f6":"foo"}}', 'f4', 'f6') → "foo"

json_extract_path_text ( from_json json, VARIADIC path_elems text[] ) → text

jsonb_extract_path_text ( from_json jsonb, VARIADIC path_elems text[] ) → text

Extracts JSON sub-object at the specified path as text. (This is functionally equivalent to the #>> operator.)

json_extract_path_text('{"f2":{"f3":1},"f4":{"f5":99,"f6":"foo"}}', 'f4', 'f6') → foo

json_object_keys ( json ) → setof text

jsonb_object_keys ( jsonb ) → setof text

Returns the set of keys in the top-level JSON object.

select * from json_object_keys('{"f1":"abc","f2":{"f3":"a", "f4":"b"}}') →

json_populate_record ( base anyelement, from_json json ) → anyelement

jsonb_populate_record ( base anyelement, from_json jsonb ) → anyelement

Expands the top-level JSON object to a row having the composite type of the base argument. The JSON object is scanned for fields whose names match column names of the output row type, and their values are inserted into those columns of the output. (Fields that do not correspond to any output column name are ignored.) In typical use, the value of base is just NULL, which means that any output columns that do not match any object field will be filled with nulls. However, if base isn't NULL then the values it contains will be used for unmatched columns.

To convert a JSON value to the SQL type of an output column, the following rules are applied in sequence:

A JSON null value is converted to an SQL null in all cases.

If the output column is of type json or jsonb, the JSON value is just reproduced exactly.

If the output column is a composite (row) type, and the JSON value is a JSON object, the fields of the object are converted to columns of the output row type by recursive application of these rules.

Likewise, if the output column is an array type and the JSON value is a JSON array, the elements of the JSON array are converted to elements of the output array by recursive application of these rules.

Otherwise, if the JSON value is a string, the contents of the string are fed to the input conversion function for the column's data type.

Otherwise, the ordinary text representation of the JSON value is fed to the input conversion function for the column's data type.


*(continued...)*
---

