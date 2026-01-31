# PostgreSQL - Functions (Part 17)

## 9.3. Mathematical Functions and Operators #


**URL:** https://www.postgresql.org/docs/18/functions-math.html

**Contents:**
- 9.3. Mathematical Functions and Operators #
  - Note

Mathematical operators are provided for many PostgreSQL types. For types without standard mathematical conventions (e.g., date/time types) we describe the actual behavior in subsequent sections.

Table 9.4 shows the mathematical operators that are available for the standard numeric types. Unless otherwise noted, operators shown as accepting numeric_type are available for all the types smallint, integer, bigint, numeric, real, and double precision. Operators shown as accepting integral_type are available for the types smallint, integer, and bigint. Except where noted, each form of an operator returns the same data type as its argument(s). Calls involving multiple argument data types, such as integer + numeric, are resolved by using the type appearing later in these lists.

Table 9.4. Mathematical Operators

numeric_type + numeric_type → numeric_type

+ numeric_type → numeric_type

Unary plus (no operation)

numeric_type - numeric_type → numeric_type

- numeric_type → numeric_type

numeric_type * numeric_type → numeric_type

numeric_type / numeric_type → numeric_type

Division (for integral types, division truncates the result towards zero)

5.0 / 2 → 2.5000000000000000

numeric_type % numeric_type → numeric_type

Modulo (remainder); available for smallint, integer, bigint, and numeric

numeric ^ numeric → numeric

double precision ^ double precision → double precision

Unlike typical mathematical practice, multiple uses of ^ will associate left to right by default:

2 ^ (3 ^ 3) → 134217728

|/ double precision → double precision

||/ double precision → double precision

@ numeric_type → numeric_type

integral_type & integral_type → integral_type

integral_type | integral_type → integral_type

integral_type # integral_type → integral_type

~ integral_type → integral_type

integral_type << integer → integral_type

integral_type >> integer → integral_type

Table 9.5 shows the available mathematical functions. Many of these functions are provided in multiple forms with different argument types. Except where noted, any given form of a function returns the same data type as its argument(s); cross-type cases are resolved in the same way as explained above for operators. The functions working with double precision data are mostly implemented on top of the host system's C library; accuracy and behavior in boundary cases can therefore vary depending on the host system.

Table 9.5. Mathematical Functions

abs ( numeric_type ) → numeric_type

cbrt ( double precision ) → double precision

ceil ( numeric ) → numeric

ceil ( double precision ) → double precision

Nearest integer greater than or equal to argument

ceiling ( numeric ) → numeric

ceiling ( double precision ) → double precision

Nearest integer greater than or equal to argument (same as ceil)

degrees ( double precision ) → double precision

Converts radians to degrees

degrees(0.5) → 28.64788975654116

div ( y numeric, x numeric ) → numeric

Integer quotient of y/x (truncates towards zero)

erf ( double precision ) → double precision

erf(1.0) → 0.8427007929497149

erfc ( double precision ) → double precision

Complementary error function (1 - erf(x), without loss of precision for large inputs)

erfc(1.0) → 0.15729920705028513

exp ( numeric ) → numeric

exp ( double precision ) → double precision

Exponential (e raised to the given power)

exp(1.0) → 2.7182818284590452

factorial ( bigint ) → numeric

floor ( numeric ) → numeric

floor ( double precision ) → double precision

Nearest integer less than or equal to argument

gamma ( double precision ) → double precision

gamma(0.5) → 1.772453850905516

gcd ( numeric_type, numeric_type ) → numeric_type

Greatest common divisor (the largest positive number that divides both inputs with no remainder); returns 0 if both inputs are zero; available for integer, bigint, and numeric

lcm ( numeric_type, numeric_type ) → numeric_type

Least common multiple (the smallest strictly positive number that is an integral multiple of both inputs); returns 0 if either input is zero; available for integer, bigint, and numeric

lcm(1071, 462) → 23562

lgamma ( double precision ) → double precision

Natural logarithm of the absolute value of the gamma function

lgamma(1000) → 5905.220423209181

ln ( numeric ) → numeric

ln ( double precision ) → double precision

ln(2.0) → 0.6931471805599453

log ( numeric ) → numeric

log ( double precision ) → double precision

log10 ( numeric ) → numeric

log10 ( double precision ) → double precision

Base 10 logarithm (same as log)

log ( b numeric, x numeric ) → numeric

Logarithm of x to base b

log(2.0, 64.0) → 6.0000000000000000

min_scale ( numeric ) → integer

Minimum scale (number of fractional decimal digits) needed to represent the supplied value precisely

min_scale(8.4100) → 2

mod ( y numeric_type, x numeric_type ) → numeric_type

Remainder of y/x; available for smallint, integer, bigint, and numeric

pi ( ) → double precision

Approximate value of π

pi() → 3.141592653589793

power ( a numeric, b numeric ) → numeric

power ( a double precision, b double precision ) → double precision

a raised to the power of b

radians ( double precision ) → double precision

Converts degrees to radians

radians(45.0) → 0.7853981633974483

round ( numeric ) → numeric

round ( double precision ) → double precision

Rounds to nearest integer. For numeric, ties are broken by rounding away from zero. For double precision, the tie-breaking behavior is platform dependent, but “round to nearest even” is the most common rule.

round ( v numeric, s integer ) → numeric

Rounds v to s decimal places. Ties are broken by rounding away from zero.

round(42.4382, 2) → 42.44

round(1234.56, -1) → 1230

scale ( numeric ) → integer

Scale of the argument (the number of decimal digits in the fractional part)

sign ( numeric ) → numeric

sign ( double precision ) → double precision

Sign of the argument (-1, 0, or +1)

sqrt ( numeric ) → numeric

sqrt ( double precision ) → double precision

sqrt(2) → 1.4142135623730951

trim_scale ( numeric ) → numeric

Reduces the value's scale (number of fractional decimal digits) by removing trailing zeroes

trim_scale(8.4100) → 8.41

trunc ( numeric ) → numeric

trunc ( double precision ) → double precision

Truncates to integer (towards zero)

trunc ( v numeric, s integer ) → numeric

Truncates v to s decimal places

trunc(42.4382, 2) → 42.43

width_bucket ( operand numeric, low numeric, high numeric, count integer ) → integer

width_bucket ( operand double precision, low double precision, high double precision, count integer ) → integer

Returns the number of the bucket in which operand falls in a histogram having count equal-width buckets spanning the range low to high. The buckets have inclusive lower bounds and exclusive upper bounds. Returns 0 for an input less than low, or count+1 for an input greater than or equal to high. If low > high, the behavior is mirror-reversed, with bucket 1 now being the one just below low, and the inclusive bounds now being on the upper side.

width_bucket(5.35, 0.024, 10.06, 5) → 3

width_bucket(9, 10, 0, 10) → 2

width_bucket ( operand anycompatible, thresholds anycompatiblearray ) → integer

Returns the number of the bucket in which operand falls given an array listing the inclusive lower bounds of the buckets. Returns 0 for an input less than the first lower bound. operand and the array elements can be of any type having standard comparison operators. The thresholds array must be sorted, smallest first, or unexpected results will be obtained.

width_bucket(now(), array['yesterday', 'today', 'tomorrow']::timestamptz[]) → 2

Table 9.6 shows functions for generating random numbers.

Table 9.6. Random Functions

random ( ) → double precision

Returns a random value in the range 0.0 <= x < 1.0

random() → 0.897124072839091

random ( min integer, max integer ) → integer

random ( min bigint, max bigint ) → bigint

random ( min numeric, max numeric ) → numeric

Returns a random value in the range min <= x <= max. For type numeric, the result will have the same number of fractional decimal digits as min or max, whichever has more.

random(-0.499, 0.499) → 0.347

random_normal ( [ mean double precision [, stddev double precision ]] ) → double precision

Returns a random value from the normal distribution with the given parameters; mean defaults to 0.0 and stddev defaults to 1.0

random_normal(0.0, 1.0) → 0.051285419

setseed ( double precision ) → void

Sets the seed for subsequent random() and random_normal() calls; argument must be between -1.0 and 1.0, inclusive

The random() and random_normal() functions listed in Table 9.6 use a deterministic pseudo-random number generator. It is fast but not suitable for cryptographic applications; see the pgcrypto module for a more secure alternative. If setseed() is called, the series of results of subsequent calls to these functions in the current session can be repeated by re-issuing setseed() with the same argument. Without any prior setseed() call in the same session, the first call to any of these functions obtains a seed from a platform-dependent source of random bits.

Table 9.7 shows the available trigonometric functions. Each of these functions comes in two variants, one that measures angles in radians and one that measures angles in degrees.

Table 9.7. Trigonometric Functions

acos ( double precision ) → double precision

Inverse cosine, result in radians

acosd ( double precision ) → double precision

Inverse cosine, result in degrees

asin ( double precision ) → double precision

Inverse sine, result in radians

asin(1) → 1.5707963267948966

asind ( double precision ) → double precision

Inverse sine, result in degrees

atan ( double precision ) → double precision

Inverse tangent, result in radians

atan(1) → 0.7853981633974483

atand ( double precision ) → double precision

Inverse tangent, result in degrees

atan2 ( y double precision, x double precision ) → double precision

Inverse tangent of y/x, result in radians

atan2(1, 0) → 1.5707963267948966

atan2d ( y double precision, x double precision ) → double precision

Inverse tangent of y/x, result in degrees

cos ( double precision ) → double precision

Cosine, argument in radians

cosd ( double precision ) → double precision

Cosine, argument in degrees

cot ( double precision ) → double precision

Cotangent, argument in radians

cot(0.5) → 1.830487721712452

cotd ( double precision ) → double precision

Cotangent, argument in degrees

sin ( double precision ) → double precision

Sine, argument in radians

sin(1) → 0.8414709848078965

sind ( double precision ) → double precision

Sine, argument in degrees

tan ( double precision ) → double precision

Tangent, argument in radians

tan(1) → 1.5574077246549023

tand ( double precision ) → double precision

Tangent, argument in degrees

Another way to work with angles measured in degrees is to use the unit transformation functions radians() and degrees() shown earlier. However, using the degree-based trigonometric functions is preferred, as that way avoids round-off error for special cases such as sind(30).

Table 9.8 shows the available hyperbolic functions.

Table 9.8. Hyperbolic Functions

sinh ( double precision ) → double precision

sinh(1) → 1.1752011936438014


*(continued...)*
---

