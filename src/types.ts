export type TipoCategoria = "fixa" | "variavel";
// Grupos da regra 50/30/20: necessidades, desejos e poupança.
export type Grupo = "necessidade" | "desejo" | "poupanca";

export interface Categoria {
  id: string;
  nome: string;
  tipo: TipoCategoria;
  grupo: Grupo;
  teto?: number; // limite mensal opcional
  cor: string;
}

export type TipoLancamento = "despesa" | "receita";

export interface Lancamento {
  id: string;
  data: string; // YYYY-MM-DD
  descricao: string;
  valor: number; // sempre positivo
  tipo: TipoLancamento;
  categoriaId: string; // vazio para receitas
  pagamento: string;
}

export interface Meta {
  id: string;
  nome: string;
  valorAlvo: number;
  valorAtual: number;
  prazo: string; // YYYY-MM-DD
}

export interface Db {
  versao: 1;
  categorias: Categoria[];
  lancamentos: Lancamento[];
  metas: Meta[];
}
