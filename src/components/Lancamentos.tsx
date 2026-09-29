import { useState } from "react";
import type { Db, Lancamento, TipoLancamento } from "../types";
import { hoje, mesDe, moeda, uid } from "../lib/format";

interface Props {
  db: Db;
  setDb: (fn: (d: Db) => Db) => void;
  mes: string;
}

const PAGAMENTOS = ["Pix", "Débito", "Crédito", "Dinheiro", "Boleto", "Transferência"];

export default function Lancamentos({ db, setDb, mes }: Props) {
  const [tipo, setTipo] = useState<TipoLancamento>("despesa");
  const [data, setData] = useState(hoje());
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoriaId, setCategoriaId] = useState(db.categorias[0]?.id ?? "");
  const [pagamento, setPagamento] = useState("Pix");
  const [erro, setErro] = useState("");

  const nomeCat = new Map(db.categorias.map((c) => [c.id, c.nome]));
  const lista = db.lancamentos
    .filter((l) => mesDe(l.data) === mes)
    .sort((a, b) => b.data.localeCompare(a.data));

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    const v = Number(valor.replace(",", "."));
    if (!(v > 0)) return setErro("Informe um valor maior que zero.");
    if (tipo === "despesa" && !categoriaId) return setErro("Escolha uma categoria.");
    setErro("");
    const novo: Lancamento = {
      id: uid(),
      data,
      descricao: descricao.trim() || (tipo === "receita" ? "Receita" : "Despesa"),
      valor: Math.round(v * 100) / 100,
      tipo,
      categoriaId: tipo === "despesa" ? categoriaId : "",
      pagamento,
    };
    setDb((d) => ({ ...d, lancamentos: [...d.lancamentos, novo] }));
    setDescricao("");
    setValor("");
  }

  const remover = (id: string) =>
    setDb((d) => ({ ...d, lancamentos: d.lancamentos.filter((l) => l.id !== id) }));

  return (
    <div className="stack">
      <form className="painel form" onSubmit={adicionar}>
        <h2>Novo lançamento</h2>
        <div className="segmento">
          <button type="button" className={tipo === "despesa" ? "on" : ""} onClick={() => setTipo("despesa")}>Despesa</button>
          <button type="button" className={tipo === "receita" ? "on" : ""} onClick={() => setTipo("receita")}>Receita</button>
        </div>
        <label>Data<input type="date" value={data} onChange={(e) => setData(e.target.value)} required /></label>
        <label>Descrição<input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Supermercado" /></label>
        <label>Valor (R$)<input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" /></label>
        {tipo === "despesa" && (
          <label>Categoria
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
              {db.categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
        )}
        <label>Forma de pagamento
          <select value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
            {PAGAMENTOS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        {erro && <p className="erro">{erro}</p>}
        <button className="primario" type="submit">Adicionar</button>
      </form>

      <section className="painel">
        <h2>Lançamentos do mês ({lista.length})</h2>
        {lista.length === 0 && <p className="vazio">Nenhum lançamento neste mês. Use o seletor de mês na aba Resumo.</p>}
        <ul className="lista">
          {lista.map((l) => (
            <li key={l.id}>
              <div>
                <b>{l.descricao}</b>
                <small>{l.data.split("-").reverse().join("/")} · {l.tipo === "receita" ? "Receita" : nomeCat.get(l.categoriaId) ?? "Sem categoria"} · {l.pagamento}</small>
              </div>
              <span className={l.tipo === "receita" ? "pos" : "neg"}>
                {l.tipo === "receita" ? "+" : "−"}{moeda(l.valor)}
              </span>
              <button className="perigo" onClick={() => confirm("Excluir este lançamento?") && remover(l.id)} aria-label="Excluir">✕</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
