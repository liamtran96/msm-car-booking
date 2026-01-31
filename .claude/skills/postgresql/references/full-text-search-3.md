# PostgreSQL - Full Text Search (Part 3)

## 12.7. Configuration Example #


**URL:** https://www.postgresql.org/docs/18/textsearch-configuration.html

**Contents:**
- 12.7. Configuration Example #

A text search configuration specifies all options necessary to transform a document into a tsvector: the parser to use to break text into tokens, and the dictionaries to use to transform each token into a lexeme. Every call of to_tsvector or to_tsquery needs a text search configuration to perform its processing. The configuration parameter default_text_search_config specifies the name of the default configuration, which is the one used by text search functions if an explicit configuration parameter is omitted. It can be set in postgresql.conf, or set for an individual session using the SET command.

Several predefined text search configurations are available, and you can create custom configurations easily. To facilitate management of text search objects, a set of SQL commands is available, and there are several psql commands that display information about text search objects (Section 12.10).

As an example we will create a configuration pg, starting by duplicating the built-in english configuration:

We will use a PostgreSQL-specific synonym list and store it in $SHAREDIR/tsearch_data/pg_dict.syn. The file contents look like:

We define the synonym dictionary like this:

Next we register the Ispell dictionary english_ispell, which has its own configuration files:

Now we can set up the mappings for words in configuration pg:

We choose not to index or search some token types that the built-in configuration does handle:

Now we can test our configuration:

The next step is to set the session to use the new configuration, which was created in the public schema:

**Examples:**

Example 1 (unknown):
```unknown
to_tsvector
```

Example 2 (unknown):
```unknown
postgresql.conf
```

Example 3 (unknown):
```unknown
CREATE TEXT SEARCH CONFIGURATION public.pg ( COPY = pg_catalog.english );
```

Example 4 (bash):
```bash
$SHAREDIR/tsearch_data/pg_dict.syn
```

---


---

## 12.2. Tables and Indexes #


**URL:** https://www.postgresql.org/docs/18/textsearch-tables.html

**Contents:**
- 12.2. Tables and Indexes #
  - 12.2.1. Searching a Table #
  - 12.2.2. Creating Indexes #

The examples in the previous section illustrated full text matching using simple constant strings. This section shows how to search table data, optionally using indexes.

It is possible to do a full text search without an index. A simple query to print the title of each row that contains the word friend in its body field is:

This will also find related words such as friends and friendly, since all these are reduced to the same normalized lexeme.

The query above specifies that the english configuration is to be used to parse and normalize the strings. Alternatively we could omit the configuration parameters:

This query will use the configuration set by default_text_search_config.

A more complex example is to select the ten most recent documents that contain create and table in the title or body:

For clarity we omitted the coalesce function calls which would be needed to find rows that contain NULL in one of the two fields.

Although these queries will work without an index, most applications will find this approach too slow, except perhaps for occasional ad-hoc searches. Practical use of text searching usually requires creating an index.

We can create a GIN index (Section 12.9) to speed up text searches:

Notice that the 2-argument version of to_tsvector is used. Only text search functions that specify a configuration name can be used in expression indexes (Section 11.7). This is because the index contents must be unaffected by default_text_search_config. If they were affected, the index contents might be inconsistent because different entries could contain tsvectors that were created with different text search configurations, and there would be no way to guess which was which. It would be impossible to dump and restore such an index correctly.

Because the two-argument version of to_tsvector was used in the index above, only a query reference that uses the 2-argument version of to_tsvector with the same configuration name will use that index. That is, WHERE to_tsvector('english', body) @@ 'a & b' can use the index, but WHERE to_tsvector(body) @@ 'a & b' cannot. This ensures that an index will be used only with the same configuration used to create the index entries.

It is possible to set up more complex expression indexes wherein the configuration name is specified by another column, e.g.:

where config_name is a column in the pgweb table. This allows mixed configurations in the same index while recording which configuration was used for each index entry. This would be useful, for example, if the document collection contained documents in different languages. Again, queries that are meant to use the index must be phrased to match, e.g., WHERE to_tsvector(config_name, body) @@ 'a & b'.

Indexes can even concatenate columns:

Another approach is to create a separate tsvector column to hold the output of to_tsvector. To keep this column automatically up to date with its source data, use a stored generated column. This example is a concatenation of title and body, using coalesce to ensure that one field will still be indexed when the other is NULL:

Then we create a GIN index to speed up the search:

Now we are ready to perform a fast full text search:

One advantage of the separate-column approach over an expression index is that it is not necessary to explicitly specify the text search configuration in queries in order to make use of the index. As shown in the example above, the query can depend on default_text_search_config. Another advantage is that searches will be faster, since it will not be necessary to redo the to_tsvector calls to verify index matches. (This is more important when using a GiST index than a GIN index; see Section 12.9.) The expression-index approach is simpler to set up, however, and it requires less disk space since the tsvector representation is not stored explicitly.

**Examples:**

Example 1 (sql):
```sql
SELECT title
FROM pgweb
WHERE to_tsvector('english', body) @@ to_tsquery('english', 'friend');
```

Example 2 (sql):
```sql
SELECT title
FROM pgweb
WHERE to_tsvector(body) @@ to_tsquery('friend');
```

Example 3 (sql):
```sql
SELECT title
FROM pgweb
WHERE to_tsvector(title || ' ' || body) @@ to_tsquery('create & table')
ORDER BY last_mod_date DESC
LIMIT 10;
```

Example 4 (julia):
```julia
CREATE INDEX pgweb_idx ON pgweb USING GIN (to_tsvector('english', body));
```

---


---

## 12.9. Preferred Index Types for Text Search #


**URL:** https://www.postgresql.org/docs/18/textsearch-indexes.html

**Contents:**
- 12.9. Preferred Index Types for Text Search #

There are two kinds of indexes that can be used to speed up full text searches: GIN and GiST. Note that indexes are not mandatory for full text searching, but in cases where a column is searched on a regular basis, an index is usually desirable.

To create such an index, do one of:

Creates a GIN (Generalized Inverted Index)-based index. The column must be of tsvector type.

Creates a GiST (Generalized Search Tree)-based index. The column can be of tsvector or tsquery type. Optional integer parameter siglen determines signature length in bytes (see below for details).

GIN indexes are the preferred text search index type. As inverted indexes, they contain an index entry for each word (lexeme), with a compressed list of matching locations. Multi-word searches can find the first match, then use the index to remove rows that are lacking additional words. GIN indexes store only the words (lexemes) of tsvector values, and not their weight labels. Thus a table row recheck is needed when using a query that involves weights.

A GiST index is lossy, meaning that the index might produce false matches, and it is necessary to check the actual table row to eliminate such false matches. (PostgreSQL does this automatically when needed.) GiST indexes are lossy because each document is represented in the index by a fixed-length signature. The signature length in bytes is determined by the value of the optional integer parameter siglen. The default signature length (when siglen is not specified) is 124 bytes, the maximum signature length is 2024 bytes. The signature is generated by hashing each word into a single bit in an n-bit string, with all these bits OR-ed together to produce an n-bit document signature. When two words hash to the same bit position there will be a false match. If all words in the query have matches (real or false) then the table row must be retrieved to see if the match is correct. Longer signatures lead to a more precise search (scanning a smaller fraction of the index and fewer heap pages), at the cost of a larger index.

A GiST index can be covering, i.e., use the INCLUDE clause. Included columns can have data types without any GiST operator class. Included attributes will be stored uncompressed.

Lossiness causes performance degradation due to unnecessary fetches of table records that turn out to be false matches. Since random access to table records is slow, this limits the usefulness of GiST indexes. The likelihood of false matches depends on several factors, in particular the number of unique words, so using dictionaries to reduce this number is recommended.

Note that GIN index build time can often be improved by increasing maintenance_work_mem, while GiST index build time is not sensitive to that parameter.

Partitioning of big collections and the proper use of GIN and GiST indexes allows the implementation of very fast searches with online update. Partitioning can be done at the database level using table inheritance, or by distributing documents over servers and collecting external search results, e.g., via Foreign Data access. The latter is possible because ranking functions use only local information.

**Examples:**

Example 1 (julia):
```julia
CREATE INDEX name ON table USING GIN (column);
```

Example 2 (julia):
```julia
CREATE INDEX name ON table USING GIST (column [ { DEFAULT | tsvector_ops } (siglen = number) ] );
```

---


---

## 12.11. Limitations #


**URL:** https://www.postgresql.org/docs/18/textsearch-limitations.html

**Contents:**
- 12.11. Limitations #

The current limitations of PostgreSQL's text search features are:

The length of each lexeme must be less than 2 kilobytes

The length of a tsvector (lexemes + positions) must be less than 1 megabyte

The number of lexemes must be less than 264

Position values in tsvector must be greater than 0 and no more than 16,383

The match distance in a <N> (FOLLOWED BY) tsquery operator cannot be more than 16,384

No more than 256 positions per lexeme

The number of nodes (lexemes + operators) in a tsquery must be less than 32,768

For comparison, the PostgreSQL 8.1 documentation contained 10,441 unique words, a total of 335,420 words, and the most frequent word “postgresql” was mentioned 6,127 times in 655 documents.

Another example — the PostgreSQL mailing list archives contained 910,989 unique words with 57,491,343 lexemes in 461,020 messages.

---


---

## 12.8. Testing and Debugging Text Search #


**URL:** https://www.postgresql.org/docs/18/textsearch-debugging.html

**Contents:**
- 12.8. Testing and Debugging Text Search #
  - 12.8.1. Configuration Testing #
  - 12.8.2. Parser Testing #
  - 12.8.3. Dictionary Testing #
  - Note

The behavior of a custom text search configuration can easily become confusing. The functions described in this section are useful for testing text search objects. You can test a complete configuration, or test parsers and dictionaries separately.

The function ts_debug allows easy testing of a text search configuration.

ts_debug displays information about every token of document as produced by the parser and processed by the configured dictionaries. It uses the configuration specified by config, or default_text_search_config if that argument is omitted.

ts_debug returns one row for each token identified in the text by the parser. The columns returned are

alias text — short name of the token type

description text — description of the token type

token text — text of the token

dictionaries regdictionary[] — the dictionaries selected by the configuration for this token type

dictionary regdictionary — the dictionary that recognized the token, or NULL if none did

lexemes text[] — the lexeme(s) produced by the dictionary that recognized the token, or NULL if none did; an empty array ({}) means it was recognized as a stop word

Here is a simple example:

For a more extensive demonstration, we first create a public.english configuration and Ispell dictionary for the English language:

In this example, the word Brightest was recognized by the parser as an ASCII word (alias asciiword). For this token type the dictionary list is english_ispell and english_stem. The word was recognized by english_ispell, which reduced it to the noun bright. The word supernovaes is unknown to the english_ispell dictionary so it was passed to the next dictionary, and, fortunately, was recognized (in fact, english_stem is a Snowball dictionary which recognizes everything; that is why it was placed at the end of the dictionary list).

The word The was recognized by the english_ispell dictionary as a stop word (Section 12.6.1) and will not be indexed. The spaces are discarded too, since the configuration provides no dictionaries at all for them.

You can reduce the width of the output by explicitly specifying which columns you want to see:

The following functions allow direct testing of a text search parser.

ts_parse parses the given document and returns a series of records, one for each token produced by parsing. Each record includes a tokid showing the assigned token type and a token which is the text of the token. For example:

ts_token_type returns a table which describes each type of token the specified parser can recognize. For each token type, the table gives the integer tokid that the parser uses to label a token of that type, the alias that names the token type in configuration commands, and a short description. For example:

The ts_lexize function facilitates dictionary testing.

ts_lexize returns an array of lexemes if the input token is known to the dictionary, or an empty array if the token is known to the dictionary but it is a stop word, or NULL if it is an unknown word.

The ts_lexize function expects a single token, not text. Here is a case where this can be confusing:

The thesaurus dictionary thesaurus_astro does know the phrase supernovae stars, but ts_lexize fails since it does not parse the input text but treats it as a single token. Use plainto_tsquery or to_tsvector to test thesaurus dictionaries, for example:

**Examples:**

Example 1 (unknown):
```unknown
description
```

Example 2 (unknown):
```unknown
dictionaries
```

Example 3 (unknown):
```unknown
regdictionary[]
```

Example 4 (unknown):
```unknown
regdictionary
```

---


---

