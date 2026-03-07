const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const res = path.resolve(dir, file);
        if (fs.statSync(res).isDirectory()) {
            getFiles(res, files);
        } else if (res.endsWith('.ts') || res.endsWith('.tsx')) {
            files.push(res);
        }
    }
    return files;
}

const files = getFiles('app/api');
let fixedCount = 0;
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const org = content;
    content = content.replace(/(?<!await\s+)(db\.(?:select|insert|update|delete)(?:(?!\.all|\.get|\.run)[\s\S])*?\.(?:all|get|run)\(\))/g, 'await $1');
    if (content !== org) {
        fs.writeFileSync(file, content);
        console.log('Fixed:', path.basename(file));
        fixedCount++;
    }
}
console.log('Total fixed:', fixedCount);
