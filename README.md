# JSONTag: Tagged JSON

JSON has won the battle for universal data interchange format. There are still some holdouts using XML or SOAP, but if you start a new online API today, the default is JSON. Even the linked data proponents have made a JSON version, called JSON-LD.

However, JSON has a problem. It is too restricted. There are too few basic data types. This means that if you do need to specify a specific data type, like `Date`, you must go out of your way to either define a JSON Schema, or, another external definition, like JSON-LD does. This leads to unnecessary complexity.

Instead of creating another Something-in-JSON format, JSONTag enhances the JSON format with additional type information inline. Every JSON file is valid JSONTag. Every JSONTag file can be easily stripped of type information to get valid JSON.

JSONTag looks like this:
```
<object class="Person">{
	"name": "John",
	"dob": <date>"1972-09-20"
}
```

Type information is inserted immediately in front of a value, enclosed in `<` and `>` characters. There is a restricted list of types. But you can add extra attributes to the types for more information.

For example, though there is only one type `object`, just like in JSON, you can enhance it with attributes. Here we've added the `class` attribute. The type syntax is based heavily on the HTML tag syntax. There is one difference, attribute names are more restricted. You aren't allowed to use the `-` character in an attribute name. This is because it leads to less readable code in most programming languages.

## Install / Usage

```shell
npm install @muze-nl/JSONTag
```

In the browser:

```html
<script src="/node_modules/JSONT/dist/browser.js"></script>
<script>
    let p = JSONTag.parse('<object class="Person">{"name":"John"}')
    let s = JSONTag.stringify(p)
</script>
```

In node:
```javascript
import JSONTag from 'JSONTag'

let p = JSONTag.parse('<object class="Person">{"name":"John"}')
let s = JSONTag.stringify(p)
```

## JSONTag Types

The list below is preliminary. The aim is to have a good coverage of most used or useful types, without creating an unwieldy specification. It should be only slightly harder to implement JSONTag support compared to JSON support. Some inspiration was taken from HTML, PostgreSQL and [RED](https://red-lang.org)

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

## Circular data, or references

One shortcoming of JSON is that it cannot represent data with internal references. JSONTag solves this by introducing the `<link>` type. Here's an example:

```
<object id="source">{
	"foo":{
		"bar":"Baz"
	},
	"bar":<link>"#source"
}
```	

When parsed the property `bar` is a reference to the parent object of that property. The current stringify implementation (javascript) automatically add `id` attributes and `link` values when a reference to a previous value is found.

This allows for complex graphs to be serialized to JSONTag and revived correctly. The `<link>` type does not specify a specific format, other that a string. It is implied that the URL format is explicitly supported as the default.

## Typed Null values

JSON only supports a single `null` value. Each null is identical to each other null. This makes it impossible to add type and attribute information to it. So JSONTag uses a Null class. Each instance of the Null class is unique. The Null class has no properties or methods, except for:
- isNull: property, always true
- toString: returns ''
- toJSON: returns 'null'
- toJSONTag: return typeInfo + 'null'

Any access to other properties or methods results in an exception

Because JSONTag now can keep type and attribute information, you could create your own typed Null object when reviving JSONTag data.

## Monkeypatching

Upgrade a program to use JSONTag by:

```javascript
JSON.parse = JSONTag.parse
JSON.stringify = JSONTag.stringify
```

Since the API is identical this just works. Use at your own risk however...

## Reviver extension

JSON.Parse has a `reviver` parameter, and JSONTag.parse has it too. It is fully backwards compatible, but it adds an extra parameter:

```javascript
let result = JSONTag.parse(JSONTag, function(key, value, meta) {

})
```

The extra meta parameter is an object with an `ids` property, which is an object with all `id` attribute values found in the JSONTag text. As well as a `unresolved` property, which is an array with all `<link>` values, which haven't yet been resolved.

## TODO

- implement parser rules for:
	- int
	- float
	- color
	- email
	- hash
	- interval
	- phone
	- range
	- url

- figure out if the URL parser must become strict, to avoid server-side request forgery using differences in the parsing of invalid URLs

- tie down decimal format, money format, allow "," in money format, only every 3 digits

- add stub type class for most JSONTag types

- write more tests


## Motivation

You might be wondering why someone would create yet another data interchange format. What is wrong with all the stuff that already exists?

For that, I need some background. I've long wondered how and why the Web has gotten so big and universal, in such a short time. And why it has staying power. Lots of smart people have criticized certain design principles of the web. Specifically the limitations in HTML, how it for a long time didn't allow extensions. There was no concept of abstractions building on top of eachother, like we're used to in programming language. So later on we got XML (and XHTML), trying to fix (among other things) that lack of abstraction.

And yet, XML has lost to JSON, which again has no concept of adding new abstractions. 

With the semantic web and Linked Data, people all over the world are trying to build a new data-centric (or knowledge-centric) web. One of the attempts to make this more popular is to embrace JSON (with JSON-LD) and extend it to support meta information, or specifically meaning, semantics. However, this hasn't really worked yet. 

Given a list of things that have worked, read: become popular or even universal, versus the list of things that have not become popular, I found one common thing:

All popular formats are fundamentally limited. You cannot extend the format itself.

The hypothesis, which JSONTag is trying to prove, is that by fixing the format, every implementation is also fixed, so there are no dialects. Everyone is talking the same language. Therefor, it becomes trivial to support it everywhere.

Whereas more powerfull formats, which do allows for extension, e.g. XML, become fragmented.

I believe that the Linked Data world is such a fragmented world. There are islands of interoperability, where organizations have agreed to a set of common ontologies. But if you step outside those islands, there is no common base. Attempts like dublin core and skos, fail because they are so broad that you can't use it without an academic level comprehension of linked data and knowledge bases.

With JSONTag I'm attempting to create such a base. The idea is that by broadening JSON, and keeping it backwards compatible, it will be easy for programmers to incorporate. The next step is to create a universal JSONTag client, just like the browser is a universal HTML client. This universal JSONTag client should be able to render any JSONTag in human readable format. You should be able to query it and edit it. And you should be able to add scripts. This client will most probably be an extension on the normal web browser, hopefully just by adding some javascript.

Once this universal client exists, I'm hoping that Linked Data will be a normal and sensible progression from that base. For that reason I'm also creating a JSONTag ontology. This ontology differs from the usual Linked Data ontologies, in that it only specifies the format of its Subjects, not the meaning. So there will be no 'startDate' or 'endDate', just 'date'. But hopefully because of that, it may become a kind of low level glue that connects different ontologies.

Because I would like Linked Data to be a natural fit for JSONTag, I haven't (yet) limited what kind of attributes you can add. JSONTag itself defines just two:
- id
- class

## Details and choices made

### strict parsing

Because I intend to use JSONTag as a data interchange format, I've added strict value parsing for all types. So if you specify some value is a `<date>`, its value must conform to the date syntax, or the parser will throw a parse error. The aim is to prevent corrupt data, or data that can be interpreted in multiple ways, to be passed or stored.

### The meaning of the id attribute

There are potential semantics conflicts of the term `id`. If we encode a set of data from a SQL database, it is common to have a specific `id` value for each record or row. This would commonly be encoded in JSON like this:

```JSON
[
	{
		"id": 1,
		"name": "foo"
	}
]
```

This is a different use case of `id` than the id attribute in JSONTag. JSON-LD has the potential for the same confusion. Because JSON-LD is 100% JSON, there is no way to encode the JSON-LD attribute outside the normal JSON format. Instead there the id value is encoded like this:

```JSON
[
	{
		"@id": "https://example.org/my-id",
		"name": "foo"
	}
]
```

The `@` marks it as 'meta data', not part of the normal dataset.

In JSONTag there is a way to encode it outside of the normal JSON data, using an attribute on a tag. This way we don't have to change or add a value, only tag a value with an id attribute:

```
[
	<object id="foo">{
		"name": "foo"
	}
]
```

This id can then be referenced, e.g. by a `<link>` value.

### link and id

When JSONTag.stringify encounters an object it has already seen, it will insert a `<link>` value instead. The value is an autogenerated id, such as:

```
<link>"#71ff0cb1-6026-4ddb-be6a-250c40242649"
```

The original object then gets a new id attribute:

```
<object id="71ff0cb1-6026-4ddb-be6a-250c40242649">{
	...
}
```

An alternative implementation is to use a JSON Path pointer, e.g.:

```
{
	"foo": {
		"name": "This is a foo"
	},
	"bar": <link>"/foo/"
}
```

Here the `"bar"` entry is a reference to the `"foo"` entry. This is similar to the `recycle` implementation of Douglas Crockford. But it does require that `stringify` keeps track of all paths to all objects. With a link to an id there is no need for that. It does introduce an extra attribute, which a JSON Path reference doesn't need though. So the stringify implementation may change in the future.

### link values

A `<link>` value has a special meaning in JSONTag. It means 'this is a placeholder, the real value can be found somewhere else'. The value of a `<link>` is therefor a pointer. There are three potential pointer values:
- A reference to an id: "#id"
- A JSON Path: "/some/path/"
- A URL: "https://exameple.org/foo/"

In fact all three values are valid URL's, but the way the parser interprets them differs. If a link references an id, the parser will attempt to find the value tagged with that id and replace the link with a reference to that value. It does this automatically.

Currently it doesn't handle the JSON Path, but this is on the roadmap.

As for URL's, the parser leaves these link values alone, but you can create a reviver function for use with JSONTag.parse, which can automatically fetch those URL's and replace the links with the fetched data. The reviver function in JSONTag.parse is called with an extra `meta` parameter, which contains all unresolved links, just for this purpose.

The `<link>` value is explicitly designed to support Linked Data later on.

### Date and Datetime

Since the point of JSONTag is to create a data interchange format, not primarily a human readable format, I've opted to force all date related types to use universal time (GMT). Adding timezones creates the possibility of confusion and errors. Each client parsing the JSONTag data should apply timezones if needed.

I've used the simplified ISO 8601 format as described in RFC 3339, since it allows for easy sorting and is already a widely used internet standard.

### Decimal and Money

Using floats for monetary values is one of the most common and costly mistakes beginning programmers make. So I've added explicit decimal and money types to JSONTag to help avoid that. I've encoded them as string values, instead of number values, to make explicit that they aren't floats, even if you remove all tags from a JSONTag file.

### Nil and null

There are many articles and papers written about the problems with `null`. I would like it if JSONTag could somehow improve the situation. However a clear and non-negiotable line in the sand was that JSONTag must be 100% backwards compatible with JSON. So JSONTag must support the `null` value exactly as JSON does.

This means that all `null` values are identical. And therefor JSONTag cannot add tags to null values. Or at least, if it did, each tagged null value would have to become something other than the javascript `null` object.

So instead I've added support for typed null objects with the keyword `Nil`. This is the only case where I've introduced a value that is not JSON compatible. e.g.:

```
{
	"foo": Nil
}
```

The above is valid JSONTag, but not valid JSON, even though it doesn't use tags. In this case you would not use `Nil`, since it is only useful if you do add a tag, e.g:

```
{
	"foo": <object class="person">Nil
}
```

Now it makes much more sense. `"foo"` is a reference to Person object, currently empty. A parser could now interpret this to create a `NullPerson` instance, which at least gives you the option to keep the `Person` semantics intact, even though there is no person linked yet.

The current parser will automatically create an instance of the JSONTag.Nil class whenever it encounters a Nil value. You can override this in a reviver function.

The choice to use Nil here instead of null, may change in the future. The parser could just as easily parse `<object class="Person">null` in the same way. The fact that there is a tag can be construed to force a Null object when parsing. For now this is invalid JSONTag and the parser will object.

### JSONTag Type classes

I've opted not to construct objects with specific classes based on the type of tag it was encoded with. Instead the default value that JSONTag.parse will return is exactly the same as JSON.parse would return, if not tags were set. With the only exception being the `Nil` value, as JSON doesn't have that.

The idea is to make it as simple as possible to retrofit any current codebase to use JSONTag instead of JSON. 

Instead there is a set of JSONTag functions that you can use to find out what type a value was encoded as, or which attributes were added to a value. This is why I did not call it 'Typed JSON' (besides that the name was already taken), but 'Tagged JSON'. It is the most minimally intrusive addition I could find, which still enables advanced usages like adding meaning to data, without touching the data itself.

If you do want to create specific classes of objects based on the tag or attributes, you can do so in your own reviver function. Or if you want to use the classes provided with JSONTag, you can use `JSONTag.reviver` as the reviver function.

The purpose of the type classe provided with JSONTag is mostly documentary. It is to document in code what the semantics, the workings of each type is supposed to be. So they have been kept purposely small and simple. They are also immutable by default, following the [value object](https://en.wikipedia.org/wiki/Value_object) paradigm from Domain-Driven Design (DDD)
