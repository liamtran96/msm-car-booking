# PostgreSQL - Contrib Modules (Part 8)

## F.16. fuzzystrmatch — determine string similarities and distance #


**URL:** https://www.postgresql.org/docs/18/fuzzystrmatch.html

**Contents:**
- F.16. fuzzystrmatch — determine string similarities and distance #
  - Caution
  - F.16.1. Soundex #
  - F.16.2. Daitch-Mokotoff Soundex #
  - F.16.3. Levenshtein #
  - F.16.4. Metaphone #
  - F.16.5. Double Metaphone #

The fuzzystrmatch module provides several functions to determine similarities and distance between strings.

At present, the soundex, metaphone, dmetaphone, and dmetaphone_alt functions do not work well with multibyte encodings (such as UTF-8). Use daitch_mokotoff or levenshtein with such data.

This module is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database.

The Soundex system is a method of matching similar-sounding names by converting them to the same code. It was initially used by the United States Census in 1880, 1900, and 1910. Note that Soundex is not very useful for non-English names.

The fuzzystrmatch module provides two functions for working with Soundex codes:

The soundex function converts a string to its Soundex code. The difference function converts two strings to their Soundex codes and then reports the number of matching code positions. Since Soundex codes have four characters, the result ranges from zero to four, with zero being no match and four being an exact match. (Thus, the function is misnamed — similarity would have been a better name.)

Here are some usage examples:

Like the original Soundex system, Daitch-Mokotoff Soundex matches similar-sounding names by converting them to the same code. However, Daitch-Mokotoff Soundex is significantly more useful for non-English names than the original system. Major improvements over the original system include:

The code is based on the first six meaningful letters rather than four.

A letter or combination of letters maps into ten possible codes rather than seven.

Where two consecutive letters have a single sound, they are coded as a single number.

When a letter or combination of letters may have different sounds, multiple codes are emitted to cover all possibilities.

This function generates the Daitch-Mokotoff soundex codes for its input:

The result may contain one or more codes depending on how many plausible pronunciations there are, so it is represented as an array.

Since a Daitch-Mokotoff soundex code consists of only 6 digits, source should be preferably a single word or name.

Here are some examples:

For matching of single names, returned text arrays can be matched directly using the && operator: any overlap can be considered a match. A GIN index may be used for efficiency, see Section 65.4 and this example:

For indexing and matching of any number of names in any order, Full Text Search features can be used. See Chapter 12 and this example:

If it is desired to avoid recalculation of soundex codes during index rechecks, an index on a separate column can be used instead of an index on an expression. A stored generated column can be used for this; see Section 5.4.

This function calculates the Levenshtein distance between two strings:

Both source and target can be any non-null string, with a maximum of 255 characters. The cost parameters specify how much to charge for a character insertion, deletion, or substitution, respectively. You can omit the cost parameters, as in the second version of the function; in that case they all default to 1.

levenshtein_less_equal is an accelerated version of the Levenshtein function for use when only small distances are of interest. If the actual distance is less than or equal to max_d, then levenshtein_less_equal returns the correct distance; otherwise it returns some value greater than max_d. If max_d is negative then the behavior is the same as levenshtein.

Metaphone, like Soundex, is based on the idea of constructing a representative code for an input string. Two strings are then deemed similar if they have the same codes.

This function calculates the metaphone code of an input string:

source has to be a non-null string with a maximum of 255 characters. max_output_length sets the maximum length of the output metaphone code; if longer, the output is truncated to this length.

The Double Metaphone system computes two “sounds like” strings for a given input string — a “primary” and an “alternate”. In most cases they are the same, but for non-English names especially they can be a bit different, depending on pronunciation. These functions compute the primary and alternate codes:

There is no length limit on the input strings.

**Examples:**

Example 1 (unknown):
```unknown
fuzzystrmatch
```

Example 2 (unknown):
```unknown
dmetaphone_alt
```

Example 3 (unknown):
```unknown
daitch_mokotoff
```

Example 4 (unknown):
```unknown
levenshtein
```

---


---

## F.22. ltree — hierarchical tree-like data type #


**URL:** https://www.postgresql.org/docs/18/ltree.html

**Contents:**
- F.22. ltree — hierarchical tree-like data type #
  - F.22.1. Definitions #
  - F.22.2. Operators and Functions #
  - F.22.3. Indexes #
  - F.22.4. Example #
  - F.22.5. Transforms #
  - F.22.6. Authors #

This module implements a data type ltree for representing labels of data stored in a hierarchical tree-like structure. Extensive facilities for searching through label trees are provided.

This module is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database.

A label is a sequence of alphanumeric characters, underscores, and hyphens. Valid alphanumeric character ranges are dependent on the database locale. For example, in C locale, the characters A-Za-z0-9_- are allowed. Labels must be no more than 1000 characters long.

Examples: 42, Personal_Services

A label path is a sequence of zero or more labels separated by dots, for example L1.L2.L3, representing a path from the root of a hierarchical tree to a particular node. The length of a label path cannot exceed 65535 labels.

Example: Top.Countries.Europe.Russia

The ltree module provides several data types:

ltree stores a label path.

lquery represents a regular-expression-like pattern for matching ltree values. A simple word matches that label within a path. A star symbol (*) matches zero or more labels. These can be joined with dots to form a pattern that must match the whole label path. For example:

Both star symbols and simple words can be quantified to restrict how many labels they can match:

In the absence of any explicit quantifier, the default for a star symbol is to match any number of labels (that is, {,}) while the default for a non-star item is to match exactly once (that is, {1}).

There are several modifiers that can be put at the end of a non-star lquery item to make it match more than just the exact match:

The behavior of % is a bit complicated. It tries to match words rather than the entire label. For example foo_bar% matches foo_bar_baz but not foo_barbaz. If combined with *, prefix matching applies to each word separately, for example foo_bar%* matches foo1_bar2_baz but not foo1_br2_baz.

Also, you can write several possibly-modified non-star items separated with | (OR) to match any of those items, and you can put ! (NOT) at the start of a non-star group to match any label that doesn't match any of the alternatives. A quantifier, if any, goes at the end of the group; it means some number of matches for the group as a whole (that is, some number of labels matching or not matching any of the alternatives).

Here's an annotated example of lquery:

This query will match any label path that:

begins with the label Top

and next has zero to two labels before

a label beginning with the case-insensitive prefix sport

then has one or more labels, none of which match football nor tennis

and then ends with a label beginning with Russ or exactly matching Spain.

ltxtquery represents a full-text-search-like pattern for matching ltree values. An ltxtquery value contains words, possibly with the modifiers @, *, % at the end; the modifiers have the same meanings as in lquery. Words can be combined with & (AND), | (OR), ! (NOT), and parentheses. The key difference from lquery is that ltxtquery matches words without regard to their position in the label path.

Here's an example ltxtquery:

This will match paths that contain the label Europe and any label beginning with Russia (case-insensitive), but not paths containing the label Transportation. The location of these words within the path is not important. Also, when % is used, the word can be matched to any underscore-separated word within a label, regardless of position.

Note: ltxtquery allows whitespace between symbols, but ltree and lquery do not.

Type ltree has the usual comparison operators =, <>, <, >, <=, >=. Comparison sorts in the order of a tree traversal, with the children of a node sorted by label text. In addition, the specialized operators shown in Table F.12 are available.

Table F.12. ltree Operators

ltree @> ltree → boolean

Is left argument an ancestor of right (or equal)?

ltree <@ ltree → boolean

Is left argument a descendant of right (or equal)?

ltree ~ lquery → boolean

lquery ~ ltree → boolean

Does ltree match lquery?

ltree ? lquery[] → boolean

lquery[] ? ltree → boolean

Does ltree match any lquery in array?

ltree @ ltxtquery → boolean

ltxtquery @ ltree → boolean

Does ltree match ltxtquery?

ltree || ltree → ltree

Concatenates ltree paths.

ltree || text → ltree

text || ltree → ltree

Converts text to ltree and concatenates.

ltree[] @> ltree → boolean

ltree <@ ltree[] → boolean

Does array contain an ancestor of ltree?

ltree[] <@ ltree → boolean

ltree @> ltree[] → boolean

Does array contain a descendant of ltree?

ltree[] ~ lquery → boolean

lquery ~ ltree[] → boolean

Does array contain any path matching lquery?

ltree[] ? lquery[] → boolean

lquery[] ? ltree[] → boolean

Does ltree array contain any path matching any lquery?

ltree[] @ ltxtquery → boolean

ltxtquery @ ltree[] → boolean

Does array contain any path matching ltxtquery?

ltree[] ?@> ltree → ltree

Returns first array entry that is an ancestor of ltree, or NULL if none.

ltree[] ?<@ ltree → ltree

Returns first array entry that is a descendant of ltree, or NULL if none.

ltree[] ?~ lquery → ltree

Returns first array entry that matches lquery, or NULL if none.

ltree[] ?@ ltxtquery → ltree

Returns first array entry that matches ltxtquery, or NULL if none.

The operators <@, @>, @ and ~ have analogues ^<@, ^@>, ^@, ^~, which are the same except they do not use indexes. These are useful only for testing purposes.

The available functions are shown in Table F.13.

Table F.13. ltree Functions

subltree ( ltree, start integer, end integer ) → ltree

Returns subpath of ltree from position start to position end-1 (counting from 0).

subltree('Top.Child1.Child2', 1, 2) → Child1

subpath ( ltree, offset integer, len integer ) → ltree

Returns subpath of ltree starting at position offset, with length len. If offset is negative, subpath starts that far from the end of the path. If len is negative, leaves that many labels off the end of the path.

subpath('Top.Child1.Child2', 0, 2) → Top.Child1

subpath ( ltree, offset integer ) → ltree

Returns subpath of ltree starting at position offset, extending to end of path. If offset is negative, subpath starts that far from the end of the path.

subpath('Top.Child1.Child2', 1) → Child1.Child2

nlevel ( ltree ) → integer

Returns number of labels in path.

nlevel('Top.Child1.Child2') → 3

index ( a ltree, b ltree ) → integer

Returns position of first occurrence of b in a, or -1 if not found.

index('0.1.2.3.5.4.5.6.8.5.6.8', '5.6') → 6

index ( a ltree, b ltree, offset integer ) → integer

Returns position of first occurrence of b in a, or -1 if not found. The search starts at position offset; negative offset means start -offset labels from the end of the path.

index('0.1.2.3.5.4.5.6.8.5.6.8', '5.6', -4) → 9

text2ltree ( text ) → ltree

ltree2text ( ltree ) → text

lca ( ltree [, ltree [, ... ]] ) → ltree

Computes longest common ancestor of paths (up to 8 arguments are supported).

lca('1.2.3', '1.2.3.4.5.6') → 1.2

lca ( ltree[] ) → ltree

Computes longest common ancestor of paths in array.

lca(array['1.2.3'::ltree,'1.2.3.4']) → 1.2

ltree supports several types of indexes that can speed up the indicated operators:

B-tree index over ltree: <, <=, =, >=, >

Hash index over ltree: =

GiST index over ltree (gist_ltree_ops opclass): <, <=, =, >=, >, @>, <@, @, ~, ?

gist_ltree_ops GiST opclass approximates a set of path labels as a bitmap signature. Its optional integer parameter siglen determines the signature length in bytes. The default signature length is 8 bytes. The length must be a positive multiple of int alignment (4 bytes on most machines)) up to 2024. Longer signatures lead to a more precise search (scanning a smaller fraction of the index and fewer heap pages), at the cost of a larger index.

Example of creating such an index with the default signature length of 8 bytes:

Example of creating such an index with a signature length of 100 bytes:

GiST index over ltree[] (gist__ltree_ops opclass): ltree[] <@ ltree, ltree @> ltree[], @, ~, ?

gist__ltree_ops GiST opclass works similarly to gist_ltree_ops and also takes signature length as a parameter. The default value of siglen in gist__ltree_ops is 28 bytes.

Example of creating such an index with the default signature length of 28 bytes:

Example of creating such an index with a signature length of 100 bytes:

Note: This index type is lossy.

This example uses the following data (also available in file contrib/ltree/ltreetest.sql in the source distribution):

Now, we have a table test populated with data describing the hierarchy shown below:

We can do inheritance:

Here are some examples of path matching:

Here are some examples of full text search:

Path construction using functions:

We could simplify this by creating an SQL function that inserts a label at a specified position in a path:

The ltree_plpython3u extension implements transforms for the ltree type for PL/Python. If installed and specified when creating a function, ltree values are mapped to Python lists. (The reverse is currently not supported, however.)

All work was done by Teodor Sigaev (<teodor@stack.net>) and Oleg Bartunov (<oleg@sai.msu.su>). See http://www.sai.msu.su/~megera/postgres/gist/ for additional information. Authors would like to thank Eugeny Rodichev for helpful discussions. Comments and bug reports are welcome.

**Examples:**

Example 1 (unknown):
```unknown
A-Za-z0-9_-
```

Example 2 (unknown):
```unknown
Personal_Services
```

Example 3 (unknown):
```unknown
Top.Countries.Europe.Russia
```

Example 4 (unknown):
```unknown
foo_bar_baz
```

---


---

