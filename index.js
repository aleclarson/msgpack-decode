var bops = require('bops');

exports.decode = decode;
function decode(buffer) {
  var decoder = new Decoder(buffer);
  var value = decoder.parse();
  if (decoder.offset !== buffer.length) throw new Error((buffer.length - decoder.offset) + " trailing bytes");
  return value;
}

function Decoder(buffer, offset) {
  this.offset = offset || 0;
  this.buffer = buffer;
}

Decoder.prototype.map = function (length) {
  var value = {};
  for (var i = 0; i < length; i++) {
    var key = this.parse();
    value[key] = this.parse();
  }
  return value;
};

Decoder.prototype.bin = function (length) {
  var value = bops.subarray(this.buffer, this.offset, this.offset + length);
  this.offset += length;
  return value;
};

Decoder.prototype.str = function (length) {
  var value = bops.to(bops.subarray(this.buffer, this.offset, this.offset + length));
  this.offset += length;
  return value;
};

Decoder.prototype.array = function (length) {
  var value = new Array(length);
  for (var i = 0; i < length; i++) {
    value[i] = this.parse();
  }
  return value;
};

Decoder.prototype.parse = function () {
  var type = this.buffer[this.offset];
  var value, length, extType;
  // Positive FixInt
  if ((type & 0x80) === 0x00) {
    this.offset++;
    return type;
  }
  // FixMap
  if ((type & 0xf0) === 0x80) {
    length = type & 0x0f;
    this.offset++;
    return this.map(length);
  }
  // FixArray
  if ((type & 0xf0) === 0x90) {
    length = type & 0x0f;
    this.offset++;
    return this.array(length);
  }
  // FixStr
  if ((type & 0xe0) === 0xa0) {
    length = type & 0x1f;
    this.offset++;
    return this.str(length);
  }
  // Negative FixInt
  if ((type & 0xe0) === 0xe0) {
    value = bops.readInt8(this.buffer, this.offset);
    this.offset++;
    return value;
  }
  switch (type) {
  // nil
  case 0xc0:
    this.offset++;
    return null;
  // 0xc1: (never used)
  // false
  case 0xc2:
    this.offset++;
    return false;
  // true
  case 0xc3:
    this.offset++;
    return true;

  // bin 8
  case 0xc4:
    length = bops.readUInt8(this.buffer, this.offset + 1);
    this.offset += 2;
    return this.bin(length);
  // bin 16
  case 0xc5:
    length = bops.readUInt16BE(this.buffer, this.offset + 1);
    this.offset += 3;
    return this.bin(length);
  // bin 32
  case 0xc6:
    length = bops.readUInt32BE(this.buffer, this.offset + 1);
    this.offset += 5;
    return this.bin(length);

  // ext 8
  case 0xc7:
    length = bops.readUInt8(this.buffer, this.offset + 1);
    extType = bops.readUInt8(this.buffer, this.offset + 2);
    this.offset += 3;
    return [extType, this.bin(length)];
  // ext 16
  case 0xc8:
    length = bops.readUInt16BE(this.buffer, this.offset + 1);
    extType = bops.readUInt8(this.buffer, this.offset + 3);
    this.offset += 4;
    return [extType, this.bin(length)];
  // ext 32
  case 0xc9:
    length = bops.readUInt32BE(this.buffer, this.offset + 1);
    extType = bops.readUInt8(this.buffer, this.offset + 5);
    this.offset += 6;
    return [extType, this.bin(length)];

  // float 32
  case 0xca:
    value = bops.readFloatBE(this.buffer, this.offset + 1);
    this.offset += 5;
    return value;
  // float 64 / double
  case 0xcb:
    value = bops.readDoubleBE(this.buffer, this.offset + 1);
    this.offset += 9;
    return value;

  // uint8
  case 0xcc:
    value = this.buffer[this.offset + 1];
    this.offset += 2;
    return value;
  // uint 16
  case 0xcd:
    value = bops.readUInt16BE(this.buffer, this.offset + 1);
    this.offset += 3;
    return value;
  // uint 32
  case 0xce:
    value = bops.readUInt32BE(this.buffer, this.offset + 1);
    this.offset += 5;
    return value;
  // uint64
  case 0xcf:
    value = bops.readUInt64BE(this.buffer, this.offset + 1);
    this.offset += 9;
    return value;

  // int 8
  case 0xd0:
    value = bops.readInt8(this.buffer, this.offset + 1);
    this.offset += 2;
    return value;
  // int 16
  case 0xd1:
    value = bops.readInt16BE(this.buffer, this.offset + 1);
    this.offset += 3;
    return value;
  // int 32
  case 0xd2:
    value = bops.readInt32BE(this.buffer, this.offset + 1);
    this.offset += 5;
    return value;
  // int 64
  case 0xd3:
    value = bops.readInt64BE(this.buffer, this.offset + 1);
    this.offset += 9;
    return value;

  // fixext 1
  case 0xd4:
    extType = bops.readUInt8(this.buffer, this.offset + 1);
    this.offset += 2;
    return [extType, this.bin(1)];
  // fixext 2
  case 0xd5:
    extType = bops.readUInt8(this.buffer, this.offset + 1);
    this.offset += 2;
    return [extType, this.bin(2)];
  // fixext 4
  case 0xd6:
    extType = bops.readUInt8(this.buffer, this.offset + 1);
    this.offset += 2;
    return [extType, this.bin(4)];
  // fixext 8
  case 0xd7:
    extType = bops.readUInt8(this.buffer, this.offset + 1);
    this.offset += 2;
    return [extType, this.bin(8)];
  // fixext 16
  case 0xd8:
    extType = bops.readUInt8(this.buffer, this.offset + 1);
    this.offset += 2;
    return [extType, this.bin(16)];

  // str 8
  case 0xd9:
    length = bops.readUInt8(this.buffer, this.offset + 1);
    this.offset += 2;
    return this.str(length);
  // str 16
  case 0xda:
    length = bops.readUInt16BE(this.buffer, this.offset + 1);
    this.offset += 3;
    return this.str(length);
  // str 32
  case 0xdb:
    length = bops.readUInt32BE(this.buffer, this.offset + 1);
    this.offset += 5;
    return this.str(length);

  // array 16
  case 0xdc:
    length = bops.readUInt16BE(this.buffer, this.offset + 1);
    this.offset += 3;
    return this.array(length);
  // array 32
  case 0xdd:
    length = bops.readUInt32BE(this.buffer, this.offset + 1);
    this.offset += 5;
    return this.array(length);

  // map 16:
  case 0xde:
    length = bops.readUInt16BE(this.buffer, this.offset + 1);
    this.offset += 3;
    return this.map(length);
  // map 32
  case 0xdf:
    length = bops.readUInt32BE(this.buffer, this.offset + 1);
    this.offset += 5;
    return this.map(length);

  // buffer 16
  case 0xd8:
    length = bops.readUInt16BE(this.buffer, this.offset + 1);
    this.offset += 3;
    return this.buf(length);
  // buffer 32
  case 0xd9:
    length = bops.readUInt32BE(this.buffer, this.offset + 1);
    this.offset += 5;
    return this.buf(length);
  }

  throw new Error("Unknown type 0x" + type.toString(16));
};

