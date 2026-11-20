// Conventional Commits: https://www.conventionalcommits.org
// Il corpo dei commit di Renovate ha righe lunghe: lo lasciamo libero.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};
