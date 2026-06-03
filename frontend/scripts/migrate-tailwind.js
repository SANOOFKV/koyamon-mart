const fs = require('fs');
const path = require('path');

const dir = __dirname + '/../';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  if (file === 'index.html') return; // already done

  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace Tailwind CDN
  content = content.replace(
    '<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>',
    '<link href="assets/css/style.css" rel="stylesheet"/>'
  );

  // Remove tailwind-config block and inline styles block if any
  content = content.replace(/<script id="tailwind-config">[\s\S]*?<\/script>/, '');
  content = content.replace(/<style>[\s\S]*?<\/style>/, '');

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
