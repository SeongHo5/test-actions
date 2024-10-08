const fs = require('fs');

// a.json 파일 읽기
const rawData = fs.readFileSync('a.json');
const data = JSON.parse(rawData);

// 값에 +10 더하기
const updatedData = {};
for (const key in data) {
    if (data.hasOwnProperty(key)) {
        updatedData[key] = data[key] + 10;
    }
}

fs.writeFileSync('changed.json', JSON.stringify(updatedData, null, 2));

console.log('changed.json 파일이 Updated.');
