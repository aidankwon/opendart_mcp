const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); // Try if cheerio is installed, or fallback to primitive regex

try {
  const dir = '/Users/aidan/dev/opendart_mcp/opendart_docs/DS003';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && !f.includes('main'));
  
  files.forEach(file => {
    const html = fs.readFileSync(path.join(dir, file), 'utf-8');
    
    // Find URL
    const urlMatches = html.match(/https:\/\/opendart\.fss\.or\.kr\/api\/([a-zA-Z0-9_-]+)\.(json|xml)/);
    const url = urlMatches ? urlMatches[0] : 'Unknown';
    
    console.log(`\nEndpoint: ${url} (File: ${file})`);
    
    // Find parameters table
    const reqSection = html.indexOf('요청인자');
    if(reqSection !== -1) {
       const tbodyMatch = html.substring(reqSection).match(/<tbody>([\s\S]*?)<\/tbody>/);
       if (tbodyMatch) {
         const rows = tbodyMatch[1].match(/<tr>([\s\S]*?)<\/tr>/g) || [];
         rows.forEach((row, i) => {
           if(i === 0) return; // Header usually
           const cells = row.match(/<td>([\s\S]*?)<\/td>/g) || [];
           if (cells.length >= 4) {
             const key = cells[0].replace(/<[^>]+>/g, '').trim();
             const type = cells[1].replace(/<[^>]+>/g, '').trim();
             const required = cells[2].replace(/<[^>]+>/g, '').trim();
             const desc = cells[3].replace(/<[^>]+>/g, '').trim();
             console.log(`  - ${key} (${required}): ${desc}`);
           }
         });
       }
    }
  });
} catch(e) {
  console.error(e);
}
