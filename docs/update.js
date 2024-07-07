const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 디렉토리 내 파일 검색 함수
function findFileByName(dir, fileName) {
    let result = null;

    function searchDirectory(directory) {
        const files = fs.readdirSync(directory);
        for (const file of files) {
            const fullPath = path.join(directory, file);
            if (fs.statSync(fullPath).isDirectory()) {
                searchDirectory(fullPath);
            } else if (file === fileName) {
                result = fullPath;
                return;
            }
        }
    }

    searchDirectory(dir);
    return result;
}

const baseDir = process.env.GITHUB_WORKSPACE || path.resolve(__dirname, '../..');
const initializerPath = findFileByName(baseDir, 'swagger-initializer.js');
const apiDir = path.join(baseDir, 'docs/api');

if (!initializerPath) {
    console.error('swagger-initializer.js 파일을 찾을 수 없습니다.');
    process.exit(1);
}

// 초기화 파일 읽기
let initializerContent;
try {
    initializerContent = fs.readFileSync(initializerPath, 'utf-8');
} catch (error) {
    console.error(`Error reading initializer file at ${initializerPath}:`, error);
    process.exit(1);
}

// 기존 URL 추출
const urlsRegex = /urls: \[(.*?)]/s;
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
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsedYaml = yaml.load(fileContent);

    const title = parsedYaml.info && parsedYaml.info.title ? parsedYaml.info.title : path.basename(file, '.yaml');
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
try {
    fs.writeFileSync(initializerPath, initializerContent, 'utf-8');
    console.log('swagger-initializer.js 파일이 업데이트되었습니다.');
} catch (error) {
    console.error(`Error writing initializer file at ${initializerPath}:`, error);
    process.exit(1);
}
