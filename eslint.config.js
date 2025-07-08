import security from "eslint-plugin-security";

export default [
    {
        files: ["*.js","*.ts"],
        plugins: { security },
        extends: ["plugin:security/recommended"],
        languageOptions: {
            parserOptions: { ecmaVersion: "latest", sourceType: "module" }
        }
    }
];
