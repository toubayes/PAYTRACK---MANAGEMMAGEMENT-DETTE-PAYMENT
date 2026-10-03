const path = require("path");
const fs = require("fs");
const { app, BrowserWindow } = require("electron");
const { startServer } = require("./Server/index.js");

// Detect development mode
const isDev = !app.isPackaged;

/* -----------------------------------------------------
    Function: Recursive folder/file copy
------------------------------------------------------ */
function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(` Source not found: ${src}`);
    return;
  }

  const stats = fs.statSync(src);

  // Copy folder
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(child => {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    });
  }

  // Copy file
  else {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

/* -----------------------------------------------------
    Create Main Window
------------------------------------------------------ */
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 650,
    icon: path.join(__dirname, "client/build/logo.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadFile(path.join(__dirname, "./client/build/index.html"));
  // win.webContents.openDevTools();
}

/* -----------------------------------------------------
   App Ready → Copy DB & Start Server
------------------------------------------------------ */
app.whenReady().then(() => {

  /* ------------------------------
     1) Define SOURCE paths
  ------------------------------- */
  const sourceRoot = isDev
    ? path.join(__dirname, "Server")
    : path.join(process.resourcesPath, "app.asar.unpacked", "Server");

  const sourceDb = path.join(sourceRoot, "managecash.sqlite");
  const sourceBackups = path.join(sourceRoot, "backups");

  /* ------------------------------
     2) Define DESTINATION paths
  ------------------------------- */
  const userRoot = app.getPath("userData");
  const userDb = path.join(userRoot, "managecash.sqlite");
  const userBackups = path.join(userRoot, "backups");



  /* ------------------------------
     3) Copy database if missing
  ------------------------------- */
  if (!fs.existsSync(userDb)) {
    console.log(" Copying database...");
    copyRecursiveSync(sourceDb, userDb);
  }

  /* ------------------------------
     4) Copy backups folder
  ------------------------------- */
  if (!fs.existsSync(userBackups)) {
    console.log(" Copying backups folder...");
    copyRecursiveSync(sourceBackups, userBackups);
  }


  /* ------------------------------
     6) Start local server
  ------------------------------- */
  console.log(" Starting server with database:", userDb);
  startServer(userDb, userBackups);

  /* ------------------------------
     7) Open Electron window
  ------------------------------- */
  createWindow();
});

/* -----------------------------------------------------
    Standard lifecycle
------------------------------------------------------ */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
