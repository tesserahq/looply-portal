const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const globals = require("globals");
const react = require("eslint-plugin-react");

const {
    fixupConfigRules,
    fixupPluginRules,
    fixupConfigRules,
} = require("@eslint/compat");

const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const _import = require("eslint-plugin-import");
const tsParser = require("@typescript-eslint/parser");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                jsx: true,
            },
        },

        globals: {
            ...globals.browser,
            ...globals.commonjs,
        },
    },

    extends: compat.extends("eslint:recommended", "prettier"),
}, globalIgnores(["!**/.server", "!**/.client", "remix.init/*"]), {
    files: ["**/*.{js,jsx,ts,tsx}"],

    plugins: {
        react,
    },

    extends: fixupConfigRules(compat.extends(
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "plugin:react-hooks/recommended",
    )),

    settings: {
        react: {
            version: "detect",
        },

        formComponents: ["Form"],

        linkComponents: [{
            name: "Link",
            linkAttribute: "to",
        }, {
            name: "NavLink",
            linkAttribute: "to",
        }],

        "import/resolver": {
            typescript: {
                project: "./tsconfig.json",
            },
        },
    },

    rules: {
        "react-hooks/exhaustive-deps": "off",
        "no-console": "warn",
    },
}, {
    files: ["**/*.{ts,tsx}"],

    plugins: {
        "@typescript-eslint": typescriptEslint,
        import: fixupPluginRules(_import),
    },

    languageOptions: {
        parser: tsParser,
    },

    settings: {
        "import/internal-regex": "^@",

        "import/resolver": {
            node: {
                extensions: [".ts", ".tsx"],
            },

            typescript: {
                alwaysTryTypes: true,
                project: "./tsconfig.json",
            },
        },
    },

    extends: fixupConfigRules(compat.extends(
        "plugin:@typescript-eslint/recommended",
        "plugin:import/recommended",
        "plugin:import/typescript",
    )),
}, {
    files: ["**/.eslintrc.cjs"],

    languageOptions: {
        globals: {
            ...globals.node,
        },
    },
}]);
