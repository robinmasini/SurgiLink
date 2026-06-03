const fs = require('fs');

const data = fs.readFileSync('src/assets/wpp-desktop-v2.png');
// Print the first few bytes (png signature + IHDR chunk)
console.log(data.slice(0, 32).toString('hex'));
