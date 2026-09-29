import { useMemo, useState } from "react";
import type { Db, Meta } from "../types";
import { categoriasCortaveis, gastoMedioPorCategoria, simular } from "../lib/analise";
import { moeda, rotuloMes, uid } from "../lib/format";

interface Props {
  db: Db;
  setDb: (fn: (d: Db) => Db) => void;
}

export default function Metas({ db, setDb }: Props) {
  const [nome, setNome] = useState("");
  const [alvo, setAlvo] = useState("");
  const [atual, setAtual] = useState("");
  const [prazo, setPrazo] = useState("");
  const [selId, setSelId] = useState("");
  const [corte, setCorte] = useState(20);
  const [cortaveis, setCortaveis] = useState<Set<string>>(new Set());
  const [extra, setExtra] = useState("");

  const num = (s: string) => Number(s.replace(",", ".")) || 0;

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !(num(alvo) > 0) || !prazo) return;
    const m: Meta = { id: uid(), nome: nome.trim(), valorAlvo: num(alvo), valorAtual: num(atual), prazo };
    setDb((d) => ({ ...d, metas: [...d.metas, m] }));
    setNome(""); setAlvo(""); setAtual(""); setPrazo("");
  }

  const aporte = (id: string) => {
    const v = num(prompt("Quanto deseja somar a esta meta? (R$)") ?? "");
    if (v > 0) setDb((d) => ({ ...d, metas: d.metas.map((m) => (m.id === id ? { ...m, valorAtual: m.valorAtual + v } : m)) }));
  };
  const remover = (id: string) => setDb((d) => ({ ...d, metas: d.metas.filter((m) => m.id !== id) }));

  const meta = db.metas.find((m) => m.id === selId) ?? db.metas[0];
  const opcoes = categoriasCortaveis(db.categorias);
  const medios = useMemo(() => gastoMedioPorCategoria(db), [db]);
  const sim = useMemo(
    () => (meta ? simular(db, meta, cortaveis, corte, num(extra)) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, meta, cortaveis, corte, extra],
  );

  const alternar = (id: string) =>
    setCortaveis((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  return (
    <div className="stack">
      <form className="painel form" onSubmit={adicionar}>
        <h2>Nova meta</h2>
        <label>Nome<input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Reserva de emergência" required /></label>
        <label>Valor alvo (R$)<input inputMode="decimal" value={alvo} onChange={(e) => setAlvo(e.target.value)} required /></label>
        <label>Já guardado (R$)<input inputMode="decimal" value={atual} onChange={(e) => setAtual(e.target.value)} placeholder="0,00" /></label>
        <label>Prazo<input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} required /></label>
        <button className="primario" type="submit">Adicionar meta</button>
      </form>

      <section className="painel">
        <h2>Minhas metas</h2>
        {db.metas.length === 0 && <p className="vazio">Nenhuma meta cadastrada.</p>}
        <ul className="lista">
          {db.metas.map((m) => {
            const p = Math.min(100, (m.valorAtual / m.valorAlvo) * 100);
            return (
              <li key={m.id} className="meta">
                <div style={{ flex: 1 }}>
                  <b>{m.nome}</b>
                  <small>{moeda(m.valorAtual)} de {moeda(m.valorAlvo)} · prazo {m.prazo.split("-").reverse().join("/")}</small>
                  <div className="barra"><div style={{ width: `${p}%` }} /></div>
                </div>
                <button onClick={() => aporte(m.id)}>+ Aporte</button>
                <button className="perigo" onClick={() => confirm(`Excluir "${m.nome}"?`) && remover(m.id)} aria-label="Excluir">✕</button>
              </li>
            );
          })}
        </ul>
      </section>

      {meta && sim && (
        <section className="painel form">
          <h2>Simulador</h2>
          <label>Meta
            <select value={meta.id} onChange={(e) => setSelId(e.target.value)}>
              {db.metas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </label>

          <div className="cards">
            <div className="card"><span>Falta</span><b>{moeda(sim.falta)}</b></div>
            <div className="card"><span>Necessário/mês (no prazo)</span><b>{moeda(sim.necessarioPorMes)}</b></div>
            <div className="card"><span>Sobra média atual</span><b className={sim.sobraAtual >= 0 ? "pos" : "neg"}>{moeda(sim.sobraAtual)}</b></div>
          </div>

          <p className="sub">Reduzir gastos nestas categorias (média dos últimos 3 meses):</p>
          <div className="chips">
            {opcoes.map((c) => (
              <button type="button" key={c.id} className={cortaveis.has(c.id) ? "chip on" : "chip"} onClick={() => alternar(c.id)}>
                {c.nome} · {moeda(medios.get(c.id) ?? 0)}
              </button>
            ))}
          </div>
          <label>Redução: <b>{corte}%</b>
            <input type="range" min={0} max={100} step={5} value={corte} onChange={(e) => setCorte(Number(e.target.value))} />
          </label>
          <label>Renda extra mensal (R$)<input inputMode="decimal" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="0,00" /></label>

          <div className="resultado">
            <p>Economia simulada: <b>{moeda(sim.economiaSimulada)}</b>/mês → sobra de <b>{moeda(sim.sobraSimulada)}</b>/mês</p>
            {sim.mesesParaAtingir === null ? (
              <p className="neg"><b>Com esta sobra a meta não é atingida.</b> Aumente a redução ou a renda extra.</p>
            ) : sim.mesesParaAtingir === 0 ? (
              <p className="pos"><b>Meta já atingida!</b></p>
            ) : (
              <p className={sim.noPrazo ? "pos" : "neg"}>
                <b>Meta atingida em {sim.mesesParaAtingir} {sim.mesesParaAtingir === 1 ? "mês" : "meses"} ({rotuloMes(sim.dataEstimada!)})</b>
                {sim.noPrazo ? " — dentro do prazo." : ` — depois do prazo (${sim.mesesParaPrazo} meses).`}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
