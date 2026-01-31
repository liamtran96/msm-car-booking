# PostgreSQL - Functions (Part 10)

## 9.10. Enum Support Functions #


**URL:** https://www.postgresql.org/docs/18/functions-enum.html

**Contents:**
- 9.10. Enum Support Functions #

For enum types (described in Section 8.7), there are several functions that allow cleaner programming without hard-coding particular values of an enum type. These are listed in Table 9.35. The examples assume an enum type created as:

Table 9.35. Enum Support Functions

enum_first ( anyenum ) → anyenum

Returns the first value of the input enum type.

enum_first(null::rainbow) → red

enum_last ( anyenum ) → anyenum

Returns the last value of the input enum type.

enum_last(null::rainbow) → purple

enum_range ( anyenum ) → anyarray

Returns all values of the input enum type in an ordered array.

enum_range(null::rainbow) → {red,orange,yellow,​green,blue,purple}

enum_range ( anyenum, anyenum ) → anyarray

Returns the range between the two given enum values, as an ordered array. The values must be from the same enum type. If the first parameter is null, the result will start with the first value of the enum type. If the second parameter is null, the result will end with the last value of the enum type.

enum_range('orange'::rainbow, 'green'::rainbow) → {orange,yellow,green}

enum_range(NULL, 'green'::rainbow) → {red,orange,​yellow,green}

enum_range('orange'::rainbow, NULL) → {orange,yellow,green,​blue,purple}

Notice that except for the two-argument form of enum_range, these functions disregard the specific value passed to them; they care only about its declared data type. Either null or a specific value of the type can be passed, with the same result. It is more common to apply these functions to a table column or function argument than to a hardwired type name as used in the examples.

**Examples:**

Example 1 (typescript):
```typescript
CREATE TYPE rainbow AS ENUM ('red', 'orange', 'yellow', 'green', 'blue', 'purple');
```

Example 2 (julia):
```julia
enum_first(null::rainbow)
```

Example 3 (julia):
```julia
enum_last(null::rainbow)
```

Example 4 (julia):
```julia
enum_range(null::rainbow)
```

---


---

## 9.12. Network Address Functions and Operators #


**URL:** https://www.postgresql.org/docs/18/functions-net.html

**Contents:**
- 9.12. Network Address Functions and Operators #
  - Tip

The IP network address types, cidr and inet, support the usual comparison operators shown in Table 9.1 as well as the specialized operators and functions shown in Table 9.39 and Table 9.40.

Any cidr value can be cast to inet implicitly; therefore, the operators and functions shown below as operating on inet also work on cidr values. (Where there are separate functions for inet and cidr, it is because the behavior should be different for the two cases.) Also, it is permitted to cast an inet value to cidr. When this is done, any bits to the right of the netmask are silently zeroed to create a valid cidr value.

Table 9.39. IP Address Operators

inet << inet → boolean

Is subnet strictly contained by subnet? This operator, and the next four, test for subnet inclusion. They consider only the network parts of the two addresses (ignoring any bits to the right of the netmasks) and determine whether one network is identical to or a subnet of the other.

inet '192.168.1.5' << inet '192.168.1/24' → t

inet '192.168.0.5' << inet '192.168.1/24' → f

inet '192.168.1/24' << inet '192.168.1/24' → f

inet <<= inet → boolean

Is subnet contained by or equal to subnet?

inet '192.168.1/24' <<= inet '192.168.1/24' → t

inet >> inet → boolean

Does subnet strictly contain subnet?

inet '192.168.1/24' >> inet '192.168.1.5' → t

inet >>= inet → boolean

Does subnet contain or equal subnet?

inet '192.168.1/24' >>= inet '192.168.1/24' → t

inet && inet → boolean

Does either subnet contain or equal the other?

inet '192.168.1/24' && inet '192.168.1.80/28' → t

inet '192.168.1/24' && inet '192.168.2.0/28' → f

Computes bitwise NOT.

~ inet '192.168.1.6' → 63.87.254.249

Computes bitwise AND.

inet '192.168.1.6' & inet '0.0.0.255' → 0.0.0.6

inet '192.168.1.6' | inet '0.0.0.255' → 192.168.1.255

Adds an offset to an address.

inet '192.168.1.6' + 25 → 192.168.1.31

Adds an offset to an address.

200 + inet '::ffff:fff0:1' → ::ffff:255.240.0.201

Subtracts an offset from an address.

inet '192.168.1.43' - 36 → 192.168.1.7

Computes the difference of two addresses.

inet '192.168.1.43' - inet '192.168.1.19' → 24

inet '::1' - inet '::ffff:1' → -4294901760

Table 9.40. IP Address Functions

abbrev ( inet ) → text

Creates an abbreviated display format as text. (The result is the same as the inet output function produces; it is “abbreviated” only in comparison to the result of an explicit cast to text, which for historical reasons will never suppress the netmask part.)

abbrev(inet '10.1.0.0/32') → 10.1.0.0

abbrev ( cidr ) → text

Creates an abbreviated display format as text. (The abbreviation consists of dropping all-zero octets to the right of the netmask; more examples are in Table 8.22.)

abbrev(cidr '10.1.0.0/16') → 10.1/16

broadcast ( inet ) → inet

Computes the broadcast address for the address's network.

broadcast(inet '192.168.1.5/24') → 192.168.1.255/24

family ( inet ) → integer

Returns the address's family: 4 for IPv4, 6 for IPv6.

family(inet '::1') → 6

Returns the IP address as text, ignoring the netmask.

host(inet '192.168.1.0/24') → 192.168.1.0

hostmask ( inet ) → inet

Computes the host mask for the address's network.

hostmask(inet '192.168.23.20/30') → 0.0.0.3

inet_merge ( inet, inet ) → cidr

Computes the smallest network that includes both of the given networks.

inet_merge(inet '192.168.1.5/24', inet '192.168.2.5/24') → 192.168.0.0/22

inet_same_family ( inet, inet ) → boolean

Tests whether the addresses belong to the same IP family.

inet_same_family(inet '192.168.1.5/24', inet '::1') → f

masklen ( inet ) → integer

Returns the netmask length in bits.

masklen(inet '192.168.1.5/24') → 24

netmask ( inet ) → inet

Computes the network mask for the address's network.

netmask(inet '192.168.1.5/24') → 255.255.255.0

network ( inet ) → cidr

Returns the network part of the address, zeroing out whatever is to the right of the netmask. (This is equivalent to casting the value to cidr.)

network(inet '192.168.1.5/24') → 192.168.1.0/24

set_masklen ( inet, integer ) → inet

Sets the netmask length for an inet value. The address part does not change.

set_masklen(inet '192.168.1.5/24', 16) → 192.168.1.5/16

set_masklen ( cidr, integer ) → cidr

Sets the netmask length for a cidr value. Address bits to the right of the new netmask are set to zero.

set_masklen(cidr '192.168.1.0/24', 16) → 192.168.0.0/16

Returns the unabbreviated IP address and netmask length as text. (This has the same result as an explicit cast to text.)

text(inet '192.168.1.5') → 192.168.1.5/32

The abbrev, host, and text functions are primarily intended to offer alternative display formats for IP addresses.

The MAC address types, macaddr and macaddr8, support the usual comparison operators shown in Table 9.1 as well as the specialized functions shown in Table 9.41. In addition, they support the bitwise logical operators ~, & and | (NOT, AND and OR), just as shown above for IP addresses.

Table 9.41. MAC Address Functions

trunc ( macaddr ) → macaddr

Sets the last 3 bytes of the address to zero. The remaining prefix can be associated with a particular manufacturer (using data not included in PostgreSQL).

trunc(macaddr '12:34:56:78:90:ab') → 12:34:56:00:00:00

trunc ( macaddr8 ) → macaddr8

Sets the last 5 bytes of the address to zero. The remaining prefix can be associated with a particular manufacturer (using data not included in PostgreSQL).

trunc(macaddr8 '12:34:56:78:90:ab:cd:ef') → 12:34:56:00:00:00:00:00

macaddr8_set7bit ( macaddr8 ) → macaddr8

Sets the 7th bit of the address to one, creating what is known as modified EUI-64, for inclusion in an IPv6 address.

macaddr8_set7bit(macaddr8 '00:34:56:ab:cd:ef') → 02:34:56:ff:fe:ab:cd:ef

**Examples:**

Example 1 (unknown):
```unknown
inet '192.168.1.5' << inet '192.168.1/24'
```

Example 2 (unknown):
```unknown
inet '192.168.0.5' << inet '192.168.1/24'
```

Example 3 (unknown):
```unknown
inet '192.168.1/24' << inet '192.168.1/24'
```

Example 4 (unknown):
```unknown
inet '192.168.1/24' <<= inet '192.168.1/24'
```

---


---

## 9.1. Logical Operators #


**URL:** https://www.postgresql.org/docs/18/functions-logical.html

**Contents:**
- 9.1. Logical Operators #

The usual logical operators are available:

SQL uses a three-valued logic system with true, false, and null, which represents “unknown”. Observe the following truth tables:

The operators AND and OR are commutative, that is, you can switch the left and right operands without affecting the result. (However, it is not guaranteed that the left operand is evaluated before the right operand. See Section 4.2.14 for more information about the order of evaluation of subexpressions.)

---


---

## 9.31. Statistics Information Functions #


**URL:** https://www.postgresql.org/docs/18/functions-statistics.html

**Contents:**
- 9.31. Statistics Information Functions #
  - 9.31.1. Inspecting MCV Lists #

PostgreSQL provides a function to inspect complex statistics defined using the CREATE STATISTICS command.

pg_mcv_list_items returns a set of records describing all items stored in a multi-column MCV list. It returns the following columns:

The pg_mcv_list_items function can be used like this:

Values of the pg_mcv_list type can be obtained only from the pg_statistic_ext_data.stxdmcv column.

**Examples:**

Example 1 (unknown):
```unknown
CREATE STATISTICS
```

Example 2 (unknown):
```unknown
pg_mcv_list_items
```

Example 3 (unknown):
```unknown
pg_mcv_list
```

Example 4 (unknown):
```unknown
setof record
```

---


---

