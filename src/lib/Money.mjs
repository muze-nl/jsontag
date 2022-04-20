import Decimal from './Decimal.mjs'

export default class Money {

	#c; 
	#i; 
	#e;

	constructor(c, i, e=null)
	{
		if (isNaN(i)) {
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
				console.log(c.substring(c.indexOf('$')))
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

	toTSON()
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
		n = Decimal.from(n)
		let [ ni, ne ] = n.toExp()
		return new Money( this.#c, this.#i * ni, this.#e + ne )
	}

	divideBy(n)
	{
		n = Decimal.from(n)
		let [ ni, ne ] = n.toExp()
		return new Money( this.#c, this.#i / ni, this.#e - ne)
	}

	add(n)
	{
		n = Money.from(n)
		if (n.getCurrency()!==this.#c) {
			throw new TypeError('You cannot add different curreency values')
		}
		let [ ni, ne ] = n.toExp()
		if (ne<this.#e) {
			ni = Math.pow(10, (this.#e - ne)) * ni
			return new Money(this.#c, this.#i + ni, this.#e)
		} else if (ne>this.#e) {
			let i = Math.pow(10, (ne - this.#e)) * this.#i
			return new Money(this.#c, i + ni, ne)
		} else {
			return new Money(this.#c, ni + this.#i, this.#e)
		}
	}

	subtract(n)
	{
		n = Money.from(n)
		if (n.getCurrency()!==this.#c) {
			throw new TypeError('You cannot subtract different currency values')
		}
		let [ ni, ne ] = n.toExp()
		if (ne<this.#e) {
			ni = Math.pow(10, (this.#e - ne)) * ni
			return new Decimal(this.#i - ni, this.#e)
		} else if (ne>this.#e) {
			let i = Math.pow(10, (ne - this.#e)) * this.#i
			return new Decimal(i - ni, ne)
		} else {
			return new Decimal(this.#i - ni, this.#e)
		}
	}

	compareWith(n)
	{
		n = Money.from(n)
		if (n.getCurrency()!==this.#c) {
			throw new TypeError('You cannot compare different currency values')
		}
		let [ ni, ne ] = n.toExp()
		if (ne<this.#e) {
			return -1
		}
		if (ne>this.#e) {
			return 1
		}
		if (ni<this.#i) {
			return -1
		}
		if (ni>this.#i) {
			return 1
		}
		return 0
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