# PostgreSQL - Data Types (Part 2)

## 8.14. JSON Types #


**URL:** https://www.postgresql.org/docs/18/datatype-json.html

**Contents:**
- 8.14. JSON Types #
  - Note
  - 8.14.1. JSON Input and Output Syntax #
  - 8.14.2. Designing JSON Documents #
  - 8.14.3. jsonb Containment and Existence #
  - Tip
  - 8.14.4. jsonb Indexing #
  - 8.14.5. jsonb Subscripting #
  - 8.14.6. Transforms #
  - 8.14.7. jsonpath Type #

JSON data types are for storing JSON (JavaScript Object Notation) data, as specified in RFC 7159. Such data can also be stored as text, but the JSON data types have the advantage of enforcing that each stored value is valid according to the JSON rules. There are also assorted JSON-specific functions and operators available for data stored in these data types; see Section 9.16.

PostgreSQL offers two types for storing JSON data: json and jsonb. To implement efficient query mechanisms for these data types, PostgreSQL also provides the jsonpath data type described in Section 8.14.7.

The json and jsonb data types accept almost identical sets of values as input. The major practical difference is one of efficiency. The json data type stores an exact copy of the input text, which processing functions must reparse on each execution; while jsonb data is stored in a decomposed binary format that makes it slightly slower to input due to added conversion overhead, but significantly faster to process, since no reparsing is needed. jsonb also supports indexing, which can be a significant advantage.

Because the json type stores an exact copy of the input text, it will preserve semantically-insignificant white space between tokens, as well as the order of keys within JSON objects. Also, if a JSON object within the value contains the same key more than once, all the key/value pairs are kept. (The processing functions consider the last value as the operative one.) By contrast, jsonb does not preserve white space, does not preserve the order of object keys, and does not keep duplicate object keys. If duplicate keys are specified in the input, only the last value is kept.

In general, most applications should prefer to store JSON data as jsonb, unless there are quite specialized needs, such as legacy assumptions about ordering of object keys.

RFC 7159 specifies that JSON strings should be encoded in UTF8. It is therefore not possible for the JSON types to conform rigidly to the JSON specification unless the database encoding is UTF8. Attempts to directly include characters that cannot be represented in the database encoding will fail; conversely, characters that can be represented in the database encoding but not in UTF8 will be allowed.

RFC 7159 permits JSON strings to contain Unicode escape sequences denoted by \uXXXX. In the input function for the json type, Unicode escapes are allowed regardless of the database encoding, and are checked only for syntactic correctness (that is, that four hex digits follow \u). However, the input function for jsonb is stricter: it disallows Unicode escapes for characters that cannot be represented in the database encoding. The jsonb type also rejects \u0000 (because that cannot be represented in PostgreSQL's text type), and it insists that any use of Unicode surrogate pairs to designate characters outside the Unicode Basic Multilingual Plane be correct. Valid Unicode escapes are converted to the equivalent single character for storage; this includes folding surrogate pairs into a single character.

Many of the JSON processing functions described in Section 9.16 will convert Unicode escapes to regular characters, and will therefore throw the same types of errors just described even if their input is of type json not jsonb. The fact that the json input function does not make these checks may be considered a historical artifact, although it does allow for simple storage (without processing) of JSON Unicode escapes in a database encoding that does not support the represented characters.

When converting textual JSON input into jsonb, the primitive types described by RFC 7159 are effectively mapped onto native PostgreSQL types, as shown in Table 8.23. Therefore, there are some minor additional constraints on what constitutes valid jsonb data that do not apply to the json type, nor to JSON in the abstract, corresponding to limits on what can be represented by the underlying data type. Notably, jsonb will reject numbers that are outside the range of the PostgreSQL numeric data type, while json will not. Such implementation-defined restrictions are permitted by RFC 7159. However, in practice such problems are far more likely to occur in other implementations, as it is common to represent JSON's number primitive type as IEEE 754 double precision floating point (which RFC 7159 explicitly anticipates and allows for). When using JSON as an interchange format with such systems, the danger of losing numeric precision compared to data originally stored by PostgreSQL should be considered.

Conversely, as noted in the table there are some minor restrictions on the input format of JSON primitive types that do not apply to the corresponding PostgreSQL types.

Table 8.23. JSON Primitive Types and Corresponding PostgreSQL Types

The input/output syntax for the JSON data types is as specified in RFC 7159.

The following are all valid json (or jsonb) expressions:

As previously stated, when a JSON value is input and then printed without any additional processing, json outputs the same text that was input, while jsonb does not preserve semantically-insignificant details such as whitespace. For example, note the differences here:

One semantically-insignificant detail worth noting is that in jsonb, numbers will be printed according to the behavior of the underlying numeric type. In practice this means that numbers entered with E notation will be printed without it, for example:

However, jsonb will preserve trailing fractional zeroes, as seen in this example, even though those are semantically insignificant for purposes such as equality checks.

For the list of built-in functions and operators available for constructing and processing JSON values, see Section 9.16.

Representing data as JSON can be considerably more flexible than the traditional relational data model, which is compelling in environments where requirements are fluid. It is quite possible for both approaches to co-exist and complement each other within the same application. However, even for applications where maximal flexibility is desired, it is still recommended that JSON documents have a somewhat fixed structure. The structure is typically unenforced (though enforcing some business rules declaratively is possible), but having a predictable structure makes it easier to write queries that usefully summarize a set of “documents” (datums) in a table.

JSON data is subject to the same concurrency-control considerations as any other data type when stored in a table. Although storing large documents is practicable, keep in mind that any update acquires a row-level lock on the whole row. Consider limiting JSON documents to a manageable size in order to decrease lock contention among updating transactions. Ideally, JSON documents should each represent an atomic datum that business rules dictate cannot reasonably be further subdivided into smaller datums that could be modified independently.

Testing containment is an important capability of jsonb. There is no parallel set of facilities for the json type. Containment tests whether one jsonb document has contained within it another one. These examples return true except as noted:

The general principle is that the contained object must match the containing object as to structure and data contents, possibly after discarding some non-matching array elements or object key/value pairs from the containing object. But remember that the order of array elements is not significant when doing a containment match, and duplicate array elements are effectively considered only once.

As a special exception to the general principle that the structures must match, an array may contain a primitive value:

jsonb also has an existence operator, which is a variation on the theme of containment: it tests whether a string (given as a text value) appears as an object key or array element at the top level of the jsonb value. These examples return true except as noted:

JSON objects are better suited than arrays for testing containment or existence when there are many keys or elements involved, because unlike arrays they are internally optimized for searching, and do not need to be searched linearly.

Because JSON containment is nested, an appropriate query can skip explicit selection of sub-objects. As an example, suppose that we have a doc column containing objects at the top level, with most objects containing tags fields that contain arrays of sub-objects. This query finds entries in which sub-objects containing both "term":"paris" and "term":"food" appear, while ignoring any such keys outside the tags array:

One could accomplish the same thing with, say,

but that approach is less flexible, and often less efficient as well.

On the other hand, the JSON existence operator is not nested: it will only look for the specified key or array element at top level of the JSON value.

The various containment and existence operators, along with all other JSON operators and functions are documented in Section 9.16.

GIN indexes can be used to efficiently search for keys or key/value pairs occurring within a large number of jsonb documents (datums). Two GIN “operator classes” are provided, offering different performance and flexibility trade-offs.

The default GIN operator class for jsonb supports queries with the key-exists operators ?, ?| and ?&, the containment operator @>, and the jsonpath match operators @? and @@. (For details of the semantics that these operators implement, see Table 9.48.) An example of creating an index with this operator class is:

The non-default GIN operator class jsonb_path_ops does not support the key-exists operators, but it does support @>, @? and @@. An example of creating an index with this operator class is:

Consider the example of a table that stores JSON documents retrieved from a third-party web service, with a documented schema definition. A typical document is:

We store these documents in a table named api, in a jsonb column named jdoc. If a GIN index is created on this column, queries like the following can make use of the index:

However, the index could not be used for queries like the following, because though the operator ? is indexable, it is not applied directly to the indexed column jdoc:

Still, with appropriate use of expression indexes, the above query can use an index. If querying for particular items within the "tags" key is common, defining an index like this may be worthwhile:

Now, the WHERE clause jdoc -> 'tags' ? 'qui' will be recognized as an application of the indexable operator ? to the indexed expression jdoc -> 'tags'. (More information on expression indexes can be found in Section 11.7.)

Another approach to querying is to exploit containment, for example:

A simple GIN index on the jdoc column can support this query. But note that such an index will store copies of every key and value in the jdoc column, whereas the expression index of the previous example stores only data found under the tags key. While the simple-index approach is far more flexible (since it supports queries about any key), targeted expression indexes are likely to be smaller and faster to search than a simple index.

GIN indexes also support the @? and @@ operators, which perform jsonpath matching. Examples are

For these operators, a GIN index extracts clauses of the form accessors_chain == constant out of the jsonpath pattern, and does the index search based on the keys and values mentioned in these clauses. The accessors chain may include .key, [*], and [index] accessors. The jsonb_ops operator class also supports .* and .** accessors, but the jsonb_path_ops operator class does not.

Although the jsonb_path_ops operator class supports only queries with the @>, @? and @@ operators, it has notable performance advantages over the default operator class jsonb_ops. A jsonb_path_ops index is usually much smaller than a jsonb_ops index over the same data, and the specificity of searches is better, particularly when queries contain keys that appear frequently in the data. Therefore search operations typically perform better than with the default operator class.

The technical difference between a jsonb_ops and a jsonb_path_ops GIN index is that the former creates independent index items for each key and value in the data, while the latter creates index items only for each value in the data. [7] Basically, each jsonb_path_ops index item is a hash of the value and the key(s) leading to it; for example to index {"foo": {"bar": "baz"}}, a single index item would be created incorporating all three of foo, bar, and baz into the hash value. Thus a containment query looking for this structure would result in an extremely specific index search; but there is no way at all to find out whether foo appears as a key. On the other hand, a jsonb_ops index would create three index items representing foo, bar, and baz separately; then to do the containment query, it would look for rows containing all three of these items. While GIN indexes can perform such an AND search fairly efficiently, it will still be less specific and slower than the equivalent jsonb_path_ops search, especially if there are a very large number of rows containing any single one of the three index items.

A disadvantage of the jsonb_path_ops approach is that it produces no index entries for JSON structures not containing any values, such as {"a": {}}. If a search for documents containing such a structure is requested, it will require a full-index scan, which is quite slow. jsonb_path_ops is therefore ill-suited for applications that often perform such searches.

jsonb also supports btree and hash indexes. These are usually useful only if it's important to check equality of complete JSON documents. The btree ordering for jsonb datums is seldom of great interest, but for completeness it is:

with the exception that (for historical reasons) an empty top level array sorts less than null. Objects with equal numbers of pairs are compared in the order:

Note that object keys are compared in their storage order; in particular, since shorter keys are stored before longer keys, this can lead to results that might be unintuitive, such as:

Similarly, arrays with equal numbers of elements are compared in the order:

Primitive JSON values are compared using the same comparison rules as for the underlying PostgreSQL data type. Strings are compared using the default database collation.

The jsonb data type supports array-style subscripting expressions to extract and modify elements. Nested values can be indicated by chaining subscripting expressions, following the same rules as the path argument in the jsonb_set function. If a jsonb value is an array, numeric subscripts start at zero, and negative integers count backwards from the last element of the array. Slice expressions are not supported. The result of a subscripting expression is always of the jsonb data type.

UPDATE statements may use subscripting in the SET clause to modify jsonb values. Subscript paths must be traversable for all affected values insofar as they exist. For instance, the path val['a']['b']['c'] can be traversed all the way to c if every val, val['a'], and val['a']['b'] is an object. If any val['a'] or val['a']['b'] is not defined, it will be created as an empty object and filled as necessary. However, if any val itself or one of the intermediary values is defined as a non-object such as a string, number, or jsonb null, traversal cannot proceed so an error is raised and the transaction aborted.

An example of subscripting syntax:

jsonb assignment via subscripting handles a few edge cases differently from jsonb_set. When a source jsonb value is NULL, assignment via subscripting will proceed as if it was an empty JSON value of the type (object or array) implied by the subscript key:

If an index is specified for an array containing too few elements, NULL elements will be appended until the index is reachable and the value can be set.

A jsonb value will accept assignments to nonexistent subscript paths as long as the last existing element to be traversed is an object or array, as implied by the corresponding subscript (the element indicated by the last subscript in the path is not traversed and may be anything). Nested array and object structures will be created, and in the former case null-padded, as specified by the subscript path until the assigned value can be placed.

Additional extensions are available that implement transforms for the jsonb type for different procedural languages.

The extensions for PL/Perl are called jsonb_plperl and jsonb_plperlu. If you use them, jsonb values are mapped to Perl arrays, hashes, and scalars, as appropriate.

The extension for PL/Python is called jsonb_plpython3u. If you use it, jsonb values are mapped to Python dictionaries, lists, and scalars, as appropriate.

Of these extensions, jsonb_plperl is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database. The rest require superuser privilege to install.

The jsonpath type implements support for the SQL/JSON path language in PostgreSQL to efficiently query JSON data. It provides a binary representation of the parsed SQL/JSON path expression that specifies the items to be retrieved by the path engine from the JSON data for further processing with the SQL/JSON query functions.

The semantics of SQL/JSON path predicates and operators generally follow SQL. At the same time, to provide a natural way of working with JSON data, SQL/JSON path syntax uses some JavaScript conventions:

Dot (.) is used for member access.

Square brackets ([]) are used for array access.

SQL/JSON arrays are 0-relative, unlike regular SQL arrays that start from 1.

Numeric literals in SQL/JSON path expressions follow JavaScript rules, which are different from both SQL and JSON in some minor details. For example, SQL/JSON path allows .1 and 1., which are invalid in JSON. Non-decimal integer literals and underscore separators are supported, for example, 1_000_000, 0x1EEE_FFFF, 0o273, 0b100101. In SQL/JSON path (and in JavaScript, but not in SQL proper), there must not be an underscore separator directly after the radix prefix.

An SQL/JSON path expression is typically written in an SQL query as an SQL character string literal, so it must be enclosed in single quotes, and any single quotes desired within the value must be doubled (see Section 4.1.2.1). Some forms of path expressions require string literals within them. These embedded string literals follow JavaScript/ECMAScript conventions: they must be surrounded by double quotes, and backslash escapes may be used within them to represent otherwise-hard-to-type characters. In particular, the way to write a double quote within an embedded string literal is \", and to write a backslash itself, you must write \\. Other special backslash sequences include those recognized in JavaScript strings: \b, \f, \n, \r, \t, \v for various ASCII control characters, \xNN for a character code written with only two hex digits, \uNNNN for a Unicode character identified by its 4-hex-digit code point, and \u{N...} for a Unicode character code point written with 1 to 6 hex digits.

A path expression consists of a sequence of path elements, which can be any of the following:

Path literals of JSON primitive types: Unicode text, numeric, true, false, or null.

Path variables listed in Table 8.24.

Accessor operators listed in Table 8.25.

jsonpath operators and methods listed in Section 9.16.2.3.

Parentheses, which can be used to provide filter expressions or define the order of path evaluation.

For details on using jsonpath expressions with SQL/JSON query functions, see Section 9.16.2.

Table 8.24. jsonpath Variables

Table 8.25. jsonpath Accessors

Member accessor that returns an object member with the specified key. If the key name matches some named variable starting with $ or does not meet the JavaScript rules for an identifier, it must be enclosed in double quotes to make it a string literal.

Wildcard member accessor that returns the values of all members located at the top level of the current object.

Recursive wildcard member accessor that processes all levels of the JSON hierarchy of the current object and returns all the member values, regardless of their nesting level. This is a PostgreSQL extension of the SQL/JSON standard.

.**{start_level to end_level}

Like .**, but selects only the specified levels of the JSON hierarchy. Nesting levels are specified as integers. Level zero corresponds to the current object. To access the lowest nesting level, you can use the last keyword. This is a PostgreSQL extension of the SQL/JSON standard.

Array element accessor. subscript can be given in two forms: index or start_index to end_index. The first form returns a single array element by its index. The second form returns an array slice by the range of indexes, including the elements that correspond to the provided start_index and end_index.

The specified index can be an integer, as well as an expression returning a single numeric value, which is automatically cast to integer. Index zero corresponds to the first array element. You can also use the last keyword to denote the last array element, which is useful for handling arrays of unknown length.

Wildcard array element accessor that returns all array elements.

[7] For this purpose, the term “value” includes array elements, though JSON terminology sometimes considers array elements distinct from values within objects.

**Examples:**

Example 1 (json):
```json
-- Simple scalar/primitive value
-- Primitive values can be numbers, quoted strings, true, false, or null
SELECT '5'::json;

-- Array of zero or more elements (elements need not be of same type)
SELECT '[1, 2, "foo", null]'::json;

-- Object containing pairs of keys and values
-- Note that object keys must always be quoted strings
SELECT '{"bar": "baz", "balance": 7.77, "active": false}'::json;

-- Arrays and objects can be nested arbitrarily
SELECT '{"foo": [true, "bar"], "tags": {"a": 1, "b": null}}'::json;
```

Example 2 (json):
```json
SELECT '{"bar": "baz", "balance": 7.77, "active":false}'::json;
                      json
-------------------------------------------------
 {"bar": "baz", "balance": 7.77, "active":false}
(1 row)

SELECT '{"bar": "baz", "balance": 7.77, "active":false}'::jsonb;
                      jsonb
--------------------------------------------------
 {"bar": "baz", "active": false, "balance": 7.77}
(1 row)
```

Example 3 (json):
```json
SELECT '{"reading": 1.230e-5}'::json, '{"reading": 1.230e-5}'::jsonb;
         json          |          jsonb
-----------------------+-------------------------
 {"reading": 1.230e-5} | {"reading": 0.00001230}
(1 row)
```

Example 4 (json):
```json
-- Simple scalar/primitive values contain only the identical value:
SELECT '"foo"'::jsonb @> '"foo"'::jsonb;

-- The array on the right side is contained within the one on the left:
SELECT '[1, 2, 3]'::jsonb @> '[1, 3]'::jsonb;

-- Order of array elements is not significant, so this is also true:
SELECT '[1, 2, 3]'::jsonb @> '[3, 1]'::jsonb;

-- Duplicate array elements don't matter either:
SELECT '[1, 2, 3]'::jsonb @> '[1, 2, 2]'::jsonb;

-- The object with a single pair on the right side is contained
-- within the object on the left side:
SELECT '{"product": "PostgreSQL", "version": 9.4, "jsonb": true}'::jsonb @> '{"version": 9.4}'::jsonb;

-- The array on the right side is not considered contained within the
-- array on the left, even though a similar array is nested within it:
SELECT '[1, 2, [1, 3]]'::jsonb @> '[1, 3]'::jsonb;  -- yields false

-- But with a layer of nesting, it is contained:
SELECT '[1, 2, [1, 3]]'::jsonb @> '[[1, 3]]'::jsonb;

-- Similarly, containment is not reported here:
SELECT '{"foo": {"bar": "baz"}}'::jsonb @> '{"bar": "baz"}'::jsonb;  -- yields false

-- A top-level key and an empty object is contained:
SELECT '{"foo": {"bar": "baz"}}'::jsonb @> '{"foo": {}}'::jsonb;
```

---


---

## 8.9. Network Address Types #


**URL:** https://www.postgresql.org/docs/18/datatype-net-types.html

**Contents:**
- 8.9. Network Address Types #
  - 8.9.1. inet #
  - 8.9.2. cidr #
  - 8.9.3. inet vs. cidr #
  - Tip
  - 8.9.4. macaddr #
  - 8.9.5. macaddr8 #

PostgreSQL offers data types to store IPv4, IPv6, and MAC addresses, as shown in Table 8.21. It is better to use these types instead of plain text types to store network addresses, because these types offer input error checking and specialized operators and functions (see Section 9.12).

Table 8.21. Network Address Types

When sorting inet or cidr data types, IPv4 addresses will always sort before IPv6 addresses, including IPv4 addresses encapsulated or mapped to IPv6 addresses, such as ::10.2.3.4 or ::ffff:10.4.3.2.

The inet type holds an IPv4 or IPv6 host address, and optionally its subnet, all in one field. The subnet is represented by the number of network address bits present in the host address (the “netmask”). If the netmask is 32 and the address is IPv4, then the value does not indicate a subnet, only a single host. In IPv6, the address length is 128 bits, so 128 bits specify a unique host address. Note that if you want to accept only networks, you should use the cidr type rather than inet.

The input format for this type is address/y where address is an IPv4 or IPv6 address and y is the number of bits in the netmask. If the /y portion is omitted, the netmask is taken to be 32 for IPv4 or 128 for IPv6, so the value represents just a single host. On display, the /y portion is suppressed if the netmask specifies a single host.

The cidr type holds an IPv4 or IPv6 network specification. Input and output formats follow Classless Internet Domain Routing conventions. The format for specifying networks is address/y where address is the network's lowest address represented as an IPv4 or IPv6 address, and y is the number of bits in the netmask. If y is omitted, it is calculated using assumptions from the older classful network numbering system, except it will be at least large enough to include all of the octets written in the input. It is an error to specify a network address that has bits set to the right of the specified netmask.

Table 8.22 shows some examples.

Table 8.22. cidr Type Input Examples

The essential difference between inet and cidr data types is that inet accepts values with nonzero bits to the right of the netmask, whereas cidr does not. For example, 192.168.0.1/24 is valid for inet but not for cidr.

If you do not like the output format for inet or cidr values, try the functions host, text, and abbrev.

The macaddr type stores MAC addresses, known for example from Ethernet card hardware addresses (although MAC addresses are used for other purposes as well). Input is accepted in the following formats:

These examples all specify the same address. Upper and lower case is accepted for the digits a through f. Output is always in the first of the forms shown.

IEEE Standard 802-2001 specifies the second form shown (with hyphens) as the canonical form for MAC addresses, and specifies the first form (with colons) as used with bit-reversed, MSB-first notation, so that 08-00-2b-01-02-03 = 10:00:D4:80:40:C0. This convention is widely ignored nowadays, and it is relevant only for obsolete network protocols (such as Token Ring). PostgreSQL makes no provisions for bit reversal; all accepted formats use the canonical LSB order.

The remaining five input formats are not part of any standard.

The macaddr8 type stores MAC addresses in EUI-64 format, known for example from Ethernet card hardware addresses (although MAC addresses are used for other purposes as well). This type can accept both 6 and 8 byte length MAC addresses and stores them in 8 byte length format. MAC addresses given in 6 byte format will be stored in 8 byte length format with the 4th and 5th bytes set to FF and FE, respectively. Note that IPv6 uses a modified EUI-64 format where the 7th bit should be set to one after the conversion from EUI-48. The function macaddr8_set7bit is provided to make this change. Generally speaking, any input which is comprised of pairs of hex digits (on byte boundaries), optionally separated consistently by one of ':', '-' or '.', is accepted. The number of hex digits must be either 16 (8 bytes) or 12 (6 bytes). Leading and trailing whitespace is ignored. The following are examples of input formats that are accepted:

These examples all specify the same address. Upper and lower case is accepted for the digits a through f. Output is always in the first of the forms shown.

The last six input formats shown above are not part of any standard.

To convert a traditional 48 bit MAC address in EUI-48 format to modified EUI-64 format to be included as the host portion of an IPv6 address, use macaddr8_set7bit as shown:

**Examples:**

Example 1 (unknown):
```unknown
abbrev(cidr)
```

Example 2 (unknown):
```unknown
abbrev(cidr)
```

Example 3 (unknown):
```unknown
192.168.0.1/24
```

Example 4 (json):
```json
'08:00:2b:01:02:03'
```

---


---

## 8.18. Domain Types #


**URL:** https://www.postgresql.org/docs/18/domains.html

**Contents:**
- 8.18. Domain Types #

A domain is a user-defined data type that is based on another underlying type. Optionally, it can have constraints that restrict its valid values to a subset of what the underlying type would allow. Otherwise it behaves like the underlying type — for example, any operator or function that can be applied to the underlying type will work on the domain type. The underlying type can be any built-in or user-defined base type, enum type, array type, composite type, range type, or another domain.

For example, we could create a domain over integers that accepts only positive integers:

When an operator or function of the underlying type is applied to a domain value, the domain is automatically down-cast to the underlying type. Thus, for example, the result of mytable.id - 1 is considered to be of type integer not posint. We could write (mytable.id - 1)::posint to cast the result back to posint, causing the domain's constraints to be rechecked. In this case, that would result in an error if the expression had been applied to an id value of 1. Assigning a value of the underlying type to a field or variable of the domain type is allowed without writing an explicit cast, but the domain's constraints will be checked.

For additional information see CREATE DOMAIN.

**Examples:**

Example 1 (sql):
```sql
CREATE DOMAIN posint AS integer CHECK (VALUE > 0);
CREATE TABLE mytable (id posint);
INSERT INTO mytable VALUES(1);   -- works
INSERT INTO mytable VALUES(-1);  -- fails
```

Example 2 (unknown):
```unknown
mytable.id - 1
```

Example 3 (julia):
```julia
(mytable.id - 1)::posint
```

---


---

