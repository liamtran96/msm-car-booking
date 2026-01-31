# PostgreSQL - Type Conversion (Part 2)

## 10.6. SELECT Output Columns #


**URL:** https://www.postgresql.org/docs/18/typeconv-select.html

**Contents:**
- 10.6. SELECT Output Columns #
  - Note

The rules given in the preceding sections will result in assignment of non-unknown data types to all expressions in an SQL query, except for unspecified-type literals that appear as simple output columns of a SELECT command. For example, in

there is nothing to identify what type the string literal should be taken as. In this situation PostgreSQL will fall back to resolving the literal's type as text.

When the SELECT is one arm of a UNION (or INTERSECT or EXCEPT) construct, or when it appears within INSERT ... SELECT, this rule is not applied since rules given in preceding sections take precedence. The type of an unspecified-type literal can be taken from the other UNION arm in the first case, or from the destination column in the second case.

RETURNING lists are treated the same as SELECT output lists for this purpose.

Prior to PostgreSQL 10, this rule did not exist, and unspecified-type literals in a SELECT output list were left as type unknown. That had assorted bad consequences, so it's been changed.

**Examples:**

Example 1 (sql):
```sql
SELECT 'Hello World';
```

Example 2 (unknown):
```unknown
INSERT ... SELECT
```

---


---

## 10.4. Value Storage #


**URL:** https://www.postgresql.org/docs/18/typeconv-query.html

**Contents:**
- 10.4. Value Storage #

Values to be inserted into a table are converted to the destination column's data type according to the following steps.

Value Storage Type Conversion

Check for an exact match with the target.

Otherwise, try to convert the expression to the target type. This is possible if an assignment cast between the two types is registered in the pg_cast catalog (see CREATE CAST). Alternatively, if the expression is an unknown-type literal, the contents of the literal string will be fed to the input conversion routine for the target type.

Check to see if there is a sizing cast for the target type. A sizing cast is a cast from that type to itself. If one is found in the pg_cast catalog, apply it to the expression before storing into the destination column. The implementation function for such a cast always takes an extra parameter of type integer, which receives the destination column's atttypmod value (typically its declared length, although the interpretation of atttypmod varies for different data types), and it may take a third boolean parameter that says whether the cast is explicit or implicit. The cast function is responsible for applying any length-dependent semantics such as size checking or truncation.

Example 10.9. character Storage Type Conversion

For a target column declared as character(20) the following statement shows that the stored value is sized correctly:

What has really happened here is that the two unknown literals are resolved to text by default, allowing the || operator to be resolved as text concatenation. Then the text result of the operator is converted to bpchar (“blank-padded char”, the internal name of the character data type) to match the target column type. (Since the conversion from text to bpchar is binary-coercible, this conversion does not insert any real function call.) Finally, the sizing function bpchar(bpchar, integer, boolean) is found in the system catalog and applied to the operator's result and the stored column length. This type-specific function performs the required length check and addition of padding spaces.

**Examples:**

Example 1 (unknown):
```unknown
character(20)
```

Example 2 (sql):
```sql
CREATE TABLE vv (v character(20));
INSERT INTO vv SELECT 'abc' || 'def';
SELECT v, octet_length(v) FROM vv;

          v           | octet_length
----------------------+--------------
 abcdef               |           20
(1 row)
```

Example 3 (unknown):
```unknown
bpchar(bpchar, integer, boolean)
```

---


---

