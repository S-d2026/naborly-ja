'use client'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="app-shell">
      <div style={{ background: '#1B3A1D', padding: '17px 15px 13px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href="/" className="back-btn">←</Link>
        <div>
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.42)', marginBottom: 4 }}>Legal</p>
          <p style={{ color: '#fff', fontSize: 18 }}>Terms & Conditions</p>
        </div>
      </div>

      <div className="scroll-area" style={{ padding: '16px 17px 40px' }}>

        <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginBottom: 20 }}>
          Last updated: June 2026. By using NaberlyJA you agree to these terms.
        </p>

        {/* Section 1 */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 8 }}>1. About NaberlyJA</p>
          <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.75 }}>
            NaberlyJA (naberlyja.com) is a community marketplace platform operated by Omega Care Solutions LLC. It connects neighbours in Jamaica and beyond to share resources, find work, offer services, and support one another. NaberlyJA is a platform only — we do not sell goods or services directly and we are not a party to any transaction between users.
          </p>
        </div>

        {/* Section 2 */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 8 }}>2. Vendor and Buyer Disputes</p>
          <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.75 }}>
            NaberlyJA is not responsible for disputes between vendors and buyers or between any users of the platform. All transactions, arrangements, payments and agreements made between users are solely between those users. NaberlyJA does not guarantee the quality, safety, legality, or accuracy of any listing, product, or service offered on the platform. Users engage with one another at their own risk. If you have a dispute with another user, NaberlyJA encourages you to resolve it directly. NaberlyJA may, at its sole discretion, assist in mediation but is under no obligation to do so.
          </p>
        </div>

        {/* Section 3 */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 8 }}>3. Donations</p>
          <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.75 }}>
            Donations made through NaberlyJA are received and managed by Omega Care Solutions LLC via the NaberlyJA community fund. Donations do not go directly to individual listing posters. NaberlyJA makes no guarantee that donations will be passed on to any specific individual or family. Donation amounts are at the sole discretion of the donor. All donations are voluntary and non-refundable unless required by applicable law.
          </p>
        </div>

        {/* Section 4 */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 8 }}>4. Anonymous Listings</p>
          <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.75 }}>
            NaberlyJA offers an anonymous posting option that hides the poster's name and contact number. When a user contacts an anonymous listing, their message is relayed through NaberlyJA's relay number. NaberlyJA does not verify the identity of anonymous posters and is not responsible for the accuracy, truthfulness, or legitimacy of anonymous listings. Users who respond to anonymous listings do so at their own risk.
          </p>
        </div>

        {/* Section 5 */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 8 }}>5. No Guarantee of Listing Accuracy</p>
          <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.75 }}>
            Listings on NaberlyJA are posted by community members and are not verified by NaberlyJA unless specifically stated. NaberlyJA does not guarantee the accuracy, completeness, or reliability of any listing. NaberlyJA reserves the right to remove any listing at any time without notice for any reason including but not limited to suspected fraud, spam, inappropriate content, or violation of these terms. Users are encouraged to exercise their own judgement before responding to or acting on any listing.
          </p>
        </div>

        {/* Section 6 */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 8 }}>6. Privacy and Data</p>
          <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.75 }}>
            NaberlyJA collects the following information when you create an account: your name, email address, WhatsApp number, parish, and any services you choose to list. This information is used solely to operate the platform and connect you with your community. NaberlyJA does not sell your personal information to third parties. Your WhatsApp number is shared with other users only when you respond to or post a non-anonymous listing. You may request deletion of your account and associated data at any time by contacting hello@naberlyja.com.
          </p>
        </div>

        {/* Section 7 */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 8 }}>7. Age Requirement</p>
          <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.75 }}>
            NaberlyJA is intended for users who are 18 years of age or older. By creating an account you confirm that you are at least 18 years old. If we become aware that a user is under 18 we reserve the right to suspend or delete their account.
          </p>
        </div>

        {/* Section 8 */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 8 }}>8. Payments</p>
          <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.75 }}>
            Payments for boosts, sponsorships, and donations are processed securely via PayPal and Zelle. NaberlyJA does not store your payment information. All payments are subject to the terms of the relevant payment provider. Boost and sponsorship fees are non-refundable once activated. NaberlyJA reserves the right to change pricing at any time with reasonable notice.
          </p>
        </div>

        {/* Section 9 */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 8 }}>9. Prohibited Conduct</p>
          <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.75 }}>
            Users must not post fraudulent, misleading, offensive, or illegal listings. Users must not use the platform to harass, scam, or harm other users. Users must not post content that violates the rights of any third party. Violation of these prohibitions may result in immediate account suspension and removal of all listings without notice.
          </p>
        </div>

        {/* Section 10 */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 8 }}>10. Limitation of Liability</p>
          <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.75 }}>
            To the fullest extent permitted by law, NaberlyJA and Omega Care Solutions LLC shall not be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in connection with your use of the platform, including but not limited to damages arising from transactions between users, reliance on listing content, or donations made through the platform.
          </p>
        </div>

        {/* Section 11 */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 8 }}>11. Changes to These Terms</p>
          <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.75 }}>
            NaberlyJA reserves the right to update these terms at any time. Updated terms will be posted at naberlyja.com/terms with the date of the last update. Continued use of the platform after any update constitutes acceptance of the new terms.
          </p>
        </div>

        {/* Section 12 */}
        <div style={{ marginBottom: 30 }}>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 8 }}>12. Contact</p>
          <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.75 }}>
            For questions about these terms or to request account deletion, contact us at naberlyja@gmail.com or via WhatsApp at +19174432797.
          </p>
        </div>

        <div style={{ background: '#EDE7D9', borderRadius: 10, padding: 13, border: '1px solid #D8D0BC' }}>
          <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.65, textAlign: 'center' }}>
            NaberlyJA · naberlyja.com
          </p>
        </div>

      </div>
    </div>
  )
}
