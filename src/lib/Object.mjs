import TSONType from './TSONType.mjs'
import { encodeProperties } from './functions.mjs'

export default class TSONObject extends TSONType {

	constructor()
	{
		super()
	}

	toJSON()
	{
		return JSON.stringify(this)
	}

	toTSON()
	{
		let classlist=this.getAttribute('class')
		let list = []
		if (typeof classlist === 'string') {
			list = [classlist]
			let attrs = this.getAttributes()
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
			let attrs = this.getAttributesString()
			if (attrs) {
				list.push(attrs)
			}
		}
		return '<'+list.join(' ')+'>{'+encodeProperties(this)+'}'
	}
}