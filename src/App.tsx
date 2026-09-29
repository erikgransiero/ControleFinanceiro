import { useEffect, useState } from "react";
import type { Db } from "./types";
import { carregar, salvar, ultimoBackup } from "./lib/storage";
import { mesAtual } from "./lib/format";
import Resumo from "./components/Resumo";
import Lancamentos from "./components/Lancamentos";
import Categorias from "./components/Categorias";
import Metas from "./components/Metas";
import Backup from "./components/Backup";

const ABAS = [
  ["resumo", "Resumo"],
  ["lancamentos", "Lançamentos"],
  ["categorias", "Categorias"],
  ["metas", "Metas"],
  ["backup", "Backup"],
] as const;
type Aba = (typeof ABAS)[number][0];

const DIAS_ALERTA_BACKUP = 14;

export default function App() {
  const [db, setDbState] = useState<Db>(carregar);
  const [aba, setAba] = useState<Aba>("resumo");
  const [mes, setMes] = useState(mesAtual());

  useEffect(() => salvar(db), [db]);

  const setDb = (fn: (d: Db) => Db) => setDbState(fn);

  const ub = ultimoBackup();
  const diasSemBackup = ub ? Math.floor((Date.now() - new Date(ub).getTime()) / 86400000) : null;
  const precisaBackup = db.lancamentos.length > 0 && (diasSemBackup === null || diasSemBackup >= DIAS_ALERTA_BACKUP);

  return (
    <div className="app">
      <header>
        <h1>Controle Financeiro</h1>
      </header>
      {precisaBackup && aba !== "backup" && (
        <div className="aviso" onClick={() => setAba("backup")}>
          {diasSemBackup === null ? "Você ainda não fez backup." : `Último backup há ${diasSemBackup} dias.`} Toque para exportar.
        </div>
      )}
      <main>
        {aba === "resumo" && <Resumo db={db} mes={mes} setMes={setMes} />}
        {aba === "lancamentos" && <Lancamentos db={db} setDb={setDb} mes={mes} />}
        {aba === "categorias" && <Categorias db={db} setDb={setDb} />}
        {aba === "metas" && <Metas db={db} setDb={setDb} />}
        {aba === "backup" && <Backup db={db} substituir={setDbState} />}
      </main>
      <nav>
        {ABAS.map(([id, rot]) => (
          <button key={id} className={aba === id ? "on" : ""} onClick={() => setAba(id)}>{rot}</button>
        ))}
      </nav>
    </div>
  );
}
