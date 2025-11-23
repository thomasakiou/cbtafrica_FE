const fs = require('fs');
const path = require('path');

const subjectsDir = path.join(__dirname, 'subjects');
const files = fs.readdirSync(subjectsDir).filter(file => file.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(subjectsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add animations.css if not present
    if (!content.includes('animations.css')) {
        content = content.replace(
            '<link rel="stylesheet" href="../css/style.css">',
            '<link rel="stylesheet" href="../css/style.css">\n    <link rel="stylesheet" href="../css/animations.css">'
        );
    }
    
    // Add apply-subject-animations.js before closing body tag
    if (!content.includes('apply-subject-animations.js')) {
        content = content.replace(
            '</body>',
            '    <script src="../js/apply-subject-animations.js"></script>\n</body>'
        );
    }
    
    // Add page-load class to main element if not present
    if (!content.includes('class="page-load"') && content.includes('<main')) {
        content = content.replace(
            '<main',
            '<main class="page-load"'
        );
    }
    
    // Add content-section class to container if not present
    if (!content.includes('class="content-section"') && content.includes('class="container"')) {
        content = content.replace(
            'class="container"',
            'class="container content-section"'
        );
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
});

console.log('All subject pages have been updated with animations!');
