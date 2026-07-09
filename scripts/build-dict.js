const fs = require('fs');
const { pinyin } = require('pinyin');

const src = fs.readFileSync('./source/_data/dict.txt', 'utf8');
const lines = src.split('\n');

const seen = new Set();
const items = [];
let skipCount = 0;
let errorCount = 0;

lines.forEach((line, index) => {
  const raw = line.trim();

  // 1. 跳过空行
  if (!raw) return;

  // 2. 检查是否包含逗号
  if (!raw.includes(',')) {
    console.log(`⚠️ 第 ${index + 1} 行缺少逗号，已跳过: "${raw}"`);
    errorCount++;
    return;
  }

  const parts = raw.split(',').map(s => s.trim());

  // 3. 检查是否有中文（至少一个汉字）
  const word = parts[0] || '';
  if (!word || !/[\u4e00-\u9fa5]/.test(word)) {
    console.log(`⚠️ 第 ${index + 1} 行没有识别到中文，已跳过: "${raw}"`);
    errorCount++;
    return;
  }

  // 4. IPA 音标
  const ipa = parts[1] || '';

  // 5. 去重（用中文+IPA作为唯一标识）
  const key = word + '|' + ipa;
  if (seen.has(key)) {
    console.log(`⚠️ 第 ${index + 1} 行重复词条，已跳过: "${raw}"`);
    skipCount++;
    return;
  }
  seen.add(key);

  // 6. 计算首个汉字的汉语拼音全拼和首字母
  const pyArr = pinyin(word, { style: 'normal' });
  const pinyin_full = (pyArr.length > 0 && pyArr[0].length > 0) ? pyArr[0][0] : '';
  const initial = pinyin_full ? pinyin_full.charAt(0).toUpperCase() : '#';

  items.push({ word, ipa, initial, pinyin_full });
});

// 生成YAML
let yaml = '';
items.forEach(item => {
  yaml += `- word: ${item.word}\n`;
  yaml += `  ipa: ${item.ipa}\n`;
  yaml += `  initial: ${item.initial}\n`;
  yaml += `  pinyin_full: ${item.pinyin_full}\n`;
});

fs.writeFileSync('./source/_data/dict.yml', yaml, 'utf8');

console.log('\n📊 统计:');
console.log(`   ✅ 成功写入 ${items.length} 个词条`);
console.log(`   ⚠️ 跳过 ${skipCount} 个重复词条`);
console.log(`   ❌ 跳过 ${errorCount} 个格式错误词条`);
console.log(`   📄 共处理 ${lines.length} 行`);
