const pkg = require("./package.json")

const banner = `/*!
  * ${pkg.name} ${pkg.version}
  * MIT license
*/
`;

export default {
  input: "./dist/fertile.js",
  output: [
    {
      format: "cjs",
      file: "dist/fertile.cjs.js",
      banner
    },
    {
      format: "es",
      file: "dist/fertile.esm.js",
      banner
    }
  ]
};