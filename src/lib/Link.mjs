import { getAttributesString } from "./functions.mjs"

export default class Link {
	#url;

	constructor(url)
	{
		this.#url = ''+url
	}

	static from(url)
	{
		if (url instanceof Link) {
			return url
		}
		return new Link(url)
	}

	get value()
	{
		return this.#url
	}

	toString()
	{
		return this.#url
	}

	toJSON()
	{
		return '"'+this.#url+'"'
	}

	toJSONTag()
	{
		let attributes = getAttributesString(this)
		return '<link'+(attributes ? ' ' + attributes : '')+'>'+this.toJSON()
	}

}