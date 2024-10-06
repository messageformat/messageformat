import en from './messages.en.yaml';
import fi from './messages.fi.yaml';

console.log({ en, fi });
console.log('In English: ' + en.select({ GENDER: 'female' }));
console.log('Suomeksi: ' + fi.select({ GENDER: 'female' }));
