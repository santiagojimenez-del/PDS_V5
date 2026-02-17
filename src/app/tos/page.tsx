import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-muted-foreground">
          Last updated: February 17, 2026
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Acceptance of Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            By accessing and using ProDrones Hub ("the Service"), you accept and agree to be bound
            by the terms and provision of this agreement. If you do not agree to these Terms of
            Service, please do not use the Service.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Description of Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            ProDrones Hub is a comprehensive drone operations management platform that provides
            tools for job management, site tracking, deliverable viewing, and administrative
            functions for drone service operations.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. User Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials
            and for all activities that occur under your account. You agree to:
          </p>
          <ul className="ml-6 list-disc space-y-2 text-sm">
            <li>Provide accurate and complete information when creating your account</li>
            <li>Keep your password secure and confidential</li>
            <li>Notify us immediately of any unauthorized access to your account</li>
            <li>Accept responsibility for all activities under your account</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. User Responsibilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            When using ProDrones Hub, you agree to:
          </p>
          <ul className="ml-6 list-disc space-y-2 text-sm">
            <li>Comply with all applicable laws and regulations</li>
            <li>Not use the Service for any illegal or unauthorized purpose</li>
            <li>Not interfere with or disrupt the Service or servers</li>
            <li>Not attempt to gain unauthorized access to any part of the Service</li>
            <li>Not upload malicious code, viruses, or harmful content</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Data and Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            We are committed to protecting your privacy. Your use of the Service is also governed
            by our Privacy Policy. By using the Service, you consent to the collection and use of
            your information as described in our Privacy Policy.
          </p>
          <p className="text-sm leading-relaxed">
            All data uploaded to the Service, including aerial imagery, job information, and
            deliverables, remains the property of the respective organization or client.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Intellectual Property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            The Service and its original content, features, and functionality are owned by
            ProDrones and are protected by international copyright, trademark, patent, trade
            secret, and other intellectual property laws.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Service Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            While we strive to provide continuous access to the Service, we do not guarantee that
            the Service will be available at all times. We may suspend, withdraw, or modify the
            Service without notice for maintenance, updates, or other reasons.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            To the maximum extent permitted by law, ProDrones shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, or any loss of profits or
            revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill,
            or other intangible losses resulting from:
          </p>
          <ul className="ml-6 list-disc space-y-2 text-sm">
            <li>Your use or inability to use the Service</li>
            <li>Any unauthorized access to or use of our servers and/or any personal information</li>
            <li>Any interruption or cessation of transmission to or from the Service</li>
            <li>Any bugs, viruses, or other harmful code transmitted through the Service</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Termination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            We may terminate or suspend your account and access to the Service immediately, without
            prior notice or liability, for any reason, including but not limited to a breach of
            these Terms of Service.
          </p>
          <p className="text-sm leading-relaxed">
            Upon termination, your right to use the Service will immediately cease. All provisions
            of the Terms which by their nature should survive termination shall survive, including
            ownership provisions, warranty disclaimers, and limitations of liability.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>10. Changes to Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            We reserve the right to modify or replace these Terms at any time. If a revision is
            material, we will provide at least 30 days' notice prior to any new terms taking
            effect. What constitutes a material change will be determined at our sole discretion.
          </p>
          <p className="text-sm leading-relaxed">
            By continuing to access or use our Service after revisions become effective, you agree
            to be bound by the revised terms.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>11. Governing Law</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of the
            jurisdiction in which ProDrones operates, without regard to its conflict of law
            provisions.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>12. Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium">ProDrones Support</p>
            <p className="text-muted-foreground">support@prodrones.com</p>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm text-muted-foreground">
          By using ProDrones Hub, you acknowledge that you have read, understood, and agree to be
          bound by these Terms of Service.
        </p>
      </div>
    </div>
  );
}
