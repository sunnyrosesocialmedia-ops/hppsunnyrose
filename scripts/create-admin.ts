import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { normalizeEmail } from "../src/lib/email";
import readline from "readline";

function ask(question: string, hide = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hide) {
      // @ts-expect-error - readline internal, cukup untuk menyembunyikan input password sederhana
      rl._writeToOutput = () => {};
    }
    rl.question(question, (answer) => {
      rl.close();
      console.log();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const rawEmail = process.env.ADMIN_EMAIL || (await ask("Email admin: "));
  const password = process.env.ADMIN_PASSWORD || (await ask("Password admin: ", true));
  const name = process.env.ADMIN_NAME || "Fotografer";

  if (!rawEmail || !password) {
    console.error("Email dan password wajib diisi.");
    process.exit(1);
  }

  const email = normalizeEmail(rawEmail);

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });

  console.log(`Admin siap: ${admin.email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
