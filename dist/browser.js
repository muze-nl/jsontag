(() => {
  // src/lib/functions.mjs
  var jsonStringify = JSON.stringify;
  var stringify = (value, replacer = null, space = "") => {
    const objectReferences = /* @__PURE__ */ new WeakMap();
    let indent = "";
    let gap = "";
    if (typeof space === "number") {
      indent += " ".repeat(space);
    } else if (typeof space === "string") {
      indent = space;
    }
    if (replacer && typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number")) {
      throw new Error("JSONTag.stringify");
    }
    const encodeProperties = (obj) => {
      let mind = gap;
      gap += indent;
      let gapstart = "";
      let gapend = "";
      let keys = Object.keys(obj);
      if (Array.isArray(replacer)) {
        keys = keys.filter((key) => replacer.indexOf(key) !== -1);
      }
      if (gap) {
        gapstart = "\n" + gap;
        gapend = "\n" + mind;
      }
      let result2 = gapstart + keys.map((prop) => {
        return jsonStringify(prop) + ":" + str(prop, obj);
      }).join("," + gapstart) + gapend;
      gap = mind;
      return result2;
    };
    const encodeEntries = (arr) => {
      let mind = gap;
      gap += indent;
      let gapstart = "";
      let gapend = "";
      if (gap) {
        gapstart = "\n" + gap;
        gapend = "\n" + mind;
      }
      let result2 = gapstart + arr.map((value2, index) => {
        return str(index, arr);
      }).join("," + gapstart) + gapend;
      gap = mind;
      return result2;
    };
    const checkCircular = /* @__PURE__ */ new WeakMap();
    function createIds(value2) {
      if (Array.isArray(value2)) {
        for (let v of value2) {
          createIds(v);
        }
      } else if (value2 && getType(value2) == "object") {
        if (checkCircular.has(value2)) {
          let id = getAttribute(value2, "id");
          if (!id) {
            createId(value2);
          }
        } else {
          checkCircular.set(value2, true);
          for (let v of Object.values(value2)) {
            createIds(v);
          }
        }
      }
    }
    const str = (key, holder) => {
      let value2 = holder[key];
      if (typeof replacer === "function" && key !== "") {
        value2 = replacer.call(holder, key, value2);
      }
      if (getType(value2) === "object" && objectReferences.has(value2)) {
        let id = getAttribute(value2, "id");
        if (!id) {
          id = createId(value2);
        }
        return '<link>"' + id + '"';
      }
      if (typeof value2 === "undefined" || value2 === null) {
        return "null";
      }
      if (getType(value2) === "object") {
        objectReferences.set(value2, true);
      }
      if (typeof value2.toJSONTag == "function") {
        return value2.toJSONTag(objectReferences, replacer, space);
      } else if (Array.isArray(value2)) {
        return getTypeString(value2) + "[" + encodeEntries(value2) + "]";
      } else if (value2 instanceof Object) {
        switch (getType(value2)) {
          case "string":
          case "decimal":
          case "money":
          case "link":
          case "text":
          case "blob":
          case "color":
          case "email":
          case "hash":
          case "duration":
          case "phone":
          case "url":
          case "uuid":
          case "date":
          case "time":
          case "datetime":
            return getTypeString(value2) + jsonStringify("" + value2, replacer, space);
            break;
          case "int":
          case "uint":
          case "int8":
          case "uint8":
          case "int16":
          case "uint16":
          case "int32":
          case "uint32":
          case "int64":
          case "uint64":
          case "float":
          case "float32":
          case "float64":
          case "timestamp":
          case "number":
          case "boolean":
            return getTypeString(value2) + jsonStringify(value2, replacer, space);
            break;
          case "array":
            let entries = encodeEntries(value2);
            return getTypeString(value2) + "[" + entries + "}";
            break;
          case "object":
            if (value2 === null) {
              return "null";
            }
            let props = encodeProperties(value2);
            return getTypeString(value2) + "{" + props + "}";
            break;
          default:
            throw new Error(getType(value2) + " type not yet implemented");
            break;
        }
      } else {
        return jsonStringify(value2, replacer, space);
      }
    };
    createIds(value);
    const result = str("", { "": value });
    return result;
  };
  function createId(value) {
    if (typeof crypto.randomUUID === "function") {
      var id = crypto.randomUUID();
    } else {
      let replacer = (c) => c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4;
      if (typeof crypto === "undefined") {
        replacer = (c) => c ^ Math.random() * 256 & 15 >> c / 4;
      }
      var id = ("10000000-1000-4000-8000" + -1e11).replace(/[018]/g, (c) => replacer(c).toString(16));
    }
    setAttribute(value, "id", id);
    return id;
  }
  var isNull = (v) => {
    let result = v === null || typeof v.isNull !== "undefined" && v.isNull;
    return result;
  };
  if (!globalThis.JSONTagTypeInfo) {
    globalThis.JSONTagTypeInfo = /* @__PURE__ */ new WeakMap();
  }
  var typeInfo = globalThis.JSONTagTypeInfo;
  var getType = (obj) => {
    if (typeInfo.has(obj)) {
      let info = typeInfo.get(obj);
      if (info.type) {
        return info.type;
      }
    }
    if (Array.isArray(obj)) {
      return "array";
    }
    if (obj instanceof Number) {
      return "number";
    }
    if (obj instanceof Boolean) {
      return "boolean";
    }
    return typeof obj;
  };
  var types = [
    "object",
    "array",
    "string",
    "number",
    "boolean",
    // JSON
    "decimal",
    "money",
    "uuid",
    "url",
    "link",
    "date",
    "time",
    "datetime",
    "duration",
    "timestamp",
    "text",
    "blob",
    "color",
    "email",
    "hash",
    "phone",
    "int",
    "int8",
    "int16",
    "int32",
    "int64",
    "uint",
    "uint8",
    "uint16",
    "uint32",
    "uint64",
    "float",
    "float32",
    "float64"
  ];
  var setType = (obj, type) => {
    if (typeof obj !== "object") {
      throw new TypeError("JSONTag can only add attributes to objects, convert literals to objects first");
    }
    let info = {};
    if (typeInfo.has(obj)) {
      info = typeInfo.get(obj);
    }
    if (!types.includes(type)) {
      throw new TypeError("unknown type " + type);
    }
    info.type = type;
    if (typeof info.attributes === "undefined") {
      info.attributes = {};
    }
    typeInfo.set(obj, info);
  };
  var setAttribute = (obj, attr, value) => {
    if (typeof obj !== "object") {
      throw new TypeError("JSONTag can only add attributes to objects, convert literals to objects first");
    }
    if (Array.isArray(value)) {
      value = value.join(" ");
    }
    if (typeof value !== "string") {
      throw new TypeError("attribute values must be a string or an array of strings");
    }
    if (value.indexOf('"') !== -1) {
      throw new TypeError('attribute values must not contain " character');
    }
    if (value.indexOf(" ") !== -1) {
      value = value.split(" ");
    }
    let info = typeInfo.get(obj) || { attributes: {} };
    info.attributes[attr] = value;
    typeInfo.set(obj, info);
  };
  var setAttributes = (obj, attributes) => {
    if (typeof obj !== "object") {
      throw new TypeError("JSONTag can only add attributes to objects, convert literals to objects first");
    }
    if (typeof attributes !== "object") {
      throw new TypeError("attributes param must be an object");
    }
    Object.keys(attributes).forEach((key) => {
      setAttribute(obj, key, attributes[key]);
    });
  };
  var getAttribute = (obj, attr) => {
    let info = typeInfo.get(obj) || { attributes: {} };
    return info.attributes[attr];
  };
  var addAttribute = (obj, attr, value) => {
    if (typeof value !== "string") {
      throw new TypeError("attribute values must be a string");
    }
    if (value.indexOf('"') !== -1) {
      throw new TypeError('attribute values must not contain " characters');
    }
    let info = typeInfo.get(obj) || { attributes: {} };
    if (typeof info.attributes[attr] === "undefined") {
      setAttribute(obj, attr, value);
    } else {
      if (!Array.isArray(info.attributes[attr])) {
        info.attributes[attr] = [info.attributes[attr]];
      }
      if (value.indexOf(" ") !== -1) {
        value = value.split(" ");
      } else {
        value = [value];
      }
      info.attributes[attr] = info.attributes[attr].concat(value);
      typeInfo.set(obj, info);
    }
  };
  var removeAttribute = (obj, attr) => {
    let info = typeInfo.get(obj) || { attributes: {} };
    if (typeof info.attributes[attr] !== "undefined") {
      delete info.attributes[attr];
      typeInfo.set(obj, info);
    }
  };
  var getAttributes = (obj) => {
    let info = typeInfo.get(obj) || { attributes: {} };
    return Object.assign({}, info.attributes);
  };
  var getAttributesString = (obj) => {
    return Object.entries(getAttributes(obj)).map(([attr, attrValue]) => {
      if (Array.isArray(attrValue)) {
        attrValue = attrValue.join(" ");
      }
      return attr + '="' + attrValue + '"';
    }).join(" ");
  };
  var getTypeString = (obj) => {
    let type = getType(obj);
    let attributes = getAttributes(obj);
    let attributesString = Object.entries(attributes).map(([attr, attrValue]) => {
      if (Array.isArray(attrValue)) {
        attrValue = attrValue.join(" ");
      }
      return attr + '="' + attrValue + '"';
    }).join(" ");
    if (!attributesString) {
      if (["object", "array", "string", "number", "boolean"].indexOf(type) !== -1) {
        type = "";
      }
    }
    if (type || attributesString) {
      return "<" + [type, attributesString].filter(Boolean).join(" ") + ">";
    } else {
      return "";
    }
  };
  function shallowClone(o) {
    if (o instanceof Number) {
      return new Number(o);
    }
    if (o instanceof Boolean) {
      return new Boolean(o);
    }
    if (o instanceof String) {
      return new String(o);
    }
    if (Array.isArray(o)) {
      return [...o];
    }
    return { ...o };
  }
  var clone = (obj) => {
    let typeString = getTypeString(obj);
    let type = getType(obj);
    let attributes = getAttributes(obj);
    let clone2 = shallowClone(obj);
    if (typeString) {
      setType(clone2, type);
      if (attributes) {
        setAttributes(clone2, attributes);
      }
    }
    return clone2;
  };

  // src/lib/Null.mjs
  var ExtendableProxy = class {
    constructor() {
      return new Proxy(this, {
        get: (target, name) => {
          if (typeof target[name] !== "undefined") {
            return target[name];
          }
          if (name == "then" || typeof name == "symbol") {
            return void 0;
          }
          console.error("Attempting to get from Null", name, typeof name, JSON.stringify(name));
          throw new Error("Attempting to get " + name + " from Null");
        },
        set: (target, name, newValue) => {
          console.error("Attempting to set " + name + " in Null to", newValue);
          throw new Error("Attempting to set " + name + " in Null");
        }
      });
    }
  };
  var Null = class extends ExtendableProxy {
    isNull = true;
    toString() {
      return "";
    }
    toJSON() {
      return "null";
    }
    toJSONTag() {
      let type = getTypeString(this);
      return type + this.toJSON();
    }
  };

  // src/lib/Link.mjs
  var Link = class _Link {
    #url;
    constructor(url) {
      if (typeof url !== "string") {
        throw new Error("not a url:", url);
      }
      this.#url = "" + url;
      setType(this, "link");
    }
    static from(url) {
      if (url instanceof _Link) {
        return url;
      }
      if (typeof url !== "string") {
        throw new Error("not a url:", url);
      }
      return new _Link(url);
    }
    get value() {
      return this.#url;
    }
    toString() {
      return this.#url;
    }
    toJSON() {
      return '"' + this.#url + '"';
    }
    toJSONTag() {
      let attributes = getAttributesString(this);
      return "<link" + (attributes ? " " + attributes : "") + ">" + this.toJSON();
    }
  };

  // src/lib/fast-parse.mjs
  function parse(input, reviver, meta) {
    if (!meta) {
      meta = {};
    }
    if (!meta.index) {
      meta.index = {};
    }
    if (!meta.index.id) {
      meta.index.id = /* @__PURE__ */ new Map();
    }
    if (!meta.unresolved) {
      meta.unresolved = /* @__PURE__ */ new Map();
    }
    if (!meta.baseURL) {
      meta.baseURL = "http://localhost/";
    }
    let at, ch, value, result;
    let escapee = {
      '"': '"',
      "\\": "\\",
      "/": "/",
      b: "\b",
      f: "\f",
      n: "\n",
      r: "\r",
      t: "	"
    };
    let error = function(m) {
      let context = input.substring(at - 100, at + 100);
      throw {
        name: "SyntaxError",
        message: m,
        at,
        input: context
      };
    };
    let next = function(c) {
      if (c && c !== ch) {
        error("Expected '" + c + "' instead of '" + ch + "'");
      }
      ch = input.charAt(at);
      at += 1;
      return ch;
    };
    let number = function(tagName) {
      let numString = "";
      if (ch === "-") {
        numString = "-";
        next("-");
      }
      while (ch >= "0" && ch <= "9") {
        numString += ch;
        next();
      }
      if (ch === ".") {
        numString += ".";
        while (next() && ch >= "0" && ch <= "9") {
          numString += ch;
        }
      }
      if (ch === "e" || ch === "E") {
        numString += ch;
        next();
        if (ch === "-" || ch === "+") {
          numString += ch;
          next();
        }
        while (ch >= "0" && ch <= "9") {
          numString += ch;
          next();
        }
      }
      let result2 = new Number(numString).valueOf();
      if (tagName) {
        switch (tagName) {
          case "int":
            isInt(numString);
            break;
          case "uint":
            isInt(numString, [0, Infinity]);
            break;
          case "int8":
            isInt(numString, [-128, 127]);
            break;
          case "uint8":
            isInt(numString, [0, 255]);
            break;
          case "int16":
            isInt(numString, [-32768, 32767]);
            break;
          case "uint16":
            isInt(numString, [0, 65535]);
            break;
          case "int32":
            isInt(numString, [-2147483648, 2147483647]);
            break;
          case "uint32":
            isInt(numString, [0, 4294967295]);
            break;
          case "timestamp":
          case "int64":
            isInt(numString, [-9223372036854776e3, 9223372036854776e3]);
            break;
          case "uint64":
            isInt(numString, [0, 18446744073709552e3]);
            break;
          case "float":
            isFloat(numString);
            break;
          case "float32":
            isFloat(numString, [-34e37, 34e37]);
            break;
          case "float64":
            isFloat(numString, [-17e307, 17e307]);
            break;
          case "number":
            break;
          default:
            isTypeError(tagName, numString);
            break;
        }
      }
      return result2;
    };
    let isTypeError = function(type, value2) {
      error("Syntax error, expected " + type + ", got: " + value2);
    };
    const regexes = {
      color: /^(rgb|hsl)a?\((\d+%?(deg|rad|grad|turn)?[,\s]+){2,3}[\s\/]*[\d\.]+%?\)$/i,
      email: /^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/,
      uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
      decimal: /^\d*\.?\d*$/,
      money: /^[A-Z]+\$\d*\.?\d*$/,
      duration: /^(-?)P(?=\d|T\d)(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)([DW]))?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/,
      phone: /^[+]?(?:\(\d+(?:\.\d+)?\)|\d+(?:\.\d+)?)(?:[ -]?(?:\(\d+(?:\.\d+)?\)|\d+(?:\.\d+)?))*(?:[ ]?(?:x|ext)\.?[ ]?\d{1,5})?$/,
      time: /^(\d{2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?$/,
      date: /^-?[1-9][0-9]{3,}-([0][1-9]|[1][0-2])-([1-2][0-9]|[0][1-9]|[3][0-1])$/,
      datetime: /^(\d{4,})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?Z?$/,
      range: /^\[-?(\d+\.)?\d+\,-?(\d+\.)?\d+\]$/
    };
    let isFloat = function(float, range) {
      let test = new Number(parseFloat(float));
      let str = test.toString();
      if (float !== str) {
        error("Syntax Error: expected float value");
      }
      if (range) {
        if (typeof range[0] === "number") {
          if (test < range[0]) {
            error("Syntax Error: float value out of range");
          }
        }
        if (typeof range[1] === "number") {
          if (test > range[1]) {
            error("Syntax Error: float value out of range");
          }
        }
      }
    };
    let isInt = function(int, range) {
      let test = new Number(parseInt(int));
      let str = test.toString();
      if (int !== str) {
        error("Syntax Error: expected integer value");
      }
      if (range) {
        if (typeof range[0] === "number") {
          if (test < range[0]) {
            error("Syntax Error: integer value out of range");
          }
        }
        if (typeof range[1] === "number") {
          if (test > range[1]) {
            error("Syntax Error: integer value out of range");
          }
        }
      }
    };
    let isColor = function(color) {
      let result2 = false;
      if (color.charAt(0) === "#") {
        color = color.substring(1);
        result2 = [3, 4, 6, 8].indexOf(color.length) > -1 && !isNaN(parseInt(color, 16));
        if (result2.toString(16) !== color) {
          isTypeError("color", color);
        }
      } else {
        result2 = regexes.color.test(color);
      }
      if (!result2) {
        isTypeError("color", color);
      }
      return true;
    };
    let isEmail = function(email) {
      let result2 = regexes.email.test(email);
      if (!result2) {
        isTypeError("email", email);
      }
      return true;
    };
    let isUuid = function(uuid) {
      let result2 = regexes.uuid.test(uuid);
      if (!result2) {
        isTypeError("uuid", uuid);
      }
      return true;
    };
    let isDecimal = function(decimal) {
      let result2 = regexes.decimal.test(decimal);
      if (!result2) {
        isTypeError("decimal", decimal);
      }
      return true;
    };
    let isMoney = function(money) {
      let result2 = regexes.money.test(money);
      if (!result2) {
        isTypeError("money", money);
      }
      return true;
    };
    let isUrl = function(url) {
      try {
        return Boolean(new URL(url, meta.baseURL));
      } catch (e) {
        console.log(e);
        isTypeError("url", url);
      }
    };
    let isDuration = function(duration) {
      let result2 = regexes.duration.test(duration);
      if (!result2) {
        isTypeError("duration", duration);
      }
      return true;
    };
    let isPhone = function(phone) {
      let result2 = regexes.phone.test(phone);
      if (!result2) {
        isTypeError("phone", phone);
      }
      return true;
    };
    let isRange = function(range) {
      let result2 = regexes.range.test(range);
      if (!result2) {
        isTypeError("range", range);
      }
      return true;
    };
    let isTime = function(time) {
      let result2 = regexes.time.test(time);
      if (!result2) {
        isTypeError("time", time);
      }
      return true;
    };
    let isDate = function(date) {
      let result2 = regexes.date.test(date);
      if (!result2) {
        isTypeError("date", date);
      }
      return true;
    };
    let isDatetime = function(datetime) {
      let result2 = regexes.datetime.test(datetime);
      if (!result2) {
        isTypeError("datetime", datetime);
      }
      return true;
    };
    let checkStringType = function(tagName, value2) {
      if (!tagName) {
        return;
      }
      switch (tagName) {
        case "object":
        case "array":
        case "int8":
        case "uint8":
        case "int16":
        case "uint16":
        case "int32":
        case "uint32":
        case "int64":
        case "uint64":
        case "int":
        case "uint":
        case "float32":
        case "float64":
        case "float":
        case "timestamp":
          isTypeError(tagName, value2);
          break;
        case "uuid":
          return isUuid(value2);
        case "decimal":
          return isDecimal(value2);
        case "money":
          return isMoney(value2);
        case "url":
          return isUrl(value2);
        case "link":
        case "string":
        case "text":
        case "blob":
        case "hash":
          return true;
        case "color":
          return isColor(value2);
        case "email":
          return isEmail(value2);
        case "duration":
          return isDuration(value2);
        case "phone":
          return isPhone(value2);
        case "range":
          return isRange(value2);
        case "time":
          return isTime(value2);
        case "date":
          return isDate(value2);
        case "datetime":
          return isDatetime(value2);
      }
      error("Syntax error: unknown tagName " + tagName);
    };
    let string = function(tagName) {
      let value2 = "", hex, i, uffff;
      if (ch !== '"') {
        error("Syntax Error");
      }
      next('"');
      while (ch) {
        if (ch === '"') {
          next();
          checkStringType(tagName, value2);
          return value2;
        }
        if (ch === "\\") {
          next();
          if (ch === "u") {
            uffff = 0;
            for (i = 0; i < 4; i++) {
              hex = parseInt(next(), 16);
              if (!isFinite(hex)) {
                break;
              }
              uffff = uffff * 16 + hex;
            }
            value2 += String.fromCharCode(uffff);
            next();
          } else if (typeof escapee[ch] === "string") {
            value2 += escapee[ch];
            next();
          } else {
            break;
          }
        } else {
          value2 += ch;
          next();
        }
      }
      error("Syntax error: incomplete string");
    };
    let tag = function() {
      let key, val, tagOb = {
        attributes: {}
      };
      if (ch !== "<") {
        error("Syntax Error");
      }
      next("<");
      key = word();
      if (!key) {
        error("Syntax Error: expected tag name");
      }
      tagOb.tagName = key;
      whitespace();
      while (ch) {
        if (ch === ">") {
          next(">");
          return tagOb;
        }
        key = word();
        if (!key) {
          error("Syntax Error: expected attribute name");
        }
        whitespace();
        next("=");
        whitespace();
        val = string();
        tagOb.attributes[key] = val;
        whitespace();
      }
      error("Syntax Error: unexpected end of input");
    };
    let whitespace = function() {
      while (ch) {
        switch (ch) {
          case " ":
          case "	":
          case "\r":
          case "\n":
            next();
            break;
          default:
            return;
            break;
        }
      }
    };
    let word = function() {
      let val = "";
      if (ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z") {
        val += ch;
        next();
      } else {
        error("Syntax Error: expected word");
      }
      while (ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch >= "0" && ch <= "9" || ch == "_") {
        val += ch;
        next();
      }
      return val;
    };
    let boolOrNull = function(tagName) {
      let w = word();
      if (!w || typeof w !== "string") {
        error('Syntax error: expected boolean or null, got "' + w + '"');
      }
      switch (w.toLowerCase()) {
        case "true":
          if (tagName && tagName !== "boolean") {
            isTypeError(tagName, w);
          }
          return true;
          break;
        case "false":
          if (tagName && tagName !== "boolean") {
            isTypeError(tagName, w);
          }
          return false;
          break;
        case "null":
          return null;
          break;
        default:
          error('Syntax error: expected boolean or null, got "' + w + '"');
          break;
      }
    };
    let checkUnresolved = function(item, object2, key) {
      if (getType(item) === "link") {
        let link = "" + item;
        let links = meta.unresolved.get(link);
        if (typeof links === "undefined") {
          meta.unresolved.set(link, []);
          links = meta.unresolved.get(link);
        }
        let count = links.push({
          src: new WeakRef(object2),
          key
        });
      }
    };
    let array = function() {
      let item, array2 = [];
      if (ch !== "[") {
        error("Syntax error");
      }
      next("[");
      whitespace();
      if (ch === "]") {
        next("]");
        return array2;
      }
      while (ch) {
        item = value();
        checkUnresolved(item, array2, array2.length);
        array2.push(item);
        whitespace();
        if (ch === "]") {
          next("]");
          return array2;
        }
        next(",");
        whitespace();
      }
      error("Input stopped early");
    };
    let object = function() {
      let key, val, object2 = {};
      if (ch !== "{") {
        error("Syntax Error");
      }
      next("{");
      whitespace();
      if (ch === "}") {
        next("}");
        return object2;
      }
      while (ch) {
        key = string();
        if (key === "__proto__") {
          error("Attempt at prototype pollution");
        }
        whitespace();
        next(":");
        val = value();
        object2[key] = val;
        checkUnresolved(val, object2, key);
        whitespace();
        if (ch === "}") {
          next("}");
          return object2;
        }
        next(",");
        whitespace();
      }
      error("Input stopped early");
    };
    value = function() {
      let tagOb, result2, tagName;
      whitespace();
      if (ch === "<") {
        tagOb = tag();
        tagName = tagOb.tagName;
        whitespace();
      }
      switch (ch) {
        case "{":
          if (tagName && tagName !== "object") {
            isTypeError(tagName, ch);
          }
          result2 = object();
          break;
        case "[":
          if (tagName && tagName !== "array") {
            isTypeError(tagName, ch);
          }
          result2 = array();
          break;
        case '"':
          result2 = string(tagName);
          break;
        case "-":
          result2 = number(tagName);
          break;
        default:
          if (ch >= "0" && ch <= "9") {
            result2 = number(tagName);
          } else {
            result2 = boolOrNull(tagName);
          }
          break;
      }
      if (tagOb) {
        if (result2 === null) {
          result2 = new Null();
        }
        if (typeof result2 !== "object") {
          switch (typeof result2) {
            case "string":
              result2 = new String(result2);
              break;
            case "number":
              result2 = new Number(result2);
              break;
            default:
              error("Syntax Error: unexpected type " + typeof result2);
              break;
          }
        }
        if (tagOb.tagName) {
          setType(result2, tagOb.tagName);
        }
        if (tagOb.attributes) {
          setAttributes(result2, tagOb.attributes);
          if (tagOb.attributes?.id) {
            meta.index.id.set(tagOb.attributes.id, new WeakRef(result2));
          }
        }
      }
      return result2;
    };
    at = 0;
    ch = " ";
    result = value();
    whitespace();
    if (ch) {
      error("Syntax error");
    }
    if (typeof reviver === "function") {
      let walk = function(holder, key) {
        var k;
        var v;
        var value2 = holder[key];
        if (value2 !== null && typeof value2 === "object" && !(value2 instanceof String || value2 instanceof Number || value2 instanceof Boolean)) {
          for (k in value2) {
            if (Object.prototype.hasOwnProperty.call(value2, k)) {
              v = walk(value2, k);
              if (v !== void 0 && (typeof value2[k] === "undefined" || value2[k] !== v)) {
                value2[k] = v;
                if (getType(v) === "link") {
                  checkUnresolved(v, value2, k);
                }
              } else if (v === void 0) {
                delete value2[k];
              }
            }
          }
        }
        return reviver.call(holder, key, value2, meta);
      };
      walk({ "": result }, "");
    }
    let replaceLink = function(u, value2) {
      if (typeof value2 !== "undefined") {
        let src = u.src.deref();
        if (typeof src !== "undefined" && getType(src[u.key]) === "link") {
          src[u.key] = value2;
          return true;
        }
      }
    };
    if (meta.index.id.size > meta.unresolved.size) {
      meta.unresolved.forEach((links, id) => {
        let value2 = meta.index.id.get(id)?.deref();
        if (value2 !== void 0) {
          links.forEach((u, i) => {
            if (replaceLink(u, value2)) {
              delete links[i];
            }
          });
        }
      });
    } else {
      meta.index.id.forEach((ref, id) => {
        let value2 = ref.deref();
        let links = meta.unresolved.get(id);
        if (value2 !== void 0 && typeof links !== "undefined") {
          links.forEach((u, i) => {
            replaceLink(u, value2);
          });
          meta.unresolved.delete(id);
        }
      });
    }
    return result;
  }

  // src/browser.mjs
  window.JSONTag = {
    stringify,
    parse,
    getType,
    setType,
    getTypeString,
    setAttribute,
    getAttribute,
    addAttribute,
    removeAttribute,
    getAttributes,
    setAttributes,
    getAttributesString,
    isNull,
    clone,
    Link,
    Null
  };
})();
//# sourceMappingURL=browser.js.map
