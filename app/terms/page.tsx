import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms and Conditions - Dynamo Downloader",
  description: "Terms and Conditions for using Dynamo Downloader - YouTube video downloader service.",
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-red-500">Terms and Conditions</h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing and using dynamodownloader.com ("Website"), you accept and agree to be bound by the terms and
              provision of this agreement. In addition, when using this Website's particular services, you shall be
              subject to any posted guidelines or rules applicable to such services. Any participation in this service
              will constitute acceptance of this agreement. If you do not agree to abide by the above, please do not use
              this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">2. Intellectual Property</h2>
            <p>
              The Website and its original content, features, and functionality are owned by Dynamo Downloader and are
              protected by international copyright, trademark, patent, trade secret, and other intellectual property or
              proprietary rights laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">3. Termination</h2>
            <p>
              We may terminate your access to the Website, without cause or notice, which may result in the forfeiture
              and destruction of all information associated with you. All provisions of this Agreement that by their
              nature should survive termination shall survive termination, including, without limitation, ownership
              provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">4. Changes to This Agreement</h2>
            <p>
              We reserve the right to modify these Terms and Conditions at any time. We do so by posting and drawing
              attention to the updated terms on the Website. Your decision to continue visiting and making use of the
              Website after such changes have been made constitutes your formal acceptance of the new Terms and
              Conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">5. Governing Law</h2>
            <p>
              This Agreement is governed in accordance with the laws of United States, without regard to its conflict of
              law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">6. Contact Us</h2>
            <p>If you have any questions about this Agreement, please contact us at contact@dynamodownloader.com.</p>
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
