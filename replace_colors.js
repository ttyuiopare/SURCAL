const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/'white'/g, "'var(--text-primary)'");
      content = content.replace(/background:\s*'white'/g, "background: 'var(--bg-surface)'");
      content = content.replace(/background:\s*white/g, "background: var(--bg-surface)");
      content = content.replace(/'rgba\(255,255,255,0\.5\)'/g, "'var(--bg-surface)'");
      
      content = content.replace(/linear-gradient\(135deg, var\(--primary-navy\) 0%, var\(--secondary-blue\) 100%\)/g, 
        "linear-gradient(135deg, var(--primary-magenta) 0%, var(--ai-purple) 100%)");
      content = content.replace(/linear-gradient\(135deg, var\(--ai-teal\) 0%, #17805e 100%\)/g, 
        "linear-gradient(135deg, var(--ai-purple) 0%, #6d28d9 100%)");
      
      // Fix text colors that were explicitly white but should now be dynamic
      content = content.replace(/color:\s*'white'/g, "color: 'var(--text-primary)'");

      fs.writeFileSync(fullPath, content);
    }
  }
}
processDir('src/app');
console.log('Colors replaced successfully!');
