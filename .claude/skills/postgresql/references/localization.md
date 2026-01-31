# PostgreSQL - Localization

## Chapter 23. Localization


**URL:** https://www.postgresql.org/docs/18/charset.html

**Contents:**
- Chapter 23. Localization

This chapter describes the available localization features from the point of view of the administrator. PostgreSQL supports two localization facilities:

Using the locale features of the operating system to provide locale-specific collation order, number formatting, translated messages, and other aspects. This is covered in Section 23.1 and Section 23.2.

Providing a number of different character sets to support storing text in all kinds of languages, and providing character set translation between client and server. This is covered in Section 23.3.

---


---

## 23.1. Locale Support #


**URL:** https://www.postgresql.org/docs/18/locale.html

**Contents:**
- 23.1. Locale Support #
  - 23.1.1. Overview #
  - Note
  - 23.1.2. Behavior #
  - 23.1.3. Selecting Locales #
  - 23.1.4. Locale Providers #
  - Note
  - Note
  - 23.1.5. ICU Locales #
    - 23.1.5.1. ICU Locale Names #

Locale support refers to an application respecting cultural preferences regarding alphabets, sorting, number formatting, etc. PostgreSQL uses the standard ISO C and POSIX locale facilities provided by the server operating system. For additional information refer to the documentation of your system.

Locale support is automatically initialized when a database cluster is created using initdb. initdb will initialize the database cluster with the locale setting of its execution environment by default, so if your system is already set to use the locale that you want in your database cluster then there is nothing else you need to do. If you want to use a different locale (or you are not sure which locale your system is set to), you can instruct initdb exactly which locale to use by specifying the --locale option. For example:

This example for Unix systems sets the locale to Swedish (sv) as spoken in Sweden (SE). Other possibilities might include en_US (U.S. English) and fr_CA (French Canadian). If more than one character set can be used for a locale then the specifications can take the form language_territory.codeset. For example, fr_BE.UTF-8 represents the French language (fr) as spoken in Belgium (BE), with a UTF-8 character set encoding.

What locales are available on your system under what names depends on what was provided by the operating system vendor and what was installed. On most Unix systems, the command locale -a will provide a list of available locales. Windows uses more verbose locale names, such as German_Germany or Swedish_Sweden.1252, but the principles are the same.

Occasionally it is useful to mix rules from several locales, e.g., use English collation rules but Spanish messages. To support that, a set of locale subcategories exist that control only certain aspects of the localization rules:

The category names translate into names of initdb options to override the locale choice for a specific category. For instance, to set the locale to French Canadian, but use U.S. rules for formatting currency, use initdb --locale=fr_CA --lc-monetary=en_US.

If you want the system to behave as if it had no locale support, use the special locale name C, or equivalently POSIX.

Some locale categories must have their values fixed when the database is created. You can use different settings for different databases, but once a database is created, you cannot change them for that database anymore. LC_COLLATE and LC_CTYPE are these categories. They affect the sort order of indexes, so they must be kept fixed, or indexes on text columns would become corrupt. (But you can alleviate this restriction using collations, as discussed in Section 23.2.) The default values for these categories are determined when initdb is run, and those values are used when new databases are created, unless specified otherwise in the CREATE DATABASE command.

The other locale categories can be changed whenever desired by setting the server configuration parameters that have the same name as the locale categories (see Section 19.11.2 for details). The values that are chosen by initdb are actually only written into the configuration file postgresql.conf to serve as defaults when the server is started. If you remove these assignments from postgresql.conf then the server will inherit the settings from its execution environment.

Note that the locale behavior of the server is determined by the environment variables seen by the server, not by the environment of any client. Therefore, be careful to configure the correct locale settings before starting the server. A consequence of this is that if client and server are set up in different locales, messages might appear in different languages depending on where they originated.

When we speak of inheriting the locale from the execution environment, this means the following on most operating systems: For a given locale category, say the collation, the following environment variables are consulted in this order until one is found to be set: LC_ALL, LC_COLLATE (or the variable corresponding to the respective category), LANG. If none of these environment variables are set then the locale defaults to C.

Some message localization libraries also look at the environment variable LANGUAGE which overrides all other locale settings for the purpose of setting the language of messages. If in doubt, please refer to the documentation of your operating system, in particular the documentation about gettext.

To enable messages to be translated to the user's preferred language, NLS must have been selected at build time (configure --enable-nls). All other locale support is built in automatically.

The locale settings influence the following SQL features:

Sort order in queries using ORDER BY or the standard comparison operators on textual data

The upper, lower, and initcap functions

Pattern matching operators (LIKE, SIMILAR TO, and POSIX-style regular expressions); locales affect both case insensitive matching and the classification of characters by character-class regular expressions

The to_char family of functions

The ability to use indexes with LIKE clauses

The drawback of using locales other than C or POSIX in PostgreSQL is its performance impact. It slows character handling and prevents ordinary indexes from being used by LIKE. For this reason use locales only if you actually need them.

As a workaround to allow PostgreSQL to use indexes with LIKE clauses under a non-C locale, several custom operator classes exist. These allow the creation of an index that performs a strict character-by-character comparison, ignoring locale comparison rules. Refer to Section 11.10 for more information. Another approach is to create indexes using the C collation, as discussed in Section 23.2.

Locales can be selected in different scopes depending on requirements. The above overview showed how locales are specified using initdb to set the defaults for the entire cluster. The following list shows where locales can be selected. Each item provides the defaults for the subsequent items, and each lower item allows overriding the defaults on a finer granularity.

As explained above, the environment of the operating system provides the defaults for the locales of a newly initialized database cluster. In many cases, this is enough: if the operating system is configured for the desired language/territory, by default PostgreSQL will also behave according to that locale.

As shown above, command-line options for initdb specify the locale settings for a newly initialized database cluster. Use this if the operating system does not have the locale configuration you want for your database system.

A locale can be selected separately for each database. The SQL command CREATE DATABASE and its command-line equivalent createdb have options for that. Use this for example if a database cluster houses databases for multiple tenants with different requirements.

Locale settings can be made for individual table columns. This uses an SQL object called collation and is explained in Section 23.2. Use this for example to sort data in different languages or customize the sort order of a particular table.

Finally, locales can be selected for an individual query. Again, this uses SQL collation objects. This could be used to change the sort order based on run-time choices or for ad-hoc experimentation.

A locale provider specifies which library defines the locale behavior for collations and character classifications.

The commands and tools that select the locale settings, as described above, each have an option to select the locale provider. Here is an example to initialize a database cluster using the ICU provider:

See the description of the respective commands and programs for details. Note that you can mix locale providers at different granularities, for example use libc by default for the cluster but have one database that uses the icu provider, and then have collation objects using either provider within those databases.

Regardless of the locale provider, the operating system is still used to provide some locale-aware behavior, such as messages (see lc_messages).

The available locale providers are listed below:

The builtin provider uses built-in operations. Only the C, C.UTF-8, and PG_UNICODE_FAST locales are supported for this provider.

The C locale behavior is identical to the C locale in the libc provider. When using this locale, the behavior may depend on the database encoding.

The C.UTF-8 locale is available only for when the database encoding is UTF-8, and the behavior is based on Unicode. The collation uses the code point values only. The regular expression character classes are based on the "POSIX Compatible" semantics, and the case mapping is the "simple" variant.

The PG_UNICODE_FAST locale is available only when the database encoding is UTF-8, and the behavior is based on Unicode. The collation uses the code point values only. The regular expression character classes are based on the "Standard" semantics, and the case mapping is the "full" variant.

The icu provider uses the external ICU library. PostgreSQL must have been configured with support.

ICU provides collation and character classification behavior that is independent of the operating system and database encoding, which is preferable if you expect to transition to other platforms without any change in results. LC_COLLATE and LC_CTYPE can be set independently of the ICU locale.

For the ICU provider, results may depend on the version of the ICU library used, as it is updated to reflect changes in natural language over time.

The libc provider uses the operating system's C library. The collation and character classification behavior is controlled by the settings LC_COLLATE and LC_CTYPE, so they cannot be set independently.

The same locale name may have different behavior on different platforms when using the libc provider.

The ICU format for the locale name is a Language Tag.

When defining a new ICU collation object or database with ICU as the provider, the given locale name is transformed ("canonicalized") into a language tag if not already in that form. For instance,

If you see this notice, ensure that the provider and locale are the expected result. For consistent results when using the ICU provider, specify the canonical language tag instead of relying on the transformation.

A locale with no language name, or the special language name root, is transformed to have the language und ("undefined").

ICU can transform most libc locale names, as well as some other formats, into language tags for easier transition to ICU. If a libc locale name is used in ICU, it may not have precisely the same behavior as in libc.

If there is a problem interpreting the locale name, or if the locale name represents a language or region that ICU does not recognize, you will see the following warning:

icu_validation_level controls how the message is reported. Unless set to ERROR, the collation will still be created, but the behavior may not be what the user intended.

A language tag, defined in BCP 47, is a standardized identifier used to identify languages, regions, and other information about a locale.

Basic language tags are simply language-region; or even just language. The language is a language code (e.g. fr for French), and region is a region code (e.g. CA for Canada). Examples: ja-JP, de, or fr-CA.

Collation settings may be included in the language tag to customize collation behavior. ICU allows extensive customization, such as sensitivity (or insensitivity) to accents, case, and punctuation; treatment of digits within text; and many other options to satisfy a variety of uses.

To include this additional collation information in a language tag, append -u, which indicates there are additional collation settings, followed by one or more -key-value pairs. The key is the key for a collation setting and value is a valid value for that setting. For boolean settings, the -key may be specified without a corresponding -value, which implies a value of true.

For example, the language tag en-US-u-kn-ks-level2 means the locale with the English language in the US region, with collation settings kn set to true and ks set to level2. Those settings mean the collation will be case-insensitive and treat a sequence of digits as a single number:

See Section 23.2.3 for details and additional examples of using language tags with custom collation information for the locale.

If locale support doesn't work according to the explanation above, check that the locale support in your operating system is correctly configured. To check what locales are installed on your system, you can use the command locale -a if your operating system provides it.

Check that PostgreSQL is actually using the locale that you think it is. The LC_COLLATE and LC_CTYPE settings are determined when a database is created, and cannot be changed except by creating a new database. Other locale settings including LC_MESSAGES and LC_MONETARY are initially determined by the environment the server is started in, but can be changed on-the-fly. You can check the active locale settings using the SHOW command.

The directory src/test/locale in the source distribution contains a test suite for PostgreSQL's locale support.

Client applications that handle server-side errors by parsing the text of the error message will obviously have problems when the server's messages are in a different language. Authors of such applications are advised to make use of the error code scheme instead.

Maintaining catalogs of message translations requires the on-going efforts of many volunteers that want to see PostgreSQL speak their preferred language well. If messages in your language are currently not available or not fully translated, your assistance would be appreciated. If you want to help, refer to Chapter 56 or write to the developers' mailing list.

**Examples:**

Example 1 (unknown):
```unknown
initdb --locale=sv_SE
```

Example 2 (unknown):
```unknown
language_territory.codeset
```

Example 3 (unknown):
```unknown
fr_BE.UTF-8
```

Example 4 (unknown):
```unknown
German_Germany
```

---


---

## 23.3. Character Set Support #


**URL:** https://www.postgresql.org/docs/18/multibyte.html

**Contents:**
- 23.3. Character Set Support #
  - 23.3.1. Supported Character Sets #
  - 23.3.2. Setting the Character Set #
  - Important
  - 23.3.3. Automatic Character Set Conversion Between Server and Client #
  - 23.3.4. Available Character Set Conversions #
  - 23.3.5. Further Reading #

The character set support in PostgreSQL allows you to store text in a variety of character sets (also called encodings), including single-byte character sets such as the ISO 8859 series and multiple-byte character sets such as EUC (Extended Unix Code), UTF-8, and Mule internal code. All supported character sets can be used transparently by clients, but a few are not supported for use within the server (that is, as a server-side encoding). The default character set is selected while initializing your PostgreSQL database cluster using initdb. It can be overridden when you create a database, so you can have multiple databases each with a different character set.

An important restriction, however, is that each database's character set must be compatible with the database's LC_CTYPE (character classification) and LC_COLLATE (string sort order) locale settings. For C or POSIX locale, any character set is allowed, but for other libc-provided locales there is only one character set that will work correctly. (On Windows, however, UTF-8 encoding can be used with any locale.) If you have ICU support configured, ICU-provided locales can be used with most but not all server-side encodings.

Table 23.3 shows the character sets available for use in PostgreSQL.

Table 23.3. PostgreSQL Character Sets

Not all client APIs support all the listed character sets. For example, the PostgreSQL JDBC driver does not support MULE_INTERNAL, LATIN6, LATIN8, and LATIN10.

The SQL_ASCII setting behaves considerably differently from the other settings. When the server character set is SQL_ASCII, the server interprets byte values 0–127 according to the ASCII standard, while byte values 128–255 are taken as uninterpreted characters. No encoding conversion will be done when the setting is SQL_ASCII. Thus, this setting is not so much a declaration that a specific encoding is in use, as a declaration of ignorance about the encoding. In most cases, if you are working with any non-ASCII data, it is unwise to use the SQL_ASCII setting because PostgreSQL will be unable to help you by converting or validating non-ASCII characters.

initdb defines the default character set (encoding) for a PostgreSQL cluster. For example,

sets the default character set to EUC_JP (Extended Unix Code for Japanese). You can use --encoding instead of -E if you prefer longer option strings. If no -E or --encoding option is given, initdb attempts to determine the appropriate encoding to use based on the specified or default locale.

You can specify a non-default encoding at database creation time, provided that the encoding is compatible with the selected locale:

This will create a database named korean that uses the character set EUC_KR, and locale ko_KR. Another way to accomplish this is to use this SQL command:

Notice that the above commands specify copying the template0 database. When copying any other database, the encoding and locale settings cannot be changed from those of the source database, because that might result in corrupt data. For more information see Section 22.3.

The encoding for a database is stored in the system catalog pg_database. You can see it by using the psql -l option or the \l command.

On most modern operating systems, PostgreSQL can determine which character set is implied by the LC_CTYPE setting, and it will enforce that only the matching database encoding is used. On older systems it is your responsibility to ensure that you use the encoding expected by the locale you have selected. A mistake in this area is likely to lead to strange behavior of locale-dependent operations such as sorting.

PostgreSQL will allow superusers to create databases with SQL_ASCII encoding even when LC_CTYPE is not C or POSIX. As noted above, SQL_ASCII does not enforce that the data stored in the database has any particular encoding, and so this choice poses risks of locale-dependent misbehavior. Using this combination of settings is deprecated and may someday be forbidden altogether.

PostgreSQL supports automatic character set conversion between server and client for many combinations of character sets (Section 23.3.4 shows which ones).

To enable automatic character set conversion, you have to tell PostgreSQL the character set (encoding) you would like to use in the client. There are several ways to accomplish this:

Using the \encoding command in psql. \encoding allows you to change client encoding on the fly. For example, to change the encoding to SJIS, type:

libpq (Section 32.11) has functions to control the client encoding.

Using SET client_encoding TO. Setting the client encoding can be done with this SQL command:

Also you can use the standard SQL syntax SET NAMES for this purpose:

To query the current client encoding:

To return to the default encoding:

Using PGCLIENTENCODING. If the environment variable PGCLIENTENCODING is defined in the client's environment, that client encoding is automatically selected when a connection to the server is made. (This can subsequently be overridden using any of the other methods mentioned above.)

Using the configuration variable client_encoding. If the client_encoding variable is set, that client encoding is automatically selected when a connection to the server is made. (This can subsequently be overridden using any of the other methods mentioned above.)

If the conversion of a particular character is not possible — suppose you chose EUC_JP for the server and LATIN1 for the client, and some Japanese characters are returned that do not have a representation in LATIN1 — an error is reported.

If the client character set is defined as SQL_ASCII, encoding conversion is disabled, regardless of the server's character set. (However, if the server's character set is not SQL_ASCII, the server will still check that incoming data is valid for that encoding; so the net effect is as though the client character set were the same as the server's.) Just as for the server, use of SQL_ASCII is unwise unless you are working with all-ASCII data.

PostgreSQL allows conversion between any two character sets for which a conversion function is listed in the pg_conversion system catalog. PostgreSQL comes with some predefined conversions, as summarized in Table 23.4 and shown in more detail in Table 23.5. You can create a new conversion using the SQL command CREATE CONVERSION. (To be used for automatic client/server conversions, a conversion must be marked as “default” for its character set pair.)

Table 23.4. Built-in Client/Server Character Set Conversions

Table 23.5. All Built-in Character Set Conversions

[a] The conversion names follow a standard naming scheme: The official name of the source encoding with all non-alphanumeric characters replaced by underscores, followed by _to_, followed by the similarly processed destination encoding name. Therefore, these names sometimes deviate from the customary encoding names shown in Table 23.3.

These are good sources to start learning about various kinds of encoding systems.

Contains detailed explanations of EUC_JP, EUC_CN, EUC_KR, EUC_TW.

The web site of the Unicode Consortium.

UTF-8 (8-bit UCS/Unicode Transformation Format) is defined here.

**Examples:**

Example 1 (unknown):
```unknown
EUC_JIS_2004
```

Example 2 (unknown):
```unknown
MULE_INTERNAL
```

Example 3 (unknown):
```unknown
SHIFT_JIS_2004
```

Example 4 (unknown):
```unknown
MULE_INTERNAL
```

---


---

