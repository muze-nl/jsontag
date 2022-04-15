import * as TSON from './functions.mjs'

export default class TSONObject {

	toJSON()
	{
		return JSON.stringify(this)
	}

	toTSON()
	{
		let classlist = TSON.getAttribute(this,'class')
		let list = []
		if (typeof classlist === 'string') {
			list = [classlist]
			let attrs = TSON.getAttributes(this)
			delete attrs.class
			attrs = Object.keys(attrs).map(attr => {
				let attrValue = attrs[attr]
				if (Array.isArray(attrValue)) {
					attrValue = attrValue.join(' ')
				}	
				return attr+'="'+attrValue+'"'
			}).join(' ')
			if (attrs) {
				list.push(attrs)
			}
		} else {
			list = ['object']
			let attrs = TSON.getAttributesString(this)
			if (attrs) {
				list.push(attrs)
			}
		}
		return '<'+list.join(' ')+'>{'+TSON.encodeProperties(this)+'}'
	}
}