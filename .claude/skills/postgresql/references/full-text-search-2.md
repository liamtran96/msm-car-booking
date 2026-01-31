# PostgreSQL - Full Text Search (Part 2)

## 12.6. Dictionaries #


**URL:** https://www.postgresql.org/docs/18/textsearch-dictionaries.html

**Contents:**
- 12.6. Dictionaries #
  - 12.6.1. Stop Words #
  - 12.6.2. Simple Dictionary #
  - Caution
  - Caution
  - 12.6.3. Synonym Dictionary #
  - 12.6.4. Thesaurus Dictionary #
  - Caution
    - 12.6.4.1. Thesaurus Configuration #
    - 12.6.4.2. Thesaurus Example #

Dictionaries are used to eliminate words that should not be considered in a search (stop words), and to normalize words so that different derived forms of the same word will match. A successfully normalized word is called a lexeme. Aside from improving search quality, normalization and removal of stop words reduce the size of the tsvector representation of a document, thereby improving performance. Normalization does not always have linguistic meaning and usually depends on application semantics.

Some examples of normalization:

Linguistic — Ispell dictionaries try to reduce input words to a normalized form; stemmer dictionaries remove word endings

URL locations can be canonicalized to make equivalent URLs match:

http://www.pgsql.ru/db/mw/index.html

http://www.pgsql.ru/db/mw/

http://www.pgsql.ru/db/../db/mw/index.html

Color names can be replaced by their hexadecimal values, e.g., red, green, blue, magenta -> FF0000, 00FF00, 0000FF, FF00FF

If indexing numbers, we can remove some fractional digits to reduce the range of possible numbers, so for example 3.14159265359, 3.1415926, 3.14 will be the same after normalization if only two digits are kept after the decimal point.

A dictionary is a program that accepts a token as input and returns:

an array of lexemes if the input token is known to the dictionary (notice that one token can produce more than one lexeme)

a single lexeme with the TSL_FILTER flag set, to replace the original token with a new token to be passed to subsequent dictionaries (a dictionary that does this is called a filtering dictionary)

an empty array if the dictionary knows the token, but it is a stop word

NULL if the dictionary does not recognize the input token

PostgreSQL provides predefined dictionaries for many languages. There are also several predefined templates that can be used to create new dictionaries with custom parameters. Each predefined dictionary template is described below. If no existing template is suitable, it is possible to create new ones; see the contrib/ area of the PostgreSQL distribution for examples.

A text search configuration binds a parser together with a set of dictionaries to process the parser's output tokens. For each token type that the parser can return, a separate list of dictionaries is specified by the configuration. When a token of that type is found by the parser, each dictionary in the list is consulted in turn, until some dictionary recognizes it as a known word. If it is identified as a stop word, or if no dictionary recognizes the token, it will be discarded and not indexed or searched for. Normally, the first dictionary that returns a non-NULL output determines the result, and any remaining dictionaries are not consulted; but a filtering dictionary can replace the given word with a modified word, which is then passed to subsequent dictionaries.

The general rule for configuring a list of dictionaries is to place first the most narrow, most specific dictionary, then the more general dictionaries, finishing with a very general dictionary, like a Snowball stemmer or simple, which recognizes everything. For example, for an astronomy-specific search (astro_en configuration) one could bind token type asciiword (ASCII word) to a synonym dictionary of astronomical terms, a general English dictionary and a Snowball English stemmer:

A filtering dictionary can be placed anywhere in the list, except at the end where it'd be useless. Filtering dictionaries are useful to partially normalize words to simplify the task of later dictionaries. For example, a filtering dictionary could be used to remove accents from accented letters, as is done by the unaccent module.

Stop words are words that are very common, appear in almost every document, and have no discrimination value. Therefore, they can be ignored in the context of full text searching. For example, every English text contains words like a and the, so it is useless to store them in an index. However, stop words do affect the positions in tsvector, which in turn affect ranking:

The missing positions 1,2,4 are because of stop words. Ranks calculated for documents with and without stop words are quite different:

It is up to the specific dictionary how it treats stop words. For example, ispell dictionaries first normalize words and then look at the list of stop words, while Snowball stemmers first check the list of stop words. The reason for the different behavior is an attempt to decrease noise.

The simple dictionary template operates by converting the input token to lower case and checking it against a file of stop words. If it is found in the file then an empty array is returned, causing the token to be discarded. If not, the lower-cased form of the word is returned as the normalized lexeme. Alternatively, the dictionary can be configured to report non-stop-words as unrecognized, allowing them to be passed on to the next dictionary in the list.

Here is an example of a dictionary definition using the simple template:

Here, english is the base name of a file of stop words. The file's full name will be $SHAREDIR/tsearch_data/english.stop, where $SHAREDIR means the PostgreSQL installation's shared-data directory, often /usr/local/share/postgresql (use pg_config --sharedir to determine it if you're not sure). The file format is simply a list of words, one per line. Blank lines and trailing spaces are ignored, and upper case is folded to lower case, but no other processing is done on the file contents.

Now we can test our dictionary:

We can also choose to return NULL, instead of the lower-cased word, if it is not found in the stop words file. This behavior is selected by setting the dictionary's Accept parameter to false. Continuing the example:

With the default setting of Accept = true, it is only useful to place a simple dictionary at the end of a list of dictionaries, since it will never pass on any token to a following dictionary. Conversely, Accept = false is only useful when there is at least one following dictionary.

Most types of dictionaries rely on configuration files, such as files of stop words. These files must be stored in UTF-8 encoding. They will be translated to the actual database encoding, if that is different, when they are read into the server.

Normally, a database session will read a dictionary configuration file only once, when it is first used within the session. If you modify a configuration file and want to force existing sessions to pick up the new contents, issue an ALTER TEXT SEARCH DICTIONARY command on the dictionary. This can be a “dummy” update that doesn't actually change any parameter values.

This dictionary template is used to create dictionaries that replace a word with a synonym. Phrases are not supported (use the thesaurus template (Section 12.6.4) for that). A synonym dictionary can be used to overcome linguistic problems, for example, to prevent an English stemmer dictionary from reducing the word “Paris” to “pari”. It is enough to have a Paris paris line in the synonym dictionary and put it before the english_stem dictionary. For example:

The only parameter required by the synonym template is SYNONYMS, which is the base name of its configuration file — my_synonyms in the above example. The file's full name will be $SHAREDIR/tsearch_data/my_synonyms.syn (where $SHAREDIR means the PostgreSQL installation's shared-data directory). The file format is just one line per word to be substituted, with the word followed by its synonym, separated by white space. Blank lines and trailing spaces are ignored.

The synonym template also has an optional parameter CaseSensitive, which defaults to false. When CaseSensitive is false, words in the synonym file are folded to lower case, as are input tokens. When it is true, words and tokens are not folded to lower case, but are compared as-is.

An asterisk (*) can be placed at the end of a synonym in the configuration file. This indicates that the synonym is a prefix. The asterisk is ignored when the entry is used in to_tsvector(), but when it is used in to_tsquery(), the result will be a query item with the prefix match marker (see Section 12.3.2). For example, suppose we have these entries in $SHAREDIR/tsearch_data/synonym_sample.syn:

Then we will get these results:

A thesaurus dictionary (sometimes abbreviated as TZ) is a collection of words that includes information about the relationships of words and phrases, i.e., broader terms (BT), narrower terms (NT), preferred terms, non-preferred terms, related terms, etc.

Basically a thesaurus dictionary replaces all non-preferred terms by one preferred term and, optionally, preserves the original terms for indexing as well. PostgreSQL's current implementation of the thesaurus dictionary is an extension of the synonym dictionary with added phrase support. A thesaurus dictionary requires a configuration file of the following format:

where the colon (:) symbol acts as a delimiter between a phrase and its replacement.

A thesaurus dictionary uses a subdictionary (which is specified in the dictionary's configuration) to normalize the input text before checking for phrase matches. It is only possible to select one subdictionary. An error is reported if the subdictionary fails to recognize a word. In that case, you should remove the use of the word or teach the subdictionary about it. You can place an asterisk (*) at the beginning of an indexed word to skip applying the subdictionary to it, but all sample words must be known to the subdictionary.

The thesaurus dictionary chooses the longest match if there are multiple phrases matching the input, and ties are broken by using the last definition.

Specific stop words recognized by the subdictionary cannot be specified; instead use ? to mark the location where any stop word can appear. For example, assuming that a and the are stop words according to the subdictionary:

matches a one the two and the one a two; both would be replaced by swsw.

Since a thesaurus dictionary has the capability to recognize phrases it must remember its state and interact with the parser. A thesaurus dictionary uses these assignments to check if it should handle the next word or stop accumulation. The thesaurus dictionary must be configured carefully. For example, if the thesaurus dictionary is assigned to handle only the asciiword token, then a thesaurus dictionary definition like one 7 will not work since token type uint is not assigned to the thesaurus dictionary.

Thesauruses are used during indexing so any change in the thesaurus dictionary's parameters requires reindexing. For most other dictionary types, small changes such as adding or removing stopwords does not force reindexing.

To define a new thesaurus dictionary, use the thesaurus template. For example:

thesaurus_simple is the new dictionary's name

mythesaurus is the base name of the thesaurus configuration file. (Its full name will be $SHAREDIR/tsearch_data/mythesaurus.ths, where $SHAREDIR means the installation shared-data directory.)

pg_catalog.english_stem is the subdictionary (here, a Snowball English stemmer) to use for thesaurus normalization. Notice that the subdictionary will have its own configuration (for example, stop words), which is not shown here.

Now it is possible to bind the thesaurus dictionary thesaurus_simple to the desired token types in a configuration, for example:

Consider a simple astronomical thesaurus thesaurus_astro, which contains some astronomical word combinations:

Below we create a dictionary and bind some token types to an astronomical thesaurus and English stemmer:

Now we can see how it works. ts_lexize is not very useful for testing a thesaurus, because it treats its input as a single token. Instead we can use plainto_tsquery and to_tsvector which will break their input strings into multiple tokens:

In principle, one can use to_tsquery if you quote the argument:

Notice that supernova star matches supernovae stars in thesaurus_astro because we specified the english_stem stemmer in the thesaurus definition. The stemmer removed the e and s.

To index the original phrase as well as the substitute, just include it in the right-hand part of the definition:

The Ispell dictionary template supports morphological dictionaries, which can normalize many different linguistic forms of a word into the same lexeme. For example, an English Ispell dictionary can match all declensions and conjugations of the search term bank, e.g., banking, banked, banks, banks', and bank's.

The standard PostgreSQL distribution does not include any Ispell configuration files. Dictionaries for a large number of languages are available from Ispell. Also, some more modern dictionary file formats are supported — MySpell (OO < 2.0.1) and Hunspell (OO >= 2.0.2). A large list of dictionaries is available on the OpenOffice Wiki.

To create an Ispell dictionary perform these steps:

download dictionary configuration files. OpenOffice extension files have the .oxt extension. It is necessary to extract .aff and .dic files, change extensions to .affix and .dict. For some dictionary files it is also needed to convert characters to the UTF-8 encoding with commands (for example, for a Norwegian language dictionary):

copy files to the $SHAREDIR/tsearch_data directory

load files into PostgreSQL with the following command:

Here, DictFile, AffFile, and StopWords specify the base names of the dictionary, affixes, and stop-words files. The stop-words file has the same format explained above for the simple dictionary type. The format of the other files is not specified here but is available from the above-mentioned web sites.

Ispell dictionaries usually recognize a limited set of words, so they should be followed by another broader dictionary; for example, a Snowball dictionary, which recognizes everything.

The .affix file of Ispell has the following structure:

And the .dict file has the following structure:

Format of the .dict file is:

In the .affix file every affix flag is described in the following format:

Here, condition has a format similar to the format of regular expressions. It can use groupings [...] and [^...]. For example, [AEIOU]Y means that the last letter of the word is "y" and the penultimate letter is "a", "e", "i", "o" or "u". [^EY] means that the last letter is neither "e" nor "y".

Ispell dictionaries support splitting compound words; a useful feature. Notice that the affix file should specify a special flag using the compoundwords controlled statement that marks dictionary words that can participate in compound formation:

Here are some examples for the Norwegian language:

MySpell format is a subset of Hunspell. The .affix file of Hunspell has the following structure:

The first line of an affix class is the header. Fields of an affix rules are listed after the header:

parameter name (PFX or SFX)

flag (name of the affix class)

stripping characters from beginning (at prefix) or end (at suffix) of the word

condition that has a format similar to the format of regular expressions.

The .dict file looks like the .dict file of Ispell:

MySpell does not support compound words. Hunspell has sophisticated support for compound words. At present, PostgreSQL implements only the basic compound word operations of Hunspell.

The Snowball dictionary template is based on a project by Martin Porter, inventor of the popular Porter's stemming algorithm for the English language. Snowball now provides stemming algorithms for many languages (see the Snowball site for more information). Each algorithm understands how to reduce common variant forms of words to a base, or stem, spelling within its language. A Snowball dictionary requires a language parameter to identify which stemmer to use, and optionally can specify a stopword file name that gives a list of words to eliminate. (PostgreSQL's standard stopword lists are also provided by the Snowball project.) For example, there is a built-in definition equivalent to

The stopword file format is the same as already explained.

A Snowball dictionary recognizes everything, whether or not it is able to simplify the word, so it should be placed at the end of the dictionary list. It is useless to have it before any other dictionary because a token will never pass through it to the next dictionary.

**Examples:**

Example 1 (php):
```php
red, green, blue, magenta -> FF0000, 00FF00, 0000FF, FF00FF
```

Example 2 (unknown):
```unknown
ALTER TEXT SEARCH CONFIGURATION astro_en
    ADD MAPPING FOR asciiword WITH astrosyn, english_ispell, english_stem;
```

Example 3 (sql):
```sql
SELECT to_tsvector('english', 'in the list of stop words');
        to_tsvector
----------------------------
 'list':3 'stop':5 'word':6
```

Example 4 (sql):
```sql
SELECT ts_rank_cd (to_tsvector('english', 'in the list of stop words'), to_tsquery('list & stop'));
 ts_rank_cd
------------
       0.05

SELECT ts_rank_cd (to_tsvector('english', 'list stop words'), to_tsquery('list & stop'));
 ts_rank_cd
------------
        0.1
```

---


---

## 12.4. Additional Features #


**URL:** https://www.postgresql.org/docs/18/textsearch-features.html

**Contents:**
- 12.4. Additional Features #
  - 12.4.1. Manipulating Documents #
  - 12.4.2. Manipulating Queries #
    - 12.4.2.1. Query Rewriting #
  - 12.4.3. Triggers for Automatic Updates #
  - Note
  - 12.4.4. Gathering Document Statistics #

This section describes additional functions and operators that are useful in connection with text search.

Section 12.3.1 showed how raw textual documents can be converted into tsvector values. PostgreSQL also provides functions and operators that can be used to manipulate documents that are already in tsvector form.

The tsvector concatenation operator returns a vector which combines the lexemes and positional information of the two vectors given as arguments. Positions and weight labels are retained during the concatenation. Positions appearing in the right-hand vector are offset by the largest position mentioned in the left-hand vector, so that the result is nearly equivalent to the result of performing to_tsvector on the concatenation of the two original document strings. (The equivalence is not exact, because any stop-words removed from the end of the left-hand argument will not affect the result, whereas they would have affected the positions of the lexemes in the right-hand argument if textual concatenation were used.)

One advantage of using concatenation in the vector form, rather than concatenating text before applying to_tsvector, is that you can use different configurations to parse different sections of the document. Also, because the setweight function marks all lexemes of the given vector the same way, it is necessary to parse the text and do setweight before concatenating if you want to label different parts of the document with different weights.

setweight returns a copy of the input vector in which every position has been labeled with the given weight, either A, B, C, or D. (D is the default for new vectors and as such is not displayed on output.) These labels are retained when vectors are concatenated, allowing words from different parts of a document to be weighted differently by ranking functions.

Note that weight labels apply to positions, not lexemes. If the input vector has been stripped of positions then setweight does nothing.

Returns the number of lexemes stored in the vector.

Returns a vector that lists the same lexemes as the given vector, but lacks any position or weight information. The result is usually much smaller than an unstripped vector, but it is also less useful. Relevance ranking does not work as well on stripped vectors as unstripped ones. Also, the <-> (FOLLOWED BY) tsquery operator will never match stripped input, since it cannot determine the distance between lexeme occurrences.

A full list of tsvector-related functions is available in Table 9.43.

Section 12.3.2 showed how raw textual queries can be converted into tsquery values. PostgreSQL also provides functions and operators that can be used to manipulate queries that are already in tsquery form.

Returns the AND-combination of the two given queries.

Returns the OR-combination of the two given queries.

Returns the negation (NOT) of the given query.

Returns a query that searches for a match to the first given query immediately followed by a match to the second given query, using the <-> (FOLLOWED BY) tsquery operator. For example:

Returns a query that searches for a match to the first given query followed by a match to the second given query at a distance of exactly distance lexemes, using the <N> tsquery operator. For example:

Returns the number of nodes (lexemes plus operators) in a tsquery. This function is useful to determine if the query is meaningful (returns > 0), or contains only stop words (returns 0). Examples:

Returns the portion of a tsquery that can be used for searching an index. This function is useful for detecting unindexable queries, for example those containing only stop words or only negated terms. For example:

The ts_rewrite family of functions search a given tsquery for occurrences of a target subquery, and replace each occurrence with a substitute subquery. In essence this operation is a tsquery-specific version of substring replacement. A target and substitute combination can be thought of as a query rewrite rule. A collection of such rewrite rules can be a powerful search aid. For example, you can expand the search using synonyms (e.g., new york, big apple, nyc, gotham) or narrow the search to direct the user to some hot topic. There is some overlap in functionality between this feature and thesaurus dictionaries (Section 12.6.4). However, you can modify a set of rewrite rules on-the-fly without reindexing, whereas updating a thesaurus requires reindexing to be effective.

This form of ts_rewrite simply applies a single rewrite rule: target is replaced by substitute wherever it appears in query. For example:

This form of ts_rewrite accepts a starting query and an SQL select command, which is given as a text string. The select must yield two columns of tsquery type. For each row of the select result, occurrences of the first column value (the target) are replaced by the second column value (the substitute) within the current query value. For example:

Note that when multiple rewrite rules are applied in this way, the order of application can be important; so in practice you will want the source query to ORDER BY some ordering key.

Let's consider a real-life astronomical example. We'll expand query supernovae using table-driven rewriting rules:

We can change the rewriting rules just by updating the table:

Rewriting can be slow when there are many rewriting rules, since it checks every rule for a possible match. To filter out obvious non-candidate rules we can use the containment operators for the tsquery type. In the example below, we select only those rules which might match the original query:

The method described in this section has been obsoleted by the use of stored generated columns, as described in Section 12.2.2.

When using a separate column to store the tsvector representation of your documents, it is necessary to create a trigger to update the tsvector column when the document content columns change. Two built-in trigger functions are available for this, or you can write your own.

These trigger functions automatically compute a tsvector column from one or more textual columns, under the control of parameters specified in the CREATE TRIGGER command. An example of their use is:

Having created this trigger, any change in title or body will automatically be reflected into tsv, without the application having to worry about it.

The first trigger argument must be the name of the tsvector column to be updated. The second argument specifies the text search configuration to be used to perform the conversion. For tsvector_update_trigger, the configuration name is simply given as the second trigger argument. It must be schema-qualified as shown above, so that the trigger behavior will not change with changes in search_path. For tsvector_update_trigger_column, the second trigger argument is the name of another table column, which must be of type regconfig. This allows a per-row selection of configuration to be made. The remaining argument(s) are the names of textual columns (of type text, varchar, or char). These will be included in the document in the order given. NULL values will be skipped (but the other columns will still be indexed).

A limitation of these built-in triggers is that they treat all the input columns alike. To process columns differently — for example, to weight title differently from body — it is necessary to write a custom trigger. Here is an example using PL/pgSQL as the trigger language:

Keep in mind that it is important to specify the configuration name explicitly when creating tsvector values inside triggers, so that the column's contents will not be affected by changes to default_text_search_config. Failure to do this is likely to lead to problems such as search results changing after a dump and restore.

The function ts_stat is useful for checking your configuration and for finding stop-word candidates.

sqlquery is a text value containing an SQL query which must return a single tsvector column. ts_stat executes the query and returns statistics about each distinct lexeme (word) contained in the tsvector data. The columns returned are

word text — the value of a lexeme

ndoc integer — number of documents (tsvectors) the word occurred in

nentry integer — total number of occurrences of the word

If weights is supplied, only occurrences having one of those weights are counted.

For example, to find the ten most frequent words in a document collection:

The same, but counting only word occurrences with weight A or B:

**Examples:**

Example 1 (unknown):
```unknown
tsvector || tsvector
```

Example 2 (unknown):
```unknown
to_tsvector
```

Example 3 (unknown):
```unknown
to_tsvector
```

Example 4 (unknown):
```unknown
setweight(vector tsvector, weight "char") returns tsvector
```

---


---

## 12.5. Parsers #


**URL:** https://www.postgresql.org/docs/18/textsearch-parsers.html

**Contents:**
- 12.5. Parsers #
  - Note

Text search parsers are responsible for splitting raw document text into tokens and identifying each token's type, where the set of possible types is defined by the parser itself. Note that a parser does not modify the text at all — it simply identifies plausible word boundaries. Because of this limited scope, there is less need for application-specific custom parsers than there is for custom dictionaries. At present PostgreSQL provides just one built-in parser, which has been found to be useful for a wide range of applications.

The built-in parser is named pg_catalog.default. It recognizes 23 token types, shown in Table 12.1.

Table 12.1. Default Parser's Token Types

The parser's notion of a “letter” is determined by the database's locale setting, specifically lc_ctype. Words containing only the basic ASCII letters are reported as a separate token type, since it is sometimes useful to distinguish them. In most European languages, token types word and asciiword should be treated alike.

email does not support all valid email characters as defined by RFC 5322. Specifically, the only non-alphanumeric characters supported for email user names are period, dash, and underscore.

tag does not support all valid tag names as defined by W3C Recommendation, XML. Specifically, the only tag names supported are those starting with an ASCII letter, underscore, or colon, and containing only letters, digits, hyphens, underscores, periods, and colons. tag also includes XML comments starting with <!-- and ending with -->, and XML declarations (but note that this includes anything starting with <?x and ending with >).

It is possible for the parser to produce overlapping tokens from the same piece of text. As an example, a hyphenated word will be reported both as the entire word and as each component:

This behavior is desirable since it allows searches to work for both the whole compound word and for components. Here is another instructive example:

**Examples:**

Example 1 (unknown):
```unknown
pg_catalog.default
```

Example 2 (unknown):
```unknown
lógico-matemática
```

Example 3 (unknown):
```unknown
postgresql-beta1
```

Example 4 (unknown):
```unknown
hword_asciipart
```

---


---

