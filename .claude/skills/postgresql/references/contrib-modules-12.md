# PostgreSQL - Contrib Modules (Part 12)

## F.42. sslinfo — obtain client SSL information #


**URL:** https://www.postgresql.org/docs/18/sslinfo.html

**Contents:**
- F.42. sslinfo — obtain client SSL information #
  - F.42.1. Functions Provided #
  - F.42.2. Author #

The sslinfo module provides information about the SSL certificate that the current client provided when connecting to PostgreSQL. The module is useless (most functions will return NULL) if the current connection does not use SSL.

Some of the information available through this module can also be obtained using the built-in system view pg_stat_ssl.

This extension won't build at all unless the installation was configured with --with-ssl=openssl.

Returns true if current connection to server uses SSL, and false otherwise.

Returns the name of the protocol used for the SSL connection (e.g., TLSv1.0, TLSv1.1, TLSv1.2 or TLSv1.3).

Returns the name of the cipher used for the SSL connection (e.g., DHE-RSA-AES256-SHA).

Returns true if current client has presented a valid SSL client certificate to the server, and false otherwise. (The server might or might not be configured to require a client certificate.)

Returns serial number of current client certificate. The combination of certificate serial number and certificate issuer is guaranteed to uniquely identify a certificate (but not its owner — the owner ought to regularly change their keys, and get new certificates from the issuer).

So, if you run your own CA and allow only certificates from this CA to be accepted by the server, the serial number is the most reliable (albeit not very mnemonic) means to identify a user.

Returns the full subject of the current client certificate, converting character data into the current database encoding. It is assumed that if you use non-ASCII characters in the certificate names, your database is able to represent these characters, too. If your database uses the SQL_ASCII encoding, non-ASCII characters in the name will be represented as UTF-8 sequences.

The result looks like /CN=Somebody /C=Some country/O=Some organization.

Returns the full issuer name of the current client certificate, converting character data into the current database encoding. Encoding conversions are handled the same as for ssl_client_dn.

The combination of the return value of this function with the certificate serial number uniquely identifies the certificate.

This function is really useful only if you have more than one trusted CA certificate in your server's certificate authority file, or if this CA has issued some intermediate certificate authority certificates.

This function returns the value of the specified field in the certificate subject, or NULL if the field is not present. Field names are string constants that are converted into ASN1 object identifiers using the OpenSSL object database. The following values are acceptable:

All of these fields are optional, except commonName. It depends entirely on your CA's policy which of them would be included and which wouldn't. The meaning of these fields, however, is strictly defined by the X.500 and X.509 standards, so you cannot just assign arbitrary meaning to them.

Same as ssl_client_dn_field, but for the certificate issuer rather than the certificate subject.

Provide information about extensions of client certificate: extension name, extension value, and if it is a critical extension.

Victor Wagner <vitus@cryptocom.ru>, Cryptocom LTD

Dmitry Voronin <carriingfate92@yandex.ru>

E-Mail of Cryptocom OpenSSL development group: <openssl@cryptocom.ru>

**Examples:**

Example 1 (unknown):
```unknown
pg_stat_ssl
```

Example 2 (unknown):
```unknown
--with-ssl=openssl
```

Example 3 (unknown):
```unknown
ssl_is_used() returns boolean
```

Example 4 (unknown):
```unknown
ssl_version() returns text
```

---


---

## F.25. pg_buffercache — inspect PostgreSQL buffer cache state #


**URL:** https://www.postgresql.org/docs/18/pgbuffercache.html

**Contents:**
- F.25. pg_buffercache — inspect PostgreSQL buffer cache state #
  - F.25.1. The pg_buffercache View #
  - F.25.2. The pg_buffercache_numa View #
  - Warning
  - F.25.3. The pg_buffercache_summary() Function #
  - F.25.4. The pg_buffercache_usage_counts() Function #
  - F.25.5. The pg_buffercache_evict() Function #
  - F.25.6. The pg_buffercache_evict_relation() Function #
  - F.25.7. The pg_buffercache_evict_all() Function #
  - F.25.8. Sample Output #

The pg_buffercache module provides a means for examining what's happening in the shared buffer cache in real time. It also offers a low-level way to evict data from it, for testing purposes.

This module provides the pg_buffercache_pages() function (wrapped in the pg_buffercache view), the pg_buffercache_numa_pages() function (wrapped in the pg_buffercache_numa view), the pg_buffercache_summary() function, the pg_buffercache_usage_counts() function, the pg_buffercache_evict() function, the pg_buffercache_evict_relation() function and the pg_buffercache_evict_all() function.

The pg_buffercache_pages() function returns a set of records, each row describing the state of one shared buffer entry. The pg_buffercache view wraps the function for convenient use.

The pg_buffercache_numa_pages() function provides NUMA node mappings for shared buffer entries. This information is not part of pg_buffercache_pages() itself, as it is much slower to retrieve. The pg_buffercache_numa view wraps the function for convenient use.

The pg_buffercache_summary() function returns a single row summarizing the state of the shared buffer cache.

The pg_buffercache_usage_counts() function returns a set of records, each row describing the number of buffers with a given usage count.

By default, use of the above functions is restricted to superusers and roles with privileges of the pg_monitor role. Access may be granted to others using GRANT.

The pg_buffercache_evict() function allows a block to be evicted from the buffer pool given a buffer identifier. Use of this function is restricted to superusers only.

The pg_buffercache_evict_relation() function allows all unpinned shared buffers in the relation to be evicted from the buffer pool given a relation identifier. Use of this function is restricted to superusers only.

The pg_buffercache_evict_all() function allows all unpinned shared buffers to be evicted in the buffer pool. Use of this function is restricted to superusers only.

The definitions of the columns exposed by the view are shown in Table F.14.

Table F.14. pg_buffercache Columns

ID, in the range 1..shared_buffers

relfilenode oid (references pg_class.relfilenode)

Filenode number of the relation

reltablespace oid (references pg_tablespace.oid)

Tablespace OID of the relation

reldatabase oid (references pg_database.oid)

Database OID of the relation

relforknumber smallint

Fork number within the relation; see common/relpath.h

relblocknumber bigint

Page number within the relation

Clock-sweep access count

pinning_backends integer

Number of backends pinning this buffer

There is one row for each buffer in the shared cache. Unused buffers are shown with all fields null except bufferid. Shared system catalogs are shown as belonging to database zero.

Because the cache is shared by all the databases, there will normally be pages from relations not belonging to the current database. This means that there may not be matching join rows in pg_class for some rows, or that there could even be incorrect joins. If you are trying to join against pg_class, it's a good idea to restrict the join to rows having reldatabase equal to the current database's OID or zero.

Since buffer manager locks are not taken to copy the buffer state data that the view will display, accessing pg_buffercache view has less impact on normal buffer activity but it doesn't provide a consistent set of results across all buffers. However, we ensure that the information of each buffer is self-consistent.

The definitions of the columns exposed by the view are shown in Table F.15.

Table F.15. pg_buffercache_numa Columns

ID, in the range 1..shared_buffers

number of OS memory page for this buffer

As NUMA node ID inquiry for each page requires memory pages to be paged-in, the first execution of this function can take a noticeable amount of time. In all the cases (first execution or not), retrieving this information is costly and querying the view at a high frequency is not recommended.

When determining the NUMA node, the view touches all memory pages for the shared memory segment. This will force allocation of the shared memory, if it wasn't allocated already, and the memory may get allocated in a single NUMA node (depending on system configuration).

The definitions of the columns exposed by the function are shown in Table F.16.

Table F.16. pg_buffercache_summary() Output Columns

Number of used shared buffers

Number of unused shared buffers

Number of dirty shared buffers

Number of pinned shared buffers

usagecount_avg float8

Average usage count of used shared buffers

The pg_buffercache_summary() function returns a single row summarizing the state of all shared buffers. Similar and more detailed information is provided by the pg_buffercache view, but pg_buffercache_summary() is significantly cheaper.

Like the pg_buffercache view, pg_buffercache_summary() does not acquire buffer manager locks. Therefore concurrent activity can lead to minor inaccuracies in the result.

The definitions of the columns exposed by the function are shown in Table F.17.

Table F.17. pg_buffercache_usage_counts() Output Columns

A possible buffer usage count

Number of buffers with the usage count

Number of dirty buffers with the usage count

Number of pinned buffers with the usage count

The pg_buffercache_usage_counts() function returns a set of rows summarizing the states of all shared buffers, aggregated over the possible usage count values. Similar and more detailed information is provided by the pg_buffercache view, but pg_buffercache_usage_counts() is significantly cheaper.

Like the pg_buffercache view, pg_buffercache_usage_counts() does not acquire buffer manager locks. Therefore concurrent activity can lead to minor inaccuracies in the result.

The pg_buffercache_evict() function takes a buffer identifier, as shown in the bufferid column of the pg_buffercache view. It returns information about whether the buffer was evicted and flushed. The buffer_evicted column is true on success, and false if the buffer wasn't valid, if it couldn't be evicted because it was pinned, or if it became dirty again after an attempt to write it out. The buffer_flushed column is true if the buffer was flushed. This does not necessarily mean that buffer was flushed by us, it might be flushed by someone else. The result is immediately out of date upon return, as the buffer might become valid again at any time due to concurrent activity. The function is intended for developer testing only.

The pg_buffercache_evict_relation() function is very similar to the pg_buffercache_evict() function. The difference is that the pg_buffercache_evict_relation() takes a relation identifier instead of buffer identifier. It tries to evict all buffers for all forks in that relation. It returns the number of evicted buffers, flushed buffers and the number of buffers that could not be evicted. Flushed buffers haven't necessarily been flushed by us, they might have been flushed by someone else. The result is immediately out of date upon return, as buffers might immediately be read back in due to concurrent activity. The function is intended for developer testing only.

The pg_buffercache_evict_all() function is very similar to the pg_buffercache_evict() function. The difference is, the pg_buffercache_evict_all() function does not take an argument; instead it tries to evict all buffers in the buffer pool. It returns the number of evicted buffers, flushed buffers and the number of buffers that could not be evicted. Flushed buffers haven't necessarily been flushed by us, they might have been flushed by someone else. The result is immediately out of date upon return, as buffers might immediately be read back in due to concurrent activity. The function is intended for developer testing only.

Mark Kirkwood <markir@paradise.net.nz>

Design suggestions: Neil Conway <neilc@samurai.com>

Debugging advice: Tom Lane <tgl@sss.pgh.pa.us>

**Examples:**

Example 1 (unknown):
```unknown
pg_buffercache
```

Example 2 (unknown):
```unknown
pg_buffercache_numa
```

Example 3 (unknown):
```unknown
pg_buffercache_summary()
```

Example 4 (unknown):
```unknown
pg_buffercache_usage_counts()
```

---


---

## F.50. xml2 — XPath querying and XSLT functionality #


**URL:** https://www.postgresql.org/docs/18/xml2.html

**Contents:**
- F.50. xml2 — XPath querying and XSLT functionality #
  - F.50.1. Deprecation Notice #
  - F.50.2. Description of Functions #
  - F.50.3. xpath_table #
    - F.50.3.1. Multivalued Results #
  - F.50.4. XSLT Functions #
    - F.50.4.1. xslt_process #
  - F.50.5. Author #

The xml2 module provides XPath querying and XSLT functionality.

From PostgreSQL 8.3 on, there is XML-related functionality based on the SQL/XML standard in the core server. That functionality covers XML syntax checking and XPath queries, which is what this module does, and more, but the API is not at all compatible. It is planned that this module will be removed in a future version of PostgreSQL in favor of the newer standard API, so you are encouraged to try converting your applications. If you find that some of the functionality of this module is not available in an adequate form with the newer API, please explain your issue to <pgsql-hackers@lists.postgresql.org> so that the deficiency can be addressed.

Table F.37 shows the functions provided by this module. These functions provide straightforward XML parsing and XPath queries.

Table F.37. xml2 Functions

xml_valid ( document text ) → boolean

Parses the given document and returns true if the document is well-formed XML. (Note: this is an alias for the standard PostgreSQL function xml_is_well_formed(). The name xml_valid() is technically incorrect since validity and well-formedness have different meanings in XML.)

xpath_string ( document text, query text ) → text

Evaluates the XPath query on the supplied document, and casts the result to text.

xpath_number ( document text, query text ) → real

Evaluates the XPath query on the supplied document, and casts the result to real.

xpath_bool ( document text, query text ) → boolean

Evaluates the XPath query on the supplied document, and casts the result to boolean.

xpath_nodeset ( document text, query text, toptag text, itemtag text ) → text

Evaluates the query on the document and wraps the result in XML tags. If the result is multivalued, the output will look like:

If either toptag or itemtag is an empty string, the relevant tag is omitted.

xpath_nodeset ( document text, query text, itemtag text ) → text

Like xpath_nodeset(document, query, toptag, itemtag) but result omits toptag.

xpath_nodeset ( document text, query text ) → text

Like xpath_nodeset(document, query, toptag, itemtag) but result omits both tags.

xpath_list ( document text, query text, separator text ) → text

Evaluates the query on the document and returns multiple values separated by the specified separator, for example Value 1,Value 2,Value 3 if separator is ,.

xpath_list ( document text, query text ) → text

This is a wrapper for the above function that uses , as the separator.

xpath_table is a table function that evaluates a set of XPath queries on each of a set of documents and returns the results as a table. The primary key field from the original document table is returned as the first column of the result so that the result set can readily be used in joins. The parameters are described in Table F.38.

Table F.38. xpath_table Parameters

the name of the “key” field — this is just a field to be used as the first column of the output table, i.e., it identifies the record from which each output row came (see note below about multiple values)

the name of the field containing the XML document

the name of the table or view containing the documents

one or more XPath expressions, separated by |

the contents of the WHERE clause. This cannot be omitted, so use true or 1=1 if you want to process all the rows in the relation

These parameters (except the XPath strings) are just substituted into a plain SQL SELECT statement, so you have some flexibility — the statement is

SELECT <key>, <document> FROM <relation> WHERE <criteria>

so those parameters can be anything valid in those particular locations. The result from this SELECT needs to return exactly two columns (which it will unless you try to list multiple fields for key or document). Beware that this simplistic approach requires that you validate any user-supplied values to avoid SQL injection attacks.

The function has to be used in a FROM expression, with an AS clause to specify the output columns; for example

The AS clause defines the names and types of the columns in the output table. The first is the “key” field and the rest correspond to the XPath queries. If there are more XPath queries than result columns, the extra queries will be ignored. If there are more result columns than XPath queries, the extra columns will be NULL.

Notice that this example defines the page_count result column as an integer. The function deals internally with string representations, so when you say you want an integer in the output, it will take the string representation of the XPath result and use PostgreSQL input functions to transform it into an integer (or whatever type the AS clause requests). An error will result if it can't do this — for example if the result is empty — so you may wish to just stick to text as the column type if you think your data has any problems.

The calling SELECT statement doesn't necessarily have to be just SELECT * — it can reference the output columns by name or join them to other tables. The function produces a virtual table with which you can perform any operation you wish (e.g., aggregation, joining, sorting etc.). So we could also have:

as a more complicated example. Of course, you could wrap all of this in a view for convenience.

The xpath_table function assumes that the results of each XPath query might be multivalued, so the number of rows returned by the function may not be the same as the number of input documents. The first row returned contains the first result from each query, the second row the second result from each query. If one of the queries has fewer values than the others, null values will be returned instead.

In some cases, a user will know that a given XPath query will return only a single result (perhaps a unique document identifier) — if used alongside an XPath query returning multiple results, the single-valued result will appear only on the first row of the result. The solution to this is to use the key field as part of a join against a simpler XPath query. As an example:

To get doc_num on every line, the solution is to use two invocations of xpath_table and join the results:

The following functions are available if libxslt is installed:

This function applies the XSL stylesheet to the document and returns the transformed result. The paramlist is a list of parameter assignments to be used in the transformation, specified in the form a=1,b=2. Note that the parameter parsing is very simple-minded: parameter values cannot contain commas!

There is also a two-parameter version of xslt_process which does not pass any parameters to the transformation.

John Gray <jgray@azuli.co.uk>

Development of this module was sponsored by Torchbox Ltd. (www.torchbox.com). It has the same BSD license as PostgreSQL.

**Examples:**

Example 1 (unknown):
```unknown
xpath_table
```

Example 2 (python):
```python
<pgsql-hackers@lists.postgresql.org>
```

Example 3 (unknown):
```unknown
xml_is_well_formed()
```

Example 4 (unknown):
```unknown
xml_valid()
```

---


---

