import type { Categoria, Db, Grupo, Meta } from "../types";
import { mesDe, mesesEntre, mesAtual, moeda, somaMes } from "./format";

export interface ResumoMes {
  receitas: number;
  despesas: number;
  saldo: number;
  porCategoria: Map<string, number>;
  porGrupo: Record<Grupo, number>;
}

export function resumoDoMes(db: Db, mes: string): ResumoMes {
  const porCategoria = new Map<string, number>();
  const porGrupo: Record<Grupo, number> = { necessidade: 0, desejo: 0, poupanca: 0 };
  let receitas = 0;
  let despesas = 0;
  const grupoDe = new Map(db.categorias.map((c) => [c.id, c.grupo]));
  for (const l of db.lancamentos) {
    if (mesDe(l.data) !== mes) continue;
    if (l.tipo === "receita") {
      receitas += l.valor;
      continue;
    }
    despesas += l.valor;
    porCategoria.set(l.categoriaId, (porCategoria.get(l.categoriaId) ?? 0) + l.valor);
    const g = grupoDe.get(l.categoriaId);
    if (g) porGrupo[g] += l.valor;
  }
  return { receitas, despesas, saldo: receitas - despesas, porCategoria, porGrupo };
}

export interface Dica {
  nivel: "alerta" | "atencao" | "ok" | "info";
  texto: string;
}

const pct = (v: number, t: number) => (t > 0 ? (v / t) * 100 : 0);

export function gerarDicas(db: Db, mes: string): Dica[] {
  const r = resumoDoMes(db, mes);
  const dicas: Dica[] = [];
  const nome = new Map(db.categorias.map((c) => [c.id, c.nome]));

  if (r.receitas === 0 && r.despesas === 0) {
    return [{ nivel: "info", texto: "Registre suas receitas e despesas do mês para receber orientações." }];
  }
  if (r.receitas === 0) {
    dicas.push({ nivel: "atencao", texto: "Nenhuma receita registrada neste mês. Lance seu salário/renda para as análises fazerem sentido." });
  }

  if (r.receitas > 0) {
    if (r.saldo < 0) {
      dicas.push({
        nivel: "alerta",
        texto: `Você gastou ${moeda(-r.saldo)} a mais do que ganhou. Priorize cortar gastos de desejo (lazer, restaurantes, assinaturas) até voltar ao positivo.`,
      });
    }
    const nec = pct(r.porGrupo.necessidade, r.receitas);
    const des = pct(r.porGrupo.desejo, r.receitas);
    const poup = pct(r.porGrupo.poupanca, r.receitas);
    if (nec > 50) {
      dicas.push({
        nivel: nec > 65 ? "alerta" : "atencao",
        texto: `Necessidades (moradia, mercado, saúde...) consomem ${nec.toFixed(0)}% da renda; a referência é 50%. Vale renegociar contratos fixos e comparar preços.`,
      });
    }
    if (des > 30) {
      dicas.push({
        nivel: des > 40 ? "alerta" : "atencao",
        texto: `Desejos (lazer, restaurantes...) somam ${des.toFixed(0)}% da renda; a referência é 30%. Defina um teto mensal para essas categorias.`,
      });
    }
    if (poup < 20) {
      dicas.push({
        nivel: poup < 10 ? "alerta" : "atencao",
        texto: `Você guardou/investiu ${poup.toFixed(0)}% da renda; a meta da regra 50/30/20 é 20% (${moeda(r.receitas * 0.2)} neste mês). Automatize um valor fixo logo que o salário cair.`,
      });
    } else {
      dicas.push({ nivel: "ok", texto: `Ótimo: ${poup.toFixed(0)}% da renda foi para poupança/investimento (meta: 20%).` });
    }
    if (nec <= 50 && des <= 30 && r.saldo >= 0) {
      dicas.push({ nivel: "ok", texto: "Seus gastos estão dentro da proporção 50/30/20 neste mês." });
    }
  }

  for (const c of db.categorias) {
    const gasto = r.porCategoria.get(c.id) ?? 0;
    if (c.teto && gasto > c.teto) {
      dicas.push({
        nivel: "alerta",
        texto: `${c.nome} estourou o teto: ${moeda(gasto)} de ${moeda(c.teto)} (${moeda(gasto - c.teto)} acima).`,
      });
    } else if (c.teto && gasto > c.teto * 0.8) {
      dicas.push({ nivel: "atencao", texto: `${c.nome} já usou ${pct(gasto, c.teto).toFixed(0)}% do teto (${moeda(gasto)} de ${moeda(c.teto)}).` });
    }
  }

  const ant = resumoDoMes(db, somaMes(mes, -1));
  for (const [id, gasto] of r.porCategoria) {
    const antes = ant.porCategoria.get(id) ?? 0;
    if (antes > 0 && gasto > antes * 1.3 && gasto - antes > 50) {
      dicas.push({
        nivel: "atencao",
        texto: `${nome.get(id) ?? "Categoria"} subiu ${pct(gasto - antes, antes).toFixed(0)}% em relação ao mês anterior (${moeda(antes)} → ${moeda(gasto)}).`,
      });
    }
  }

  // Reserva de emergência: 6x as necessidades mensais.
  if (r.porGrupo.necessidade > 0) {
    const alvo = r.porGrupo.necessidade * 6;
    dicas.push({
      nivel: "info",
      texto: `Reserva de emergência ideal: cerca de ${moeda(alvo)} (6 meses de necessidades). Cadastre-a como meta na aba Metas.`,
    });
  }
  return dicas;
}

/** Média mensal de sobra (receitas - despesas) dos últimos `n` meses com movimento. */
export function sobraMedia(db: Db, n = 3): number {
  const base = mesAtual();
  const valores: number[] = [];
  for (let i = 0; i < n; i++) {
    const r = resumoDoMes(db, somaMes(base, -i));
    if (r.receitas > 0 || r.despesas > 0) valores.push(r.saldo);
  }
  return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
}

/** Média mensal de gasto por categoria nos últimos `n` meses. */
export function gastoMedioPorCategoria(db: Db, n = 3): Map<string, number> {
  const base = mesAtual();
  const total = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    for (const [id, v] of resumoDoMes(db, somaMes(base, -i)).porCategoria) {
      total.set(id, (total.get(id) ?? 0) + v);
    }
  }
  for (const [id, v] of total) total.set(id, v / n);
  return total;
}

export interface Simulacao {
  falta: number;
  mesesParaPrazo: number;
  necessarioPorMes: number;
  sobraAtual: number;
  sobraSimulada: number;
  economiaSimulada: number;
  mesesParaAtingir: number | null; // null = nunca com a sobra simulada
  dataEstimada: string | null; // YYYY-MM
  noPrazo: boolean;
}

/**
 * Simula quando a meta é atingida se os gastos das categorias escolhidas
 * forem reduzidos em `cortePct` (0-100) e a sobra resultante for aplicada na meta.
 */
export function simular(
  db: Db,
  meta: Meta,
  categoriasCorte: Set<string>,
  cortePct: number,
  sobraExtra = 0,
): Simulacao {
  const falta = Math.max(0, meta.valorAlvo - meta.valorAtual);
  const mesesParaPrazo = Math.max(0, mesesEntre(mesAtual(), mesDe(meta.prazo)));
  const necessarioPorMes = mesesParaPrazo > 0 ? falta / mesesParaPrazo : falta;
  const sobraAtual = sobraMedia(db);
  const medios = gastoMedioPorCategoria(db);
  let economiaSimulada = 0;
  for (const id of categoriasCorte) economiaSimulada += (medios.get(id) ?? 0) * (cortePct / 100);
  const sobraSimulada = sobraAtual + economiaSimulada + sobraExtra;
  const mesesParaAtingir =
    falta === 0 ? 0 : sobraSimulada > 0 ? Math.ceil(falta / sobraSimulada) : null;
  return {
    falta,
    mesesParaPrazo,
    necessarioPorMes,
    sobraAtual,
    sobraSimulada,
    economiaSimulada,
    mesesParaAtingir,
    dataEstimada: mesesParaAtingir === null ? null : somaMes(mesAtual(), mesesParaAtingir),
    noPrazo: mesesParaAtingir !== null && mesesParaAtingir <= mesesParaPrazo,
  };
}

export const categoriasCortaveis = (cats: Categoria[]) =>
  cats.filter((c) => c.grupo !== "poupanca");
