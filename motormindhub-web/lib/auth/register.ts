import { toast } from "@/lib/toast/toast";
import { apiFetch } from "@/lib/http/client";

export interface RegisterInput {
  nome: string;
  cognome: string;
  email: string;
  password: string;
  consensoPrivacy: boolean;
}

interface RegisterErrorBody {
  messages?: string[];
}

/**
 * POST /api/v1/utenti/registrazione: a differenza di login/refresh/logout
 * non maneggia token/cookie, quindi chiama il backend direttamente via
 * apiFetch (CORS, come ogni altra chiamata non-auth) invece di passare da
 * un route handler proxy dedicato — non ce n'è motivo qui.
 *
 * Gli errori di validazione (email già registrata, password debole, ecc.)
 * possono essere più di uno per submit (RF1.3, ognuno dei campi validato
 * indipendentemente lato backend): mostrati tutti, non solo il primo.
 */
export async function register(input: RegisterInput): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch("/api/v1/utenti/registrazione", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify(input),
    });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    let body: RegisterErrorBody = {};
    try {
      body = await response.json();
    } catch {
      // corpo non JSON: si ricade sul messaggio generico sotto
    }
    const messages = body.messages?.length
      ? body.messages
      : ["Non è stato possibile completare la registrazione. Riprova."];
    messages.forEach((message) => toast.error(message));
    return false;
  }

  return true;
}
