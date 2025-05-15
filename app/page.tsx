import { YoutubeDownloader } from "@/components/youtube-downloader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Facebook, Twitter, MessageCircle, Share2 } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dynamo Downloader - Best YouTube Video Downloader Online",
  description:
    "Download YouTube videos in MP4, 1080p HD, 4K, and MP3 formats for free. No software needed, works on all devices.",
  keywords:
    "YouTube downloader, video downloader, MP4 downloader, MP3 converter, download YouTube videos, 1080p downloader, 4K video download",
  openGraph: {
    title: "Dynamo Downloader - Best YouTube Video Downloader Online",
    description:
      "Download YouTube videos in MP4, 1080p HD, 4K, and MP3 formats for free. No software needed, works on all devices.",
    url: "https://dynamodownloader.com",
    siteName: "Dynamo Downloader",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Dynamo Downloader - YouTube Video Downloader",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dynamo Downloader - Best YouTube Video Downloader Online",
    description:
      "Download YouTube videos in MP4, 1080p HD, 4K, and MP3 formats for free. No software needed, works on all devices.",
    images: ["/twitter-image.jpg"],
  },
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 bg-[url('/hero-bg.jpg')] bg-cover bg-center"></div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-red-500 drop-shadow-lg">
              Dynamo Downloader
            </h1>
            <p className="text-xl md:text-2xl font-medium text-white mb-8">Best YouTube Video Downloader Online</p>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto">
              Looking for the best YouTube videos downloader online? Dynamo Downloader offers a fast, secure, and free
              solution to save YouTube videos in various formats, including MP4, 1080p HD, 4K, and MP3.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="flex items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-red-400 mr-2">✓</span>
                <span className="text-sm md:text-base">No software needed</span>
              </div>
              <div className="flex items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-red-400 mr-2">✓</span>
                <span className="text-sm md:text-base">Convert to MP4 or MP3</span>
              </div>
              <div className="flex items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-red-400 mr-2">✓</span>
                <span className="text-sm md:text-base">Mac & Windows compatible</span>
              </div>
              <div className="flex items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-red-400 mr-2">✓</span>
                <span className="text-sm md:text-base">High-quality downloads</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Downloader Section */}
      <section className="py-12" id="downloader">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <Card className="border border-gray-700 bg-gray-800/80 text-white shadow-2xl backdrop-blur-sm">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="text-red-500 text-2xl md:text-3xl">YouTube Downloader</CardTitle>
              <CardDescription className="text-gray-300">
                Enter a YouTube URL to download videos in MP3 or MP4 format
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <YoutubeDownloader />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Key Features of Our YouTube Video Downloader
            </h2>
            <div className="w-24 h-1 bg-red-500 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-800/80 p-6 rounded-xl shadow-lg hover:shadow-red-500/10 transition-all duration-300">
              <h3 className="text-xl font-bold text-red-400 mb-3">Effortless YouTube Video Downloads</h3>
              <p className="text-gray-300">
                Download YouTube videos in formats like MP4, WebM, and 1080p HD without restrictions.
              </p>
            </div>

            <div className="bg-gray-800/80 p-6 rounded-xl shadow-lg hover:shadow-red-500/10 transition-all duration-300">
              <h3 className="text-xl font-bold text-red-400 mb-3">User-Friendly Interface</h3>
              <p className="text-gray-300">
                No technical skills are required; just paste the link and download instantly.
              </p>
            </div>

            <div className="bg-gray-800/80 p-6 rounded-xl shadow-lg hover:shadow-red-500/10 transition-all duration-300">
              <h3 className="text-xl font-bold text-red-400 mb-3">Multi-Format YouTube Video Converter</h3>
              <p className="text-gray-300">
                Dynamo Downloader serves as a YouTube video to MP4 downloader and a video downloader MP3 converter.
              </p>
            </div>

            <div className="bg-gray-800/80 p-6 rounded-xl shadow-lg hover:shadow-red-500/10 transition-all duration-300">
              <h3 className="text-xl font-bold text-red-400 mb-3">High-Quality 1080p & 4K Downloads</h3>
              <p className="text-gray-300">
                Get crisp and clear videos with our YouTube video downloader 1080p/4K feature.
              </p>
            </div>

            <div className="bg-gray-800/80 p-6 rounded-xl shadow-lg hover:shadow-red-500/10 transition-all duration-300">
              <h3 className="text-xl font-bold text-red-400 mb-3">Supports Windows & Mac Users</h3>
              <p className="text-gray-300">
                Download YouTube videos on Mac and Windows devices without installing any software.
              </p>
            </div>

            <div className="bg-gray-800/80 p-6 rounded-xl shadow-lg hover:shadow-red-500/10 transition-all duration-300">
              <h3 className="text-xl font-bold text-red-400 mb-3">Fast & Secure Downloads</h3>
              <p className="text-gray-300">
                Dynamo Downloader provides lightning-fast download speeds while ensuring your privacy is protected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Download YouTube Videos Online in 3 Simple Steps
            </h2>
            <div className="w-24 h-1 bg-red-500 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative">
              <div className="bg-gray-800/80 p-6 rounded-xl shadow-lg h-full">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold text-white mb-3 mt-4">Copy the YouTube Video URL</h3>
                <p className="text-gray-300">
                  Find the video you want on YouTube and copy its link from the address bar.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gray-800/80 p-6 rounded-xl shadow-lg h-full">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold text-white mb-3 mt-4">Paste the Link in YouTube to MP4</h3>
                <p className="text-gray-300">Enter the copied URL into the search box above and click "Download."</p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gray-800/80 p-6 rounded-xl shadow-lg h-full">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold text-white mb-3 mt-4">Choose Format & Download</h3>
                <p className="text-gray-300">
                  Select from MP4, 1080p HD, or MP3, then hit "Download" for instant access.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-red-500/20 transition-all duration-300">
              <a href="#downloader" className="flex items-center">
                Download Now
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  ></path>
                </svg>
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Share Section */}
      <section className="py-8 bg-gray-800/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between max-w-4xl mx-auto">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold text-white">Share Dynamo Downloader:</h3>
            </div>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-gray-600 hover:bg-red-500 hover:border-red-500"
              >
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Share on Facebook</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-gray-600 hover:bg-red-500 hover:border-red-500"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Share on Twitter</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-gray-600 hover:bg-red-500 hover:border-red-500"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="sr-only">Share on WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-gray-600 hover:bg-red-500 hover:border-red-500"
              >
                <Share2 className="h-5 w-5" />
                <span className="sr-only">Share on Reddit</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              FAQ – Dynamo Downloader Your Ultimate YouTube Video Downloader
            </h2>
            <div className="w-24 h-1 bg-red-500 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-800/80 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-red-400 mb-2">1. Is it legal to download YouTube videos?</h3>
              <p className="text-gray-300">
                Downloading videos for personal use is generally fine, but downloading copyrighted content without
                permission violates YouTube's policies.
              </p>
            </div>

            <div className="bg-gray-800/80 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-red-400 mb-2">2. Can I download YouTube videos on Mac?</h3>
              <p className="text-gray-300">
                Yes! Our YouTube video downloader for Mac works directly in your browser—no installation is required.
              </p>
            </div>

            <div className="bg-gray-800/80 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-red-400 mb-2">3. How can I convert YouTube videos to MP4?</h3>
              <p className="text-gray-300">
                Use Dynamo YouTube video to MP4 downloader to save videos in MP4 format for smooth playback on any
                device.
              </p>
            </div>

            <div className="bg-gray-800/80 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-red-400 mb-2">4. Does Dynamo Downloader support Windows users?</h3>
              <p className="text-gray-300">
                Dynamo Downloader works as a YouTube video downloader for Windows, supporting all major browsers.
              </p>
            </div>

            <div className="bg-gray-800/80 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-red-400 mb-2">5. Can I download 1080p YouTube videos?</h3>
              <p className="text-gray-300">
                Use our YouTube video downloader 1080p feature to get high-definition videos without quality loss.
              </p>
            </div>

            <div className="bg-gray-800/80 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-red-400 mb-2">6. How do I convert YouTube videos to MP3?</h3>
              <p className="text-gray-300">
                Our video downloader MP3 feature allows you to extract audio from videos easily.
              </p>
            </div>

            <div className="bg-gray-800/80 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-red-400 mb-2">7. Why is my video not downloading?</h3>
              <p className="text-gray-300">
                If you're experiencing issues, check if the video is public and not restricted. Try refreshing the page
                and entering the link again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Links */}
      <footer className="bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Dynamo Downloader</h3>
              <p className="text-gray-400 mb-4">Download your favorite YouTube videos now – fast, free, & secure!</p>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-gray-600 hover:bg-red-500 hover:border-red-500"
                >
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-gray-600 hover:bg-red-500 hover:border-red-500"
                >
                  <Twitter className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-red-400 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-gray-400 hover:text-red-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-red-400 transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/disclaimer" className="text-gray-400 hover:text-red-400 transition-colors">
                    Disclaimer
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-4">Contact Us</h3>
              <p className="text-gray-400">Have questions or feedback? We'd love to hear from you!</p>
              <Link href="/contact" className="inline-block mt-4 text-red-400 hover:text-red-300 transition-colors">
                Get in touch →
              </Link>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-500">© {new Date().getFullYear()} Dynamo Downloader. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Dynamo Downloader",
            url: "https://dynamodownloader.com",
            description:
              "Download YouTube videos in MP4, 1080p HD, 4K, and MP3 formats for free. No software needed, works on all devices.",
            applicationCategory: "MultimediaApplication",
            operatingSystem: "Windows, macOS, Android, iOS",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          }),
        }}
      />
    </div>
  )
}
