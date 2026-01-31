# PostgreSQL - Contrib Modules (Part 13)

## F.5. basic_archive — an example WAL archive module #


**URL:** https://www.postgresql.org/docs/18/basic-archive.html

**Contents:**
- F.5. basic_archive — an example WAL archive module #
  - F.5.1. Configuration Parameters #
  - F.5.2. Notes #
  - F.5.3. Author #

basic_archive is an example of an archive module. This module copies completed WAL segment files to the specified directory. This may not be especially useful, but it can serve as a starting point for developing your own archive module. For more information about archive modules, see Chapter 49.

In order to function, this module must be loaded via archive_library, and archive_mode must be enabled.

The directory where the server should copy WAL segment files. This directory must already exist. The default is an empty string, which effectively halts WAL archiving, but if archive_mode is enabled, the server will accumulate WAL segment files in the expectation that a value will soon be provided.

These parameters must be set in postgresql.conf. Typical usage might be:

Server crashes may leave temporary files with the prefix archtemp in the archive directory. It is recommended to delete such files before restarting the server after a crash. It is safe to remove such files while the server is running as long as they are unrelated to any archiving still in progress, but users should use extra caution when doing so.

**Examples:**

Example 1 (unknown):
```unknown
basic_archive
```

Example 2 (unknown):
```unknown
basic_archive.archive_directory
```

Example 3 (unknown):
```unknown
postgresql.conf
```

Example 4 (markdown):
```markdown
# postgresql.conf
archive_mode = 'on'
archive_library = 'basic_archive'
basic_archive.archive_directory = '/path/to/archive/directory'
```

---


---

## F.36. pg_visibility — visibility map information and utilities #


**URL:** https://www.postgresql.org/docs/18/pgvisibility.html

**Contents:**
- F.36. pg_visibility — visibility map information and utilities #
  - F.36.1. Functions #
  - F.36.2. Author #

The pg_visibility module provides a means for examining the visibility map (VM) and page-level visibility information of a table. It also provides functions to check the integrity of a visibility map and to force it to be rebuilt.

Three different bits are used to store information about page-level visibility. The all-visible bit in the visibility map indicates that every tuple in the corresponding page of the relation is visible to every current and future transaction. The all-frozen bit in the visibility map indicates that every tuple in the page is frozen; that is, no future vacuum will need to modify the page until such time as a tuple is inserted, updated, deleted, or locked on that page. The page header's PD_ALL_VISIBLE bit has the same meaning as the all-visible bit in the visibility map, but is stored within the data page itself rather than in a separate data structure. These two bits will normally agree, but the page's all-visible bit can sometimes be set while the visibility map bit is clear after a crash recovery. The reported values can also disagree because of a change that occurs after pg_visibility examines the visibility map and before it examines the data page. Any event that causes data corruption can also cause these bits to disagree.

Functions that display information about PD_ALL_VISIBLE bits are much more costly than those that only consult the visibility map, because they must read the relation's data blocks rather than only the (much smaller) visibility map. Functions that check the relation's data blocks are similarly expensive.

Returns the all-visible and all-frozen bits in the visibility map for the given block of the given relation.

Returns the all-visible and all-frozen bits in the visibility map for the given block of the given relation, plus the PD_ALL_VISIBLE bit of that block.

Returns the all-visible and all-frozen bits in the visibility map for each block of the given relation.

Returns the all-visible and all-frozen bits in the visibility map for each block of the given relation, plus the PD_ALL_VISIBLE bit of each block.

Returns the number of all-visible pages and the number of all-frozen pages in the relation according to the visibility map.

Returns the TIDs of non-frozen tuples stored in pages marked all-frozen in the visibility map. If this function returns a non-empty set of TIDs, the visibility map is corrupt.

Returns the TIDs of non-all-visible tuples stored in pages marked all-visible in the visibility map. If this function returns a non-empty set of TIDs, the visibility map is corrupt.

Truncates the visibility map for the given relation. This function is useful if you believe that the visibility map for the relation is corrupt and wish to force rebuilding it. The first VACUUM executed on the given relation after this function is executed will scan every page in the relation and rebuild the visibility map. (Until that is done, queries will treat the visibility map as containing all zeroes.)

By default, these functions are executable only by superusers and roles with privileges of the pg_stat_scan_tables role, with the exception of pg_truncate_visibility_map(relation regclass) which can only be executed by superusers.

Robert Haas <rhaas@postgresql.org>

**Examples:**

Example 1 (unknown):
```unknown
pg_visibility
```

Example 2 (unknown):
```unknown
PD_ALL_VISIBLE
```

Example 3 (unknown):
```unknown
pg_visibility
```

Example 4 (unknown):
```unknown
PD_ALL_VISIBLE
```

---


---

## F.9. citext — a case-insensitive character string type #


**URL:** https://www.postgresql.org/docs/18/citext.html

**Contents:**
- F.9. citext — a case-insensitive character string type #
  - Tip
  - F.9.1. Rationale #
  - F.9.2. How to Use It #
  - F.9.3. String Comparison Behavior #
  - F.9.4. Limitations #
  - F.9.5. Author #

The citext module provides a case-insensitive character string type, citext. Essentially, it internally calls lower when comparing values. Otherwise, it behaves almost exactly like text.

Consider using nondeterministic collations (see Section 23.2.2.4) instead of this module. They can be used for case-insensitive comparisons, accent-insensitive comparisons, and other combinations, and they handle more Unicode special cases correctly.

This module is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database.

The standard approach to doing case-insensitive matches in PostgreSQL has been to use the lower function when comparing values, for example

This works reasonably well, but has a number of drawbacks:

It makes your SQL statements verbose, and you always have to remember to use lower on both the column and the query value.

It won't use an index, unless you create a functional index using lower.

If you declare a column as UNIQUE or PRIMARY KEY, the implicitly generated index is case-sensitive. So it's useless for case-insensitive searches, and it won't enforce uniqueness case-insensitively.

The citext data type allows you to eliminate calls to lower in SQL queries, and allows a primary key to be case-insensitive. citext is locale-aware, just like text, which means that the matching of upper case and lower case characters is dependent on the rules of the database's LC_CTYPE setting. Again, this behavior is identical to the use of lower in queries. But because it's done transparently by the data type, you don't have to remember to do anything special in your queries.

Here's a simple example of usage:

The SELECT statement will return one tuple, even though the nick column was set to larry and the query was for Larry.

citext performs comparisons by converting each string to lower case (as though lower were called) and then comparing the results normally. Thus, for example, two strings are considered equal if lower would produce identical results for them.

In order to emulate a case-insensitive collation as closely as possible, there are citext-specific versions of a number of string-processing operators and functions. So, for example, the regular expression operators ~ and ~* exhibit the same behavior when applied to citext: they both match case-insensitively. The same is true for !~ and !~*, as well as for the LIKE operators ~~ and ~~*, and !~~ and !~~*. If you'd like to match case-sensitively, you can cast the operator's arguments to text.

Similarly, all of the following functions perform matching case-insensitively if their arguments are citext:

regexp_split_to_array()

regexp_split_to_table()

For the regexp functions, if you want to match case-sensitively, you can specify the “c” flag to force a case-sensitive match. Otherwise, you must cast to text before using one of these functions if you want case-sensitive behavior.

citext's case-folding behavior depends on the LC_CTYPE setting of your database. How it compares values is therefore determined when the database is created. It is not truly case-insensitive in the terms defined by the Unicode standard. Effectively, what this means is that, as long as you're happy with your collation, you should be happy with citext's comparisons. But if you have data in different languages stored in your database, users of one language may find their query results are not as expected if the collation is for another language.

As of PostgreSQL 9.1, you can attach a COLLATE specification to citext columns or data values. Currently, citext operators will honor a non-default COLLATE specification while comparing case-folded strings, but the initial folding to lower case is always done according to the database's LC_CTYPE setting (that is, as though COLLATE "default" were given). This may be changed in a future release so that both steps follow the input COLLATE specification.

citext is not as efficient as text because the operator functions and the B-tree comparison functions must make copies of the data and convert it to lower case for comparisons. Also, only text can support B-Tree deduplication. However, citext is slightly more efficient than using lower to get case-insensitive matching.

citext doesn't help much if you need data to compare case-sensitively in some contexts and case-insensitively in other contexts. The standard answer is to use the text type and manually use the lower function when you need to compare case-insensitively; this works all right if case-insensitive comparison is needed only infrequently. If you need case-insensitive behavior most of the time and case-sensitive infrequently, consider storing the data as citext and explicitly casting the column to text when you want case-sensitive comparison. In either situation, you will need two indexes if you want both types of searches to be fast.

The schema containing the citext operators must be in the current search_path (typically public); if it is not, the normal case-sensitive text operators will be invoked instead.

The approach of lower-casing strings for comparison does not handle some Unicode special cases correctly, for example when one upper-case letter has two lower-case letter equivalents. Unicode distinguishes between case mapping and case folding for this reason. Use nondeterministic collations instead of citext to handle that correctly.

David E. Wheeler <david@kineticode.com>

Inspired by the original citext module by Donald Fraser.

**Examples:**

Example 1 (sql):
```sql
SELECT * FROM tab WHERE lower(col) = LOWER(?);
```

Example 2 (unknown):
```unknown
PRIMARY KEY
```

Example 3 (sql):
```sql
CREATE TABLE users (
    nick CITEXT PRIMARY KEY,
    pass TEXT   NOT NULL
);

INSERT INTO users VALUES ( 'larry',  sha256(random()::text::bytea) );
INSERT INTO users VALUES ( 'Tom',    sha256(random()::text::bytea) );
INSERT INTO users VALUES ( 'Damian', sha256(random()::text::bytea) );
INSERT INTO users VALUES ( 'NEAL',   sha256(random()::text::bytea) );
INSERT INTO users VALUES ( 'Bjørn',  sha256(random()::text::bytea) );

SELECT * FROM users WHERE nick = 'Larry';
```

Example 4 (unknown):
```unknown
regexp_match()
```

---


---

## F.13. dict_xsyn — example synonym full-text search dictionary #


**URL:** https://www.postgresql.org/docs/18/dict-xsyn.html

**Contents:**
- F.13. dict_xsyn — example synonym full-text search dictionary #
  - F.13.1. Configuration #
  - F.13.2. Usage #

dict_xsyn (Extended Synonym Dictionary) is an example of an add-on dictionary template for full-text search. This dictionary type replaces words with groups of their synonyms, and so makes it possible to search for a word using any of its synonyms.

A dict_xsyn dictionary accepts the following options:

matchorig controls whether the original word is accepted by the dictionary. Default is true.

matchsynonyms controls whether the synonyms are accepted by the dictionary. Default is false.

keeporig controls whether the original word is included in the dictionary's output. Default is true.

keepsynonyms controls whether the synonyms are included in the dictionary's output. Default is true.

rules is the base name of the file containing the list of synonyms. This file must be stored in $SHAREDIR/tsearch_data/ (where $SHAREDIR means the PostgreSQL installation's shared-data directory). Its name must end in .rules (which is not to be included in the rules parameter).

The rules file has the following format:

Each line represents a group of synonyms for a single word, which is given first on the line. Synonyms are separated by whitespace, thus:

The sharp (#) sign is a comment delimiter. It may appear at any position in a line. The rest of the line will be skipped.

Look at xsyn_sample.rules, which is installed in $SHAREDIR/tsearch_data/, for an example.

Installing the dict_xsyn extension creates a text search template xsyn_template and a dictionary xsyn based on it, with default parameters. You can alter the parameters, for example

or create new dictionaries based on the template.

To test the dictionary, you can try

Real-world usage will involve including it in a text search configuration as described in Chapter 12. That might look like this:

**Examples:**

Example 1 (unknown):
```unknown
matchsynonyms
```

Example 2 (unknown):
```unknown
keepsynonyms
```

Example 3 (bash):
```bash
$SHAREDIR/tsearch_data/
```

Example 4 (unknown):
```unknown
word syn1 syn2 syn3
```

---


---

