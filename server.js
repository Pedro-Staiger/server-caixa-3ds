// Carrega as variáveis do .env
import dotenv from "dotenv";
dotenv.config();

// Importação das bibliotecas necessárias
import express from "express";
import http from "http";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// Conecta ao Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Declaração das variáveis de cada biblioteca
const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);


//== Rotas HTTP ==\\

//-- Rotas para criar registros --\\

// Criar porção
app.post("/server/criarPorcao", async (req, res) => {
    try {
        let { nome, preco, descricao } = req.body;

        if (descricao === "") {
            descricao = "Sem descrição";
        }

        const { data, error } = await supabase
            .from('porcao')
            .insert({ nome: nome, preco: preco, descricao: descricao })
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message });

        res.status(201).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao criar porção" });
    }
});

// Criar adicional
app.post("/server/criarAdicional", async (req, res) => {
    try {
        const { nome, preco } = req.body;

        const { data, error } = await supabase
            .from('adicional')
            .insert({ nome: nome, preco: preco })
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message });

        res.status(201).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao criar adicional" });
    }
});

// Criar pedido completo (com itens e adicionais)
// Body esperado:
// {
//   "nome_cliente": "João",
//   "forma_pagamento": "pix",
//   "itens": [
//     {
//       "porcao_id": 1,
//       "quantidade": 2,
//       "preco_unitario": 10.00,
//       "obs": "sem pimenta",
//       "adicionais": [
//         { "adicional_id": 3, "quantidade": 1, "preco_unitario": 2.00 }
//       ]
//     }
//   ]
// }

app.post("/server/criarPedido", async (req, res) => {
    try {
        const { nome_cliente, forma_pagamento, itens } = req.body;

        // Passo 1 — cria o pedido com total 0 (será atualizado no final)
        const { data: pedido, error: errPedido } = await supabase
            .from('pedido')
            .insert({ nome_cliente, forma_pagamento, status: 'aguardando', total: 0 })
            .select()
            .single();

        if (errPedido) return res.status(500).json({ erro: errPedido.message });

        let totalGeral = 0;

        // Passo 2 — insere cada item do pedido
        for (const item of itens) {
            const { data: pp, error: errPp } = await supabase
                .from('pedido_porcao')
                .insert({
                    pedido_id: pedido.id,
                    porcao_id: item.porcao_id,
                    quantidade: item.quantidade,
                    preco_unitario: item.preco_unitario,
                    obs: item.obs ?? ""
                })
                .select()
                .single();

            if (errPp) return res.status(500).json({ erro: errPp.message });

            totalGeral += item.preco_unitario * item.quantidade;

            // Passo 3 — insere os adicionais de cada item
            for (const ad of item.adicionais) {
                const { error: errAd } = await supabase
                    .from('adicional_porcao')
                    .insert({
                        pedido_porcao_id: pp.id,
                        adicional_id: ad.adicional_id,
                        quantidade: ad.quantidade,
                        preco_unitario: ad.preco_unitario
                    });

                if (errAd) return res.status(500).json({ erro: errAd.message });

                totalGeral += ad.preco_unitario * ad.quantidade;
            }
        }

        // Passo 4 — atualiza o total do pedido
        const { error: errTotal } = await supabase
            .from('pedido')
            .update({ total: totalGeral })
            .eq('id', pedido.id);

        if (errTotal) return res.status(500).json({ erro: errTotal.message });

        res.status(201).json({ sucesso: true, pedido_id: pedido.id, total: totalGeral });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao criar pedido" });
    }
});

// Adicionar uma porção a um pedido já existente
app.post("/server/criarPorcaoPedido/:pedido_id", async (req, res) => {
    try {
        const { pedido_id } = req.params;
        const { porcao_id, quantidade, preco_unitario, obs } = req.body;

        const { data, error } = await supabase
            .from('pedido_porcao')
            .insert({ pedido_id, porcao_id, quantidade, preco_unitario, obs: obs ?? "" })
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message });

        res.status(201).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao adicionar porção ao pedido" });
    }
});

// Adicionar um adicional a uma porção de um pedido já existente
app.post("/server/criarAdicionalPorcao/:pedido_porcao_id", async (req, res) => {
    try {
        const { pedido_porcao_id } = req.params;
        const { adicional_id, quantidade, preco_unitario } = req.body;

        const { data, error } = await supabase
            .from('adicional_porcao')
            .insert({ pedido_porcao_id, adicional_id, quantidade, preco_unitario })
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message });

        res.status(201).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao adicionar adicional à porção" });
    }
});


//-- Rotas para consultar registros --\\

// Consultar todas as porções
app.get("/server/buscarPorcoes", async (req, res) => {
    const { data, error } = await supabase.from('porcao').select("*");

    if (error) return res.status(500).json({ erro: error.message });
    res.json(data);
});

// Consultar todos os adicionais
app.get("/server/buscarAdicionais", async (req, res) => {
    const { data, error } = await supabase.from('adicional').select("*");

    if (error) return res.status(500).json({ erro: error.message });
    res.json(data);
});

// Consultar todos os pedidos
app.get("/server/buscarPedidos", async (req, res) => {
    const { data, error } = await supabase
        .from('pedido')
        .select("*")
        .order('criado_em', { ascending: false });

    if (error) return res.status(500).json({ erro: error.message });
    res.json(data);
});

// Consultar um pedido específico com todos os seus itens e adicionais
app.get("/server/buscarPedido/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('pedido')
            .select(`
                *,
                pedido_porcao (
                    *,
                    porcao (*),
                    adicional_porcao (
                        *,
                        adicional (*)
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error) return res.status(404).json({ erro: "Pedido não encontrado" });

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao buscar pedido" });
    }
});


//-- Rotas para atualizar registros --\\

// Alterar status de uma porção específica
app.put("/server/alterarStatusPorcao/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data: porcao, error: erroBusca } = await supabase
            .from('porcao')
            .select('*')
            .eq('id', id)
            .single();

        if (erroBusca) return res.status(404).json({ erro: "Porção não encontrada" });

        const { data, error } = await supabase
            .from('porcao')
            .update({ status: !porcao.status })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message });
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao alterar status da porção" });
    }
});

// Alterar status de um adicional específico
app.put("/server/alterarStatusAdicional/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data: adicional, error: erroBusca } = await supabase
            .from('adicional')
            .select('*')
            .eq('id', id)
            .single();

        if (erroBusca) return res.status(404).json({ erro: "Adicional não encontrado" });

        const { data, error } = await supabase
            .from('adicional')
            .update({ status: !adicional.status })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message });
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao alterar status do adicional" });
    }
});

// Alterar status de um pedido específico
// Body esperado: { "status": "pronto" } ou "aguardando" ou "entregue"
app.put("/server/alterarStatusPedido/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const statusValidos = ['aguardando', 'pronto', 'entregue'];
        if (!statusValidos.includes(status)) {
            return res.status(400).json({ erro: "Status inválido. Use: aguardando, pronto ou entregue" });
        }

        const { data, error } = await supabase
            .from('pedido')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message });
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao alterar status do pedido" });
    }
});


//== Inicialização ==\\
server.listen(process.env.PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${process.env.PORT}`);
});