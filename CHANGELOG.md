# Changelog

## 0.11.0 - 2026-10-08

This release contains breaking changes. Check the first section before
upgrading.

### Breaking changes

- `<int64>` and `<uint64>` values are parsed as a `BigInt` object instead of a
  `Number`. A `Number` loses precision above 2^53, e.g.
  `<int64>9223372036854775807` was parsed as `9223372036854776000`. A `BigInt`
  cannot be mixed with numbers in arithmetic: use `value + 1n` or
  `Number(value) + 1`.
- `<timestamp>` values are parsed as a `Number` object if they are a safe
  integer, and as a `BigInt` object otherwise, e.g. for timestamps in
  nanoseconds.
- Repeated references are written as path links, e.g. `<link>"#!/people/3"`,
  instead of adding random `id` attributes. `stringify` no longer changes its
  input, and gives the same output for the same input. Objects that already
  have an `id` attribute are still linked by their id. Older versions of
  JSONTag cannot resolve path links.
- `Date` objects are written as `<datetime>"1970-01-01T00:00:00.000Z"`.
  Previously they were written as an object with one property per character.
  An invalid date is written as `<datetime>null`.
- `setType` throws a `TypeError` if the type does not fit the value, e.g.
  `setType(new String('abc'), 'int')`.
- `stringify` throws a `TypeError` instead of writing output that the parser,
  or other implementations, would reject or misread:
  - `Map`, `Set`, `WeakMap` and `WeakSet`, which would lose their contents.
    Convert them first, with `toJSON()` or a replacer.
  - Typed numbers that do not fit their type, e.g. `<int8>300` or `<int>1.5`.
  - Numbers that are integers larger than 2^53, also untyped, e.g. `2**60`
    or `1e300`. These may already have lost precision. Write a `BigInt`
    instead, or set a float type, e.g. `<float64>`.
  - A `Number` typed as `int64`, `uint64` or `timestamp` that is not a safe
    integer.
  - A `Boolean` object with attributes, which the parser cannot read.
  - Attribute names that the parser cannot read. A name must start with a
    letter, followed by letters, digits or `_`.
  - A `BigInt` that does not fit in 64 bits.
  - Strings, keys and attribute values that contain an unpaired UTF-16
    surrogate, e.g. `"\uD800"`. These cannot be encoded as UTF-8, and are
    rejected by e.g. Rust. Often this is a string cut in the middle of an
    emoji, e.g. by `slice()`.
  - A `space` string that contains anything else than spaces, tabs and
    newlines.
- The parser rejects path links that point to a value later in the document.
- The parser rejects integers larger than 2^53, also in plain JSON, e.g.
  `{"id":9007199254740993}`, and also `<number>` values and large floats
  without a float type, like `1e300`. As a `Number` they would silently lose
  precision. So not every JSON document is valid JSONTag anymore. Use
  `<int64>`, `<uint64>` or a float type for these numbers.
- `<int>` and `<uint>` must be safe integers, from -(2^53-1) to 2^53-1.
- The replacer function now works as in `JSON.stringify`:
  - It is called after `toJSON()`, so it sees the converted value.
  - It is called for the root value, with the key `""`.
  - It is called once per value. String values were passed through it twice.
  - Array indexes are passed as strings.
- An array replacer writes the properties in the order of the array, and
  accepts numbers, as in `JSON.stringify`.

### Added

- `stringify` writes a `BigInt` as `<int64>`, or as `<uint64>` if it is larger
  than the int64 maximum.
- A `BigInt` object, e.g. `Object(5n)`, can have a type and attributes.
  `setType` accepts the integer types and `timestamp` for it.
- `getType` returns `int64` or `uint64` for a `BigInt`.
- `<date>` and `<datetime>` accept expanded years: a sign followed by at
  least four digits, e.g. `<datetime>"+010000-01-01T00:00:00.000Z"` or
  `<date>"-0001-01-01"`. A `Date` outside the years 0 to 9999 is written this
  way, as `toISOString()` does. A negative year cannot be zero, e.g. `-0000`,
  as in ISO 8601.
- `JSONTag.isZero(value)`, because typed numbers are parsed as wrapper
  objects, which are always truthy, even when their value is zero.
- `JSONTag.quoteString`, `assertUnicode`, `formatNumber` and `isBigIntValue`,
  so that other serializers, like od-jsontag, write values exactly as
  `stringify` does.

### Fixed

- Hexadecimal colors, like `<color>"#abc"`, were always rejected by the
  parser.
- `<date>` rejected the years 0000 to 0999, which `<datetime>` accepted.
- A property set to `undefined`, also by a replacer, is left out instead of
  written as `null`.
- Functions and symbols are left out, or written as `null` in arrays, as in
  `JSON.stringify`. Functions threw an error, symbols produced invalid output.
- An object with a `toJSON()` method that returns a string was written as an
  object with one property per character.
- `toJSON()` is called with the property key.
- An untyped `String` object was written as an object with one property per
  character.
- `space` is limited to 10 characters, as in `JSON.stringify`. A negative
  number threw an error, and a very large number could run out of memory.
- Empty objects and arrays are written as `{}` and `[]` when indenting.
- Circular arrays caused a stack overflow.
- Shared arrays were written twice, and were no longer shared after parsing.
- A shared typed string, `Link` or typed null was written twice with the same
  `id` attribute.
- An object shared through `toJSON()` or a replacer was linked to an id that
  was never written.
- Attribute values are written with JSON escapes, as the parser reads them.
  A backslash or newline in an attribute value was corrupted or produced
  invalid output.
- A `Number` typed as `int64` above 2^53 was written in its shortest form,
  which parsed to a different `BigInt`.
- Invalid `<int64>`, `<uint64>` and `<timestamp>` values, like `1.5`, now give
  a parser error instead of the error from `BigInt()`.
- `clone` copies `BigInt` objects, which became empty objects, and `Boolean`
  objects, where `false` became `true`.

### Performance

- `stringify` is about 10% faster, because it no longer inspects the data
  before writing it.
- Parsing documents with many links to the same object is about 3 times
  faster.
- Parsing plain JSON is about 10% slower, because every number is checked
  for precision loss.
