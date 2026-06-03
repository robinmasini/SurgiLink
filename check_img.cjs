const fs = require('fs');
const data = fs.readFileSync('src/assets/wpp-desktop-v2.png');
// Check if the image is transparent by just noting it's a PNG
console.log("Size:", data.length);
