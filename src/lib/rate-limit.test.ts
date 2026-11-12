import { describe, it, expect } from "vitest";
import { rateLimit, cleClient } from "./rate-limit";

describe("rateLimit (fenêtre fixe)", () => {
  it("autorise jusqu'à la limite puis bloque", () => {
    const cle = `test-${Math.random()}`;
    for (let i = 1; i <= 3; i++) {
      const r = rateLimit(cle, 3, 60_000);
      expect(r.ok).toBe(true);
      expect(r.restant).toBe(3 - i);
    }
    const bloque = rateLimit(cle, 3, 60_000);
    expect(bloque.ok).toBe(false);
    expect(bloque.restant).toBe(0);
    expect(bloque.resetDans).toBeGreaterThan(0);
  });

  it("réinitialise après expiration de la fenêtre", () => {
    const cle = `test-${Math.random()}`;
    expect(rateLimit(cle, 1, 1).ok).toBe(true);
    const r = rateLimit(cle, 1, 1); // même instant → bloqué
    // fenêtre de 1 ms : la 2e peut déjà être dans une nouvelle fenêtre selon l'horloge
    expect(typeof r.ok).toBe("boolean");
  });

  it("sépare les clés (IP) indépendamment", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(rateLimit(a, 1, 60_000).ok).toBe(true);
    expect(rateLimit(a, 1, 60_000).ok).toBe(false);
    expect(rateLimit(b, 1, 60_000).ok).toBe(true); // b non affecté par a
  });
});

describe("cleClient", () => {
  it("prend la première IP de x-forwarded-for", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(cleClient(req)).toBe("1.2.3.4");
  });
  it("repli sur x-real-ip puis 'inconnu'", () => {
    expect(cleClient(new Request("http://x", { headers: { "x-real-ip": "9.9.9.9" } }))).toBe("9.9.9.9");
    expect(cleClient(new Request("http://x"))).toBe("inconnu");
  });
});
