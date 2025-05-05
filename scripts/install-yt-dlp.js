const { exec } = require("child_process")
const fs = require("fs")
const path = require("path")
const os = require("os")

const isWindows = os.platform() === "win32"
const isMac = os.platform() === "darwin"
const isLinux = os.platform() === "linux"

const scriptsDir = path.join(process.cwd(), "scripts")
const binDir = path.join(process.cwd(), "bin")

// Create bin directory if it doesn't exist
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true })
}

console.log("Installing yt-dlp...")

// Function to download yt-dlp based on platform
async function downloadYtDlp() {
  let downloadCommand
  let ytDlpPath

  if (isWindows) {
    ytDlpPath = path.join(binDir, "yt-dlp.exe")
    downloadCommand = `curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -o ${ytDlpPath}`
  } else if (isMac || isLinux) {
    ytDlpPath = path.join(binDir, "yt-dlp")
    downloadCommand = `curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ${ytDlpPath} && chmod +x ${ytDlpPath}`
  } else {
    console.error("Unsupported platform")
    return
  }

  console.log(`Downloading yt-dlp to ${ytDlpPath}`)

  exec(downloadCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error downloading yt-dlp: ${error.message}`)
      return
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`)
    }
    console.log(`yt-dlp downloaded successfully to ${ytDlpPath}`)

    // Create a .env.local file with the path to yt-dlp
    const envPath = path.join(process.cwd(), ".env.local")
    const envContent = `YT_DLP_PATH=${ytDlpPath.replace(/\\/g, "\\\\")}\n`

    // Append to existing .env.local or create new one
    if (fs.existsSync(envPath)) {
      const currentEnv = fs.readFileSync(envPath, "utf8")
      if (!currentEnv.includes("YT_DLP_PATH")) {
        fs.appendFileSync(envPath, envContent)
      }
    } else {
      fs.writeFileSync(envPath, envContent)
    }

    console.log(".env.local updated with YT_DLP_PATH")
  })
}

downloadYtDlp()
