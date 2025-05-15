import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Disclaimer - Dynamo Downloader",
  description: "Disclaimer for Dynamo Downloader - YouTube video downloader service.",
}

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-red-500">Disclaimer</h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">1. General Information</h2>
            <p>
              The information provided by Dynamo Downloader ("we," "us," or "our") on dynamodownloader.com is for
              general informational purposes only. All information on the Website is provided in good faith; however, we
              make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy,
              validity, reliability, availability, or completeness of any information on the Website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">2. External Links Disclaimer</h2>
            <p>
              The Website may contain  links to other websites or content
              belonging to or originating from third parties or links to websites and features in banners or other
              advertising. Such external links are not investigated, monitored, or checked for accuracy, adequacy,
              validity, reliability, availability, or completeness by us. We do not warrant, endorse, guarantee, or
              assume responsibility for the accuracy or reliability of any information offered by third-party websites
              linked through the Website or any website or feature linked in any banner or other advertising. We will
              not be a party to or in any way be responsible for monitoring any transaction between you and third-party
              providers of products or services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">3. Fair Use Disclaimer</h2>
            <p>
              The Website may contain copyrighted material, the use of which has not always been specifically authorized
              by the copyright owner. We are making such material available for criticism, comment, news reporting,
              teaching, scholarship, or research. We believe this constitutes a "fair use" of any such copyrighted
              material as provided for in section 107 of the US Copyright Law. If you wish to use copyrighted material
              from this site for purposes of your own that go beyond fair use, you must obtain permission from the
              copyright owner.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">4. Views Expressed Disclaimer</h2>
            <p>
              The Website may contain views and opinions that are those of the authors and do not necessarily reflect
              the official policy or position of any other author, agency, organization, employer, or company, including
              Dynamo Downloader. Comments published by users are their sole responsibility, and the users will take full
              responsibility, liability, and blame for any libel or litigation that results from something written in or
              as a direct result of something written in a comment. Dynamo Downloader is not liable for any comment
              published by users and reserves the right to delete any comment for any reason whatsoever.
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
