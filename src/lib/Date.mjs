import { getAttributesString } from "./functions.mjs"

function getISODate(epoch)
{
	let date  = new Date(epoch)
	let year  = date.getFullYear()
	let month = '0'+(date.getMonth()+1) // january gives 0
	month     = month.substring(month.length-2)
	let days  = '0'+date.getDate()
	days      = days.substring(days.length-2)
	return year+'-'+month+'-'+days	
}

export default class myDate {
	#date

	constructor(str)
	{
		let re = /^(\d{4}-(\d\d)-(\d\d))$/
		if (re.exec(str)) {
			this.#date = new Date(Date.parse(str))
		} else {
			throw new Error(str+' is not a valid date')
		}
	}

	static from(str)
	{
		if (str instanceof myDate) {
			return str
		}
		if (typeof str === 'object' && typeof str.getISODate === 'function') {
			str = getISODate(str.getTime())
		}
		return new myDate(str)
	}

	toDate()
	{
		return new myDate(this.#date.getTime())
	}

	getDate()
	{
		return this.#date.getDate()
	}

	getDay()
	{
		return this.#date.getDay()
	}

	getFullYear()
	{
		return this.#date.getFullYear()
	}

	getMonth()
	{
		return this.#date.getMonth()
	}

	getYear()
	{
		return this.#date.getYear()
	}

	toString()
	{
		return getISODate(this.#date.getTime())
	}

	toJSON()
	{
		return this.toString()
	}

	toJSONTag()
	{
		let attributes = getAttributesString(this)
		return '<date'+(attributes ? ' ' + attributes : '')+'>'+this.toJSON()
	}
}