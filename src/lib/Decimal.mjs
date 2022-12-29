import { getAttributesString } from "./functions.mjs"

if (!String.prototype.padStart) {
	String.prototype.padStart = function padStart(targetLength,padString) {
		targetLength = targetLength>>0; //truncate if number or convert non-number to 0;
		padString = String((typeof padString !== 'undefined' ? padString : ' '));
		if (this.length > targetLength) {
			return String(this);
		}
		else {
			targetLength = targetLength-this.length;
			if (targetLength > padString.length) {
				padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
			}
			return padString.slice(0,targetLength) + String(this);
		}
	};
}

export default class Decimal {
	#i;
	#e;

	constructor(i,e)
	{
		if (isNaN(i)) {
			throw new TypeError(i+' is not a number')
		}
		this.#i = i
		this.#e = e		
	}

	static from(i, e=0)
	{
		if (i instanceof Decimal) {
			return i
		}
		let oi = i
		if (typeof i === 'string') {
			if (i.indexOf('.')!==-1) {
				e = -1 * i.substring(i.indexOf('.')+1).length
			} else {
				e = 0
			}
			i = parseInt(i.replace(/[,.]/g, ''))
		}
		if (isNaN(i)) {
			throw new TypeError(oi+' is not a number')
		}
		if (isNaN(e)) {
			throw new TypeError(e+' is not a number')
		}
		return new Decimal(i, e)
	}

	toJSON()
	{
		return '"'+this.toString()+'"'
	}

	toJSONTag()
	{
		let attributes = getAttributesString(this)
		return '<decimal'+(attributes ? ' ' + attributes : '')+'>'+this.toJSON()
	}

	hoist(a,b)
	{
		a = Decimal.from(a)
		b = Decimal.from(b)
		let [ ai, ae ] = a.toExp()
		let [ bi, be ] = b.toExp()
		if (be<ae) {
			ai = ''+ai
			ai = parseInt(ai + '0'.repeat(ae - be))
			return [ new Decimal(ai, be), b ]
		} else if (be>ae) {
			bi = ''+bi
			bi = parseInt(bi + '0'.repeat(be - ae))
			return [ a, new Decimal(bi, ae)]
		} else {
			return [ a, b ]
		}			
	}

	toString()
	{
		//let d = ''+(this.#i % Math.pow(10,-this.#e))
		// can't do #i * Math.pow(10,this.#e), as it turns #i into a float and loses precision
		let s = ''+this.#i
		let d = ''
		if (this.#e<0) {
			d = s.substring(s.length+this.#e)
			s = s.substring(0, s.length+this.#e)
		} else {
			d = ''
			s = s + '0'.repeat(this.#e)
		}
		return s + (d ? '.' + d.padStart(-this.#e, '0') : '')
	}

	toExp()
	{
		return [this.#i, this.#e]
	}

	multiplyWith(n)
	{
		n = Decimal.from(n)
		let [ ni, ne ] = n.toExp()
		return new Decimal( this.#i * ni, this.#e + ne )
	}

	divideBy(n)
	{
		n = Decimal.from(n)
		let [ ni, ne ] = n.toExp()
		return new Decimal( this.#i / ni, this.#e - ne)
	}

	add(n)
	{
		let [ t,  nn ] = this.hoist(this, n)
		let [ ti, te ] = t.toExp()
		let [ ni, ne ] = nn.toExp()
		return new Decimal(ti + ni, te)
	}

	subtract(n)
	{
		let [ t,  nn ] = this.hoist(this, n)
		let [ ti, te ] = t.toExp()
		let [ ni, ne ] = nn.toExp()
		return new Decimal(ti - ni, te)
	}

	compareWith(n)
	{
		let [ t,  nn ] = this.hoist(this, n)
		let [ ti, te ] = t.toExp()
		let [ ni, ne ] = nn.toExp()
		let d = ti - ni
		if (d<0) {
			return -1
		} else if (d>0) {
			return 1
		} else {
			return 0
		}
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
		let s = ''+this.#i
		if ((this.#e+e)<0) {
			s = s.substring(0, s.length+(this.#e+e))
		} else {
			s = s + '0'.repeat(this.#e+e)
		}
		return new Decimal(parseInt(s),e)
	}

	ceil(e=0)
	{
		let s = ''+this.#i
		let d = ''
		if ((this.#e+e)<0) {
			d = parseInt(s.substring(s.length+(this.#e+e)))
			s = s.substring(0, s.length+(this.#e+e))
		} else {
			d = 0
			s = s + '0'.repeat(this.#e+e)
		}
		return new Decimal(parseInt(s)+(d?1:0),e)
	}

	round(e=0)
	{
		let s = ''+this.#i
		let d = ''
		if ((this.#e+e)<0) {
			d = s.substring(s.length+(this.#e+e))
			s = s.substring(0, s.length+(this.#e+e))
		} else {
			d = '0'
			s = s + '0'.repeat(this.#e+e)
		}
		return new Decimal(parseInt(s)+(parseInt(d[0])>=5?1:0),e)
	}
}