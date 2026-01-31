# PostgreSQL - Protocol (Part 3)

## 54.5. Logical Streaming Replication Protocol #


**URL:** https://www.postgresql.org/docs/18/protocol-logical-replication.html

**Contents:**
- 54.5. Logical Streaming Replication Protocol #
  - 54.5.1. Logical Streaming Replication Parameters #
  - 54.5.2. Logical Replication Protocol Messages #
  - 54.5.3. Logical Replication Protocol Message Flow #

This section describes the logical replication protocol, which is the message flow started by the START_REPLICATION SLOT slot_name LOGICAL replication command.

The logical streaming replication protocol builds on the primitives of the physical streaming replication protocol.

PostgreSQL logical decoding supports output plugins. pgoutput is the standard one used for the built-in logical replication.

Using the START_REPLICATION command, pgoutput accepts the following options:

Protocol version. Currently versions 1, 2, 3, and 4 are supported. A valid version is required.

Version 2 is supported only for server version 14 and above, and it allows streaming of large in-progress transactions.

Version 3 is supported only for server version 15 and above, and it allows streaming of two-phase commits.

Version 4 is supported only for server version 16 and above, and it allows streams of large in-progress transactions to be applied in parallel.

Comma-separated list of publication names for which to subscribe (receive changes). The individual publication names are treated as standard objects names and can be quoted the same as needed. At least one publication name is required.

Boolean option to use binary transfer mode. Binary mode is faster than the text mode but slightly less robust.

Boolean option to enable sending the messages that are written by pg_logical_emit_message.

Option to enable streaming of in-progress transactions. Valid values are off (the default), on and parallel. The setting parallel enables sending extra information with some messages to be used for parallelization. Minimum protocol version 2 is required to turn it on. Minimum protocol version 4 is required for the parallel value.

Boolean option to enable two-phase transactions. Minimum protocol version 3 is required to turn it on.

Option to send changes by their origin. Possible values are none to only send the changes that have no origin associated, or any to send the changes regardless of their origin. This can be used to avoid loops (infinite replication of the same data) among replication nodes.

The individual protocol messages are discussed in the following subsections. Individual messages are described in Section 54.9.

All top-level protocol messages begin with a message type byte. While represented in code as a character, this is a signed byte with no associated encoding.

Since the streaming replication protocol supplies a message length there is no need for top-level protocol messages to embed a length in their header.

With the exception of the START_REPLICATION command and the replay progress messages, all information flows only from the backend to the frontend.

The logical replication protocol sends individual transactions one by one. This means that all messages between a pair of Begin and Commit messages belong to the same transaction. Similarly, all messages between a pair of Begin Prepare and Prepare messages belong to the same transaction. It also sends changes of large in-progress transactions between a pair of Stream Start and Stream Stop messages. The last stream of such a transaction contains a Stream Commit or Stream Abort message.

Every sent transaction contains zero or more DML messages (Insert, Update, Delete). In case of a cascaded setup it can also contain Origin messages. The origin message indicates that the transaction originated on different replication node. Since a replication node in the scope of logical replication protocol can be pretty much anything, the only identifier is the origin name. It's downstream's responsibility to handle this as needed (if needed). The Origin message is always sent before any DML messages in the transaction.

Every DML message contains a relation OID, identifying the publisher's relation that was acted on. Before the first DML message for a given relation OID, a Relation message will be sent, describing the schema of that relation. Subsequently, a new Relation message will be sent if the relation's definition has changed since the last Relation message was sent for it. (The protocol assumes that the client is capable of remembering this metadata for as many relations as needed.)

Relation messages identify column types by their OIDs. In the case of a built-in type, it is assumed that the client can look up that type OID locally, so no additional data is needed. For a non-built-in type OID, a Type message will be sent before the Relation message, to provide the type name associated with that OID. Thus, a client that needs to specifically identify the types of relation columns should cache the contents of Type messages, and first consult that cache to see if the type OID is defined there. If not, look up the type OID locally.

**Examples:**

Example 1 (unknown):
```unknown
START_REPLICATION
```

Example 2 (unknown):
```unknown
START_REPLICATION
```

Example 3 (unknown):
```unknown
pg_logical_emit_message
```

Example 4 (unknown):
```unknown
START_REPLICATION
```

---


---

## 55.3. Error Message Style Guide #


**URL:** https://www.postgresql.org/docs/18/error-style-guide.html

**Contents:**
- 55.3. Error Message Style Guide #
  - What Goes Where #
  - Formatting #
  - Quotation Marks #
  - Use of Quotes #
  - Grammar and Punctuation #
  - Upper Case vs. Lower Case #
  - Avoid Passive Voice #
  - Present vs. Past Tense #
  - Type of the Object #

This style guide is offered in the hope of maintaining a consistent, user-friendly style throughout all the messages generated by PostgreSQL.

The primary message should be short, factual, and avoid reference to implementation details such as specific function names. “Short” means “should fit on one line under normal conditions”. Use a detail message if needed to keep the primary message short, or if you feel a need to mention implementation details such as the particular system call that failed. Both primary and detail messages should be factual. Use a hint message for suggestions about what to do to fix the problem, especially if the suggestion might not always be applicable.

For example, instead of:

Rationale: keeping the primary message short helps keep it to the point, and lets clients lay out screen space on the assumption that one line is enough for error messages. Detail and hint messages can be relegated to a verbose mode, or perhaps a pop-up error-details window. Also, details and hints would normally be suppressed from the server log to save space. Reference to implementation details is best avoided since users aren't expected to know the details.

Don't put any specific assumptions about formatting into the message texts. Expect clients and the server log to wrap lines to fit their own needs. In long messages, newline characters (\n) can be used to indicate suggested paragraph breaks. Don't end a message with a newline. Don't use tabs or other formatting characters. (In error context displays, newlines are automatically added to separate levels of context such as function calls.)

Rationale: Messages are not necessarily displayed on terminal-type displays. In GUI displays or browsers these formatting instructions are at best ignored.

English text should use double quotes when quoting is appropriate. Text in other languages should consistently use one kind of quotes that is consistent with publishing customs and computer output of other programs.

Rationale: The choice of double quotes over single quotes is somewhat arbitrary, but tends to be the preferred use. Some have suggested choosing the kind of quotes depending on the type of object according to SQL conventions (namely, strings single quoted, identifiers double quoted). But this is a language-internal technical issue that many users aren't even familiar with, it won't scale to other kinds of quoted terms, it doesn't translate to other languages, and it's pretty pointless, too.

Always use quotes to delimit file names, user-supplied identifiers, configuration variable names, and other variables that might contain words. Do not use them to mark up variables that will not contain words (for example, operator names).

There are functions in the backend that will double-quote their own output as needed (for example, format_type_be()). Do not put additional quotes around the output of such functions.

Rationale: Objects can have names that create ambiguity when embedded in a message. Be consistent about denoting where a plugged-in name starts and ends. But don't clutter messages with unnecessary or duplicate quote marks.

The rules are different for primary error messages and for detail/hint messages:

Primary error messages: Do not capitalize the first letter. Do not end a message with a period. Do not even think about ending a message with an exclamation point.

Detail and hint messages: Use complete sentences, and end each with a period. Capitalize the first word of sentences. Put two spaces after the period if another sentence follows (for English text; might be inappropriate in other languages).

Error context strings: Do not capitalize the first letter and do not end the string with a period. Context strings should normally not be complete sentences.

Rationale: Avoiding punctuation makes it easier for client applications to embed the message into a variety of grammatical contexts. Often, primary messages are not grammatically complete sentences anyway. (And if they're long enough to be more than one sentence, they should be split into primary and detail parts.) However, detail and hint messages are longer and might need to include multiple sentences. For consistency, they should follow complete-sentence style even when there's only one sentence.

Use lower case for message wording, including the first letter of a primary error message. Use upper case for SQL commands and key words if they appear in the message.

Rationale: It's easier to make everything look more consistent this way, since some messages are complete sentences and some not.

Use the active voice. Use complete sentences when there is an acting subject (“A could not do B”). Use telegram style without subject if the subject would be the program itself; do not use “I” for the program.

Rationale: The program is not human. Don't pretend otherwise.

Use past tense if an attempt to do something failed, but could perhaps succeed next time (perhaps after fixing some problem). Use present tense if the failure is certainly permanent.

There is a nontrivial semantic difference between sentences of the form:

The first one means that the attempt to open the file failed. The message should give a reason, such as “disk full” or “file doesn't exist”. The past tense is appropriate because next time the disk might not be full anymore or the file in question might exist.

The second form indicates that the functionality of opening the named file does not exist at all in the program, or that it's conceptually impossible. The present tense is appropriate because the condition will persist indefinitely.

Rationale: Granted, the average user will not be able to draw great conclusions merely from the tense of the message, but since the language provides us with a grammar we should use it correctly.

When citing the name of an object, state what kind of object it is.

Rationale: Otherwise no one will know what “foo.bar.baz” refers to.

Square brackets are only to be used (1) in command synopses to denote optional arguments, or (2) to denote an array subscript.

Rationale: Anything else does not correspond to widely-known customary usage and will confuse people.

When a message includes text that is generated elsewhere, embed it in this style:

Rationale: It would be difficult to account for all possible error codes to paste this into a single smooth sentence, so some sort of punctuation is needed. Putting the embedded text in parentheses has also been suggested, but it's unnatural if the embedded text is likely to be the most important part of the message, as is often the case.

Messages should always state the reason why an error occurred. For example:

If no reason is known you better fix the code.

Don't include the name of the reporting routine in the error text. We have other mechanisms for finding that out when needed, and for most users it's not helpful information. If the error text doesn't make as much sense without the function name, reword it.

Avoid mentioning called function names, either; instead say what the code was trying to do:

If it really seems necessary, mention the system call in the detail message. (In some cases, providing the actual values passed to the system call might be appropriate information for the detail message.)

Rationale: Users don't know what all those functions do.

Unable. “Unable” is nearly the passive voice. Better use “cannot” or “could not”, as appropriate.

Bad. Error messages like “bad result” are really hard to interpret intelligently. It's better to write why the result is “bad”, e.g., “invalid format”.

Illegal. “Illegal” stands for a violation of the law, the rest is “invalid”. Better yet, say why it's invalid.

Unknown. Try to avoid “unknown”. Consider “error: unknown response”. If you don't know what the response is, how do you know it's erroneous? “Unrecognized” is often a better choice. Also, be sure to include the value being complained of.

Find vs. Exists. If the program uses a nontrivial algorithm to locate a resource (e.g., a path search) and that algorithm fails, it is fair to say that the program couldn't “find” the resource. If, on the other hand, the expected location of the resource is known but the program cannot access it there then say that the resource doesn't “exist”. Using “find” in this case sounds weak and confuses the issue.

May vs. Can vs. Might. “May” suggests permission (e.g., "You may borrow my rake."), and has little use in documentation or error messages. “Can” suggests ability (e.g., "I can lift that log."), and “might” suggests possibility (e.g., "It might rain today."). Using the proper word clarifies meaning and assists translation.

Contractions. Avoid contractions, like “can't”; use “cannot” instead.

Non-negative. Avoid “non-negative” as it is ambiguous about whether it accepts zero. It's better to use “greater than zero” or “greater than or equal to zero”.

Spell out words in full. For instance, avoid:

Rationale: This will improve consistency.

Keep in mind that error message texts need to be translated into other languages. Follow the guidelines in Section 56.2.2 to avoid making life difficult for translators.

**Examples:**

Example 1 (yaml):
```yaml
IpcMemoryCreate: shmget(key=%d, size=%u, 0%o) failed: %m
(plus a long addendum that is basically a hint)
```

Example 2 (yaml):
```yaml
Primary:    could not create shared memory segment: %m
Detail:     Failed syscall was shmget(key=%d, size=%u, 0%o).
Hint:       The addendum, written as a complete sentence.
```

Example 3 (unknown):
```unknown
format_type_be()
```

Example 4 (unknown):
```unknown
could not open file "%s": %m
```

---


---

## 55.2. Reporting Errors Within the Server #


**URL:** https://www.postgresql.org/docs/18/error-message-reporting.html

**Contents:**
- 55.2. Reporting Errors Within the Server #
  - Note

Error, warning, and log messages generated within the server code should be created using ereport, or its older cousin elog. The use of this function is complex enough to require some explanation.

There are two required elements for every message: a severity level (ranging from DEBUG to PANIC, defined in src/include/utils/elog.h) and a primary message text. In addition there are optional elements, the most common of which is an error identifier code that follows the SQL spec's SQLSTATE conventions. ereport itself is just a shell macro that exists mainly for the syntactic convenience of making message generation look like a single function call in the C source code. The only parameter accepted directly by ereport is the severity level. The primary message text and any optional message elements are generated by calling auxiliary functions, such as errmsg, within the ereport call.

A typical call to ereport might look like this:

This specifies error severity level ERROR (a run-of-the-mill error). The errcode call specifies the SQLSTATE error code using a macro defined in src/include/utils/errcodes.h. The errmsg call provides the primary message text.

You will also frequently see this older style, with an extra set of parentheses surrounding the auxiliary function calls:

The extra parentheses were required before PostgreSQL version 12, but are now optional.

Here is a more complex example:

This illustrates the use of format codes to embed run-time values into a message text. Also, an optional “hint” message is provided. The auxiliary function calls can be written in any order, but conventionally errcode and errmsg appear first.

If the severity level is ERROR or higher, ereport aborts execution of the current query and does not return to the caller. If the severity level is lower than ERROR, ereport returns normally.

The available auxiliary routines for ereport are:

errcode(sqlerrcode) specifies the SQLSTATE error identifier code for the condition. If this routine is not called, the error identifier defaults to ERRCODE_INTERNAL_ERROR when the error severity level is ERROR or higher, ERRCODE_WARNING when the error level is WARNING, otherwise (for NOTICE and below) ERRCODE_SUCCESSFUL_COMPLETION. While these defaults are often convenient, always think whether they are appropriate before omitting the errcode() call.

errmsg(const char *msg, ...) specifies the primary error message text, and possibly run-time values to insert into it. Insertions are specified by sprintf-style format codes. In addition to the standard format codes accepted by sprintf, the format code %m can be used to insert the error message returned by strerror for the current value of errno. [18] %m does not require any corresponding entry in the parameter list for errmsg. Note that the message string will be run through gettext for possible localization before format codes are processed.

errmsg_internal(const char *msg, ...) is the same as errmsg, except that the message string will not be translated nor included in the internationalization message dictionary. This should be used for “cannot happen” cases that are probably not worth expending translation effort on.

errmsg_plural(const char *fmt_singular, const char *fmt_plural, unsigned long n, ...) is like errmsg, but with support for various plural forms of the message. fmt_singular is the English singular format, fmt_plural is the English plural format, n is the integer value that determines which plural form is needed, and the remaining arguments are formatted according to the selected format string. For more information see Section 56.2.2.

errdetail(const char *msg, ...) supplies an optional “detail” message; this is to be used when there is additional information that seems inappropriate to put in the primary message. The message string is processed in just the same way as for errmsg.

errdetail_internal(const char *msg, ...) is the same as errdetail, except that the message string will not be translated nor included in the internationalization message dictionary. This should be used for detail messages that are not worth expending translation effort on, for instance because they are too technical to be useful to most users.

errdetail_plural(const char *fmt_singular, const char *fmt_plural, unsigned long n, ...) is like errdetail, but with support for various plural forms of the message. For more information see Section 56.2.2.

errdetail_log(const char *msg, ...) is the same as errdetail except that this string goes only to the server log, never to the client. If both errdetail (or one of its equivalents above) and errdetail_log are used then one string goes to the client and the other to the log. This is useful for error details that are too security-sensitive or too bulky to include in the report sent to the client.

errdetail_log_plural(const char *fmt_singular, const char *fmt_plural, unsigned long n, ...) is like errdetail_log, but with support for various plural forms of the message. For more information see Section 56.2.2.

errhint(const char *msg, ...) supplies an optional “hint” message; this is to be used when offering suggestions about how to fix the problem, as opposed to factual details about what went wrong. The message string is processed in just the same way as for errmsg.

errhint_plural(const char *fmt_singular, const char *fmt_plural, unsigned long n, ...) is like errhint, but with support for various plural forms of the message. For more information see Section 56.2.2.

errcontext(const char *msg, ...) is not normally called directly from an ereport message site; rather it is used in error_context_stack callback functions to provide information about the context in which an error occurred, such as the current location in a PL function. The message string is processed in just the same way as for errmsg. Unlike the other auxiliary functions, this can be called more than once per ereport call; the successive strings thus supplied are concatenated with separating newlines.

errposition(int cursorpos) specifies the textual location of an error within a query string. Currently it is only useful for errors detected in the lexical and syntactic analysis phases of query processing.

errtable(Relation rel) specifies a relation whose name and schema name should be included as auxiliary fields in the error report.

errtablecol(Relation rel, int attnum) specifies a column whose name, table name, and schema name should be included as auxiliary fields in the error report.

errtableconstraint(Relation rel, const char *conname) specifies a table constraint whose name, table name, and schema name should be included as auxiliary fields in the error report. Indexes should be considered to be constraints for this purpose, whether or not they have an associated pg_constraint entry. Be careful to pass the underlying heap relation, not the index itself, as rel.

errdatatype(Oid datatypeOid) specifies a data type whose name and schema name should be included as auxiliary fields in the error report.

errdomainconstraint(Oid datatypeOid, const char *conname) specifies a domain constraint whose name, domain name, and schema name should be included as auxiliary fields in the error report.

errcode_for_file_access() is a convenience function that selects an appropriate SQLSTATE error identifier for a failure in a file-access-related system call. It uses the saved errno to determine which error code to generate. Usually this should be used in combination with %m in the primary error message text.

errcode_for_socket_access() is a convenience function that selects an appropriate SQLSTATE error identifier for a failure in a socket-related system call.

errhidestmt(bool hide_stmt) can be called to specify suppression of the STATEMENT: portion of a message in the postmaster log. Generally this is appropriate if the message text includes the current statement already.

errhidecontext(bool hide_ctx) can be called to specify suppression of the CONTEXT: portion of a message in the postmaster log. This should only be used for verbose debugging messages where the repeated inclusion of context would bloat the log too much.

At most one of the functions errtable, errtablecol, errtableconstraint, errdatatype, or errdomainconstraint should be used in an ereport call. These functions exist to allow applications to extract the name of a database object associated with the error condition without having to examine the potentially-localized error message text. These functions should be used in error reports for which it's likely that applications would wish to have automatic error handling. As of PostgreSQL 9.3, complete coverage exists only for errors in SQLSTATE class 23 (integrity constraint violation), but this is likely to be expanded in future.

There is an older function elog that is still heavily used. An elog call:

is exactly equivalent to:

Notice that the SQLSTATE error code is always defaulted, and the message string is not subject to translation. Therefore, elog should be used only for internal errors and low-level debug logging. Any message that is likely to be of interest to ordinary users should go through ereport. Nonetheless, there are enough internal “cannot happen” error checks in the system that elog is still widely used; it is preferred for those messages for its notational simplicity.

Advice about writing good error messages can be found in Section 55.3.

[18] That is, the value that was current when the ereport call was reached; changes of errno within the auxiliary reporting routines will not affect it. That would not be true if you were to write strerror(errno) explicitly in errmsg's parameter list; accordingly, do not do so.

**Examples:**

Example 1 (unknown):
```unknown
src/include/utils/elog.h
```

Example 2 (unknown):
```unknown
ereport(ERROR,
        errcode(ERRCODE_DIVISION_BY_ZERO),
        errmsg("division by zero"));
```

Example 3 (unknown):
```unknown
src/include/utils/errcodes.h
```

Example 4 (unknown):
```unknown
ereport(ERROR,
        (errcode(ERRCODE_DIVISION_BY_ZERO),
         errmsg("division by zero")));
```

---


---

