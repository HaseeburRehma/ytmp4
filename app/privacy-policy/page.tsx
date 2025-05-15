import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - Dynamo Downloader",
  description:
    "Privacy Policy for Dynamo Downloader - Learn how we protect your data and privacy when using our YouTube video downloader service.",
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-red-500">Privacy Policy</h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">1. Introduction</h2>
            <p>
              Welcome to Dynamo Downloader ("Company", "we", "our", "us"). We value your privacy and are committed to
              protecting your personal data. This Privacy Policy outlines how we collect, use, and safeguard your
              information when you use our website youtubetomp4download.com and services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Personal Data:</strong> We may collect personal identification information, such as your name
                and email address, when you voluntarily provide it to us.
              </li>
              <li>
                <strong>Usage Data:</strong> We automatically collect information about your interaction with our
                Website, including your IP address, browser type, operating system, referring URLs, and pages viewed.
              </li>
              <li>
                <strong>Cookies:</strong> Our Website uses cookies to enhance user experience. You can control cookie
                preferences through your browser settings.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">3. How We Use Your Information</h2>
            <p>We use the collected data for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our services.</li>
              <li>To improve and personalize user experience.</li>
              <li>To communicate with you, respond to inquiries, and provide customer support.</li>
              <li>To analyze usage patterns and improve our Website's functionality.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">4. Sharing Your Information</h2>
            <p>
              We do not sell, trade, or rent your personal identification information to others. We may share generic
              aggregated demographic information not linked to any personal identification information with our business
              partners and trusted affiliates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">5. Data Security</h2>
            <p>
              We implement appropriate data collection, storage, and processing practices to protect against
              unauthorized access, alteration, disclosure, or destruction of your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access and obtain a copy of your personal data.</li>
              <li>Rectify any inaccurate or incomplete data.</li>
              <li>Request the deletion of your personal data.</li>
              <li>Object to or restrict the processing of your data.</li>
            </ul>
            <p className="mt-4">To exercise these rights, please contact us at contact@dynamodownloader.com.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">7. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We encourage you to review this page periodically for
              any changes. Your continued use of the Website after any modifications indicates your acceptance of the
              updated policy.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <Link href="/" className="text-red-500 hover:text-red-400 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
