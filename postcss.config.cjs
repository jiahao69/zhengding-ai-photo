const tailwindcss = require("@tailwindcss/postcss");
const pxToViewport = require("postcss-px-to-viewport-8-plugin");

module.exports = {
  plugins: [
    tailwindcss(),
    pxToViewport({
      unitToConvert: "px",
      viewportWidth: 1080,
      unitPrecision: 5,
      propList: ["*"],
      viewportUnit: "vw",
      fontViewportUnit: "vw",
      minPixelValue: 0,
    }),
  ],
};
