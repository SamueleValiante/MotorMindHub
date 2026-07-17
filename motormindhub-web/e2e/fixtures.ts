import { test as base } from "@playwright/test";
import { registerAndVerifyUser, registerUnverified, setUserRole, deleteTestUser } from "./helpers/test-users";

export type TestRuolo = "ISCRITTO" | "AUTORE" | "MANAGER_AUTORI" | "GESTORE_UTENTI";

interface CreateTestUserOptions {
  /** Salta la verifica email (per testare lo scenario ACCOUNT_NON_VERIFICATO). Default: false. */
  unverified?: boolean;
  /** Promuove l'account (via SQL diretto, cfr. helpers/test-users) dopo la registrazione. Default: ISCRITTO, nessuna promozione. */
  ruolo?: TestRuolo;
}

interface TestUser {
  email: string;
  password: string;
}

interface Fixtures {
  /**
   * Crea un utente reale (registrazione + verifica email via Mailpit, come
   * farebbe un utente vero) e ne garantisce la cancellazione a fine test,
   * indipendentemente dall'esito (pass o fail) — centralizza il pattern
   * try/finally che prima era ripetuto in ogni test che scriveva dati.
   */
  createTestUser: (options?: CreateTestUserOptions) => Promise<TestUser>;
}

const PASSWORD = "Sicura123!@#";

export const test = base.extend<Fixtures>({
  // Playwright chiama questo secondo parametro posizionalmente: il nome
  // "use" (convenzione della libreria) va evitato perché eslint-plugin-
  // react-hooks lo scambia per React.use(), da qui il rename.
  createTestUser: async ({}, provideFixtureValue, testInfo) => {
    const createdEmails: string[] = [];
    let sequence = 0;

    const createTestUser = async (options: CreateTestUserOptions = {}): Promise<TestUser> => {
      // Prefisso "e2e-" condiviso col sweep di global-teardown.ts: qualunque
      // utente creato da questa fixture resta identificabile anche se il
      // singolo cleanup qui sotto non arrivasse a eseguire.
      const email = `e2e-${testInfo.testId}-${sequence++}-${Date.now()}@example.com`;
      createdEmails.push(email);

      if (options.unverified) {
        await registerUnverified(email, PASSWORD);
      } else {
        await registerAndVerifyUser(email, PASSWORD);
      }

      if (options.ruolo && options.ruolo !== "ISCRITTO") {
        setUserRole(email, options.ruolo);
      }

      return { email, password: PASSWORD };
    };

    await provideFixtureValue(createTestUser);

    for (const email of createdEmails) {
      try {
        deleteTestUser(email);
      } catch (error) {
        // Non bloccante: il sweep di global-teardown.ts è la rete di
        // sicurezza per gli utenti "e2e-*" che restano indietro qui.
        console.warn(`Cleanup fixture fallito per ${email}:`, error);
      }
    }
  },
});

export { expect } from "@playwright/test";
