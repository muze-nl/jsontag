import TSONType from './TSONType.mjs'
import TSON from '../TSON.mjs'

export default class Object extends TSONType {
	toJSON()
	{
		return JSON.stringify(this)
	}

	toTSON()
	{
		let list = ['object']
		let attrs = this.getAttributesString()
		if (attrs) {
			list.push(attrs)
		}
		return '<'+list.join(' ')+'>{'+TSON.encodeProperties(this)+'}'
	}
}