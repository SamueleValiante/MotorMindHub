import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next registra gia' il plugin jsx-a11y (con solo 6 regole:
  // alt-text, aria-props...): non si puo' spread-are di nuovo
  // jsxA11y.flatConfigs.recommended per intero, ridichiarerebbe lo stesso
  // plugin key e ESLint lo rifiuta (ConfigError). Prendo solo il blocco
  // "rules" del ruleset recommended (una trentina in piu', tra cui
  // label-has-associated-control, no-noninteractive-tabindex,
  // click-events-have-key-events), applicato sul plugin gia' registrato.
  { rules: jsxA11y.flatConfigs.recommended.rules },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
