# PostgreSQL - Internals (Part 3)

## 59.1. Sampling Method Support Functions #


**URL:** https://www.postgresql.org/docs/18/tablesample-support-functions.html

**Contents:**
- 59.1. Sampling Method Support Functions #
  - Note
  - Note

The TSM handler function returns a palloc'd TsmRoutine struct containing pointers to the support functions described below. Most of the functions are required, but some are optional, and those pointers can be NULL.

This function is called during planning. It must estimate the number of relation pages that will be read during a sample scan, and the number of tuples that will be selected by the scan. (For example, these might be determined by estimating the sampling fraction, and then multiplying the baserel->pages and baserel->tuples numbers by that, being sure to round the results to integral values.) The paramexprs list holds the expression(s) that are parameters to the TABLESAMPLE clause. It is recommended to use estimate_expression_value() to try to reduce these expressions to constants, if their values are needed for estimation purposes; but the function must provide size estimates even if they cannot be reduced, and it should not fail even if the values appear invalid (remember that they're only estimates of what the run-time values will be). The pages and tuples parameters are outputs.

Initialize for execution of a SampleScan plan node. This is called during executor startup. It should perform any initialization needed before processing can start. The SampleScanState node has already been created, but its tsm_state field is NULL. The InitSampleScan function can palloc whatever internal state data is needed by the sampling method, and store a pointer to it in node->tsm_state. Information about the table to scan is accessible through other fields of the SampleScanState node (but note that the node->ss.ss_currentScanDesc scan descriptor is not set up yet). eflags contains flag bits describing the executor's operating mode for this plan node.

When (eflags & EXEC_FLAG_EXPLAIN_ONLY) is true, the scan will not actually be performed, so this function should only do the minimum required to make the node state valid for EXPLAIN and EndSampleScan.

This function can be omitted (set the pointer to NULL), in which case BeginSampleScan must perform all initialization needed by the sampling method.

Begin execution of a sampling scan. This is called just before the first attempt to fetch a tuple, and may be called again if the scan needs to be restarted. Information about the table to scan is accessible through fields of the SampleScanState node (but note that the node->ss.ss_currentScanDesc scan descriptor is not set up yet). The params array, of length nparams, contains the values of the parameters supplied in the TABLESAMPLE clause. These will have the number and types specified in the sampling method's parameterTypes list, and have been checked to not be null. seed contains a seed to use for any random numbers generated within the sampling method; it is either a hash derived from the REPEATABLE value if one was given, or the result of random() if not.

This function may adjust the fields node->use_bulkread and node->use_pagemode. If node->use_bulkread is true, which it is by default, the scan will use a buffer access strategy that encourages recycling buffers after use. It might be reasonable to set this to false if the scan will visit only a small fraction of the table's pages. If node->use_pagemode is true, which it is by default, the scan will perform visibility checking in a single pass for all tuples on each visited page. It might be reasonable to set this to false if the scan will select only a small fraction of the tuples on each visited page. That will result in fewer tuple visibility checks being performed, though each one will be more expensive because it will require more locking.

If the sampling method is marked repeatable_across_scans, it must be able to select the same set of tuples during a rescan as it did originally, that is a fresh call of BeginSampleScan must lead to selecting the same tuples as before (if the TABLESAMPLE parameters and seed don't change).

Returns the block number of the next page to be scanned, or InvalidBlockNumber if no pages remain to be scanned.

This function can be omitted (set the pointer to NULL), in which case the core code will perform a sequential scan of the entire relation. Such a scan can use synchronized scanning, so that the sampling method cannot assume that the relation pages are visited in the same order on each scan.

Returns the offset number of the next tuple to be sampled on the specified page, or InvalidOffsetNumber if no tuples remain to be sampled. maxoffset is the largest offset number in use on the page.

NextSampleTuple is not explicitly told which of the offset numbers in the range 1 .. maxoffset actually contain valid tuples. This is not normally a problem since the core code ignores requests to sample missing or invisible tuples; that should not result in any bias in the sample. However, if necessary, the function can use node->donetuples to examine how many of the tuples it returned were valid and visible.

NextSampleTuple must not assume that blockno is the same page number returned by the most recent NextSampleBlock call. It was returned by some previous NextSampleBlock call, but the core code is allowed to call NextSampleBlock in advance of actually scanning pages, so as to support prefetching. It is OK to assume that once sampling of a given page begins, successive NextSampleTuple calls all refer to the same page until InvalidOffsetNumber is returned.

End the scan and release resources. It is normally not important to release palloc'd memory, but any externally-visible resources should be cleaned up. This function can be omitted (set the pointer to NULL) in the common case where no such resources exist.

**Examples:**

Example 1 (cpp):
```cpp
void
SampleScanGetSampleSize (PlannerInfo *root,
                         RelOptInfo *baserel,
                         List *paramexprs,
                         BlockNumber *pages,
                         double *tuples);
```

Example 2 (php):
```php
baserel->pages
```

Example 3 (php):
```php
baserel->tuples
```

Example 4 (unknown):
```unknown
TABLESAMPLE
```

---


---

## Chapter 58. Writing a Foreign Data Wrapper


**URL:** https://www.postgresql.org/docs/18/fdwhandler.html

**Contents:**
- Chapter 58. Writing a Foreign Data Wrapper
  - Note

All operations on a foreign table are handled through its foreign data wrapper, which consists of a set of functions that the core server calls. The foreign data wrapper is responsible for fetching data from the remote data source and returning it to the PostgreSQL executor. If updating foreign tables is to be supported, the wrapper must handle that, too. This chapter outlines how to write a new foreign data wrapper.

The foreign data wrappers included in the standard distribution are good references when trying to write your own. Look into the contrib subdirectory of the source tree. The CREATE FOREIGN DATA WRAPPER reference page also has some useful details.

The SQL standard specifies an interface for writing foreign data wrappers. However, PostgreSQL does not implement that API, because the effort to accommodate it into PostgreSQL would be large, and the standard API hasn't gained wide adoption anyway.

**Examples:**

Example 1 (python):
```python
IMPORT FOREIGN SCHEMA
```

---


---

## Chapter 51. Overview of PostgreSQL Internals


**URL:** https://www.postgresql.org/docs/18/overview.html

**Contents:**
- Chapter 51. Overview of PostgreSQL Internals
  - Author

This chapter originated as part of [sim98] Stefan Simkovics' Master's Thesis prepared at Vienna University of Technology under the direction of O.Univ.Prof.Dr. Georg Gottlob and Univ.Ass. Mag. Katrin Seyr.

This chapter gives an overview of the internal structure of the backend of PostgreSQL. After having read the following sections you should have an idea of how a query is processed. This chapter is intended to help the reader understand the general sequence of operations that occur within the backend from the point at which a query is received, to the point at which the results are returned to the client.

---


---

## 58.3. Foreign Data Wrapper Helper Functions #


**URL:** https://www.postgresql.org/docs/18/fdw-helpers.html

**Contents:**
- 58.3. Foreign Data Wrapper Helper Functions #

Several helper functions are exported from the core server so that authors of foreign data wrappers can get easy access to attributes of FDW-related objects, such as FDW options. To use any of these functions, you need to include the header file foreign/foreign.h in your source file. That header also defines the struct types that are returned by these functions.

This function returns a ForeignDataWrapper object for the foreign-data wrapper with the given OID. A ForeignDataWrapper object contains properties of the FDW (see foreign/foreign.h for details). flags is a bitwise-or'd bit mask indicating an extra set of options. It can take the value FDW_MISSING_OK, in which case a NULL result is returned to the caller instead of an error for an undefined object.

This function returns a ForeignDataWrapper object for the foreign-data wrapper with the given OID. A ForeignDataWrapper object contains properties of the FDW (see foreign/foreign.h for details).

This function returns a ForeignServer object for the foreign server with the given OID. A ForeignServer object contains properties of the server (see foreign/foreign.h for details). flags is a bitwise-or'd bit mask indicating an extra set of options. It can take the value FSV_MISSING_OK, in which case a NULL result is returned to the caller instead of an error for an undefined object.

This function returns a ForeignServer object for the foreign server with the given OID. A ForeignServer object contains properties of the server (see foreign/foreign.h for details).

This function returns a UserMapping object for the user mapping of the given role on the given server. (If there is no mapping for the specific user, it will return the mapping for PUBLIC, or throw error if there is none.) A UserMapping object contains properties of the user mapping (see foreign/foreign.h for details).

This function returns a ForeignTable object for the foreign table with the given OID. A ForeignTable object contains properties of the foreign table (see foreign/foreign.h for details).

This function returns the per-column FDW options for the column with the given foreign table OID and attribute number, in the form of a list of DefElem. NIL is returned if the column has no options.

Some object types have name-based lookup functions in addition to the OID-based ones:

This function returns a ForeignDataWrapper object for the foreign-data wrapper with the given name. If the wrapper is not found, return NULL if missing_ok is true, otherwise raise an error.

This function returns a ForeignServer object for the foreign server with the given name. If the server is not found, return NULL if missing_ok is true, otherwise raise an error.

**Examples:**

Example 1 (unknown):
```unknown
foreign/foreign.h
```

Example 2 (unknown):
```unknown
ForeignDataWrapper *
GetForeignDataWrapperExtended(Oid fdwid, bits16 flags);
```

Example 3 (unknown):
```unknown
ForeignDataWrapper
```

Example 4 (unknown):
```unknown
ForeignDataWrapper
```

---


---

## 56.1. For the Translator #


**URL:** https://www.postgresql.org/docs/18/nls-translator.html

**Contents:**
- 56.1. For the Translator #
  - 56.1.1. Requirements #
  - 56.1.2. Concepts #
  - 56.1.3. Creating and Maintaining Message Catalogs #
  - 56.1.4. Editing the PO Files #

PostgreSQL programs (server and client) can issue their messages in your favorite language — if the messages have been translated. Creating and maintaining translated message sets needs the help of people who speak their own language well and want to contribute to the PostgreSQL effort. You do not have to be a programmer at all to do this. This section explains how to help.

We won't judge your language skills — this section is about software tools. Theoretically, you only need a text editor. But this is only in the unlikely event that you do not want to try out your translated messages. When you configure your source tree, be sure to use the --enable-nls option. This will also check for the libintl library and the msgfmt program, which all end users will need anyway. To try out your work, follow the applicable portions of the installation instructions.

If you want to start a new translation effort or want to do a message catalog merge (described later), you will need the programs xgettext and msgmerge, respectively, in a GNU-compatible implementation. Later, we will try to arrange it so that if you use a packaged source distribution, you won't need xgettext. (If working from Git, you will still need it.) GNU Gettext 0.10.36 or later is currently recommended.

Your local gettext implementation should come with its own documentation. Some of that is probably duplicated in what follows, but for additional details you should look there.

The pairs of original (English) messages and their (possibly) translated equivalents are kept in message catalogs, one for each program (although related programs can share a message catalog) and for each target language. There are two file formats for message catalogs: The first is the “PO” file (for Portable Object), which is a plain text file with special syntax that translators edit. The second is the “MO” file (for Machine Object), which is a binary file generated from the respective PO file and is used while the internationalized program is run. Translators do not deal with MO files; in fact hardly anyone does.

The extension of the message catalog file is to no surprise either .po or .mo. The base name is either the name of the program it accompanies, or the language the file is for, depending on the situation. This is a bit confusing. Examples are psql.po (PO file for psql) or fr.mo (MO file in French).

The file format of the PO files is illustrated here:

The msgid lines are extracted from the program source. (They need not be, but this is the most common way.) The msgstr lines are initially empty and are filled in with useful strings by the translator. The strings can contain C-style escape characters and can be continued across lines as illustrated. (The next line must start at the beginning of the line.)

The # character introduces a comment. If whitespace immediately follows the # character, then this is a comment maintained by the translator. There can also be automatic comments, which have a non-whitespace character immediately following the #. These are maintained by the various tools that operate on the PO files and are intended to aid the translator.

The #. style comments are extracted from the source file where the message is used. Possibly the programmer has inserted information for the translator, such as about expected alignment. The #: comments indicate the exact locations where the message is used in the source. The translator need not look at the program source, but can if there is doubt about the correct translation. The #, comments contain flags that describe the message in some way. There are currently two flags: fuzzy is set if the message has possibly been outdated because of changes in the program source. The translator can then verify this and possibly remove the fuzzy flag. Note that fuzzy messages are not made available to the end user. The other flag is c-format, which indicates that the message is a printf-style format template. This means that the translation should also be a format string with the same number and type of placeholders. There are tools that can verify this, which key off the c-format flag.

OK, so how does one create a “blank” message catalog? First, go into the directory that contains the program whose messages you want to translate. If there is a file nls.mk, then this program has been prepared for translation.

If there are already some .po files, then someone has already done some translation work. The files are named language.po, where language is the ISO 639-1 two-letter language code (in lower case), e.g., fr.po for French. If there is really a need for more than one translation effort per language then the files can also be named language_region.po where region is the ISO 3166-1 two-letter country code (in upper case), e.g., pt_BR.po for Portuguese in Brazil. If you find the language you wanted you can just start working on that file.

If you need to start a new translation effort, then first run the command:

This will create a file progname.pot. (.pot to distinguish it from PO files that are “in production”. The T stands for “template”.) Copy this file to language.po and edit it. To make it known that the new language is available, also edit the file po/LINGUAS and add the language (or language and country) code next to languages already listed, like:

(Other languages can appear, of course.)

As the underlying program or library changes, messages might be changed or added by the programmers. In this case you do not need to start from scratch. Instead, run the command:

which will create a new blank message catalog file (the pot file you started with) and will merge it with the existing PO files. If the merge algorithm is not sure about a particular message it marks it “fuzzy” as explained above. The new PO file is saved with a .po.new extension.

The PO files can be edited with a regular text editor. There are also several specialized editors for PO files which can help the process with translation-specific features. There is (unsurprisingly) a PO mode for Emacs, which can be quite useful.

The translator should only change the area between the quotes after the msgstr directive, add comments, and alter the fuzzy flag.

The PO files need not be completely filled in. The software will automatically fall back to the original string if no translation (or an empty translation) is available. It is no problem to submit incomplete translations for inclusions in the source tree; that gives room for other people to pick up your work. However, you are encouraged to give priority to removing fuzzy entries after doing a merge. Remember that fuzzy entries will not be installed; they only serve as reference for what might be the right translation.

Here are some things to keep in mind while editing the translations:

Make sure that if the original ends with a newline, the translation does, too. Similarly for tabs, etc.

If the original is a printf format string, the translation also needs to be. The translation also needs to have the same format specifiers in the same order. Sometimes the natural rules of the language make this impossible or at least awkward. In that case you can modify the format specifiers like this:

Then the first placeholder will actually use the second argument from the list. The digits$ needs to follow the % immediately, before any other format manipulators. (This feature really exists in the printf family of functions. You might not have heard of it before because there is little use for it outside of message internationalization.)

If the original string contains a linguistic mistake, report that (or fix it yourself in the program source) and translate normally. The corrected string can be merged in when the program sources have been updated. If the original string contains a factual mistake, report that (or fix it yourself) and do not translate it. Instead, you can mark the string with a comment in the PO file.

Maintain the style and tone of the original string. Specifically, messages that are not sentences (cannot open file %s) should probably not start with a capital letter (if your language distinguishes letter case) or end with a period (if your language uses punctuation marks). It might help to read Section 55.3.

If you don't know what a message means, or if it is ambiguous, ask on the developers' mailing list. Chances are that English speaking end users might also not understand it or find it ambiguous, so it's best to improve the message.

**Examples:**

Example 1 (unknown):
```unknown
--enable-nls
```

Example 2 (markdown):
```markdown
# comment

msgid "original string"
msgstr "translated string"

msgid "more original"
msgstr "another translated"
"string can be broken up like this"

...
```

Example 3 (json):
```json
#. automatic comment
#: filename.c:1023
#, flags, flags
```

Example 4 (unknown):
```unknown
language.po
```

---


---

## 51.4. The PostgreSQL Rule System #


**URL:** https://www.postgresql.org/docs/18/rule-system.html

**Contents:**
- 51.4. The PostgreSQL Rule System #

PostgreSQL supports a powerful rule system for the specification of views and ambiguous view updates. Originally the PostgreSQL rule system consisted of two implementations:

The first one worked using row level processing and was implemented deep in the executor. The rule system was called whenever an individual row had been accessed. This implementation was removed in 1995 when the last official release of the Berkeley Postgres project was transformed into Postgres95.

The second implementation of the rule system is a technique called query rewriting. The rewrite system is a module that exists between the parser stage and the planner/optimizer. This technique is still implemented.

The query rewriter is discussed in some detail in Chapter 39, so there is no need to cover it here. We will only point out that both the input and the output of the rewriter are query trees, that is, there is no change in the representation or level of semantic detail in the trees. Rewriting can be thought of as a form of macro expansion.

---


---

## 60.3. Executing Custom Scans #


**URL:** https://www.postgresql.org/docs/18/custom-scan-execution.html

**Contents:**
- 60.3. Executing Custom Scans #
  - 60.3.1. Custom Scan Execution Callbacks #

When a CustomScan is executed, its execution state is represented by a CustomScanState, which is declared as follows:

ss is initialized as for any other scan state, except that if the scan is for a join rather than a base relation, ss.ss_currentRelation is left NULL. flags is a bit mask with the same meaning as in CustomPath and CustomScan. methods must point to a (usually statically allocated) object implementing the required custom scan state methods, which are further detailed below. Typically, a CustomScanState, which need not support copyObject, will actually be a larger structure embedding the above as its first member.

Complete initialization of the supplied CustomScanState. Standard fields have been initialized by ExecInitCustomScan, but any private fields should be initialized here.

Fetch the next scan tuple. If any tuples remain, it should fill ps_ResultTupleSlot with the next tuple in the current scan direction, and then return the tuple slot. If not, NULL or an empty slot should be returned.

Clean up any private data associated with the CustomScanState. This method is required, but it does not need to do anything if there is no associated data or it will be cleaned up automatically.

Rewind the current scan to the beginning and prepare to rescan the relation.

Save the current scan position so that it can subsequently be restored by the RestrPosCustomScan callback. This callback is optional, and need only be supplied if the CUSTOMPATH_SUPPORT_MARK_RESTORE flag is set.

Restore the previous scan position as saved by the MarkPosCustomScan callback. This callback is optional, and need only be supplied if the CUSTOMPATH_SUPPORT_MARK_RESTORE flag is set.

Estimate the amount of dynamic shared memory that will be required for parallel operation. This may be higher than the amount that will actually be used, but it must not be lower. The return value is in bytes. This callback is optional, and need only be supplied if this custom scan provider supports parallel execution.

Initialize the dynamic shared memory that will be required for parallel operation. coordinate points to a shared memory area of size equal to the return value of EstimateDSMCustomScan. This callback is optional, and need only be supplied if this custom scan provider supports parallel execution.

Re-initialize the dynamic shared memory required for parallel operation when the custom-scan plan node is about to be re-scanned. This callback is optional, and need only be supplied if this custom scan provider supports parallel execution. Recommended practice is that this callback reset only shared state, while the ReScanCustomScan callback resets only local state. Currently, this callback will be called before ReScanCustomScan, but it's best not to rely on that ordering.

Initialize a parallel worker's local state based on the shared state set up by the leader during InitializeDSMCustomScan. This callback is optional, and need only be supplied if this custom scan provider supports parallel execution.

Release resources when it is anticipated the node will not be executed to completion. This is not called in all cases; sometimes, EndCustomScan may be called without this function having been called first. Since the DSM segment used by parallel query is destroyed just after this callback is invoked, custom scan providers that wish to take some action before the DSM segment goes away should implement this method.

Output additional information for EXPLAIN of a custom-scan plan node. This callback is optional. Common data stored in the ScanState, such as the target list and scan relation, will be shown even without this callback, but the callback allows the display of additional, private state.

**Examples:**

Example 1 (unknown):
```unknown
CustomScanState
```

Example 2 (swift):
```swift
typedef struct CustomScanState
{
    ScanState ss;
    uint32    flags;
    const CustomExecMethods *methods;
} CustomScanState;
```

Example 3 (unknown):
```unknown
ss.ss_currentRelation
```

Example 4 (unknown):
```unknown
CustomScanState
```

---


---

