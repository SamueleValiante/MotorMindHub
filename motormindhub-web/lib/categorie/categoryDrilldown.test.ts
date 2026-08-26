import { describe, expect, it } from "vitest";
import { findCategoryPath } from "./categoryDrilldown";
import type { CategoryTreeNode } from "./types";

// Fiat > Panda > Panda III > Meccanica > Freni — 5 livelli, la profondità
// reale della tassonomia migrata, non un fixture a 2 livelli che non
// eserciterebbe il caso che ha reso necessario questo drill-down.
const TREE: CategoryTreeNode[] = [
  {
    id: 1,
    nome: "Fiat",
    descrizione: null,
    figlie: [
      {
        id: 2,
        nome: "Panda",
        descrizione: null,
        figlie: [
          {
            id: 3,
            nome: "Panda III",
            descrizione: null,
            figlie: [
              {
                id: 4,
                nome: "Meccanica",
                descrizione: null,
                figlie: [{ id: 5, nome: "Freni", descrizione: null, figlie: [] }],
              },
            ],
          },
        ],
      },
    ],
  },
  { id: 6, nome: "Volkswagen", descrizione: null, figlie: [] },
];

describe("findCategoryPath", () => {
  it("currentId null restituisce percorso vuoto (livello radice)", () => {
    expect(findCategoryPath(TREE, null)).toEqual([]);
  });

  it("nodo radice: percorso di un solo elemento", () => {
    const path = findCategoryPath(TREE, 1);
    expect(path.map((n) => n.nome)).toEqual(["Fiat"]);
  });

  it("foglia a profondità 5: percorso completo radice -> foglia, nell'ordine giusto", () => {
    const path = findCategoryPath(TREE, 5);
    expect(path.map((n) => n.nome)).toEqual(["Fiat", "Panda", "Panda III", "Meccanica", "Freni"]);
  });

  it("id inesistente: percorso vuoto invece di lanciare un errore (link stantio)", () => {
    expect(findCategoryPath(TREE, 999)).toEqual([]);
  });

  it("non confonde nodi in rami diversi con lo stesso id incrementale vicino", () => {
    // Volkswagen (id 6) e' un fratello di Fiat, non un discendente: il
    // percorso deve fermarsi a lui da solo, senza agganciare nulla del
    // ramo Fiat attraversato prima nella visita.
    const path = findCategoryPath(TREE, 6);
    expect(path.map((n) => n.nome)).toEqual(["Volkswagen"]);
  });
});
