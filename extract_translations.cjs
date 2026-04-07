const fs = require('fs');
const path = require('path');

function searchFiles(dir, fileList = []) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      searchFiles(filePath, fileList);
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const files = searchFiles('src');
const translations = {};

const regex = /t\(\s*['"]([^'"]+)['"]\s*(?:[,)]|})/g;
const regex2 = /t\(\s*`([^`]+)`\s*(?:[,)]|})/g;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    translations[match[1]] = match[1];
  }
  while ((match = regex2.exec(content)) !== null) {
    translations[match[1]] = match[1];
  }
});

fs.writeFileSync('src/locales/fr.json', JSON.stringify(translations, null, 2));
console.log(Object.keys(translations).length + " keys extracted.");
