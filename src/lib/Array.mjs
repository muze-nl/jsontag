import TSONType from './TSONType.mjs'
import TSON from '../TSON.mjs'

export default class TSONArray extends Array {

	#attributes={};

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
		let list = ['array']
		let attrs = this.getAttributesString()
		if (attrs) {
			list.push(attrs)
		}
		return '<'+list.join(' ')+'>['+TSON.encodeEntries(this)+']'
	}

	setAttribute(attr, value)
	{
		if (typeof value !== 'string') {
			throw new TypeError('attribute values must be a string')
		}
		if (value.indexOf('"')!==-1) {
			throw new TypeError('attribute values must not contain " character')
		}
		if (value.indexOf(' ')!==-1) {
			value = value.split(" ")
		}
		this.#attributes[attr] = value
	}

	getAttribute(attr)
	{
		return this.#attributes[attr]
	}

	addAttribute(attr, value)
	{
		if (typeof value !== 'string') {
			throw new TypeError('attribute values must be a string')
		}
		if (value.indexOf('"')!==-1) {
			throw new TypeError('attribute values must not contain " characters')
		}	
		if (typeof this.#attributes[attr] === 'undefined') {
			this.setAttribute(attr, value)
		} else {
			if (!Array.isArray(this.#attributes[attr])) {
				this.#attributes[attr] = [ this.#attributes[attr] ]
			}
			if (value.indexOf(' ')!==-1) {
				value = value.split(" ")
			} else {
				value = [ value ]
			}
			this.#attributes[attr] = this.#attributes[attr].concat(value)
		}
	}

	removeAttribute(attr)
	{
		if ( typeof this.#attributes[attr] !== 'undefined') {
			delete this.#attributes[attr]
		}
	}

	getAttributes()
	{
		return JSON.parse(JSON.stringify(this.#attributes))
	}

	getAttributesString()
	{
		return Object.keys(this.#attributes).map(attr => {
			return attr+'="'+(this.#attributes[attr].join(' '))+'"'
		}).join(' ')
	}
}
