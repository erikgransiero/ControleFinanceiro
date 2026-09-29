import type { Db } from "../types";
import dadosIniciais from "../data/dados-iniciais.json";

const CHAVE = "controle:db";
const CHAVE_BACKUP = "controle:ultimoBackup";

// Base inicial (categorias padrão, sem lançamentos) vem de um arquivo JSON.
export const dbInicial = (): Db => structuredClone(dadosIniciais) as Db;

export function validar(x: unknown): Db {
  const d = x as Partial<Db> | null;
  if (
    !d ||
    d.versao !== 1 ||
    !Array.isArray(d.categorias) ||
    !Array.isArray(d.lancamentos) ||
    !Array.isArray(d.metas)
  ) {
    throw new Error("Arquivo inválido: não é um backup do Controle.");
  }
  return d as Db;
}

export function carregar(): Db {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) return validar(JSON.parse(bruto));
  } catch {
    /* cai no padrão */
  }
  return dbInicial();
}

export function salvar(db: Db) {
  localStorage.setItem(CHAVE, JSON.stringify(db));
}

export const ultimoBackup = () => localStorage.getItem(CHAVE_BACKUP);
export const marcarBackup = () => localStorage.setItem(CHAVE_BACKUP, new Date().toISOString());

/** Pede ao navegador para não apagar os dados automaticamente (best effort). */
export const pedirArmazenamentoPersistente = () => navigator.storage?.persist?.().catch(() => false);
