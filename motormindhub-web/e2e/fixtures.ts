import { test as base } from "@playwright/test";
import {
  registerAndVerifyUser,
  registerAndGetVerificationToken,
  requestPasswordResetAndGetToken,
  setUserRole,
  deleteTestUser,
} from "./helpers/test-users";

export type TestRuolo = "ISCRITTO" | "AUTORE" | "MANAGER_AUTORI" | "GESTORE_UTENTI";

interface CreateTestUserOptions {
  /** Salta la verifica email (per testare lo scenario ACCOUNT_NON_VERIFICATO / il flusso di conferma). Default: false. */
  unverified?: boolean;
  /** Promuove l'account (via SQL diretto, cfr. helpers/test-users) dopo la registrazione. Default: ISCRITTO, nessuna promozione. */
  ruolo?: TestRuolo;
}

interface TestUser {
  email: string;
  password: string;
  /** Presente solo se creato con { unverified: true }: il token non è ancora stato consumato. */
  verificationToken?: string;
}

interface TestUsersFixture {
  /** Crea un utente reale (via API, come farebbe registerAndVerifyUser) e ne traccia la cancellazione. */
  create: (options?: CreateTestUserOptions) => Promise<TestUser>;
  /** Per gli utenti creati passando dalla UI (es. submit del form di registrazione): registra solo l'email da ripulire a fine test. */
  trackForCleanup: (email: string) => void;
  /** Richiede il recupero password per un utente già attivo e restituisce il token (non consumato) letto da Mailpit. */
  requestPasswordReset: (email: string) => Promise<string>;
}

interface Fixtures {
  /**
   * Un solo array di email tracciate condiviso da create/trackForCleanup:
   * a fine test, indipendentemente dall'esito (pass o fail), ogni email
   * tracciata viene cancellata — centralizza il pattern try/finally che
   * prima era ripetuto in ogni test che scriveva dati.
   */
  testUsers: TestUsersFixture;
}

const PASSWORD = "Sicura123!@#";

export const test = base.extend<Fixtures>({
  // Playwright chiama questo secondo parametro posizionalmente: il nome
  // "use" (convenzione della libreria) va evitato perché eslint-plugin-
  // react-hooks lo scambia per React.use(), da qui il rename.
  testUsers: async ({}, provideFixtureValue, testInfo) => {
    const createdEmails: string[] = [];
    let sequence = 0;

    const create = async (options: CreateTestUserOptions = {}): Promise<TestUser> => {
      // Prefisso "e2e-" condiviso col sweep di global-teardown.ts: qualunque
      // utente creato da questa fixture resta identificabile anche se il
      // singolo cleanup qui sotto non arrivasse a eseguire.
      const email = `e2e-${testInfo.testId}-${sequence++}-${Date.now()}@example.com`;
      createdEmails.push(email);

      let verificationToken: string | undefined;
      if (options.unverified) {
        verificationToken = await registerAndGetVerificationToken(email, PASSWORD);
      } else {
        await registerAndVerifyUser(email, PASSWORD);
      }

      if (options.ruolo && options.ruolo !== "ISCRITTO") {
        await setUserRole(email, options.ruolo);
      }

      return { email, password: PASSWORD, verificationToken };
    };

    const trackForCleanup = (email: string) => {
      createdEmails.push(email);
    };

    await provideFixtureValue({
      create,
      trackForCleanup,
      requestPasswordReset: requestPasswordResetAndGetToken,
    });

    for (const email of createdEmails) {
      try {
        await deleteTestUser(email);
      } catch (error) {
        // Non bloccante: il sweep di global-teardown.ts è la rete di
        // sicurezza per gli utenti "e2e-*" che restano indietro qui.
        console.warn(`Cleanup fixture fallito per ${email}:`, error);
      }
    }
  },
});

export { expect } from "@playwright/test";
