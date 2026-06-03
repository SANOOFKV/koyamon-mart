const fs = require('fs');
const path = require('path');

function processDir(dir, depth = 0) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git') && !file.includes('assets') && !file.includes('scripts')) {
      processDir(filePath, depth + 1);
    } else if (file.endsWith('.html')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Remove old style.css link if exists
      content = content.replace(/<link href="assets\/css\/style\.css" rel="stylesheet"\/>/g, '');
      content = content.replace(/<link href="\.\.\/assets\/css\/style\.css" rel="stylesheet"\/>/g, '');
      
      // Remove tailwind CDN if it exists
      content = content.replace(/<script src="https:\/\/cdn\.tailwindcss\.com\?plugins=forms,container-queries"><\/script>/g, '');
      
      // Add output.css
      const prefix = depth === 1 ? '../' : (depth === 2 ? '../../' : '');
      const newLink = `<link href="${prefix}assets/css/output.css" rel="stylesheet"/>`;
      
      if (!content.includes('output.css')) {
         content = content.replace('</head>', `  ${newLink}\n</head>`);
      }
      
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  }
}

processDir(path.join(__dirname, '../'));
