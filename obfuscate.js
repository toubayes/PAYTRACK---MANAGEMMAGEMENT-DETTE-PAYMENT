const JavaScriptObfuscator = require("javascript-obfuscator");
const fs = require("fs");
const path = require("path");

function obfuscateFolder(folder) {
  const files = fs.readdirSync(folder);

  files.forEach(file => {
        if (
      file === "node_modules" ||
      file === ".git" ||
      file === "dist"
    ) {
      return;
    }
    const filePath = path.join(folder, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      obfuscateFolder(filePath);
    } else if (file.endsWith(".js")) {
            console.log(filePath);
      const code = fs.readFileSync(filePath, "utf8");

try {
    const result = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        stringArray: true,
        stringArrayEncoding: ["base64"],
        stringArrayThreshold: 0.75,
        selfDefending: false,
        simplify: true,
        renameGlobals: false,
        controlFlowFlattening: false,
        deadCodeInjection: false,
        disableConsoleOutput: false
    });

    fs.writeFileSync(filePath, result.getObfuscatedCode());
} catch (err) {
    console.error("Failed:", filePath);
    console.error(err.message);
}

    }
  });
}

obfuscateFolder("./Server");