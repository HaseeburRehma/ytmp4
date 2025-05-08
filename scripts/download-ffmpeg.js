const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const isWindows = os.platform() === "win32";
const isMac = os.platform() === "darwin";
const isLinux = os.platform() === "linux";

const binDir = path.join(process.cwd(), "bin");

// Create bin directory if it doesn't exist
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

console.log("Installing FFmpeg...");

// Download and extract FFmpeg depending on OS
async function downloadFFmpeg() {
  let downloadCommand;
  let ffmpegPath = "";
  let ffprobePath = "";

  if (isWindows) {
    const zipPath = path.join(binDir, "ffmpeg.zip");
    downloadCommand = `
      curl -L https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip -o ${zipPath} && `
      + `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${binDir}' -Force" && `
      + `del ${zipPath}`;
  } else if (isMac || isLinux) {
    ffmpegPath = path.join(binDir, "ffmpeg");
    ffprobePath = path.join(binDir, "ffprobe");
    downloadCommand = `
      curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ${binDir}/ffmpeg.tar.xz && `
      + `tar -xf ${binDir}/ffmpeg.tar.xz -C ${binDir} && `
      + `mv ${binDir}/ffmpeg-*-static/ffmpeg ${ffmpegPath} && `
      + `mv ${binDir}/ffmpeg-*-static/ffprobe ${ffprobePath} && `
      + `chmod +x ${ffmpegPath} ${ffprobePath} && `
      + `rm -rf ${binDir}/ffmpeg.tar.xz ${binDir}/ffmpeg-*-static`;
  } else {
    console.error("Unsupported platform");
    return;
  }

  console.log("Downloading and extracting FFmpeg...");

  exec(downloadCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error downloading FFmpeg: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }

    if (isWindows) {
      const extractedFolder = fs.readdirSync(binDir).find(name => name.startsWith("ffmpeg"));
      const ffmpegFullPath = path.join(binDir, extractedFolder, "bin", "ffmpeg.exe");
      const ffprobeFullPath = path.join(binDir, extractedFolder, "bin", "ffprobe.exe");

      ffmpegPath = ffmpegFullPath;
      ffprobePath = ffprobeFullPath;
    }

    const envPath = path.join(process.cwd(), ".env.local");

    const envContent = [
      `FFMPEG_PATH=${ffmpegPath.replace(/\\/g, "\\\\")}`,
      `FFPROBE_PATH=${ffprobePath.replace(/\\/g, "\\\\")}`,
    ].join("\n") + "\n";

    if (fs.existsSync(envPath)) {
      const currentEnv = fs.readFileSync(envPath, "utf8");
      if (!currentEnv.includes("FFMPEG_PATH")) {
        fs.appendFileSync(envPath, envContent);
      }
    } else {
      fs.writeFileSync(envPath, envContent);
    }

    console.log(".env.local updated with FFMPEG_PATH and FFPROBE_PATH");
    console.log("FFmpeg installation complete.");
  });
}
 
downloadFFmpeg();
