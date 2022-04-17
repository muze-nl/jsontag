# TSON: Typed JSON

JSON has won the battle for universal data interchange format. There are still some holdouts using XML or SOAP, but if you start a new online API today, the default is JSON. Even the linked data proponents have made a JSON version, called JSON-LD.

However, JSON has a problem. It is too restricted. There are too few basic data types. This means that if you do need to specify a specific data type, like `Date`, you must go out of your way to either define a JSON Schema, or, another external definition, like JSON-LD does. This leads to unnecessary complexity.

Instead of creating another Something-in-JSON format, TSON enhances the JSON format with additional type information inline. Every JSON file is valid TSON. Every TSON file can be easily stripped of type information to get valid JSON.

TSON looks like this:
```
<object class="Person">{
	"name": "John",
	"dob": <date>"1972-09-20"
}
```

Type information is inserted immediately in front of a value, enclosed in `<` and `>` characters. There is a restricted list of types. But you can add extra attributes to the types for more information.

For example, though there is only one type `object`, just like in JSON, you can enhance it with attributes. Here we've added the `class` attribute. The type syntax is based heavily on the HTML tag syntax. There is one difference, attribute names are more restricted. You aren't allowed to use the `-` character in an attribute name. This is because it leads to less readable code in most programming languages.

## TSON Types

The list below is preliminary. The aim is to have a good coverage of most used or useful types, without creating an unwieldy specification. It should be only slightly harder to implement TSON support compared to JSON support. Some inspiration was taken from HTML, PostgreSQL and [RED](https://red-lang.org)

### JSON derived

- boolean
- number
- string
- object
- array

### Lowlevel scalars

- text
- blob
- int (unit, int8, uint8, int16, uint16, int32, uint32, int64, uint64)
- float (float32, float64)

### Semantic types

- color
- date
- decimal
- email
- hash
- interval
- link
- money
- phone
- range
- time
- timestamp
- url
- uuid

## Circular data

One shortcoming of JSON is that it cannot represent data with internal references. TSON solves this by introducing the `<link>` type. Here's an example:

```
<object id="source">{
	"foo":{
		"bar":"Baz"
	},
	"bar":<link>"#source"
}
```	

When parsed the property `bar` is a reference to the parent object of that property. The current stringify implementation (javascript) automatically add `id` attributes and `link` values when a reference to a previous value is found.
