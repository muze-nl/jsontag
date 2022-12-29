import Decimal from './Decimal.mjs'
import { getAttributesString } from "./functions.mjs"

export default class Money {

	#c; 
	#i; 
	#e;

	constructor(c, i, e=null)
	{
		if (i instanceof Decimal) {
			[i, e] = i.toExp()
		} else if (isNaN(i)) {
			throw new TypeError(i+' is not a number')
		}
		if (e==0) {
			e = -2;
			i = 100 * i;
		}
		this.#i = i
		this.#e = e		
		this.#c = c
	}

	static from(c, i=0, e=0)
	{
		if (c instanceof Money) {
			return c
		}
		if (typeof c === 'string') {
			if (c.indexOf('$') !== -1) {
				e = -1 * c.substring(c.indexOf('.')+1).length
				i = parseInt(c.substring(c.indexOf('$')+1).replace(/[,.]/g, ''))
				c = c.substring(0, c.indexOf('$'))
			} else {
				if (!(i instanceof Decimal)) {
					i = Decimal.from(i,e)
				}
				[ i, e ] = i.toExp()
			}
		}
		return new Money(c, i, e)
	}

	toJSON()
	{
		return '"' + this.#c + '$' + Math.floor(this.#i * Math.pow(10,this.#e)) + '.' + (this.#i % Math.pow(10,-this.#e)) +'"'
	}

	toJSONTag()
	{
		let attributes = getAttributesString(this)
		return '<money'+(attributes ? ' ' + attributes : '')+'>'+this.toJSON()
	}

	toString()
	{
		let d = ''+(this.#i % Math.pow(10,-this.#e))
		return this.#c + '$' + Math.floor(this.#i * Math.pow(10,this.#e)) + '.' + d.padStart(-this.#e, '0')
	}

	toExp()
	{
		return [this.#i, this.#e]
	}

	getCurrency()
	{
		return this.#c
	}

	multiplyWith(n)
	{
		let Dt = new Decimal(this.#i, this.#e)
		return new Money(this.#c, Dt.multiplyWith(n))
	}

	divideBy(n)
	{
		let Dt = new Decimal(this.#i, this.#e)
		return new Money(this.#c, Dt.divideBy(n))
	}

	add(n)
	{
		n = Money.from(n)
		if (n.getCurrency()!==this.#c) {
			throw new TypeError('You cannot add different curreency values')
		}
		let [ ni, ne ] = n.toExp()
		let Dn = new Decimal(ni, ne)
		let Dt = new Decimal(this.#i, this.#e)
		return new Money(this.#c, Dt.add(Dn))
	}

	subtract(n)
	{
		n = Money.from(n)
		if (n.getCurrency()!==this.#c) {
			throw new TypeError('You cannot subtract different currency values')
		}
		let [ ni, ne ] = n.toExp()
		let Dn = new Decimal(ni, ne)
		let Dt = new Decimal(this.#i, this.#e)
		return new Money(this.#c, Dt.subtract(Dn))
	}

	compareWith(n)
	{
		n = Money.from(n)
		if (n.getCurrency()!==this.#c) {
			throw new TypeError('You cannot compare different currency values')
		}
		let [ ni, ne ] = n.toExp()
		let Dn = new Decimal(ni, ne)
		let Dt = new Decimal(this.#i, this.#e)
		Dt.compareWith(Dn)
	}

	isLessThan(n)
	{
		return this.compare(n)===1
	}

	isMoreThan(n)
	{
		return this.compare(n)===-1
	}

	isEqualTo(n)
	{
		return this.compare(n)===0
	}

	toPrecision(e)
	{
		return this.round(e)
	}

	floor(e=0)
	{
		return Money.from(this.#c, new Decimal(this.#i, this.#e).floor(e))
	}

	ceil(e=0)
	{
		return Money.from(this.#c, new Decimal(this.#i, this.#e).ceil(e))
	}

	round(e=0)
	{
		return Money.from(this.#c, new Decimal(this.#i, this.#e).round(e))
	}
}