// eslint.config.cjs
const security = require("eslint-plugin-security");

module.exports = [
    {
        files: ["*.js", "*.ts"],
        plugins: { security },
        extends: ["plugin:security/recommended"],
        languageOptions: {
            parserOptions: { ecmaVersion: "latest", sourceType: "module" }
        }
    }
];

