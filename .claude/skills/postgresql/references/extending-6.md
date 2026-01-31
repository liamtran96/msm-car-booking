# PostgreSQL - Extending (Part 6)

## 36.10. C-Language Functions #


**URL:** https://www.postgresql.org/docs/18/xfunc-c.html

**Contents:**
- 36.10. C-Language Functions #
  - 36.10.1. Dynamic Loading #
  - Note
  - 36.10.2. Base Types in C-Language Functions #
  - Warning
  - 36.10.3. Version 1 Calling Conventions #
  - 36.10.4. Writing Code #
  - 36.10.5. Compiling and Linking Dynamically-Loaded Functions #
  - Tip
  - 36.10.6. Server API and ABI Stability Guidance #

User-defined functions can be written in C (or a language that can be made compatible with C, such as C++). Such functions are compiled into dynamically loadable objects (also called shared libraries) and are loaded by the server on demand. The dynamic loading feature is what distinguishes “C language” functions from “internal” functions — the actual coding conventions are essentially the same for both. (Hence, the standard internal function library is a rich source of coding examples for user-defined C functions.)

Currently only one calling convention is used for C functions (“version 1”). Support for that calling convention is indicated by writing a PG_FUNCTION_INFO_V1() macro call for the function, as illustrated below.

The first time a user-defined function in a particular loadable object file is called in a session, the dynamic loader loads that object file into memory so that the function can be called. The CREATE FUNCTION for a user-defined C function must therefore specify two pieces of information for the function: the name of the loadable object file, and the C name (link symbol) of the specific function to call within that object file. If the C name is not explicitly specified then it is assumed to be the same as the SQL function name.

The following algorithm is used to locate the shared object file based on the name given in the CREATE FUNCTION command:

If the name is an absolute path, the given file is loaded.

If the name starts with the string $libdir, that part is replaced by the PostgreSQL package library directory name, which is determined at build time.

If the name does not contain a directory part, the file is searched for in the path specified by the configuration variable dynamic_library_path.

Otherwise (the file was not found in the path, or it contains a non-absolute directory part), the dynamic loader will try to take the name as given, which will most likely fail. (It is unreliable to depend on the current working directory.)

If this sequence does not work, the platform-specific shared library file name extension (often .so) is appended to the given name and this sequence is tried again. If that fails as well, the load will fail.

It is recommended to locate shared libraries either relative to $libdir or through the dynamic library path. This simplifies version upgrades if the new installation is at a different location. The actual directory that $libdir stands for can be found out with the command pg_config --pkglibdir.

The user ID the PostgreSQL server runs as must be able to traverse the path to the file you intend to load. Making the file or a higher-level directory not readable and/or not executable by the postgres user is a common mistake.

In any case, the file name that is given in the CREATE FUNCTION command is recorded literally in the system catalogs, so if the file needs to be loaded again the same procedure is applied.

PostgreSQL will not compile a C function automatically. The object file must be compiled before it is referenced in a CREATE FUNCTION command. See Section 36.10.5 for additional information.

To ensure that a dynamically loaded object file is not loaded into an incompatible server, PostgreSQL checks that the file contains a “magic block” with the appropriate contents. This allows the server to detect obvious incompatibilities, such as code compiled for a different major version of PostgreSQL. To include a magic block, write this in one (and only one) of the module source files, after having included the header fmgr.h:

The PG_MODULE_MAGIC_EXT variant allows the specification of additional information about the module; currently, a name and/or a version string can be added. (More fields might be allowed in future.) Write something like this:

Subsequently the name and version can be examined via the pg_get_loaded_modules() function. The meaning of the version string is not restricted by PostgreSQL, but use of semantic versioning rules is recommended.

After it is used for the first time, a dynamically loaded object file is retained in memory. Future calls in the same session to the function(s) in that file will only incur the small overhead of a symbol table lookup. If you need to force a reload of an object file, for example after recompiling it, begin a fresh session.

Optionally, a dynamically loaded file can contain an initialization function. If the file includes a function named _PG_init, that function will be called immediately after loading the file. The function receives no parameters and should return void. There is presently no way to unload a dynamically loaded file.

To know how to write C-language functions, you need to know how PostgreSQL internally represents base data types and how they can be passed to and from functions. Internally, PostgreSQL regards a base type as a “blob of memory”. The user-defined functions that you define over a type in turn define the way that PostgreSQL can operate on it. That is, PostgreSQL will only store and retrieve the data from disk and use your user-defined functions to input, process, and output the data.

Base types can have one of three internal formats:

pass by value, fixed-length

pass by reference, fixed-length

pass by reference, variable-length

By-value types can only be 1, 2, or 4 bytes in length (also 8 bytes, if sizeof(Datum) is 8 on your machine). You should be careful to define your types such that they will be the same size (in bytes) on all architectures. For example, the long type is dangerous because it is 4 bytes on some machines and 8 bytes on others, whereas int type is 4 bytes on most Unix machines. A reasonable implementation of the int4 type on Unix machines might be:

(The actual PostgreSQL C code calls this type int32, because it is a convention in C that intXX means XX bits. Note therefore also that the C type int8 is 1 byte in size. The SQL type int8 is called int64 in C. See also Table 36.2.)

On the other hand, fixed-length types of any size can be passed by-reference. For example, here is a sample implementation of a PostgreSQL type:

Only pointers to such types can be used when passing them in and out of PostgreSQL functions. To return a value of such a type, allocate the right amount of memory with palloc, fill in the allocated memory, and return a pointer to it. (Also, if you just want to return the same value as one of your input arguments that's of the same data type, you can skip the extra palloc and just return the pointer to the input value.)

Finally, all variable-length types must also be passed by reference. All variable-length types must begin with an opaque length field of exactly 4 bytes, which will be set by SET_VARSIZE; never set this field directly! All data to be stored within that type must be located in the memory immediately following that length field. The length field contains the total length of the structure, that is, it includes the size of the length field itself.

Another important point is to avoid leaving any uninitialized bits within data type values; for example, take care to zero out any alignment padding bytes that might be present in structs. Without this, logically-equivalent constants of your data type might be seen as unequal by the planner, leading to inefficient (though not incorrect) plans.

Never modify the contents of a pass-by-reference input value. If you do so you are likely to corrupt on-disk data, since the pointer you are given might point directly into a disk buffer. The sole exception to this rule is explained in Section 36.12.

As an example, we can define the type text as follows:

The [FLEXIBLE_ARRAY_MEMBER] notation means that the actual length of the data part is not specified by this declaration.

When manipulating variable-length types, we must be careful to allocate the correct amount of memory and set the length field correctly. For example, if we wanted to store 40 bytes in a text structure, we might use a code fragment like this:

VARHDRSZ is the same as sizeof(int32), but it's considered good style to use the macro VARHDRSZ to refer to the size of the overhead for a variable-length type. Also, the length field must be set using the SET_VARSIZE macro, not by simple assignment.

Table 36.2 shows the C types corresponding to many of the built-in SQL data types of PostgreSQL. The “Defined In” column gives the header file that needs to be included to get the type definition. (The actual definition might be in a different file that is included by the listed file. It is recommended that users stick to the defined interface.) Note that you should always include postgres.h first in any source file of server code, because it declares a number of things that you will need anyway, and because including other headers first can cause portability issues.

Table 36.2. Equivalent C Types for Built-in SQL Types

Now that we've gone over all of the possible structures for base types, we can show some examples of real functions.

The version-1 calling convention relies on macros to suppress most of the complexity of passing arguments and results. The C declaration of a version-1 function is always:

In addition, the macro call:

must appear in the same source file. (Conventionally, it's written just before the function itself.) This macro call is not needed for internal-language functions, since PostgreSQL assumes that all internal functions use the version-1 convention. It is, however, required for dynamically-loaded functions.

In a version-1 function, each actual argument is fetched using a PG_GETARG_xxx() macro that corresponds to the argument's data type. (In non-strict functions there needs to be a previous check about argument null-ness using PG_ARGISNULL(); see below.) The result is returned using a PG_RETURN_xxx() macro for the return type. PG_GETARG_xxx() takes as its argument the number of the function argument to fetch, where the count starts at 0. PG_RETURN_xxx() takes as its argument the actual value to return.

To call another version-1 function, you can use DirectFunctionCalln(func, arg1, ..., argn). This is particularly useful when you want to call functions defined in the standard internal library, by using an interface similar to their SQL signature.

These convenience functions and similar ones can be found in fmgr.h. The DirectFunctionCalln family expect a C function name as their first argument. There are also OidFunctionCalln which take the OID of the target function, and some other variants. All of these expect the function's arguments to be supplied as Datums, and likewise they return Datum. Note that neither arguments nor result are allowed to be NULL when using these convenience functions.

For example, to call the starts_with(text, text) function from C, you can search through the catalog and find out that its C implementation is the Datum text_starts_with(PG_FUNCTION_ARGS) function. Typically you would use DirectFunctionCall2(text_starts_with, ...) to call such a function. However, starts_with(text, text) requires collation information, so it will fail with “could not determine which collation to use for string comparison” if called that way. Instead you must use DirectFunctionCall2Coll(text_starts_with, ...) and provide the desired collation, which typically is just passed through from PG_GET_COLLATION(), as shown in the example below.

fmgr.h also supplies macros that facilitate conversions between C types and Datum. For example to turn Datum into text*, you can use DatumGetTextPP(X). While some types have macros named like TypeGetDatum(X) for the reverse conversion, text* does not; it's sufficient to use the generic macro PointerGetDatum(X) for that. If your extension defines additional types, it is usually convenient to define similar macros for your types too.

Here are some examples using the version-1 calling convention:

Supposing that the above code has been prepared in file funcs.c and compiled into a shared object, we could define the functions to PostgreSQL with commands like this:

Here, DIRECTORY stands for the directory of the shared library file (for instance the PostgreSQL tutorial directory, which contains the code for the examples used in this section). (Better style would be to use just 'funcs' in the AS clause, after having added DIRECTORY to the search path. In any case, we can omit the system-specific extension for a shared library, commonly .so.)

Notice that we have specified the functions as “strict”, meaning that the system should automatically assume a null result if any input value is null. By doing this, we avoid having to check for null inputs in the function code. Without this, we'd have to check for null values explicitly, using PG_ARGISNULL().

The macro PG_ARGISNULL(n) allows a function to test whether each input is null. (Of course, doing this is only necessary in functions not declared “strict”.) As with the PG_GETARG_xxx() macros, the input arguments are counted beginning at zero. Note that one should refrain from executing PG_GETARG_xxx() until one has verified that the argument isn't null. To return a null result, execute PG_RETURN_NULL(); this works in both strict and nonstrict functions.

At first glance, the version-1 coding conventions might appear to be just pointless obscurantism, compared to using plain C calling conventions. They do however allow us to deal with NULLable arguments/return values, and “toasted” (compressed or out-of-line) values.

Other options provided by the version-1 interface are two variants of the PG_GETARG_xxx() macros. The first of these, PG_GETARG_xxx_COPY(), guarantees to return a copy of the specified argument that is safe for writing into. (The normal macros will sometimes return a pointer to a value that is physically stored in a table, which must not be written to. Using the PG_GETARG_xxx_COPY() macros guarantees a writable result.) The second variant consists of the PG_GETARG_xxx_SLICE() macros which take three arguments. The first is the number of the function argument (as above). The second and third are the offset and length of the segment to be returned. Offsets are counted from zero, and a negative length requests that the remainder of the value be returned. These macros provide more efficient access to parts of large values in the case where they have storage type “external”. (The storage type of a column can be specified using ALTER TABLE tablename ALTER COLUMN colname SET STORAGE storagetype. storagetype is one of plain, external, extended, or main.)

Finally, the version-1 function call conventions make it possible to return set results (Section 36.10.9) and implement trigger functions (Chapter 37) and procedural-language call handlers (Chapter 57). For more details see src/backend/utils/fmgr/README in the source distribution.

Before we turn to the more advanced topics, we should discuss some coding rules for PostgreSQL C-language functions. While it might be possible to load functions written in languages other than C into PostgreSQL, this is usually difficult (when it is possible at all) because other languages, such as C++, FORTRAN, or Pascal often do not follow the same calling convention as C. That is, other languages do not pass argument and return values between functions in the same way. For this reason, we will assume that your C-language functions are actually written in C.

The basic rules for writing and building C functions are as follows:

Use pg_config --includedir-server to find out where the PostgreSQL server header files are installed on your system (or the system that your users will be running on).

Compiling and linking your code so that it can be dynamically loaded into PostgreSQL always requires special flags. See Section 36.10.5 for a detailed explanation of how to do it for your particular operating system.

Remember to define a “magic block” for your shared library, as described in Section 36.10.1.

When allocating memory, use the PostgreSQL functions palloc and pfree instead of the corresponding C library functions malloc and free. The memory allocated by palloc will be freed automatically at the end of each transaction, preventing memory leaks.

Always zero the bytes of your structures using memset (or allocate them with palloc0 in the first place). Even if you assign to each field of your structure, there might be alignment padding (holes in the structure) that contain garbage values. Without this, it's difficult to support hash indexes or hash joins, as you must pick out only the significant bits of your data structure to compute a hash. The planner also sometimes relies on comparing constants via bitwise equality, so you can get undesirable planning results if logically-equivalent values aren't bitwise equal.

Most of the internal PostgreSQL types are declared in postgres.h, while the function manager interfaces (PG_FUNCTION_ARGS, etc.) are in fmgr.h, so you will need to include at least these two files. For portability reasons it's best to include postgres.h first, before any other system or user header files. Including postgres.h will also include elog.h and palloc.h for you.

Symbol names defined within object files must not conflict with each other or with symbols defined in the PostgreSQL server executable. You will have to rename your functions or variables if you get error messages to this effect.

Before you are able to use your PostgreSQL extension functions written in C, they must be compiled and linked in a special way to produce a file that can be dynamically loaded by the server. To be precise, a shared library needs to be created.

For information beyond what is contained in this section you should read the documentation of your operating system, in particular the manual pages for the C compiler, cc, and the link editor, ld. In addition, the PostgreSQL source code contains several working examples in the contrib directory. If you rely on these examples you will make your modules dependent on the availability of the PostgreSQL source code, however.

Creating shared libraries is generally analogous to linking executables: first the source files are compiled into object files, then the object files are linked together. The object files need to be created as position-independent code (PIC), which conceptually means that they can be placed at an arbitrary location in memory when they are loaded by the executable. (Object files intended for executables are usually not compiled that way.) The command to link a shared library contains special flags to distinguish it from linking an executable (at least in theory — on some systems the practice is much uglier).

In the following examples we assume that your source code is in a file foo.c and we will create a shared library foo.so. The intermediate object file will be called foo.o unless otherwise noted. A shared library can contain more than one object file, but we only use one here.

The compiler flag to create PIC is -fPIC. To create shared libraries the compiler flag is -shared.

This is applicable as of version 13.0 of FreeBSD, older versions used the gcc compiler.

The compiler flag to create PIC is -fPIC. The compiler flag to create a shared library is -shared. A complete example looks like this:

Here is an example. It assumes the developer tools are installed.

The compiler flag to create PIC is -fPIC. For ELF systems, the compiler with the flag -shared is used to link shared libraries. On the older non-ELF systems, ld -Bshareable is used.

The compiler flag to create PIC is -fPIC. ld -Bshareable is used to link shared libraries.

The compiler flag to create PIC is -KPIC with the Sun compiler and -fPIC with GCC. To link shared libraries, the compiler option is -G with either compiler or alternatively -shared with GCC.

If this is too complicated for you, you should consider using GNU Libtool, which hides the platform differences behind a uniform interface.

The resulting shared library file can then be loaded into PostgreSQL. When specifying the file name to the CREATE FUNCTION command, one must give it the name of the shared library file, not the intermediate object file. Note that the system's standard shared-library extension (usually .so or .sl) can be omitted from the CREATE FUNCTION command, and normally should be omitted for best portability.

Refer back to Section 36.10.1 about where the server expects to find the shared library files.

This section contains guidance to authors of extensions and other server plugins about API and ABI stability in the PostgreSQL server.

The PostgreSQL server contains several well-demarcated APIs for server plugins, such as the function manager (fmgr, described in this chapter), SPI (Chapter 45), and various hooks specifically designed for extensions. These interfaces are carefully managed for long-term stability and compatibility. However, the entire set of global functions and variables in the server effectively constitutes the publicly usable API, and most of it was not designed with extensibility and long-term stability in mind.

Therefore, while taking advantage of these interfaces is valid, the further one strays from the well-trodden path, the likelier it will be that one might encounter API or ABI compatibility issues at some point. Extension authors are encouraged to provide feedback about their requirements, so that over time, as new use patterns arise, certain interfaces can be considered more stabilized or new, better-designed interfaces can be added.

The API, or application programming interface, is the interface used at compile time.

There is no promise of API compatibility between PostgreSQL major versions. Extension code therefore might require source code changes to work with multiple major versions. These can usually be managed with preprocessor conditions such as #if PG_VERSION_NUM >= 160000. Sophisticated extensions that use interfaces beyond the well-demarcated ones usually require a few such changes for each major server version.

PostgreSQL makes an effort to avoid server API breaks in minor releases. In general, extension code that compiles and works with a minor release should also compile and work with any other minor release of the same major version, past or future.

When a change is required, it will be carefully managed, taking the requirements of extensions into account. Such changes will be communicated in the release notes (Appendix E).

The ABI, or application binary interface, is the interface used at run time.

Servers of different major versions have intentionally incompatible ABIs. Extensions that use server APIs must therefore be re-compiled for each major release. The inclusion of PG_MODULE_MAGIC (see Section 36.10.1) ensures that code compiled for one major version will be rejected by other major versions.

PostgreSQL makes an effort to avoid server ABI breaks in minor releases. In general, an extension compiled against any minor release should work with any other minor release of the same major version, past or future.

When a change is required, PostgreSQL will choose the least invasive change possible, for example by squeezing a new field into padding space or appending it to the end of a struct. These sorts of changes should not impact extensions unless they use very unusual code patterns.

In rare cases, however, even such non-invasive changes may be impractical or impossible. In such an event, the change will be carefully managed, taking the requirements of extensions into account. Such changes will also be documented in the release notes (Appendix E).

Note, however, that many parts of the server are not designed or maintained as publicly-consumable APIs (and that, in most cases, the actual boundary is also not well-defined). If urgent needs arise, changes in those parts will naturally be made with less consideration for extension code than changes in well-defined and widely used interfaces.

Also, in the absence of automated detection of such changes, this is not a guarantee, but historically such breaking changes have been extremely rare.

Composite types do not have a fixed layout like C structures. Instances of a composite type can contain null fields. In addition, composite types that are part of an inheritance hierarchy can have different fields than other members of the same inheritance hierarchy. Therefore, PostgreSQL provides a function interface for accessing fields of composite types from C.

Suppose we want to write a function to answer the query:

Using the version-1 calling conventions, we can define c_overpaid as:

GetAttributeByName is the PostgreSQL system function that returns attributes out of the specified row. It has three arguments: the argument of type HeapTupleHeader passed into the function, the name of the desired attribute, and a return parameter that tells whether the attribute is null. GetAttributeByName returns a Datum value that you can convert to the proper data type by using the appropriate DatumGetXXX() function. Note that the return value is meaningless if the null flag is set; always check the null flag before trying to do anything with the result.

There is also GetAttributeByNum, which selects the target attribute by column number instead of name.

The following command declares the function c_overpaid in SQL:

Notice we have used STRICT so that we did not have to check whether the input arguments were NULL.

To return a row or composite-type value from a C-language function, you can use a special API that provides macros and functions to hide most of the complexity of building composite data types. To use this API, the source file must include:

There are two ways you can build a composite data value (henceforth a “tuple”): you can build it from an array of Datum values, or from an array of C strings that can be passed to the input conversion functions of the tuple's column data types. In either case, you first need to obtain or construct a TupleDesc descriptor for the tuple structure. When working with Datums, you pass the TupleDesc to BlessTupleDesc, and then call heap_form_tuple for each row. When working with C strings, you pass the TupleDesc to TupleDescGetAttInMetadata, and then call BuildTupleFromCStrings for each row. In the case of a function returning a set of tuples, the setup steps can all be done once during the first call of the function.

Several helper functions are available for setting up the needed TupleDesc. The recommended way to do this in most functions returning composite values is to call:

passing the same fcinfo struct passed to the calling function itself. (This of course requires that you use the version-1 calling conventions.) resultTypeId can be specified as NULL or as the address of a local variable to receive the function's result type OID. resultTupleDesc should be the address of a local TupleDesc variable. Check that the result is TYPEFUNC_COMPOSITE; if so, resultTupleDesc has been filled with the needed TupleDesc. (If it is not, you can report an error along the lines of “function returning record called in context that cannot accept type record”.)

get_call_result_type can resolve the actual type of a polymorphic function result; so it is useful in functions that return scalar polymorphic results, not only functions that return composites. The resultTypeId output is primarily useful for functions returning polymorphic scalars.

get_call_result_type has a sibling get_expr_result_type, which can be used to resolve the expected output type for a function call represented by an expression tree. This can be used when trying to determine the result type from outside the function itself. There is also get_func_result_type, which can be used when only the function's OID is available. However these functions are not able to deal with functions declared to return record, and get_func_result_type cannot resolve polymorphic types, so you should preferentially use get_call_result_type.

Older, now-deprecated functions for obtaining TupleDescs are:

to get a TupleDesc for the row type of a named relation, and:

to get a TupleDesc based on a type OID. This can be used to get a TupleDesc for a base or composite type. It will not work for a function that returns record, however, and it cannot resolve polymorphic types.

Once you have a TupleDesc, call:

if you plan to work with Datums, or:

if you plan to work with C strings. If you are writing a function returning set, you can save the results of these functions in the FuncCallContext structure — use the tuple_desc or attinmeta field respectively.

When working with Datums, use:

to build a HeapTuple given user data in Datum form.

When working with C strings, use:

to build a HeapTuple given user data in C string form. values is an array of C strings, one for each attribute of the return row. Each C string should be in the form expected by the input function of the attribute data type. In order to return a null value for one of the attributes, the corresponding pointer in the values array should be set to NULL. This function will need to be called again for each row you return.

Once you have built a tuple to return from your function, it must be converted into a Datum. Use:

to convert a HeapTuple into a valid Datum. This Datum can be returned directly if you intend to return just a single row, or it can be used as the current return value in a set-returning function.

An example appears in the next section.

C-language functions have two options for returning sets (multiple rows). In one method, called ValuePerCall mode, a set-returning function is called repeatedly (passing the same arguments each time) and it returns one new row on each call, until it has no more rows to return and signals that by returning NULL. The set-returning function (SRF) must therefore save enough state across calls to remember what it was doing and return the correct next item on each call. In the other method, called Materialize mode, an SRF fills and returns a tuplestore object containing its entire result; then only one call occurs for the whole result, and no inter-call state is needed.

When using ValuePerCall mode, it is important to remember that the query is not guaranteed to be run to completion; that is, due to options such as LIMIT, the executor might stop making calls to the set-returning function before all rows have been fetched. This means it is not safe to perform cleanup activities in the last call, because that might not ever happen. It's recommended to use Materialize mode for functions that need access to external resources, such as file descriptors.

The remainder of this section documents a set of helper macros that are commonly used (though not required to be used) for SRFs using ValuePerCall mode. Additional details about Materialize mode can be found in src/backend/utils/fmgr/README. Also, the contrib modules in the PostgreSQL source distribution contain many examples of SRFs using both ValuePerCall and Materialize mode.

To use the ValuePerCall support macros described here, include funcapi.h. These macros work with a structure FuncCallContext that contains the state that needs to be saved across calls. Within the calling SRF, fcinfo->flinfo->fn_extra is used to hold a pointer to FuncCallContext across calls. The macros automatically fill that field on first use, and expect to find the same pointer there on subsequent uses.

The macros to be used by an SRF using this infrastructure are:

Use this to determine if your function is being called for the first or a subsequent time. On the first call (only), call:

to initialize the FuncCallContext. On every function call, including the first, call:

to set up for using the FuncCallContext.

If your function has data to return in the current call, use:

to return it to the caller. (result must be of type Datum, either a single value or a tuple prepared as described above.) Finally, when your function is finished returning data, use:

to clean up and end the SRF.

The memory context that is current when the SRF is called is a transient context that will be cleared between calls. This means that you do not need to call pfree on everything you allocated using palloc; it will go away anyway. However, if you want to allocate any data structures to live across calls, you need to put them somewhere else. The memory context referenced by multi_call_memory_ctx is a suitable location for any data that needs to survive until the SRF is finished running. In most cases, this means that you should switch into multi_call_memory_ctx while doing the first-call setup. Use funcctx->user_fctx to hold a pointer to any such cross-call data structures. (Data you allocate in multi_call_memory_ctx will go away automatically when the query ends, so it is not necessary to free that data manually, either.)

While the actual arguments to the function remain unchanged between calls, if you detoast the argument values (which is normally done transparently by the PG_GETARG_xxx macro) in the transient context then the detoasted copies will be freed on each cycle. Accordingly, if you keep references to such values in your user_fctx, you must either copy them into the multi_call_memory_ctx after detoasting, or ensure that you detoast the values only in that context.

A complete pseudo-code example looks like the following:

A complete example of a simple SRF returning a composite type looks like:

One way to declare this function in SQL is:

A different way is to use OUT parameters:

Notice that in this method the output type of the function is formally an anonymous record type.

C-language functions can be declared to accept and return the polymorphic types described in Section 36.2.5. When a function's arguments or return types are defined as polymorphic types, the function author cannot know in advance what data type it will be called with, or need to return. There are two routines provided in fmgr.h to allow a version-1 C function to discover the actual data types of its arguments and the type it is expected to return. The routines are called get_fn_expr_rettype(FmgrInfo *flinfo) and get_fn_expr_argtype(FmgrInfo *flinfo, int argnum). They return the result or argument type OID, or InvalidOid if the information is not available. The structure flinfo is normally accessed as fcinfo->flinfo. The parameter argnum is zero based. get_call_result_type can also be used as an alternative to get_fn_expr_rettype. There is also get_fn_expr_variadic, which can be used to find out whether variadic arguments have been merged into an array. This is primarily useful for VARIADIC "any" functions, since such merging will always have occurred for variadic functions taking ordinary array types.

For example, suppose we want to write a function to accept a single element of any type, and return a one-dimensional array of that type:

The following command declares the function make_array in SQL:

There is a variant of polymorphism that is only available to C-language functions: they can be declared to take parameters of type "any". (Note that this type name must be double-quoted, since it's also an SQL reserved word.) This works like anyelement except that it does not constrain different "any" arguments to be the same type, nor do they help determine the function's result type. A C-language function can also declare its final parameter to be VARIADIC "any". This will match one or more actual arguments of any type (not necessarily the same type). These arguments will not be gathered into an array as happens with normal variadic functions; they will just be passed to the function separately. The PG_NARGS() macro and the methods described above must be used to determine the number of actual arguments and their types when using this feature. Also, users of such a function might wish to use the VARIADIC keyword in their function call, with the expectation that the function would treat the array elements as separate arguments. The function itself must implement that behavior if wanted, after using get_fn_expr_variadic to detect that the actual argument was marked with VARIADIC.

Add-ins can reserve shared memory on server startup. To do so, the add-in's shared library must be preloaded by specifying it in shared_preload_libraries. The shared library should also register a shmem_request_hook in its _PG_init function. This shmem_request_hook can reserve shared memory by calling:

Each backend should obtain a pointer to the reserved shared memory by calling:

If this function sets foundPtr to false, the caller should proceed to initialize the contents of the reserved shared memory. If foundPtr is set to true, the shared memory was already initialized by another backend, and the caller need not initialize further.

To avoid race conditions, each backend should use the LWLock AddinShmemInitLock when initializing its allocation of shared memory, as shown here:

shmem_startup_hook provides a convenient place for the initialization code, but it is not strictly required that all such code be placed in this hook. On Windows (and anywhere else where EXEC_BACKEND is defined), each backend executes the registered shmem_startup_hook shortly after it attaches to shared memory, so add-ins should still acquire AddinShmemInitLock within this hook, as shown in the example above. On other platforms, only the postmaster process executes the shmem_startup_hook, and each backend automatically inherits the pointers to shared memory.

An example of a shmem_request_hook and shmem_startup_hook can be found in contrib/pg_stat_statements/pg_stat_statements.c in the PostgreSQL source tree.

There is another, more flexible method of reserving shared memory that can be done after server startup and outside a shmem_request_hook. To do so, each backend that will use the shared memory should obtain a pointer to it by calling:

If a dynamic shared memory segment with the given name does not yet exist, this function will allocate it and initialize it with the provided init_callback callback function. If the segment has already been allocated and initialized by another backend, this function simply attaches the existing dynamic shared memory segment to the current backend.

Unlike shared memory reserved at server startup, there is no need to acquire AddinShmemInitLock or otherwise take action to avoid race conditions when reserving shared memory with GetNamedDSMSegment. This function ensures that only one backend allocates and initializes the segment and that all other backends receive a pointer to the fully allocated and initialized segment.

A complete usage example of GetNamedDSMSegment can be found in src/test/modules/test_dsm_registry/test_dsm_registry.c in the PostgreSQL source tree.

Add-ins can reserve LWLocks on server startup. As with shared memory reserved at server startup, the add-in's shared library must be preloaded by specifying it in shared_preload_libraries, and the shared library should register a shmem_request_hook in its _PG_init function. This shmem_request_hook can reserve LWLocks by calling:

This ensures that an array of num_lwlocks LWLocks is available under the name tranche_name. A pointer to this array can be obtained by calling:

There is another, more flexible method of obtaining LWLocks that can be done after server startup and outside a shmem_request_hook. To do so, first allocate a tranche_id by calling:

Next, initialize each LWLock, passing the new tranche_id as an argument:

Similar to shared memory, each backend should ensure that only one process allocates a new tranche_id and initializes each new LWLock. One way to do this is to only call these functions in your shared memory initialization code with the AddinShmemInitLock held exclusively. If using GetNamedDSMSegment, calling these functions in the init_callback callback function is sufficient to avoid race conditions.

Finally, each backend using the tranche_id should associate it with a tranche_name by calling:

A complete usage example of LWLockNewTrancheId, LWLockInitialize, and LWLockRegisterTranche can be found in contrib/pg_prewarm/autoprewarm.c in the PostgreSQL source tree.

Add-ins can define custom wait events under the wait event type Extension by calling:

The wait event is associated to a user-facing custom string. An example can be found in src/test/modules/worker_spi in the PostgreSQL source tree.

Custom wait events can be viewed in pg_stat_activity:

An injection point with a given name is declared using macro:

There are a few injection points already declared at strategic points within the server code. After adding a new injection point the code needs to be compiled in order for that injection point to be available in the binary. Add-ins written in C-language can declare injection points in their own code using the same macro. The injection point names should use lower-case characters, with terms separated by dashes. arg is an optional argument value given to the callback at run-time.

Executing an injection point can require allocating a small amount of memory, which can fail. If you need to have an injection point in a critical section where dynamic allocations are not allowed, you can use a two-step approach with the following macros:

Before entering the critical section, call INJECTION_POINT_LOAD. It checks the shared memory state, and loads the callback into backend-private memory if it is active. Inside the critical section, use INJECTION_POINT_CACHED to execute the callback.

Add-ins can attach callbacks to an already-declared injection point by calling:

name is the name of the injection point, which when reached during execution will execute the function loaded from library. private_data is a private area of data of size private_data_size given as argument to the callback when executed.

Here is an example of callback for InjectionPointCallback:

This callback prints a message to server error log with severity NOTICE, but callbacks may implement more complex logic.

An alternative way to define the action to take when an injection point is reached is to add the testing code alongside the normal source code. This can be useful if the action e.g. depends on local variables that are not accessible to loaded modules. The IS_INJECTION_POINT_ATTACHED macro can then be used to check if an injection point is attached, for example:

Note that the callback attached to the injection point will not be executed by the IS_INJECTION_POINT_ATTACHED macro. If you want to execute the callback, you must also call INJECTION_POINT_CACHED like in the above example.

Optionally, it is possible to detach an injection point by calling:

On success, true is returned, false otherwise.

A callback attached to an injection point is available across all the backends including the backends started after InjectionPointAttach is called. It remains attached while the server is running or until the injection point is detached using InjectionPointDetach.

An example can be found in src/test/modules/injection_points in the PostgreSQL source tree.

Enabling injections points requires --enable-injection-points with configure or -Dinjection_points=true with Meson.

It is possible for add-ins written in C-language to use custom types of cumulative statistics registered in the Cumulative Statistics System.

First, define a PgStat_KindInfo that includes all the information related to the custom type registered. For example:

Then, each backend that needs to use this custom type needs to register it with pgstat_register_kind and a unique ID used to store the entries related to this type of statistics:

While developing a new extension, use PGSTAT_KIND_EXPERIMENTAL for kind. When you are ready to release the extension to users, reserve a kind ID at the Custom Cumulative Statistics page.

The details of the API for PgStat_KindInfo can be found in src/include/utils/pgstat_internal.h.

The type of statistics registered is associated with a name and a unique ID shared across the server in shared memory. Each backend using a custom type of statistics maintains a local cache storing the information of each custom PgStat_KindInfo.


*(continued...)*
---

