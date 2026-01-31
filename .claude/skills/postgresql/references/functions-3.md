# PostgreSQL - Functions (Part 3)

## 9.20. Range/Multirange Functions and Operators # (continued)

Returns a multirange containing just the given range.

multirange('[1,2)'::int4range) → {[1,2)}

unnest ( anymultirange ) → setof anyrange

Expands a multirange into a set of ranges in ascending order.

unnest('{[1,2), [3,4)}'::int4multirange) →

The lower_inc, upper_inc, lower_inf, and upper_inf functions all return false for an empty range or multirange.

**Examples:**

Example 1 (unknown):
```unknown
int4range(2,4) @> int4range(2,3)
```

Example 2 (julia):
```julia
'[2011-01-01,2011-03-01)'::tsrange @> '2011-01-10'::timestamp
```

Example 3 (unknown):
```unknown
int4range(2,4) <@ int4range(1,7)
```

Example 4 (unknown):
```unknown
42 <@ int4range(1,7)
```

---


---

