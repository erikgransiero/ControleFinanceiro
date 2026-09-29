import { useState } from "react";
import type { Db, Grupo, TipoCategoria } from "../types";
import { moeda, uid } from "../lib/format";

interface Props {
  db: Db;
  setDb: (fn: (d: Db) => Db) => void;
}

const GRUPOS: Record<Grupo, string> = {
  necessidade: "Necessidade (50%)",
  desejo: "Desejo (30%)",
  poupanca: "Poupança (20%)",
};
const CORES = ["#4c78a8", "#f58518", "#e45756", "#72b7b2", "#54a24b", "#eeca3b", "#b279a2", "#ff9da6", "#9d755d", "#79706e"];

export default function Categorias({ db, setDb }: Props) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoCategoria>("variavel");
  const [grupo, setGrupo] = useState<Grupo>("necessidade");
  const [teto, setTeto] = useState("");

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    const t = Number(teto.replace(",", "."));
    setDb((d) => ({
      ...d,
      categorias: [
        ...d.categorias,
        { id: uid(), nome: nome.trim(), tipo, grupo, teto: t > 0 ? t : undefined, cor: CORES[d.categorias.length % CORES.length] },
      ],
    }));
    setNome("");
    setTeto("");
  }

  const emUso = (id: string) => db.lancamentos.some((l) => l.categoriaId === id);

  const atualizarTeto = (id: string, valor: string) => {
    const t = Number(valor.replace(",", "."));
    setDb((d) => ({
      ...d,
      categorias: d.categorias.map((c) => (c.id === id ? { ...c, teto: t > 0 ? t : undefined } : c)),
    }));
  };

  const remover = (id: string) =>
    setDb((d) => ({ ...d, categorias: d.categorias.filter((c) => c.id !== id) }));

  return (
    <div className="stack">
      <form className="painel form" onSubmit={adicionar}>
        <h2>Nova categoria</h2>
        <label>Nome<input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Educação" required /></label>
        <label>Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoCategoria)}>
            <option value="fixa">Fixa (valor parecido todo mês)</option>
            <option value="variavel">Variável</option>
          </select>
        </label>
        <label>Grupo
          <select value={grupo} onChange={(e) => setGrupo(e.target.value as Grupo)}>
            {Object.entries(GRUPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Teto mensal (opcional)<input inputMode="decimal" value={teto} onChange={(e) => setTeto(e.target.value)} placeholder="0,00" /></label>
        <button className="primario" type="submit">Adicionar categoria</button>
      </form>

      <section className="painel">
        <h2>Categorias</h2>
        <ul className="lista">
          {db.categorias.map((c) => (
            <li key={c.id}>
              <span className="bolinha" style={{ background: c.cor }} />
              <div>
                <b>{c.nome}</b>
                <small>{c.tipo === "fixa" ? "Fixa" : "Variável"} · {GRUPOS[c.grupo]}{c.teto ? ` · teto ${moeda(c.teto)}` : ""}</small>
              </div>
              <input
                className="teto"
                inputMode="decimal"
                placeholder="teto"
                defaultValue={c.teto ?? ""}
                onBlur={(e) => atualizarTeto(c.id, e.target.value)}
                aria-label={`Teto de ${c.nome}`}
              />
              <button
                className="perigo"
                disabled={emUso(c.id)}
                title={emUso(c.id) ? "Há lançamentos nesta categoria" : "Excluir"}
                onClick={() => confirm(`Excluir "${c.nome}"?`) && remover(c.id)}
                aria-label="Excluir"
              >✕</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
