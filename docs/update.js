const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const STANDARD_CHARSET = 'UTF-8';

const baseDirectory = process.env.GITHUB_WORKSPACE || path.resolve(__dirname, '../..');
const apiYamlDirectory = path.join(baseDirectory, 'docs/api');
const swaggerPath = path.join(baseDirectory, 'src/main/resources/dist/swagger-initializer.js');

function readFile(filePath, encoding = STANDARD_CHARSET) {
    try {
        return fs.readFileSync(filePath, encoding);
    } catch (error) {
        console.error(`Error reading file at ${filePath}:`, error);
        process.exit(1);
    }
}

function readDirectory(directoryPath) {
    try {
        return fs.readdirSync(directoryPath);
    } catch (error) {
        console.error(`Error reading directory at ${directoryPath}:`, error);
        process.exit(1);
    }
}

// 초기화 파일 읽기
let initializerContent = readFile(swaggerPath);

const urlsRegex = /urls: \[(.*?)]/s;
const urlsMatch = initializerContent.match(urlsRegex);
let existingUrls = [];

if (urlsMatch && urlsMatch[1]) {
    existingUrls = JSON.parse(`[${urlsMatch[1].replace(/url: /g, '"url": ').replace(/name: /g, '"name": ')}]`);
}

// YAML 파일 목록 가져오기
let yamlFiles = readDirectory(apiYamlDirectory).filter(file => file.endsWith('.yaml'));

// 새로운 URL 추가
yamlFiles.forEach(file => {
    const filePath = path.join(apiYamlDirectory, file);
    const fileContent = readFile(filePath);
    const parsedYaml = yaml.load(fileContent);

    const title = parsedYaml.info?.title || path.basename(file, '.yaml');
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
    fs.writeFileSync(swaggerPath, initializerContent, 'utf-8');
    console.log('API 문서의 URLs 업데이트가 완료되었습니다.');
} catch (error) {
    console.error(`Error writing swagger-initializer file at ${swaggerPath}:`, error);
    process.exit(1);
}
