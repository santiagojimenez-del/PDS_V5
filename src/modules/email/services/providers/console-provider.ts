import type { IEmailProvider, EmailOptions, EmailResult } from "../../types";

/**
 * Console Provider - For local development
 * Just logs emails to console instead of actually sending them
 */
export class ConsoleProvider implements IEmailProvider {
  async send(options: EmailOptions): Promise<EmailResult> {
    const to = Array.isArray(options.to) ? options.to : [options.to];

    console.log("\n" + "=".repeat(80));
    console.log("📧 EMAIL (Console Provider)");
    console.log("=".repeat(80));
    console.log(`From: ${options.from?.name || ""} <${options.from?.email}>`);
    console.log(`To: ${to.map((t) => `${t.name || ""} <${t.email}>`).join(", ")}`);
    if (options.cc) {
      const cc = Array.isArray(options.cc) ? options.cc : [options.cc];
      console.log(`CC: ${cc.map((c) => `${c.name || ""} <${c.email}>`).join(", ")}`);
    }
    console.log(`Subject: ${options.subject}`);
    console.log("-".repeat(80));
    if (options.text) {
      console.log("Text Body:");
      console.log(options.text);
    }
    if (options.html) {
      console.log("\nHTML Body:");
      console.log(options.html.substring(0, 500) + (options.html.length > 500 ? "..." : ""));
    }
    console.log("=".repeat(80) + "\n");

    return {
      success: true,
      messageId: `console-${Date.now()}`,
      provider: "console",
    };
  }

  async verifyConnection(): Promise<boolean> {
    return true; // Console provider always works
  }
}
