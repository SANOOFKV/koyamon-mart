const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git') && !file.includes('assets') && !file.includes('scripts')) {
      processDir(filePath);
    } else if (file.endsWith('.html')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Remove inline tailwind-config
      content = content.replace(/<script id="tailwind-config">[\s\S]*?<\/script>/, '');
      
      fs.writeFileSync(filePath, content);
      console.log(`Cleaned ${filePath}`);
    }
  }
}

processDir(path.join(__dirname, '../'));
