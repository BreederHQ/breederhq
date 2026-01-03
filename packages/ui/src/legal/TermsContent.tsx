// packages/ui/src/legal/TermsContent.tsx
// Shared Terms of Service content component
import * as React from "react";
import { TOS_EFFECTIVE_DATE_DISPLAY, CURRENT_TOS_VERSION } from "./config";

export interface TermsContentProps {
  /** Optional className for the container */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
}

/**
 * Terms of Service content component.
 * Renders the full Terms of Service document.
 * Can be used standalone or embedded in a page layout.
 */
export function TermsContent({ className, style }: TermsContentProps) {
  return (
    <article className={className} style={style}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Terms of Service
        </h1>
        <p style={{ opacity: 0.7, fontSize: "0.875rem" }}>
          Effective Date: {TOS_EFFECTIVE_DATE_DISPLAY} | Version: {CURRENT_TOS_VERSION}
        </p>
      </header>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>1. Agreement to Terms</h2>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          By accessing or using any services provided by BreederHQ LLC ("BreederHQ," "we," "us," or "our"),
          including but not limited to the BreederHQ platform, marketplace, and client portal (collectively,
          the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree
          to these Terms, do not access or use the Services.
        </p>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6, fontWeight: 500 }}>
          BreederHQ LLC is a Kansas limited liability company.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>2. Nature of the Platform</h2>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>2.1 Technology Platform Only</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          BreederHQ is a technology platform that provides tools and infrastructure enabling animal breeders
          ("Providers") to manage their operations and connect with potential buyers ("Buyers").
          <strong> BreederHQ is not a party to any transaction between Providers and Buyers.</strong>
        </p>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>2.2 No Agency or Brokerage</h3>
        <p style={{ marginBottom: "0.5rem", lineHeight: 1.6 }}>BreederHQ:</p>
        <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem", lineHeight: 1.8 }}>
          <li>Does NOT sell animals or services</li>
          <li>Does NOT act as a broker, agent, or intermediary in transactions</li>
          <li>Does NOT provide escrow services</li>
          <li>Does NOT process, hold, or control payments between parties</li>
          <li>Does NOT guarantee, warrant, or certify any animals, services, or transactions</li>
          <li>Does NOT verify, endorse, or take responsibility for Provider listings, claims, or representations</li>
        </ul>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>2.3 Direct Party Transactions</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          All transactions conducted through or in connection with the Services are directly between the
          Provider and the Buyer. BreederHQ merely provides the technological infrastructure to facilitate
          communication and listing management.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>3. User Responsibilities</h2>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>3.1 Provider Responsibilities</h3>
        <p style={{ marginBottom: "0.5rem", lineHeight: 1.6 }}>Providers are solely responsible for:</p>
        <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem", lineHeight: 1.8 }}>
          <li>Accuracy and truthfulness of all listing information</li>
          <li>Compliance with all applicable federal, state, and local laws regarding animal breeding, sales, and welfare</li>
          <li>Health, welfare, and condition of all animals</li>
          <li>Fulfillment of all commitments made to Buyers</li>
          <li>Handling refunds, disputes, and returns directly with Buyers</li>
          <li>Obtaining all necessary licenses, permits, and certifications</li>
          <li>Maintaining appropriate insurance coverage</li>
          <li>Tax reporting and compliance</li>
        </ul>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>3.2 Buyer Responsibilities</h3>
        <p style={{ marginBottom: "0.5rem", lineHeight: 1.6 }}>Buyers are solely responsible for:</p>
        <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem", lineHeight: 1.8 }}>
          <li>Conducting independent due diligence on Providers and animals</li>
          <li>Verifying all claims, certifications, and representations made by Providers</li>
          <li>Understanding and complying with applicable laws regarding animal acquisition</li>
          <li>Direct communication and negotiation with Providers</li>
          <li>Payment arrangements made directly with Providers</li>
          <li>Arranging transportation and receipt of animals</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>4. Disclaimer of Liability</h2>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>4.1 No Liability for Transactions</h3>
        <p style={{ marginBottom: "0.5rem", lineHeight: 1.6 }}>BreederHQ expressly disclaims all liability for:</p>
        <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem", lineHeight: 1.8 }}>
          <li>Any losses, damages, injuries, or deaths arising from transactions between Providers and Buyers</li>
          <li>The condition, health, genetics, temperament, or suitability of any animal</li>
          <li>Misrepresentations, fraud, or deceptive practices by any user</li>
          <li>Non-delivery, late delivery, or failed transactions</li>
          <li>Disputes between Providers and Buyers</li>
          <li>Any actions or omissions of Providers or Buyers</li>
        </ul>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>4.2 No Warranties</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6, textTransform: "uppercase", fontSize: "0.875rem" }}>
          THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
          BREEDERHQ DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>4.3 Limitation of Liability</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6, textTransform: "uppercase", fontSize: "0.875rem" }}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, BREEDERHQ SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR USE, ARISING
          FROM OR RELATED TO YOUR USE OF THE SERVICES OR ANY TRANSACTION FACILITATED THROUGH THE SERVICES.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>5. Indemnification</h2>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          You agree to indemnify, defend, and hold harmless BreederHQ, its officers, directors, employees,
          agents, and affiliates from any claims, damages, losses, liabilities, and expenses (including
          reasonable attorneys' fees) arising from:
        </p>
        <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem", lineHeight: 1.8 }}>
          <li>Your use of the Services</li>
          <li>Your violation of these Terms</li>
          <li>Your violation of any applicable law</li>
          <li>Any transaction you enter into with another user</li>
          <li>Any content you submit to the Services</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>6. Account Registration and Security</h2>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>6.1 Account Creation</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          To access certain features of the Services, you must create an account. You agree to provide accurate,
          current, and complete information during registration and to update such information as necessary.
        </p>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>6.2 Account Security</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          You are responsible for maintaining the confidentiality of your account credentials and for all
          activities that occur under your account. You must immediately notify BreederHQ of any unauthorized
          use of your account.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>7. Acceptable Use</h2>
        <p style={{ marginBottom: "0.5rem", lineHeight: 1.6 }}>You agree not to:</p>
        <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem", lineHeight: 1.8 }}>
          <li>Use the Services for any unlawful purpose</li>
          <li>Post false, misleading, or fraudulent content</li>
          <li>Harass, threaten, or harm other users</li>
          <li>Attempt to gain unauthorized access to the Services or other users' accounts</li>
          <li>Interfere with or disrupt the Services</li>
          <li>Violate any applicable laws or regulations</li>
          <li>Engage in any activity that could damage BreederHQ's reputation or business</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>8. Content and Intellectual Property</h2>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>8.1 User Content</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          You retain ownership of content you submit to the Services. By submitting content, you grant BreederHQ
          a non-exclusive, worldwide, royalty-free license to use, display, and distribute such content in
          connection with the Services.
        </p>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>8.2 BreederHQ Intellectual Property</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          The Services, including all software, designs, text, and graphics, are owned by BreederHQ and protected
          by intellectual property laws. You may not copy, modify, distribute, or create derivative works without
          our express written permission.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>9. Termination</h2>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>9.1 Termination by You</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          You may terminate your account at any time by contacting us or using account termination features
          in the Services.
        </p>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>9.2 Termination by BreederHQ</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          We may suspend or terminate your account at any time, with or without cause, and with or without notice.
          Reasons for termination may include violations of these Terms, fraudulent activity, or extended periods
          of inactivity.
        </p>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>9.3 Effect of Termination</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          Upon termination, your right to use the Services ceases immediately. Provisions of these Terms that
          by their nature should survive termination shall survive.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>10. Dispute Resolution</h2>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>10.1 Governing Law</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          These Terms shall be governed by and construed in accordance with the laws of the State of Kansas,
          without regard to its conflict of law provisions.
        </p>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>10.2 Arbitration</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          Any dispute arising from or relating to these Terms or the Services shall be resolved by binding
          arbitration administered by the American Arbitration Association in accordance with its Commercial
          Arbitration Rules. The arbitration shall take place in Kansas. The arbitrator's decision shall be
          final and binding, and judgment on the award may be entered in any court of competent jurisdiction.
        </p>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>10.3 Class Action Waiver</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          You agree to resolve disputes with BreederHQ on an individual basis and waive any right to participate
          in a class action lawsuit or class-wide arbitration.
        </p>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>10.4 Venue</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          For any disputes not subject to arbitration, you agree to submit to the exclusive jurisdiction and
          venue of the state and federal courts located in Kansas.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>11. Privacy</h2>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          Your use of the Services is also governed by our Privacy Policy, which is incorporated into these
          Terms by reference.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>12. Modifications to Terms</h2>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          BreederHQ may modify these Terms at any time. We will notify you of material changes by posting the
          updated Terms on our website and updating the "Effective Date" above. Your continued use of the
          Services after such modifications constitutes your acceptance of the updated Terms.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>13. General Provisions</h2>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>13.1 Entire Agreement</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          These Terms, together with the Privacy Policy, constitute the entire agreement between you and
          BreederHQ regarding the Services.
        </p>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>13.2 Severability</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          If any provision of these Terms is held invalid or unenforceable, the remaining provisions shall
          remain in full force and effect.
        </p>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>13.3 Waiver</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          Our failure to enforce any provision of these Terms shall not constitute a waiver of that provision.
        </p>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>13.4 Assignment</h3>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          You may not assign your rights or obligations under these Terms without our prior written consent.
          BreederHQ may assign these Terms without restriction.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>14. Contact Information</h2>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          If you have questions about these Terms, please contact us at:
        </p>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          <strong>BreederHQ LLC</strong><br />
          Email: legal@breederhq.com
        </p>
      </section>

      <footer style={{ borderTop: "1px solid currentColor", opacity: 0.3, paddingTop: "1rem", marginTop: "2rem" }}>
        <p style={{ fontSize: "0.875rem", fontStyle: "italic" }}>
          By using BreederHQ, you acknowledge that you have read, understood, and agree to be bound by these
          Terms of Service.
        </p>
      </footer>
    </article>
  );
}

export default TermsContent;
