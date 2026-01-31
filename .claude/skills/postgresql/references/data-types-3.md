# PostgreSQL - Data Types (Part 3)

## 8.17. Range Types #


**URL:** https://www.postgresql.org/docs/18/rangetypes.html

**Contents:**
- 8.17. Range Types #
  - 8.17.1. Built-in Range and Multirange Types #
  - 8.17.2. Examples #
  - 8.17.3. Inclusive and Exclusive Bounds #
  - 8.17.4. Infinite (Unbounded) Ranges #
  - 8.17.5. Range Input/Output #
  - Note
  - 8.17.6. Constructing Ranges and Multiranges #
  - 8.17.7. Discrete Range Types #
  - 8.17.8. Defining New Range Types #

Range types are data types representing a range of values of some element type (called the range's subtype). For instance, ranges of timestamp might be used to represent the ranges of time that a meeting room is reserved. In this case the data type is tsrange (short for “timestamp range”), and timestamp is the subtype. The subtype must have a total order so that it is well-defined whether element values are within, before, or after a range of values.

Range types are useful because they represent many element values in a single range value, and because concepts such as overlapping ranges can be expressed clearly. The use of time and date ranges for scheduling purposes is the clearest example; but price ranges, measurement ranges from an instrument, and so forth can also be useful.

Every range type has a corresponding multirange type. A multirange is an ordered list of non-contiguous, non-empty, non-null ranges. Most range operators also work on multiranges, and they have a few functions of their own.

PostgreSQL comes with the following built-in range types:

int4range — Range of integer, int4multirange — corresponding Multirange

int8range — Range of bigint, int8multirange — corresponding Multirange

numrange — Range of numeric, nummultirange — corresponding Multirange

tsrange — Range of timestamp without time zone, tsmultirange — corresponding Multirange

tstzrange — Range of timestamp with time zone, tstzmultirange — corresponding Multirange

daterange — Range of date, datemultirange — corresponding Multirange

In addition, you can define your own range types; see CREATE TYPE for more information.

See Table 9.58 and Table 9.60 for complete lists of operators and functions on range types.

Every non-empty range has two bounds, the lower bound and the upper bound. All points between these values are included in the range. An inclusive bound means that the boundary point itself is included in the range as well, while an exclusive bound means that the boundary point is not included in the range.

In the text form of a range, an inclusive lower bound is represented by “[” while an exclusive lower bound is represented by “(”. Likewise, an inclusive upper bound is represented by “]”, while an exclusive upper bound is represented by “)”. (See Section 8.17.5 for more details.)

The functions lower_inc and upper_inc test the inclusivity of the lower and upper bounds of a range value, respectively.

The lower bound of a range can be omitted, meaning that all values less than the upper bound are included in the range, e.g., (,3]. Likewise, if the upper bound of the range is omitted, then all values greater than the lower bound are included in the range. If both lower and upper bounds are omitted, all values of the element type are considered to be in the range. Specifying a missing bound as inclusive is automatically converted to exclusive, e.g., [,] is converted to (,). You can think of these missing values as +/-infinity, but they are special range type values and are considered to be beyond any range element type's +/-infinity values.

Element types that have the notion of “infinity” can use them as explicit bound values. For example, with timestamp ranges, [today,infinity) excludes the special timestamp value infinity, while [today,infinity] include it, as does [today,) and [today,].

The functions lower_inf and upper_inf test for infinite lower and upper bounds of a range, respectively.

The input for a range value must follow one of the following patterns:

The parentheses or brackets indicate whether the lower and upper bounds are exclusive or inclusive, as described previously. Notice that the final pattern is empty, which represents an empty range (a range that contains no points).

The lower-bound may be either a string that is valid input for the subtype, or empty to indicate no lower bound. Likewise, upper-bound may be either a string that is valid input for the subtype, or empty to indicate no upper bound.

Each bound value can be quoted using " (double quote) characters. This is necessary if the bound value contains parentheses, brackets, commas, double quotes, or backslashes, since these characters would otherwise be taken as part of the range syntax. To put a double quote or backslash in a quoted bound value, precede it with a backslash. (Also, a pair of double quotes within a double-quoted bound value is taken to represent a double quote character, analogously to the rules for single quotes in SQL literal strings.) Alternatively, you can avoid quoting and use backslash-escaping to protect all data characters that would otherwise be taken as range syntax. Also, to write a bound value that is an empty string, write "", since writing nothing means an infinite bound.

Whitespace is allowed before and after the range value, but any whitespace between the parentheses or brackets is taken as part of the lower or upper bound value. (Depending on the element type, it might or might not be significant.)

These rules are very similar to those for writing field values in composite-type literals. See Section 8.16.6 for additional commentary.

The input for a multirange is curly brackets ({ and }) containing zero or more valid ranges, separated by commas. Whitespace is permitted around the brackets and commas. This is intended to be reminiscent of array syntax, although multiranges are much simpler: they have just one dimension and there is no need to quote their contents. (The bounds of their ranges may be quoted as above however.)

Each range type has a constructor function with the same name as the range type. Using the constructor function is frequently more convenient than writing a range literal constant, since it avoids the need for extra quoting of the bound values. The constructor function accepts two or three arguments. The two-argument form constructs a range in standard form (lower bound inclusive, upper bound exclusive), while the three-argument form constructs a range with bounds of the form specified by the third argument. The third argument must be one of the strings “()”, “(]”, “[)”, or “[]”. For example:

Each range type also has a multirange constructor with the same name as the multirange type. The constructor function takes zero or more arguments which are all ranges of the appropriate type. For example:

A discrete range is one whose element type has a well-defined “step”, such as integer or date. In these types two elements can be said to be adjacent, when there are no valid values between them. This contrasts with continuous ranges, where it's always (or almost always) possible to identify other element values between two given values. For example, a range over the numeric type is continuous, as is a range over timestamp. (Even though timestamp has limited precision, and so could theoretically be treated as discrete, it's better to consider it continuous since the step size is normally not of interest.)

Another way to think about a discrete range type is that there is a clear idea of a “next” or “previous” value for each element value. Knowing that, it is possible to convert between inclusive and exclusive representations of a range's bounds, by choosing the next or previous element value instead of the one originally given. For example, in an integer range type [4,8] and (3,9) denote the same set of values; but this would not be so for a range over numeric.

A discrete range type should have a canonicalization function that is aware of the desired step size for the element type. The canonicalization function is charged with converting equivalent values of the range type to have identical representations, in particular consistently inclusive or exclusive bounds. If a canonicalization function is not specified, then ranges with different formatting will always be treated as unequal, even though they might represent the same set of values in reality.

The built-in range types int4range, int8range, and daterange all use a canonical form that includes the lower bound and excludes the upper bound; that is, [). User-defined range types can use other conventions, however.

Users can define their own range types. The most common reason to do this is to use ranges over subtypes not provided among the built-in range types. For example, to define a new range type of subtype float8:

Because float8 has no meaningful “step”, we do not define a canonicalization function in this example.

When you define your own range you automatically get a corresponding multirange type.

Defining your own range type also allows you to specify a different subtype B-tree operator class or collation to use, so as to change the sort ordering that determines which values fall into a given range.

If the subtype is considered to have discrete rather than continuous values, the CREATE TYPE command should specify a canonical function. The canonicalization function takes an input range value, and must return an equivalent range value that may have different bounds and formatting. The canonical output for two ranges that represent the same set of values, for example the integer ranges [1, 7] and [1, 8), must be identical. It doesn't matter which representation you choose to be the canonical one, so long as two equivalent values with different formattings are always mapped to the same value with the same formatting. In addition to adjusting the inclusive/exclusive bounds format, a canonicalization function might round off boundary values, in case the desired step size is larger than what the subtype is capable of storing. For instance, a range type over timestamp could be defined to have a step size of an hour, in which case the canonicalization function would need to round off bounds that weren't a multiple of an hour, or perhaps throw an error instead.

In addition, any range type that is meant to be used with GiST or SP-GiST indexes should define a subtype difference, or subtype_diff, function. (The index will still work without subtype_diff, but it is likely to be considerably less efficient than if a difference function is provided.) The subtype difference function takes two input values of the subtype, and returns their difference (i.e., X minus Y) represented as a float8 value. In our example above, the function float8mi that underlies the regular float8 minus operator can be used; but for any other subtype, some type conversion would be necessary. Some creative thought about how to represent differences as numbers might be needed, too. To the greatest extent possible, the subtype_diff function should agree with the sort ordering implied by the selected operator class and collation; that is, its result should be positive whenever its first argument is greater than its second according to the sort ordering.

A less-oversimplified example of a subtype_diff function is:

See CREATE TYPE for more information about creating range types.

GiST and SP-GiST indexes can be created for table columns of range types. GiST indexes can be also created for table columns of multirange types. For instance, to create a GiST index:

A GiST or SP-GiST index on ranges can accelerate queries involving these range operators: =, &&, <@, @>, <<, >>, -|-, &<, and &>. A GiST index on multiranges can accelerate queries involving the same set of multirange operators. A GiST index on ranges and GiST index on multiranges can also accelerate queries involving these cross-type range to multirange and multirange to range operators correspondingly: &&, <@, @>, <<, >>, -|-, &<, and &>. See Table 9.58 for more information.

In addition, B-tree and hash indexes can be created for table columns of range types. For these index types, basically the only useful range operation is equality. There is a B-tree sort ordering defined for range values, with corresponding < and > operators, but the ordering is rather arbitrary and not usually useful in the real world. Range types' B-tree and hash support is primarily meant to allow sorting and hashing internally in queries, rather than creation of actual indexes.

While UNIQUE is a natural constraint for scalar values, it is usually unsuitable for range types. Instead, an exclusion constraint is often more appropriate (see CREATE TABLE ... CONSTRAINT ... EXCLUDE). Exclusion constraints allow the specification of constraints such as “non-overlapping” on a range type. For example:

That constraint will prevent any overlapping values from existing in the table at the same time:

You can use the btree_gist extension to define exclusion constraints on plain scalar data types, which can then be combined with range exclusions for maximum flexibility. For example, after btree_gist is installed, the following constraint will reject overlapping ranges only if the meeting room numbers are equal:

**Examples:**

Example 1 (unknown):
```unknown
int4multirange
```

Example 2 (unknown):
```unknown
int8multirange
```

Example 3 (unknown):
```unknown
nummultirange
```

Example 4 (unknown):
```unknown
timestamp without time zone
```

---


---

## 8.16. Composite Types #


**URL:** https://www.postgresql.org/docs/18/rowtypes.html

**Contents:**
- 8.16. Composite Types #
  - 8.16.1. Declaration of Composite Types #
  - 8.16.2. Constructing Composite Values #
  - 8.16.3. Accessing Composite Types #
  - 8.16.4. Modifying Composite Types #
  - 8.16.5. Using Composite Types in Queries #
  - Tip
  - Tip
  - 8.16.6. Composite Type Input and Output Syntax #
  - Note

A composite type represents the structure of a row or record; it is essentially just a list of field names and their data types. PostgreSQL allows composite types to be used in many of the same ways that simple types can be used. For example, a column of a table can be declared to be of a composite type.

Here are two simple examples of defining composite types:

The syntax is comparable to CREATE TABLE, except that only field names and types can be specified; no constraints (such as NOT NULL) can presently be included. Note that the AS keyword is essential; without it, the system will think a different kind of CREATE TYPE command is meant, and you will get odd syntax errors.

Having defined the types, we can use them to create tables:

Whenever you create a table, a composite type is also automatically created, with the same name as the table, to represent the table's row type. For example, had we said:

then the same inventory_item composite type shown above would come into being as a byproduct, and could be used just as above. Note however an important restriction of the current implementation: since no constraints are associated with a composite type, the constraints shown in the table definition do not apply to values of the composite type outside the table. (To work around this, create a domain over the composite type, and apply the desired constraints as CHECK constraints of the domain.)

To write a composite value as a literal constant, enclose the field values within parentheses and separate them by commas. You can put double quotes around any field value, and must do so if it contains commas or parentheses. (More details appear below.) Thus, the general format of a composite constant is the following:

which would be a valid value of the inventory_item type defined above. To make a field be NULL, write no characters at all in its position in the list. For example, this constant specifies a NULL third field:

If you want an empty string rather than NULL, write double quotes:

Here the first field is a non-NULL empty string, the third is NULL.

(These constants are actually only a special case of the generic type constants discussed in Section 4.1.2.7. The constant is initially treated as a string and passed to the composite-type input conversion routine. An explicit type specification might be necessary to tell which type to convert the constant to.)

The ROW expression syntax can also be used to construct composite values. In most cases this is considerably simpler to use than the string-literal syntax since you don't have to worry about multiple layers of quoting. We already used this method above:

The ROW keyword is actually optional as long as you have more than one field in the expression, so these can be simplified to:

The ROW expression syntax is discussed in more detail in Section 4.2.13.

To access a field of a composite column, one writes a dot and the field name, much like selecting a field from a table name. In fact, it's so much like selecting from a table name that you often have to use parentheses to keep from confusing the parser. For example, you might try to select some subfields from our on_hand example table with something like:

This will not work since the name item is taken to be a table name, not a column name of on_hand, per SQL syntax rules. You must write it like this:

or if you need to use the table name as well (for instance in a multitable query), like this:

Now the parenthesized object is correctly interpreted as a reference to the item column, and then the subfield can be selected from it.

Similar syntactic issues apply whenever you select a field from a composite value. For instance, to select just one field from the result of a function that returns a composite value, you'd need to write something like:

Without the extra parentheses, this will generate a syntax error.

The special field name * means “all fields”, as further explained in Section 8.16.5.

Here are some examples of the proper syntax for inserting and updating composite columns. First, inserting or updating a whole column:

The first example omits ROW, the second uses it; we could have done it either way.

We can update an individual subfield of a composite column:

Notice here that we don't need to (and indeed cannot) put parentheses around the column name appearing just after SET, but we do need parentheses when referencing the same column in the expression to the right of the equal sign.

And we can specify subfields as targets for INSERT, too:

Had we not supplied values for all the subfields of the column, the remaining subfields would have been filled with null values.

There are various special syntax rules and behaviors associated with composite types in queries. These rules provide useful shortcuts, but can be confusing if you don't know the logic behind them.

In PostgreSQL, a reference to a table name (or alias) in a query is effectively a reference to the composite value of the table's current row. For example, if we had a table inventory_item as shown above, we could write:

This query produces a single composite-valued column, so we might get output like:

Note however that simple names are matched to column names before table names, so this example works only because there is no column named c in the query's tables.

The ordinary qualified-column-name syntax table_name.column_name can be understood as applying field selection to the composite value of the table's current row. (For efficiency reasons, it's not actually implemented that way.)

then, according to the SQL standard, we should get the contents of the table expanded into separate columns:

PostgreSQL will apply this expansion behavior to any composite-valued expression, although as shown above, you need to write parentheses around the value that .* is applied to whenever it's not a simple table name. For example, if myfunc() is a function returning a composite type with columns a, b, and c, then these two queries have the same result:

PostgreSQL handles column expansion by actually transforming the first form into the second. So, in this example, myfunc() would get invoked three times per row with either syntax. If it's an expensive function you may wish to avoid that, which you can do with a query like:

Placing the function in a LATERAL FROM item keeps it from being invoked more than once per row. m.* is still expanded into m.a, m.b, m.c, but now those variables are just references to the output of the FROM item. (The LATERAL keyword is optional here, but we show it to clarify that the function is getting x from some_table.)

The composite_value.* syntax results in column expansion of this kind when it appears at the top level of a SELECT output list, a RETURNING list in INSERT/UPDATE/DELETE/MERGE, a VALUES clause, or a row constructor. In all other contexts (including when nested inside one of those constructs), attaching .* to a composite value does not change the value, since it means “all columns” and so the same composite value is produced again. For example, if somefunc() accepts a composite-valued argument, these queries are the same:

In both cases, the current row of inventory_item is passed to the function as a single composite-valued argument. Even though .* does nothing in such cases, using it is good style, since it makes clear that a composite value is intended. In particular, the parser will consider c in c.* to refer to a table name or alias, not to a column name, so that there is no ambiguity; whereas without .*, it is not clear whether c means a table name or a column name, and in fact the column-name interpretation will be preferred if there is a column named c.

Another example demonstrating these concepts is that all these queries mean the same thing:

All of these ORDER BY clauses specify the row's composite value, resulting in sorting the rows according to the rules described in Section 9.25.6. However, if inventory_item contained a column named c, the first case would be different from the others, as it would mean to sort by that column only. Given the column names previously shown, these queries are also equivalent to those above:

(The last case uses a row constructor with the key word ROW omitted.)

Another special syntactical behavior associated with composite values is that we can use functional notation for extracting a field of a composite value. The simple way to explain this is that the notations field(table) and table.field are interchangeable. For example, these queries are equivalent:

Moreover, if we have a function that accepts a single argument of a composite type, we can call it with either notation. These queries are all equivalent:

This equivalence between functional notation and field notation makes it possible to use functions on composite types to implement “computed fields”. An application using the last query above wouldn't need to be directly aware that somefunc isn't a real column of the table.

Because of this behavior, it's unwise to give a function that takes a single composite-type argument the same name as any of the fields of that composite type. If there is ambiguity, the field-name interpretation will be chosen if field-name syntax is used, while the function will be chosen if function-call syntax is used. However, PostgreSQL versions before 11 always chose the field-name interpretation, unless the syntax of the call required it to be a function call. One way to force the function interpretation in older versions is to schema-qualify the function name, that is, write schema.func(compositevalue).

The external text representation of a composite value consists of items that are interpreted according to the I/O conversion rules for the individual field types, plus decoration that indicates the composite structure. The decoration consists of parentheses (( and )) around the whole value, plus commas (,) between adjacent items. Whitespace outside the parentheses is ignored, but within the parentheses it is considered part of the field value, and might or might not be significant depending on the input conversion rules for the field data type. For example, in:

the whitespace will be ignored if the field type is integer, but not if it is text.

As shown previously, when writing a composite value you can write double quotes around any individual field value. You must do so if the field value would otherwise confuse the composite-value parser. In particular, fields containing parentheses, commas, double quotes, or backslashes must be double-quoted. To put a double quote or backslash in a quoted composite field value, precede it with a backslash. (Also, a pair of double quotes within a double-quoted field value is taken to represent a double quote character, analogously to the rules for single quotes in SQL literal strings.) Alternatively, you can avoid quoting and use backslash-escaping to protect all data characters that would otherwise be taken as composite syntax.

A completely empty field value (no characters at all between the commas or parentheses) represents a NULL. To write a value that is an empty string rather than NULL, write "".

The composite output routine will put double quotes around field values if they are empty strings or contain parentheses, commas, double quotes, backslashes, or white space. (Doing so for white space is not essential, but aids legibility.) Double quotes and backslashes embedded in field values will be doubled.

Remember that what you write in an SQL command will first be interpreted as a string literal, and then as a composite. This doubles the number of backslashes you need (assuming escape string syntax is used). For example, to insert a text field containing a double quote and a backslash in a composite value, you'd need to write:

The string-literal processor removes one level of backslashes, so that what arrives at the composite-value parser looks like ("\"\\"). In turn, the string fed to the text data type's input routine becomes "\. (If we were working with a data type whose input routine also treated backslashes specially, bytea for example, we might need as many as eight backslashes in the command to get one backslash into the stored composite field.) Dollar quoting (see Section 4.1.2.4) can be used to avoid the need to double backslashes.

The ROW constructor syntax is usually easier to work with than the composite-literal syntax when writing composite values in SQL commands. In ROW, individual field values are written the same way they would be written when not members of a composite.

**Examples:**

Example 1 (unknown):
```unknown
CREATE TYPE complex AS (
    r       double precision,
    i       double precision
);

CREATE TYPE inventory_item AS (
    name            text,
    supplier_id     integer,
    price           numeric
);
```

Example 2 (sql):
```sql
CREATE TABLE
```

Example 3 (unknown):
```unknown
CREATE TYPE
```

Example 4 (sql):
```sql
CREATE TABLE on_hand (
    item      inventory_item,
    count     integer
);

INSERT INTO on_hand VALUES (ROW('fuzzy dice', 42, 1.99), 1000);
```

---


---

## 8.2. Monetary Types #


**URL:** https://www.postgresql.org/docs/18/datatype-money.html

**Contents:**
- 8.2. Monetary Types #

The money type stores a currency amount with a fixed fractional precision; see Table 8.3. The fractional precision is determined by the database's lc_monetary setting. The range shown in the table assumes there are two fractional digits. Input is accepted in a variety of formats, including integer and floating-point literals, as well as typical currency formatting, such as '$1,000.00'. Output is generally in the latter form but depends on the locale.

Table 8.3. Monetary Types

Since the output of this data type is locale-sensitive, it might not work to load money data into a database that has a different setting of lc_monetary. To avoid problems, before restoring a dump into a new database make sure lc_monetary has the same or equivalent value as in the database that was dumped.

Values of the numeric, int, and bigint data types can be cast to money. Conversion from the real and double precision data types can be done by casting to numeric first, for example:

However, this is not recommended. Floating point numbers should not be used to handle money due to the potential for rounding errors.

A money value can be cast to numeric without loss of precision. Conversion to other types could potentially lose precision, and must also be done in two stages:

Division of a money value by an integer value is performed with truncation of the fractional part towards zero. To get a rounded result, divide by a floating-point value, or cast the money value to numeric before dividing and back to money afterwards. (The latter is preferable to avoid risking precision loss.) When a money value is divided by another money value, the result is double precision (i.e., a pure number, not money); the currency units cancel each other out in the division.

**Examples:**

Example 1 (swift):
```swift
'$1,000.00'
```

Example 2 (unknown):
```unknown
lc_monetary
```

Example 3 (unknown):
```unknown
lc_monetary
```

Example 4 (unknown):
```unknown
double precision
```

---


---

## 8.20. pg_lsn Type #


**URL:** https://www.postgresql.org/docs/18/datatype-pg-lsn.html

**Contents:**
- 8.20. pg_lsn Type #

The pg_lsn data type can be used to store LSN (Log Sequence Number) data which is a pointer to a location in the WAL. This type is a representation of XLogRecPtr and an internal system type of PostgreSQL.

Internally, an LSN is a 64-bit integer, representing a byte position in the write-ahead log stream. It is printed as two hexadecimal numbers of up to 8 digits each, separated by a slash; for example, 16/B374D848. The pg_lsn type supports the standard comparison operators, like = and >. Two LSNs can be subtracted using the - operator; the result is the number of bytes separating those write-ahead log locations. Also the number of bytes can be added into and subtracted from LSN using the +(pg_lsn,numeric) and -(pg_lsn,numeric) operators, respectively. Note that the calculated LSN should be in the range of pg_lsn type, i.e., between 0/0 and FFFFFFFF/FFFFFFFF.

**Examples:**

Example 1 (unknown):
```unknown
16/B374D848
```

Example 2 (unknown):
```unknown
+(pg_lsn,numeric)
```

Example 3 (unknown):
```unknown
-(pg_lsn,numeric)
```

Example 4 (unknown):
```unknown
FFFFFFFF/FFFFFFFF
```

---


---

