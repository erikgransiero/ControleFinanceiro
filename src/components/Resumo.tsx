import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { Db } from "../types";
import { gerarDicas, resumoDoMes } from "../lib/analise";
import { moeda, rotuloMes, somaMes } from "../lib/format";

interface Props {
  db: Db;
  mes: string;
  setMes: (m: string) => void;
}

export default function Resumo({ db, mes, setMes }: Props) {
  const r = useMemo(() => resumoDoMes(db, mes), [db, mes]);
  const dicas = useMemo(() => gerarDicas(db, mes), [db, mes]);

  const pizza = db.categorias
    .map((c) => ({ nome: c.nome, valor: r.porCategoria.get(c.id) ?? 0, cor: c.cor }))
    .filter((x) => x.valor > 0);

  const meses = Array.from({ length: 6 }, (_, i) => somaMes(mes, i - 5));
  const barras = meses.map((m) => {
    const x = resumoDoMes(db, m);
    return { mes: rotuloMes(m), Receitas: x.receitas, Despesas: x.despesas };
  });

  return (
    <div className="stack">
      <div className="mes-nav">
        <button onClick={() => setMes(somaMes(mes, -1))} aria-label="Mês anterior">‹</button>
        <input type="month" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} />
        <button onClick={() => setMes(somaMes(mes, 1))} aria-label="Próximo mês">›</button>
      </div>

      <div className="cards">
        <div className="card"><span>Receitas</span><b className="pos">{moeda(r.receitas)}</b></div>
        <div className="card"><span>Despesas</span><b className="neg">{moeda(r.despesas)}</b></div>
        <div className="card"><span>Saldo</span><b className={r.saldo >= 0 ? "pos" : "neg"}>{moeda(r.saldo)}</b></div>
      </div>

      <section className="painel">
        <h2>Orientações</h2>
        <ul className="dicas">
          {dicas.map((d, i) => (
            <li key={i} className={`dica ${d.nivel}`}>{d.texto}</li>
          ))}
        </ul>
      </section>

      <section className="painel">
        <h2>Despesas por categoria</h2>
        {pizza.length === 0 ? (
          <p className="vazio">Sem despesas neste mês.</p>
        ) : (
          <div className="grafico">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pizza} dataKey="valor" nameKey="nome" innerRadius={55} outerRadius={95}>
                  {pizza.map((p) => <Cell key={p.nome} fill={p.cor} />)}
                </Pie>
                <Tooltip formatter={(v: number) => moeda(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="painel">
        <h2>Receitas x despesas (6 meses)</h2>
        <div className="grafico">
          <ResponsiveContainer>
            <BarChart data={barras}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis width={70} tickFormatter={(v) => `${v}`} />
              <Tooltip formatter={(v: number) => moeda(v)} />
              <Legend />
              <Bar dataKey="Receitas" fill="#2e9e5b" />
              <Bar dataKey="Despesas" fill="#d64545" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
