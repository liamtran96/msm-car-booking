# PostgreSQL - Triggers

## 37.2. Visibility of Data Changes #


**URL:** https://www.postgresql.org/docs/18/trigger-datachanges.html

**Contents:**
- 37.2. Visibility of Data Changes #

If you execute SQL commands in your trigger function, and these commands access the table that the trigger is for, then you need to be aware of the data visibility rules, because they determine whether these SQL commands will see the data change that the trigger is fired for. Briefly:

Statement-level triggers follow simple visibility rules: none of the changes made by a statement are visible to statement-level BEFORE triggers, whereas all modifications are visible to statement-level AFTER triggers.

The data change (insertion, update, or deletion) causing the trigger to fire is naturally not visible to SQL commands executed in a row-level BEFORE trigger, because it hasn't happened yet.

However, SQL commands executed in a row-level BEFORE trigger will see the effects of data changes for rows previously processed in the same outer command. This requires caution, since the ordering of these change events is not in general predictable; an SQL command that affects multiple rows can visit the rows in any order.

Similarly, a row-level INSTEAD OF trigger will see the effects of data changes made by previous firings of INSTEAD OF triggers in the same outer command.

When a row-level AFTER trigger is fired, all data changes made by the outer command are already complete, and are visible to the invoked trigger function.

If your trigger function is written in any of the standard procedural languages, then the above statements apply only if the function is declared VOLATILE. Functions that are declared STABLE or IMMUTABLE will not see changes made by the calling command in any case.

Further information about data visibility rules can be found in Section 45.5. The example in Section 37.4 contains a demonstration of these rules.

---


---

## 37.3. Writing Trigger Functions in C #


**URL:** https://www.postgresql.org/docs/18/trigger-interface.html

**Contents:**
- 37.3. Writing Trigger Functions in C #

This section describes the low-level details of the interface to a trigger function. This information is only needed when writing trigger functions in C. If you are using a higher-level language then these details are handled for you. In most cases you should consider using a procedural language before writing your triggers in C. The documentation of each procedural language explains how to write a trigger in that language.

Trigger functions must use the “version 1” function manager interface.

When a function is called by the trigger manager, it is not passed any normal arguments, but it is passed a “context” pointer pointing to a TriggerData structure. C functions can check whether they were called from the trigger manager or not by executing the macro:

If this returns true, then it is safe to cast fcinfo->context to type TriggerData * and make use of the pointed-to TriggerData structure. The function must not alter the TriggerData structure or any of the data it points to.

struct TriggerData is defined in commands/trigger.h:

where the members are defined as follows:

Always T_TriggerData.

Describes the event for which the function is called. You can use the following macros to examine tg_event:

Returns true if the trigger fired before the operation.

Returns true if the trigger fired after the operation.

Returns true if the trigger fired instead of the operation.

Returns true if the trigger fired for a row-level event.

Returns true if the trigger fired for a statement-level event.

Returns true if the trigger was fired by an INSERT command.

Returns true if the trigger was fired by an UPDATE command.

Returns true if the trigger was fired by a DELETE command.

Returns true if the trigger was fired by a TRUNCATE command.

A pointer to a structure describing the relation that the trigger fired for. Look at utils/rel.h for details about this structure. The most interesting things are tg_relation->rd_att (descriptor of the relation tuples) and tg_relation->rd_rel->relname (relation name; the type is not char* but NameData; use SPI_getrelname(tg_relation) to get a char* if you need a copy of the name).

A pointer to the row for which the trigger was fired. This is the row being inserted, updated, or deleted. If this trigger was fired for an INSERT or DELETE then this is what you should return from the function if you don't want to replace the row with a different one (in the case of INSERT) or skip the operation. For triggers on foreign tables, values of system columns herein are unspecified.

A pointer to the new version of the row, if the trigger was fired for an UPDATE, and NULL if it is for an INSERT or a DELETE. This is what you have to return from the function if the event is an UPDATE and you don't want to replace this row by a different one or skip the operation. For triggers on foreign tables, values of system columns herein are unspecified.

A pointer to a structure of type Trigger, defined in utils/reltrigger.h:

where tgname is the trigger's name, tgnargs is the number of arguments in tgargs, and tgargs is an array of pointers to the arguments specified in the CREATE TRIGGER statement. The other members are for internal use only.

The slot containing tg_trigtuple, or a NULL pointer if there is no such tuple.

The slot containing tg_newtuple, or a NULL pointer if there is no such tuple.

A pointer to a structure of type Tuplestorestate containing zero or more rows in the format specified by tg_relation, or a NULL pointer if there is no OLD TABLE transition relation.

A pointer to a structure of type Tuplestorestate containing zero or more rows in the format specified by tg_relation, or a NULL pointer if there is no NEW TABLE transition relation.

For UPDATE triggers, a bitmap set indicating the columns that were updated by the triggering command. Generic trigger functions can use this to optimize actions by not having to deal with columns that were not changed.

As an example, to determine whether a column with attribute number attnum (1-based) is a member of this bitmap set, call bms_is_member(attnum - FirstLowInvalidHeapAttributeNumber, trigdata->tg_updatedcols)).

For triggers other than UPDATE triggers, this will be NULL.

To allow queries issued through SPI to reference transition tables, see SPI_register_trigger_data.

A trigger function must return either a HeapTuple pointer or a NULL pointer (not an SQL null value, that is, do not set isNull true). Be careful to return either tg_trigtuple or tg_newtuple, as appropriate, if you don't want to modify the row being operated on.

**Examples:**

Example 1 (unknown):
```unknown
TriggerData
```

Example 2 (unknown):
```unknown
CALLED_AS_TRIGGER(fcinfo)
```

Example 3 (php):
```php
((fcinfo)->context != NULL && IsA((fcinfo)->context, TriggerData))
```

Example 4 (php):
```php
fcinfo->context
```

---


---

## 37.4. A Complete Trigger Example #


**URL:** https://www.postgresql.org/docs/18/trigger-example.html

**Contents:**
- 37.4. A Complete Trigger Example #

Here is a very simple example of a trigger function written in C. (Examples of triggers written in procedural languages can be found in the documentation of the procedural languages.)

The function trigf reports the number of rows in the table ttest and skips the actual operation if the command attempts to insert a null value into the column x. (So the trigger acts as a not-null constraint but doesn't abort the transaction.)

First, the table definition:

This is the source code of the trigger function:

After you have compiled the source code (see Section 36.10.5), declare the function and the triggers:

Now you can test the operation of the trigger:

There are more complex examples in src/test/regress/regress.c and in spi.

**Examples:**

Example 1 (sql):
```sql
CREATE TABLE ttest (
    x integer
);
```

Example 2 (sql):
```sql
#include "postgres.h"
#include "fmgr.h"
#include "executor/spi.h"       /* this is what you need to work with SPI */
#include "commands/trigger.h"   /* ... triggers ... */
#include "utils/rel.h"          /* ... and relations */

PG_MODULE_MAGIC;

PG_FUNCTION_INFO_V1(trigf);

Datum
trigf(PG_FUNCTION_ARGS)
{
    TriggerData *trigdata = (TriggerData *) fcinfo->context;
    TupleDesc   tupdesc;
    HeapTuple   rettuple;
    char       *when;
    bool        checknull = false;
    bool        isnull;
    int         ret, i;

    /* make sure it's called as a trigger at all */
    if (!CALLED_AS_TRIGGER(fcinfo))
        elog(ERROR, "trigf: not called by trigger manager");

    /* tuple to return to executor */
    if (TRIGGER_FIRED_BY_UPDATE(trigdata->tg_event))
        rettuple = trigdata->tg_newtuple;
    else
        rettuple = trigdata->tg_trigtuple;

    /* check for null values */
    if (!TRIGGER_FIRED_BY_DELETE(trigdata->tg_event)
        && TRIGGER_FIRED_BEFORE(trigdata->tg_event))
        checknull = true;

    if (TRIGGER_FIRED_BEFORE(trigdata->tg_event))
        when = "before";
    else
        when = "after ";

    tupdesc = trigdata->tg_relation->rd_att;

    /* connect to SPI manager */
    SPI_connect();

    /* get number of rows in table */
    ret = SPI_exec("SELECT count(*) FROM ttest", 0);

    if (ret < 0)
        elog(ERROR, "trigf (fired %s): SPI_exec returned %d", when, ret);

    /* count(*) returns int8, so be careful to convert */
    i = DatumGetInt64(SPI_getbinval(SPI_tuptable->vals[0],
                                    SPI_tuptable->tupdesc,
                                    1,
                                    &isnull));

    elog (INFO, "trigf (fired %s): there are %d rows in ttest", when, i);

    SPI_finish();

    if (checknull)
    {
        SPI_getbinval(rettuple, tupdesc, 1, &isnull);
        if (isnull)
            rettuple = NULL;
    }

    return PointerGetDatum(rettuple);
}
```

Example 3 (javascript):
```javascript
CREATE FUNCTION trigf() RETURNS trigger
    AS 'filename'
    LANGUAGE C;

CREATE TRIGGER tbefore BEFORE INSERT OR UPDATE OR DELETE ON ttest
    FOR EACH ROW EXECUTE FUNCTION trigf();

CREATE TRIGGER tafter AFTER INSERT OR UPDATE OR DELETE ON ttest
    FOR EACH ROW EXECUTE FUNCTION trigf();
```

Example 4 (sql):
```sql
=> INSERT INTO ttest VALUES (NULL);
INFO:  trigf (fired before): there are 0 rows in ttest
INSERT 0 0

-- Insertion skipped and AFTER trigger is not fired

=> SELECT * FROM ttest;
 x
---
(0 rows)

=> INSERT INTO ttest VALUES (1);
INFO:  trigf (fired before): there are 0 rows in ttest
INFO:  trigf (fired after ): there are 1 rows in ttest
                                       ^^^^^^^^
                             remember what we said about visibility.
INSERT 167793 1
vac=> SELECT * FROM ttest;
 x
---
 1
(1 row)

=> INSERT INTO ttest SELECT x * 2 FROM ttest;
INFO:  trigf (fired before): there are 1 rows in ttest
INFO:  trigf (fired after ): there are 2 rows in ttest
                                       ^^^^^^
                             remember what we said about visibility.
INSERT 167794 1
=> SELECT * FROM ttest;
 x
---
 1
 2
(2 rows)

=> UPDATE ttest SET x = NULL WHERE x = 2;
INFO:  trigf (fired before): there are 2 rows in ttest
UPDATE 0
=> UPDATE ttest SET x = 4 WHERE x = 2;
INFO:  trigf (fired before): there are 2 rows in ttest
INFO:  trigf (fired after ): there are 2 rows in ttest
UPDATE 1
vac=> SELECT * FROM ttest;
 x
---
 1
 4
(2 rows)

=> DELETE FROM ttest;
INFO:  trigf (fired before): there are 2 rows in ttest
INFO:  trigf (fired before): there are 1 rows in ttest
INFO:  trigf (fired after ): there are 0 rows in ttest
INFO:  trigf (fired after ): there are 0 rows in ttest
                                       ^^^^^^
                             remember what we said about visibility.
DELETE 2
=> SELECT * FROM ttest;
 x
---
(0 rows)
```

---


---

## Chapter 37. Triggers


**URL:** https://www.postgresql.org/docs/18/triggers.html

**Contents:**
- Chapter 37. Triggers

This chapter provides general information about writing trigger functions. Trigger functions can be written in most of the available procedural languages, including PL/pgSQL (Chapter 41), PL/Tcl (Chapter 42), PL/Perl (Chapter 43), and PL/Python (PL/Python). After reading this chapter, you should consult the chapter for your favorite procedural language to find out the language-specific details of writing a trigger in it.

It is also possible to write a trigger function in C, although most people find it easier to use one of the procedural languages. It is not currently possible to write a trigger function in the plain SQL function language.

---


---

