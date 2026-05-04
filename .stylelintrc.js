export default {
  extends: ['stylelint-config-standard', 'stylelint-config-prettier'],
  rules: {
    'string-quotes': 'single',
    'selector-type-no-unknown': [true, { ignoreTypes: [/^orc-/] }],
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'media',
          'supports',
          'nest',
        ],
      },
    ],
    'property-no-unknown': [true, { ignoreProperties: ['/^--/'] }],
    'property-no-vendor-prefix': true,
    'value-no-vendor-prefix': true,
    'selector-no-vendor-prefix': true,
    'length-zero-no-unit': true,
    'selector-class-pattern': '^[a-z0-9\\-]+$',
    'selector-id-pattern': '^[a-z0-9\\-]+$',
  },
};
