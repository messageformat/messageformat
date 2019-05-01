module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [
      2,
      'never',
      ['upper-case', 'camel-case', 'kebab-case', 'pascal-case', 'snake-case']
    ]
  }
};
