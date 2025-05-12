/**
 * Proxy Manager for handling proxy rotation and management
 */

// List of free proxy servers (for demonstration - in production you would use paid/private proxies)
// Format: protocol://username:password@host:port
const FREE_PROXIES = [
    // These are placeholders - you should replace with actual proxies
    "http://35.86.81.136:3128",
    "http://18.132.36.51:3128",
    "http://34.221.119.219:999",
    "http://54.184.124.175:14581",
    "http://54.245.34.166:10001",
    "http://18.236.175.208:10001",
    "http://18.175.118.106:999",
    "http://40.76.69.94:8080",
    "http://3.10.207.94:4222",
    "http://35.90.245.227:31293",
    "http://52.11.48.124:3128",
    "http://13.40.152.64:3128",
    "http://54.245.27.232:999",
    "http://54.214.109.103:10001",
    "http://52.194.186.70:1080",   // SOCKS-compatible if supported
    "http://8.219.97.248:80",
    "http://66.201.7.151:3128",
    "http://47.254.88.250:13001"

]

// Environment variable for private proxies
const PRIVATE_PROXIES = process.env.PROXY_LIST ? process.env.PROXY_LIST.split(",") : []

class ProxyManager {
    private proxies: string[]
    private currentIndex = 0
    private lastRotation: number = Date.now()
    private rotationInterval: number = 10 * 60 * 1000 // 10 minutes

    constructor() {
        // Combine private and free proxies, prioritizing private ones
        this.proxies = [...PRIVATE_PROXIES, ...FREE_PROXIES]

        // Shuffle the proxies for better distribution
        this.shuffleProxies()

        console.log(`Initialized proxy manager with ${this.proxies.length} proxies`)
    }

    /**
     * Get the current proxy
     */
    public getCurrentProxy(): string | null {
        if (this.proxies.length === 0) {
            return null
        }

        // Check if we need to rotate based on time
        if (Date.now() - this.lastRotation > this.rotationInterval) {
            this.rotateProxy()
        }

        return this.proxies[this.currentIndex]
    }

    /**
     * Rotate to the next proxy
     */
    public rotateProxy(): string | null {
        if (this.proxies.length === 0) {
            return null
        }

        this.currentIndex = (this.currentIndex + 1) % this.proxies.length
        this.lastRotation = Date.now()

        console.log(`Rotated to proxy #${this.currentIndex + 1}`)
        return this.proxies[this.currentIndex]
    }

    /**
     * Mark the current proxy as failed and rotate to the next one
     */
    public markCurrentProxyAsFailed(): string | null {
        if (this.proxies.length === 0) {
            return null
        }

        // Remove the failed proxy
        const failedProxy = this.proxies[this.currentIndex]
        this.proxies.splice(this.currentIndex, 1)

        console.log(`Marked proxy as failed and removed: ${failedProxy}`)

        // If we have no more proxies, return null
        if (this.proxies.length === 0) {
            console.log("No more proxies available")
            return null
        }

        // Adjust the index if needed
        if (this.currentIndex >= this.proxies.length) {
            this.currentIndex = 0
        }

        return this.proxies[this.currentIndex]
    }

    /**
     * Shuffle the proxies array
     */
    private shuffleProxies(): void {
        for (let i = this.proxies.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[this.proxies[i], this.proxies[j]] = [this.proxies[j], this.proxies[i]]
        }
    }

    /**
     * Get proxy arguments for yt-dlp
     */
    public getProxyArgs(): string[] {
        const proxy = this.getCurrentProxy()
        if (!proxy) {
            return []
        }

        return ["--proxy", proxy]
    }
}

export const proxyManager = new ProxyManager()
