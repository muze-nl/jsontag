import Link from './lib/Link.mjs'
import Null from './lib/Null.mjs'

import * as attr from './lib/functions.mjs'
import parseStream from './lib/streaming-parse.mjs'
import parse from './lib/fast-parse.mjs'

export default class JSONTag 
{

	static {
		JSONTag.stringify   = attr.stringify
		JSONTag.parse       = parse
		JSONTag.parseStream = parseStream

		JSONTag.getType       = attr.getType
		JSONTag.setType       = attr.setType
		JSONTag.getTypeString = attr.getTypeString

		JSONTag.setAttribute        = attr.setAttribute
		JSONTag.getAttribute        = attr.getAttribute
		JSONTag.addAttribute        = attr.addAttribute
		JSONTag.removeAttribute     = attr.removeAttribute
		JSONTag.getAttributes       = attr.getAttributes
		JSONTag.setAttributes       = attr.setAttributes
		JSONTag.getAttributesString = attr.getAttributesString
		
		JSONTag.isNull = attr.isNull
		JSONTag.clone  = attr.clone

		JSONTag.Link = Link
		JSONTag.Null = Null

	}

}