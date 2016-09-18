function sha256(str) {
  var buffer = new TextEncoder('utf-8').encode(str);
  return crypto.subtle.digest('SHA-256', buffer).then(function(hash) {
    return hex(hash);
  });
}

function hex(buffer) {
  var hexCodes = [];
  var view = new DataView(buffer);
  for (var i = 0; i < view.byteLength; i += 4) {
    var value = view.getUint32(i);
    var stringValue = value.toString(16);
    var padding = '00000000';
    var paddedValue = (padding + stringValue).slice(-padding.length);
    hexCodes.push(paddedValue);
  }
  return hexCodes.join('');
}

var target = '0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
var token = '1ff25ae8c5fb50afe2b75569a331576b072e2a2fef54ea0c1e3a1ef5b3d446e9';
var nonce = 0;

function work() {
  sha256(token + nonce.toString()).then(function(digest) {
    if (digest > target) {
      nonce += 1;
      work();
    } else {
      console.log(nonce);
      console.log(digest);
    }
  });
}

work();
