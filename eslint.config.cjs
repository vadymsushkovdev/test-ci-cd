// eslint.config.cjs
const securityPlugin = require("eslint-plugin-security");

module.exports = [
    // include the plugin’s recommended ruleset directly:
    securityPlugin.configs.recommended,

    // (Optional) add any extra per-file overrides here
    {
        files: ["*.js", "*.ts"],
        languageOptions: {
            parserOptions: { ecmaVersion: "latest", sourceType: "module" }
        },
        plugins: {
            security: securityPlugin
        },
        rules: {
            // you can override or add rules here, example:
            // "security/detect-object-injection": "warn"
        }
    }
];

