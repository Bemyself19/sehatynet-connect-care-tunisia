try {
  const translation = require('./public/locales/fr/translation.json');
  console.log('✅ French translation JSON is valid');
} catch(e) {
  console.error('❌ JSON error:', e.message);
}
