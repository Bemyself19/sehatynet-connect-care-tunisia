try {
  const translation = require('./public/locales/en/translation.json');
  console.log('✅ JSON is valid');
} catch(e) {
  console.error('❌ JSON error:', e.message);
}
