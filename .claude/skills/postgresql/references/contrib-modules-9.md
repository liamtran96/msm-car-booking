# PostgreSQL - Contrib Modules (Part 9)

## F.45. test_decoding — SQL-based test/example module for WAL logical decoding #


**URL:** https://www.postgresql.org/docs/18/test-decoding.html

**Contents:**
- F.45. test_decoding — SQL-based test/example module for WAL logical decoding #

test_decoding is an example of a logical decoding output plugin. It doesn't do anything especially useful, but can serve as a starting point for developing your own output plugin.

test_decoding receives WAL through the logical decoding mechanism and decodes it into text representations of the operations performed.

Typical output from this plugin, used over the SQL logical decoding interface, might be:

We can also get the changes of the in-progress transaction, and the typical output might be:

**Examples:**

Example 1 (unknown):
```unknown
test_decoding
```

Example 2 (unknown):
```unknown
test_decoding
```

Example 3 (sql):
```sql
postgres=# SELECT * FROM pg_logical_slot_get_changes('test_slot', NULL, NULL, 'include-xids', '0');
   lsn     | xid |                       data
-----------+-----+--------------------------------------------------
 0/16D30F8 | 691 | BEGIN
 0/16D32A0 | 691 | table public.data: INSERT: id[int4]:2 data[text]:'arg'
 0/16D32A0 | 691 | table public.data: INSERT: id[int4]:3 data[text]:'demo'
 0/16D32A0 | 691 | COMMIT
 0/16D32D8 | 692 | BEGIN
 0/16D3398 | 692 | table public.data: DELETE: id[int4]:2
 0/16D3398 | 692 | table public.data: DELETE: id[int4]:3
 0/16D3398 | 692 | COMMIT
(8 rows)
```

Example 4 (sql):
```sql
postgres[33712]=#* SELECT * FROM pg_logical_slot_get_changes('test_slot', NULL, NULL, 'stream-changes', '1');
    lsn    | xid |                       data
-----------+-----+--------------------------------------------------
 0/16B21F8 | 503 | opening a streamed block for transaction TXN 503
 0/16B21F8 | 503 | streaming change for TXN 503
 0/16B2300 | 503 | streaming change for TXN 503
 0/16B2408 | 503 | streaming change for TXN 503
 0/16BEBA0 | 503 | closing a streamed block for transaction TXN 503
 0/16B21F8 | 503 | opening a streamed block for transaction TXN 503
 0/16BECA8 | 503 | streaming change for TXN 503
 0/16BEDB0 | 503 | streaming change for TXN 503
 0/16BEEB8 | 503 | streaming change for TXN 503
 0/16BEBA0 | 503 | closing a streamed block for transaction TXN 503
(10 rows)
```

---


---

## F.19. intarray — manipulate arrays of integers #


**URL:** https://www.postgresql.org/docs/18/intarray.html

**Contents:**
- F.19. intarray — manipulate arrays of integers #
  - F.19.1. intarray Functions and Operators #
  - F.19.2. Index Support #
  - F.19.3. Example #
  - F.19.4. Benchmark #
  - F.19.5. Authors #

The intarray module provides a number of useful functions and operators for manipulating null-free arrays of integers. There is also support for indexed searches using some of the operators.

All of these operations will throw an error if a supplied array contains any NULL elements.

Many of these operations are only sensible for one-dimensional arrays. Although they will accept input arrays of more dimensions, the data is treated as though it were a linear array in storage order.

This module is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database.

The functions provided by the intarray module are shown in Table F.8, the operators in Table F.9.

Table F.8. intarray Functions

icount ( integer[] ) → integer

Returns the number of elements in the array.

icount('{1,2,3}'::integer[]) → 3

sort ( integer[], dir text ) → integer[]

Sorts the array in either ascending or descending order. dir must be asc or desc.

sort('{1,3,2}'::integer[], 'desc') → {3,2,1}

sort ( integer[] ) → integer[]

sort_asc ( integer[] ) → integer[]

Sorts in ascending order.

sort(array[11,77,44]) → {11,44,77}

sort_desc ( integer[] ) → integer[]

Sorts in descending order.

sort_desc(array[11,77,44]) → {77,44,11}

uniq ( integer[] ) → integer[]

Removes adjacent duplicates. Often used with sort to remove all duplicates.

uniq('{1,2,2,3,1,1}'::integer[]) → {1,2,3,1}

uniq(sort('{1,2,3,2,1}'::integer[])) → {1,2,3}

idx ( integer[], item integer ) → integer

Returns index of the first array element matching item, or 0 if no match.

idx(array[11,22,33,22,11], 22) → 2

subarray ( integer[], start integer, len integer ) → integer[]

Extracts the portion of the array starting at position start, with len elements.

subarray('{1,2,3,2,1}'::integer[], 2, 3) → {2,3,2}

subarray ( integer[], start integer ) → integer[]

Extracts the portion of the array starting at position start.

subarray('{1,2,3,2,1}'::integer[], 2) → {2,3,2,1}

intset ( integer ) → integer[]

Makes a single-element array.

Table F.9. intarray Operators

integer[] && integer[] → boolean

Do arrays overlap (have at least one element in common)?

integer[] @> integer[] → boolean

Does left array contain right array?

integer[] <@ integer[] → boolean

Is left array contained in right array?

# integer[] → integer

Returns the number of elements in the array.

integer[] # integer → integer

Returns index of the first array element matching the right argument, or 0 if no match. (Same as idx function.)

integer[] + integer → integer[]

Adds element to end of array.

integer[] + integer[] → integer[]

Concatenates the arrays.

integer[] - integer → integer[]

Removes entries matching the right argument from the array.

integer[] - integer[] → integer[]

Removes elements of the right array from the left array.

integer[] | integer → integer[]

Computes the union of the arguments.

integer[] | integer[] → integer[]

Computes the union of the arguments.

integer[] & integer[] → integer[]

Computes the intersection of the arguments.

integer[] @@ query_int → boolean

Does array satisfy query? (see below)

query_int ~~ integer[] → boolean

Does array satisfy query? (commutator of @@)

The operators &&, @> and <@ are equivalent to PostgreSQL's built-in operators of the same names, except that they work only on integer arrays that do not contain nulls, while the built-in operators work for any array type. This restriction makes them faster than the built-in operators in many cases.

The @@ and ~~ operators test whether an array satisfies a query, which is expressed as a value of a specialized data type query_int. A query consists of integer values that are checked against the elements of the array, possibly combined using the operators & (AND), | (OR), and ! (NOT). Parentheses can be used as needed. For example, the query 1&(2|3) matches arrays that contain 1 and also contain either 2 or 3.

intarray provides index support for the &&, @>, and @@ operators, as well as regular array equality.

Two parameterized GiST index operator classes are provided: gist__int_ops (used by default) is suitable for small- to medium-size data sets, while gist__intbig_ops uses a larger signature and is more suitable for indexing large data sets (i.e., columns containing a large number of distinct array values). The implementation uses an RD-tree data structure with built-in lossy compression.

gist__int_ops approximates an integer set as an array of integer ranges. Its optional integer parameter numranges determines the maximum number of ranges in one index key. The default value of numranges is 100. Valid values are between 1 and 253. Using larger arrays as GiST index keys leads to a more precise search (scanning a smaller fraction of the index and fewer heap pages), at the cost of a larger index.

gist__intbig_ops approximates an integer set as a bitmap signature. Its optional integer parameter siglen determines the signature length in bytes. The default signature length is 16 bytes. Valid values of signature length are between 1 and 2024 bytes. Longer signatures lead to a more precise search (scanning a smaller fraction of the index and fewer heap pages), at the cost of a larger index.

There is also a non-default GIN operator class gin__int_ops, which supports these operators as well as <@.

The choice between GiST and GIN indexing depends on the relative performance characteristics of GiST and GIN, which are discussed elsewhere.

The source directory contrib/intarray/bench contains a benchmark test suite, which can be run against an installed PostgreSQL server. (It also requires DBD::Pg to be installed.) To run:

The bench.pl script has numerous options, which are displayed when it is run without any arguments.

All work was done by Teodor Sigaev (<teodor@sigaev.ru>) and Oleg Bartunov (<oleg@sai.msu.su>). See http://www.sai.msu.su/~megera/postgres/gist/ for additional information. Andrey Oktyabrski did a great work on adding new functions and operations.

**Examples:**

Example 1 (typescript):
```typescript
icount('{1,2,3}'::integer[])
```

Example 2 (typescript):
```typescript
sort('{1,3,2}'::integer[], 'desc')
```

Example 3 (unknown):
```unknown
sort(array[11,77,44])
```

Example 4 (unknown):
```unknown
sort_desc(array[11,77,44])
```

---


---

