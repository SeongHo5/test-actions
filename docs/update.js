const fs = require('fs');
const path = require('path');

const initializerPath = path.join(__dirname, '../src/main/resources/dist/swagger-initializer.js');
const apiDir = path.join(__dirname, 'api');

// 초기화 파일 읽기
let initializerContent = fs.readFileSync(initializerPath, 'utf-8');

// 기존 URL 추출
const urlsRegex = /urls: \[(.*?)\]/s;
const urlsMatch = initializerContent.match(urlsRegex);
let existingUrls = [];

if (urlsMatch && urlsMatch[1]) {
    existingUrls = JSON.parse(`[${urlsMatch[1].replace(/url: /g, '"url": ').replace(/name: /g, '"name": ')}]`);
}

// API 디렉토리에서 YAML 파일 목록 읽기
const yamlFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.yaml'));

// 새로운 URL 추가
yamlFiles.forEach(file => {
    const filePath = path.join(apiDir, file);
    const title = path.basename(file, '.yaml');
    const url = `./docs/api/${file}`;

    if (!existingUrls.some(existingUrl => existingUrl.url === url)) {
        existingUrls.push({ url, name: title });
    }
});

// 새로운 URL 목록 생성
const newUrlsString = existingUrls.map(url => `{url: "${url.url}", name: "${url.name}"}`).join(', ');

// 초기화 파일 업데이트
initializerContent = initializerContent.replace(urlsRegex, `urls: [${newUrlsString}]`);

// 초기화 파일 저장
fs.writeFileSync(initializerPath, initializerContent, 'utf-8');

console.log('swagger-initializer.js 파일이 업데이트되었습니다.');
