# PostgreSQL - Contrib Modules (Part 10)

## F.20. isn — data types for international standard numbers (ISBN, EAN, UPC, etc.) #


**URL:** https://www.postgresql.org/docs/18/isn.html

**Contents:**
- F.20. isn — data types for international standard numbers (ISBN, EAN, UPC, etc.) #
  - F.20.1. Data Types #
  - F.20.2. Casts #
  - F.20.3. Functions and Operators #
  - F.20.4. Configuration Parameters #
  - F.20.5. Examples #
  - F.20.6. Bibliography #
  - F.20.7. Author #

The isn module provides data types for the following international product numbering standards: EAN13, UPC, ISBN (books), ISMN (music), and ISSN (serials). Numbers are validated on input according to a hard-coded list of prefixes; this list of prefixes is also used to hyphenate numbers on output. Since new prefixes are assigned from time to time, the list of prefixes may be out of date. It is hoped that a future version of this module will obtain the prefix list from one or more tables that can be easily updated by users as needed; however, at present, the list can only be updated by modifying the source code and recompiling. Alternatively, prefix validation and hyphenation support may be dropped from a future version of this module.

This module is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database.

Table F.10 shows the data types provided by the isn module.

Table F.10. isn Data Types

ISBN13, ISMN13, ISSN13 numbers are all EAN13 numbers.

EAN13 numbers aren't always ISBN13, ISMN13 or ISSN13 (some are).

Some ISBN13 numbers can be displayed as ISBN.

Some ISMN13 numbers can be displayed as ISMN.

Some ISSN13 numbers can be displayed as ISSN.

UPC numbers are a subset of the EAN13 numbers (they are basically EAN13 without the first 0 digit).

All UPC, ISBN, ISMN and ISSN numbers can be represented as EAN13 numbers.

Internally, all these types use the same representation (a 64-bit integer), and all are interchangeable. Multiple types are provided to control display formatting and to permit tighter validity checking of input that is supposed to denote one particular type of number.

The ISBN, ISMN, and ISSN types will display the short version of the number (ISxN 10) whenever it's possible, and will show ISxN 13 format for numbers that do not fit in the short version. The EAN13, ISBN13, ISMN13 and ISSN13 types will always display the long version of the ISxN (EAN13).

The isn module provides the following pairs of type casts:

When casting from EAN13 to another type, there is a run-time check that the value is within the domain of the other type, and an error is thrown if not. The other casts are simply relabelings that will always succeed.

The isn module provides the standard comparison operators, plus B-tree and hash indexing support for all these data types. In addition, there are several specialized functions, shown in Table F.11. In this table, isn means any one of the module's data types.

Table F.11. isn Functions

make_valid ( isn ) → isn

Clears the invalid-check-digit flag of the value.

is_valid ( isn ) → boolean

Checks for the presence of the invalid-check-digit flag.

isn_weak ( boolean ) → boolean

Sets the weak input mode, and returns the new setting. This function is retained for backward compatibility. The recommended way to set weak mode is via the isn.weak configuration parameter.

isn_weak () → boolean

Returns the current status of the weak mode. This function is retained for backward compatibility. The recommended way to check weak mode is via the isn.weak configuration parameter.

isn.weak enables the weak input mode, which allows ISN input values to be accepted even when their check digit is wrong. The default is false, which rejects invalid check digits.

Why would you want to use the weak mode? Well, it could be that you have a huge collection of ISBN numbers, and that there are so many of them that for weird reasons some have the wrong check digit (perhaps the numbers were scanned from a printed list and the OCR got the numbers wrong, perhaps the numbers were manually captured... who knows). Anyway, the point is you might want to clean the mess up, but you still want to be able to have all the numbers in your database and maybe use an external tool to locate the invalid numbers in the database so you can verify the information and validate it more easily; so for example you'd want to select all the invalid numbers in the table.

When you insert invalid numbers in a table using the weak mode, the number will be inserted with the corrected check digit, but it will be displayed with an exclamation mark (!) at the end, for example 0-11-000322-5!. This invalid marker can be checked with the is_valid function and cleared with the make_valid function.

You can also force the insertion of marked-as-invalid numbers even when not in the weak mode, by appending the ! character at the end of the number.

Another special feature is that during input, you can write ? in place of the check digit, and the correct check digit will be inserted automatically.

The information to implement this module was collected from several sites, including:

https://www.isbn-international.org/

https://www.issn.org/

https://www.ismn-international.org/

https://www.wikipedia.org/

The prefixes used for hyphenation were also compiled from:

https://www.gs1.org/standards/id-keys

https://en.wikipedia.org/wiki/List_of_ISBN_registration_groups

https://www.isbn-international.org/content/isbn-users-manual/29

https://en.wikipedia.org/wiki/International_Standard_Music_Number

https://www.ismn-international.org/ranges/tools

Care was taken during the creation of the algorithms and they were meticulously verified against the suggested algorithms in the official ISBN, ISMN, ISSN User Manuals.

Germán Méndez Bravo (Kronuz), 2004–2006

This module was inspired by Garrett A. Wollman's isbn_issn code.

**Examples:**

Example 1 (unknown):
```unknown
0-11-000322-5!
```

Example 2 (sql):
```sql
--Using the types directly:
SELECT isbn('978-0-393-04002-9');
SELECT isbn13('0901690546');
SELECT issn('1436-4522');

--Casting types:
-- note that you can only cast from ean13 to another type when the
-- number would be valid in the realm of the target type;
-- thus, the following will NOT work: select isbn(ean13('0220356483481'));
-- but these will:
SELECT upc(ean13('0220356483481'));
SELECT ean13(upc('220356483481'));

--Create a table with a single column to hold ISBN numbers:
CREATE TABLE test (id isbn);
INSERT INTO test VALUES('9780393040029');

--Automatically calculate check digits (observe the '?'):
INSERT INTO test VALUES('220500896?');
INSERT INTO test VALUES('978055215372?');

SELECT issn('3251231?');
SELECT ismn('979047213542?');

--Using the weak mode:
SET isn.weak TO true;
INSERT INTO test VALUES('978-0-11-000533-4');
INSERT INTO test VALUES('9780141219307');
INSERT INTO test VALUES('2-205-00876-X');
SET isn.weak TO false;

SELECT id FROM test WHERE NOT is_valid(id);
UPDATE test SET id = make_valid(id) WHERE id = '2-205-00876-X!';

SELECT * FROM test;

SELECT isbn13(id) FROM test;
```

---


---

## F.6. bloom — bloom filter index access method #


**URL:** https://www.postgresql.org/docs/18/bloom.html

**Contents:**
- F.6. bloom — bloom filter index access method #
  - F.6.1. Parameters #
  - F.6.2. Examples #
  - F.6.3. Operator Class Interface #
  - F.6.4. Limitations #
  - F.6.5. Authors #

bloom provides an index access method based on Bloom filters.

A Bloom filter is a space-efficient data structure that is used to test whether an element is a member of a set. In the case of an index access method, it allows fast exclusion of non-matching tuples via signatures whose size is determined at index creation.

A signature is a lossy representation of the indexed attribute(s), and as such is prone to reporting false positives; that is, it may be reported that an element is in the set, when it is not. So index search results must always be rechecked using the actual attribute values from the heap entry. Larger signatures reduce the odds of a false positive and thus reduce the number of useless heap visits, but of course also make the index larger and hence slower to scan.

This type of index is most useful when a table has many attributes and queries test arbitrary combinations of them. A traditional btree index is faster than a bloom index, but it can require many btree indexes to support all possible queries where one needs only a single bloom index. Note however that bloom indexes only support equality queries, whereas btree indexes can also perform inequality and range searches.

A bloom index accepts the following parameters in its WITH clause:

Length of each signature (index entry) in bits. It is rounded up to the nearest multiple of 16. The default is 80 bits and the maximum is 4096.

Number of bits generated for each index column. Each parameter's name refers to the number of the index column that it controls. The default is 2 bits and the maximum is 4095. Parameters for index columns not actually used are ignored.

This is an example of creating a bloom index:

The index is created with a signature length of 80 bits, with attributes i1 and i2 mapped to 2 bits, and attribute i3 mapped to 4 bits. We could have omitted the length, col1, and col2 specifications since those have the default values.

Here is a more complete example of bloom index definition and usage, as well as a comparison with equivalent btree indexes. The bloom index is considerably smaller than the btree index, and can perform better.

A sequential scan over this large table takes a long time:

Even with the btree index defined the result will still be a sequential scan:

Having the bloom index defined on the table is better than btree in handling this type of search:

Now, the main problem with the btree search is that btree is inefficient when the search conditions do not constrain the leading index column(s). A better strategy for btree is to create a separate index on each column. Then the planner will choose something like this:

Although this query runs much faster than with either of the single indexes, we pay a penalty in index size. Each of the single-column btree indexes occupies 88.5 MB, so the total space needed is 531 MB, over three times the space used by the bloom index.

An operator class for bloom indexes requires only a hash function for the indexed data type and an equality operator for searching. This example shows the operator class definition for the text data type:

Only operator classes for int4 and text are included with the module.

Only the = operator is supported for search. But it is possible to add support for arrays with union and intersection operations in the future.

bloom access method doesn't support UNIQUE indexes.

bloom access method doesn't support searching for NULL values.

Teodor Sigaev <teodor@postgrespro.ru>, Postgres Professional, Moscow, Russia

Alexander Korotkov <a.korotkov@postgrespro.ru>, Postgres Professional, Moscow, Russia

Oleg Bartunov <obartunov@postgrespro.ru>, Postgres Professional, Moscow, Russia

**Examples:**

Example 1 (unknown):
```unknown
col1 — col32
```

Example 2 (julia):
```julia
CREATE INDEX bloomidx ON tbloom USING bloom (i1,i2,i3)
       WITH (length=80, col1=2, col2=2, col3=4);
```

Example 3 (sql):
```sql
=# CREATE TABLE tbloom AS
   SELECT
     (random() * 1000000)::int as i1,
     (random() * 1000000)::int as i2,
     (random() * 1000000)::int as i3,
     (random() * 1000000)::int as i4,
     (random() * 1000000)::int as i5,
     (random() * 1000000)::int as i6
   FROM
  generate_series(1,10000000);
SELECT 10000000
```

Example 4 (sql):
```sql
=# EXPLAIN ANALYZE SELECT * FROM tbloom WHERE i2 = 898732 AND i5 = 123451;
                                              QUERY PLAN
-------------------------------------------------------------------​-----------------------------------
 Seq Scan on tbloom  (cost=0.00..213744.00 rows=250 width=24) (actual time=357.059..357.059 rows=0.00 loops=1)
   Filter: ((i2 = 898732) AND (i5 = 123451))
   Rows Removed by Filter: 10000000
   Buffers: shared hit=63744
 Planning Time: 0.346 ms
 Execution Time: 357.076 ms
(6 rows)
```

---


---

## F.39. seg — a datatype for line segments or floating point intervals #


**URL:** https://www.postgresql.org/docs/18/seg.html

**Contents:**
- F.39. seg — a datatype for line segments or floating point intervals #
  - F.39.1. Rationale #
  - F.39.2. Syntax #
  - F.39.3. Precision #
  - F.39.4. Usage #
  - F.39.5. Notes #
  - F.39.6. Credits #

This module implements a data type seg for representing line segments, or floating point intervals. seg can represent uncertainty in the interval endpoints, making it especially useful for representing laboratory measurements.

This module is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database.

The geometry of measurements is usually more complex than that of a point in a numeric continuum. A measurement is usually a segment of that continuum with somewhat fuzzy limits. The measurements come out as intervals because of uncertainty and randomness, as well as because the value being measured may naturally be an interval indicating some condition, such as the temperature range of stability of a protein.

Using just common sense, it appears more convenient to store such data as intervals, rather than pairs of numbers. In practice, it even turns out more efficient in most applications.

Further along the line of common sense, the fuzziness of the limits suggests that the use of traditional numeric data types leads to a certain loss of information. Consider this: your instrument reads 6.50, and you input this reading into the database. What do you get when you fetch it? Watch:

In the world of measurements, 6.50 is not the same as 6.5. It may sometimes be critically different. The experimenters usually write down (and publish) the digits they trust. 6.50 is actually a fuzzy interval contained within a bigger and even fuzzier interval, 6.5, with their center points being (probably) the only common feature they share. We definitely do not want such different data items to appear the same.

Conclusion? It is nice to have a special data type that can record the limits of an interval with arbitrarily variable precision. Variable in the sense that each data element records its own precision.

The external representation of an interval is formed using one or two floating-point numbers joined by the range operator (.. or ...). Alternatively, it can be specified as a center point plus or minus a deviation. Optional certainty indicators (<, > or ~) can be stored as well. (Certainty indicators are ignored by all the built-in operators, however.) Table F.29 gives an overview of allowed representations; Table F.30 shows some examples.

In Table F.29, x, y, and delta denote floating-point numbers. x and y, but not delta, can be preceded by a certainty indicator.

Table F.29. seg External Representations

Table F.30. Examples of Valid seg Input

Because the ... operator is widely used in data sources, it is allowed as an alternative spelling of the .. operator. Unfortunately, this creates a parsing ambiguity: it is not clear whether the upper bound in 0...23 is meant to be 23 or 0.23. This is resolved by requiring at least one digit before the decimal point in all numbers in seg input.

As a sanity check, seg rejects intervals with the lower bound greater than the upper, for example 5 .. 2.

seg values are stored internally as pairs of 32-bit floating point numbers. This means that numbers with more than 7 significant digits will be truncated.

Numbers with 7 or fewer significant digits retain their original precision. That is, if your query returns 0.00, you will be sure that the trailing zeroes are not the artifacts of formatting: they reflect the precision of the original data. The number of leading zeroes does not affect precision: the value 0.0067 is considered to have just 2 significant digits.

The seg module includes a GiST index operator class for seg values. The operators supported by the GiST operator class are shown in Table F.31.

Table F.31. Seg GiST Operators

Is the first seg entirely to the left of the second? [a, b] << [c, d] is true if b < c.

Is the first seg entirely to the right of the second? [a, b] >> [c, d] is true if a > d.

Does the first seg not extend to the right of the second? [a, b] &< [c, d] is true if b <= d.

Does the first seg not extend to the left of the second? [a, b] &> [c, d] is true if a >= c.

Are the two segs equal?

Do the two segs overlap?

Does the first seg contain the second?

Is the first seg contained in the second?

In addition to the above operators, the usual comparison operators shown in Table 9.1 are available for type seg. These operators first compare (a) to (c), and if these are equal, compare (b) to (d). That results in reasonably good sorting in most cases, which is useful if you want to use ORDER BY with this type.

For examples of usage, see the regression test sql/seg.sql.

The mechanism that converts (+-) to regular ranges isn't completely accurate in determining the number of significant digits for the boundaries. For example, it adds an extra digit to the lower boundary if the resulting interval includes a power of ten:

The performance of an R-tree index can largely depend on the initial order of input values. It may be very helpful to sort the input table on the seg column; see the script sort-segments.pl for an example.

Original author: Gene Selkov, Jr. <selkovjr@mcs.anl.gov>, Mathematics and Computer Science Division, Argonne National Laboratory.

My thanks are primarily to Prof. Joe Hellerstein (https://dsf.berkeley.edu/jmh/) for elucidating the gist of the GiST (http://gist.cs.berkeley.edu/). I am also grateful to all Postgres developers, present and past, for enabling myself to create my own world and live undisturbed in it. And I would like to acknowledge my gratitude to Argonne Lab and to the U.S. Department of Energy for the years of faithful support of my database research.

**Examples:**

Example 1 (sql):
```sql
test=> select 6.50 :: float8 as "pH";
 pH
---
6.5
(1 row)
```

Example 2 (sql):
```sql
test=> select '6.25 .. 6.50'::seg as "pH";
          pH
------------
6.25 .. 6.50
(1 row)
```

Example 3 (unknown):
```unknown
x (+-) delta
```

Example 4 (unknown):
```unknown
1.5e-2 .. 2E-2
```

---


---

