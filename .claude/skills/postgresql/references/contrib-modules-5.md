# PostgreSQL - Contrib Modules (Part 5)

## F.17. hstore — hstore key/value datatype #


**URL:** https://www.postgresql.org/docs/18/hstore.html

**Contents:**
- F.17. hstore — hstore key/value datatype #
  - F.17.1. hstore External Representation #
  - Note
  - F.17.2. hstore Operators and Functions #
  - F.17.3. Indexes #
  - F.17.4. Examples #
  - F.17.5. Statistics #
  - F.17.6. Compatibility #
  - F.17.7. Transforms #
  - F.17.8. Authors #

This module implements the hstore data type for storing sets of key/value pairs within a single PostgreSQL value. This can be useful in various scenarios, such as rows with many attributes that are rarely examined, or semi-structured data. Keys and values are simply text strings.

This module is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database.

The text representation of an hstore, used for input and output, includes zero or more key => value pairs separated by commas. Some examples:

The order of the pairs is not significant (and may not be reproduced on output). Whitespace between pairs or around the => sign is ignored. Double-quote keys and values that include whitespace, commas, =s or >s. To include a double quote or a backslash in a key or value, escape it with a backslash.

Each key in an hstore is unique. If you declare an hstore with duplicate keys, only one will be stored in the hstore and there is no guarantee as to which will be kept:

A value (but not a key) can be an SQL NULL. For example:

The NULL keyword is case-insensitive. Double-quote the NULL to treat it as the ordinary string “NULL”.

Keep in mind that the hstore text format, when used for input, applies before any required quoting or escaping. If you are passing an hstore literal via a parameter, then no additional processing is needed. But if you're passing it as a quoted literal constant, then any single-quote characters and (depending on the setting of the standard_conforming_strings configuration parameter) backslash characters need to be escaped correctly. See Section 4.1.2.1 for more on the handling of string constants.

On output, double quotes always surround keys and values, even when it's not strictly necessary.

The operators provided by the hstore module are shown in Table F.6, the functions in Table F.7.

Table F.6. hstore Operators

hstore -> text → text

Returns value associated with given key, or NULL if not present.

'a=>x, b=>y'::hstore -> 'a' → x

hstore -> text[] → text[]

Returns values associated with given keys, or NULL if not present.

'a=>x, b=>y, c=>z'::hstore -> ARRAY['c','a'] → {"z","x"}

hstore || hstore → hstore

Concatenates two hstores.

'a=>b, c=>d'::hstore || 'c=>x, d=>q'::hstore → "a"=>"b", "c"=>"x", "d"=>"q"

hstore ? text → boolean

Does hstore contain key?

'a=>1'::hstore ? 'a' → t

hstore ?& text[] → boolean

Does hstore contain all the specified keys?

'a=>1,b=>2'::hstore ?& ARRAY['a','b'] → t

hstore ?| text[] → boolean

Does hstore contain any of the specified keys?

'a=>1,b=>2'::hstore ?| ARRAY['b','c'] → t

hstore @> hstore → boolean

Does left operand contain right?

'a=>b, b=>1, c=>NULL'::hstore @> 'b=>1' → t

hstore <@ hstore → boolean

Is left operand contained in right?

'a=>c'::hstore <@ 'a=>b, b=>1, c=>NULL' → f

hstore - text → hstore

Deletes key from left operand.

'a=>1, b=>2, c=>3'::hstore - 'b'::text → "a"=>"1", "c"=>"3"

hstore - text[] → hstore

Deletes keys from left operand.

'a=>1, b=>2, c=>3'::hstore - ARRAY['a','b'] → "c"=>"3"

hstore - hstore → hstore

Deletes pairs from left operand that match pairs in the right operand.

'a=>1, b=>2, c=>3'::hstore - 'a=>4, b=>2'::hstore → "a"=>"1", "c"=>"3"

anyelement #= hstore → anyelement

Replaces fields in the left operand (which must be a composite type) with matching values from hstore.

ROW(1,3) #= 'f1=>11'::hstore → (11,3)

Converts hstore to an array of alternating keys and values.

%% 'a=>foo, b=>bar'::hstore → {a,foo,b,bar}

Converts hstore to a two-dimensional key/value array.

%# 'a=>foo, b=>bar'::hstore → {{a,foo},{b,bar}}

Table F.7. hstore Functions

hstore ( record ) → hstore

Constructs an hstore from a record or row.

hstore(ROW(1,2)) → "f1"=>"1", "f2"=>"2"

hstore ( text[] ) → hstore

Constructs an hstore from an array, which may be either a key/value array, or a two-dimensional array.

hstore(ARRAY['a','1','b','2']) → "a"=>"1", "b"=>"2"

hstore(ARRAY[['c','3'],['d','4']]) → "c"=>"3", "d"=>"4"

hstore ( text[], text[] ) → hstore

Constructs an hstore from separate key and value arrays.

hstore(ARRAY['a','b'], ARRAY['1','2']) → "a"=>"1", "b"=>"2"

hstore ( text, text ) → hstore

Makes a single-item hstore.

hstore('a', 'b') → "a"=>"b"

akeys ( hstore ) → text[]

Extracts an hstore's keys as an array.

akeys('a=>1,b=>2') → {a,b}

skeys ( hstore ) → setof text

Extracts an hstore's keys as a set.

avals ( hstore ) → text[]

Extracts an hstore's values as an array.

avals('a=>1,b=>2') → {1,2}

svals ( hstore ) → setof text

Extracts an hstore's values as a set.

hstore_to_array ( hstore ) → text[]

Extracts an hstore's keys and values as an array of alternating keys and values.

hstore_to_array('a=>1,b=>2') → {a,1,b,2}

hstore_to_matrix ( hstore ) → text[]

Extracts an hstore's keys and values as a two-dimensional array.

hstore_to_matrix('a=>1,b=>2') → {{a,1},{b,2}}

hstore_to_json ( hstore ) → json

Converts an hstore to a json value, converting all non-null values to JSON strings.

This function is used implicitly when an hstore value is cast to json.

hstore_to_json('"a key"=>1, b=>t, c=>null, d=>12345, e=>012345, f=>1.234, g=>2.345e+4') → {"a key": "1", "b": "t", "c": null, "d": "12345", "e": "012345", "f": "1.234", "g": "2.345e+4"}

hstore_to_jsonb ( hstore ) → jsonb

Converts an hstore to a jsonb value, converting all non-null values to JSON strings.

This function is used implicitly when an hstore value is cast to jsonb.

hstore_to_jsonb('"a key"=>1, b=>t, c=>null, d=>12345, e=>012345, f=>1.234, g=>2.345e+4') → {"a key": "1", "b": "t", "c": null, "d": "12345", "e": "012345", "f": "1.234", "g": "2.345e+4"}

hstore_to_json_loose ( hstore ) → json

Converts an hstore to a json value, but attempts to distinguish numerical and Boolean values so they are unquoted in the JSON.

hstore_to_json_loose('"a key"=>1, b=>t, c=>null, d=>12345, e=>012345, f=>1.234, g=>2.345e+4') → {"a key": 1, "b": true, "c": null, "d": 12345, "e": "012345", "f": 1.234, "g": 2.345e+4}

hstore_to_jsonb_loose ( hstore ) → jsonb

Converts an hstore to a jsonb value, but attempts to distinguish numerical and Boolean values so they are unquoted in the JSON.

hstore_to_jsonb_loose('"a key"=>1, b=>t, c=>null, d=>12345, e=>012345, f=>1.234, g=>2.345e+4') → {"a key": 1, "b": true, "c": null, "d": 12345, "e": "012345", "f": 1.234, "g": 2.345e+4}

slice ( hstore, text[] ) → hstore

Extracts a subset of an hstore containing only the specified keys.

slice('a=>1,b=>2,c=>3'::hstore, ARRAY['b','c','x']) → "b"=>"2", "c"=>"3"

each ( hstore ) → setof record ( key text, value text )

Extracts an hstore's keys and values as a set of records.

select * from each('a=>1,b=>2') →

exist ( hstore, text ) → boolean

Does hstore contain key?

exist('a=>1', 'a') → t

defined ( hstore, text ) → boolean

Does hstore contain a non-NULL value for key?

defined('a=>NULL', 'a') → f

delete ( hstore, text ) → hstore

Deletes pair with matching key.

delete('a=>1,b=>2', 'b') → "a"=>"1"

delete ( hstore, text[] ) → hstore

Deletes pairs with matching keys.

delete('a=>1,b=>2,c=>3', ARRAY['a','b']) → "c"=>"3"

delete ( hstore, hstore ) → hstore

Deletes pairs matching those in the second argument.

delete('a=>1,b=>2', 'a=>4,b=>2'::hstore) → "a"=>"1"

populate_record ( anyelement, hstore ) → anyelement

Replaces fields in the left operand (which must be a composite type) with matching values from hstore.

populate_record(ROW(1,2), 'f1=>42'::hstore) → (42,2)

In addition to these operators and functions, values of the hstore type can be subscripted, allowing them to act like associative arrays. Only a single subscript of type text can be specified; it is interpreted as a key and the corresponding value is fetched or stored. For example,

A subscripted fetch returns NULL if the subscript is NULL or that key does not exist in the hstore. (Thus, a subscripted fetch is not greatly different from the -> operator.) A subscripted update fails if the subscript is NULL; otherwise, it replaces the value for that key, adding an entry to the hstore if the key does not already exist.

hstore has GiST and GIN index support for the @>, ?, ?& and ?| operators. For example:

gist_hstore_ops GiST opclass approximates a set of key/value pairs as a bitmap signature. Its optional integer parameter siglen determines the signature length in bytes. The default length is 16 bytes. Valid values of signature length are between 1 and 2024 bytes. Longer signatures lead to a more precise search (scanning a smaller fraction of the index and fewer heap pages), at the cost of a larger index.

Example of creating such an index with a signature length of 32 bytes:

hstore also supports btree or hash indexes for the = operator. This allows hstore columns to be declared UNIQUE, or to be used in GROUP BY, ORDER BY or DISTINCT expressions. The sort ordering for hstore values is not particularly useful, but these indexes may be useful for equivalence lookups. Create indexes for = comparisons as follows:

Add a key, or update an existing key with a new value:

Another way to do the same thing is:

If multiple keys are to be added or changed in one operation, the concatenation approach is more efficient than subscripting:

Convert a record to an hstore:

Convert an hstore to a predefined record type:

Modify an existing record using the values from an hstore:

The hstore type, because of its intrinsic liberality, could contain a lot of different keys. Checking for valid keys is the task of the application. The following examples demonstrate several techniques for checking keys and obtaining statistics.

As of PostgreSQL 9.0, hstore uses a different internal representation than previous versions. This presents no obstacle for dump/restore upgrades since the text representation (used in the dump) is unchanged.

In the event of a binary upgrade, upward compatibility is maintained by having the new code recognize old-format data. This will entail a slight performance penalty when processing data that has not yet been modified by the new code. It is possible to force an upgrade of all values in a table column by doing an UPDATE statement as follows:

Another way to do it is:

The ALTER TABLE method requires an ACCESS EXCLUSIVE lock on the table, but does not result in bloating the table with old row versions.

Additional extensions are available that implement transforms for the hstore type for the languages PL/Perl and PL/Python. The extensions for PL/Perl are called hstore_plperl and hstore_plperlu, for trusted and untrusted PL/Perl. If you install these transforms and specify them when creating a function, hstore values are mapped to Perl hashes. The extension for PL/Python is called hstore_plpython3u. If you use it, hstore values are mapped to Python dictionaries.

Oleg Bartunov <oleg@sai.msu.su>, Moscow, Moscow University, Russia

Teodor Sigaev <teodor@sigaev.ru>, Moscow, Delta-Soft Ltd., Russia

Additional enhancements by Andrew Gierth <andrew@tao11.riddles.org.uk>, United Kingdom

**Examples:**

Example 1 (sql):
```sql
SELECT 'a=>1,a=>2'::hstore;
  hstore
----------
 "a"=>"1"
```

Example 2 (javascript):
```javascript
key => NULL
```

Example 3 (unknown):
```unknown
standard_conforming_strings
```

Example 4 (php):
```php
'a=>x, b=>y'::hstore -> 'a'
```

---


---

## F.46. tsm_system_rows — the SYSTEM_ROWS sampling method for TABLESAMPLE #


**URL:** https://www.postgresql.org/docs/18/tsm-system-rows.html

**Contents:**
- F.46. tsm_system_rows — the SYSTEM_ROWS sampling method for TABLESAMPLE #
  - F.46.1. Examples #

The tsm_system_rows module provides the table sampling method SYSTEM_ROWS, which can be used in the TABLESAMPLE clause of a SELECT command.

This table sampling method accepts a single integer argument that is the maximum number of rows to read. The resulting sample will always contain exactly that many rows, unless the table does not contain enough rows, in which case the whole table is selected.

Like the built-in SYSTEM sampling method, SYSTEM_ROWS performs block-level sampling, so that the sample is not completely random but may be subject to clustering effects, especially if only a small number of rows are requested.

SYSTEM_ROWS does not support the REPEATABLE clause.

This module is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database.

Here is an example of selecting a sample of a table with SYSTEM_ROWS. First install the extension:

Then you can use it in a SELECT command, for instance:

This command will return a sample of 100 rows from the table my_table (unless the table does not have 100 visible rows, in which case all its rows are returned).

**Examples:**

Example 1 (unknown):
```unknown
SYSTEM_ROWS
```

Example 2 (unknown):
```unknown
TABLESAMPLE
```

Example 3 (unknown):
```unknown
SYSTEM_ROWS
```

Example 4 (unknown):
```unknown
TABLESAMPLE
```

---


---

