const fs = require('fs');
const path = require('path');

const pages = [
    'dashboard.html',
    'result.html',
    'jamb.html',
    'neco.html',
    'waec.html',
    'privacy-policy.html',
    'terms-of-service.html'
];

pages.forEach(page => {
    const filePath = path.join(__dirname, page);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${page} - file not found`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Add animations.css if not present
    if (!content.includes('animations.css')) {
        content = content.replace(
            '<link rel="stylesheet" href="css/style.css">',
            '<link rel="stylesheet" href="css/style.css">\n    <link rel="stylesheet" href="css/animations.css">'
        );
        updated = true;
    }
    
    // Add apply-animations.js before closing body tag
    if (!content.includes('apply-animations.js')) {
        content = content.replace(
            '</body>',
            '    <script src="js/apply-animations.js"></script>\n</body>'
        );
        updated = true;
    }
    
    // Add page-load class to main element if not present
    if (!content.includes('class="page-load"') && content.includes('<main')) {
        content = content.replace(
            '<main',
            '<main class="page-load"'
        );
        updated = true;
    }
    
    // Add content-section class to container if not present
    if (!content.includes('class="content-section"') && content.includes('class="container"')) {
        content = content.replace(
            'class="container"',
            'class="container content-section"'
        );
        updated = true;
    }
    
    if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${page}`);
    } else {
        console.log(`No changes needed for ${page}`);
    }
});

console.log('All pages have been updated with animations!');
