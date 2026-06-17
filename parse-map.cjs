const fs = require('fs');
const { SourceMapConsumer } = require('source-map');

const rawSourceMap = JSON.parse(fs.readFileSync('./dist/assets/index-lWQVGQ9d.js.map', 'utf8'));

SourceMapConsumer.with(rawSourceMap, null, consumer => {
  const pos = consumer.originalPositionFor({
    line: 688,
    column: 70605
  });
  console.log('Error position:', pos);
  
  const pos2 = consumer.originalPositionFor({
    line: 688,
    column: 73479
  });
  console.log('Error position 2 (Iu):', pos2);
});
