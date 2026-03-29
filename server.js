// Carrega as variáveis do .env
import dotenv from "dotenv";
dotenv.config();

// Importação das bibliotecas necessárias
import express from "express";
import { Server } from "socket.io";
import http from "http";
import bcryptjs from "bcryptjs";
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

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());


//== Rotas HTTP ==\\

//--Rotas para criar registros--\\

// Criar usuário
app.post("/server/criarUsuario", async (req, res) => {
    try {
        const { username, senha } = req.body;

        const senhaHash = await bcryptjs.hash(senha, 10);

        const { data, error } = await supabase
            .from('usuario')
            .insert({ username: username, senha: senhaHash })
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message }); // ← erro do Supabase

        res.status(201).json(data); // ← resposta de sucesso
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao criar usuário" });
    }
});

// Criar produto
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

        if (error) return res.status(500).json({ erro: error.message }); // ← erro do Supabase

        res.status(201).json(data); // ← resposta de sucesso
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao criar porção" });
    }
});

// Criar adicional
app.post("/server/criarAdicional", async (req, res) => {
    try {
        let { nome, preco } = req.body;

        const { data, error } = await supabase
            .from('adicional')
            .insert({ nome: nome, preco: preco })
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message }); // ← erro do Supabase

        res.status(201).json(data); // ← resposta de sucesso
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao criar porção" });
    }
});

// Criar pedido
app.post("/server/criarPedido", async (req, res) => {

});

// Criar um produto de um pedido
app.post("/server/criarPorcaoProduto", async (req, res) => {
    try {

    } catch (error) {

    }
});

// Criar adicional de um pedido de um produto
app.post("/server/criarAdicionalPorcao", async (req, res) => {
    try {

    } catch (error) {

    }
});


//--Rotas para consultar registros--\\

// Consultar usuários (todos)
app.get("/server/buscarUsuarios", async (req, res) => {
    const { data, error } = await supabase.from('usuario').select("*");

    if (error) return res.status(500).json({ erro: error.message });
    res.json(data);
});

// Consultar porção (todas)
app.get("/server/buscarPorcoes", async (req, res) => {
    const { data, error } = await supabase.from('porcao').select("*");

    if (error) return res.status(500).json({ erro: error.message });
    res.json(data);
});

// Consultar adicional (todas)
app.get("/server/buscarAdicionais", async (req, res) => {
    const { data, error } = await supabase.from('adicional').select("*");

    if (error) return res.status(500).json({ erro: error.message });
    res.json(data);
});


//--Rotas para atualizar registros--\\

// Alterar estado de um usuário específico
app.put("/server/alterarStatusUsuario/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data: usuario, error: erroBusca } = await supabase
            .from('usuario')
            .select('*')
            .eq('id', id)
            .single();

        if (erroBusca) return res.status(404).json({ erro: "Usuário não encontrada" });

        const { data, error } = await supabase
            .from('usuario')
            .update({ status: !usuario.status })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message });
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao alterar status do usuário" });
    }
});

// Alterar estado de uma porção específica
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

// Alterar estado de um adicional específico
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


//--Rota para verificações--\\

// Rota para realizar login
app.post("/server/loginUsuario", async (req, res) => {
    try {
        const { username, senha } = req.body;

        const { data, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('username', username)
            .single();

        if (error) return res.status(404).json({ erro: "Usuário não encontrado" });

        if (!data.status) {
            return res.status(401).json({ erro: "Usuário desativado" });
        }

        const senhaCorreta = await bcryptjs.compare(senha, data.senha);

        if (!senhaCorreta) {
            return res.status(401).json({ erro: "Informações inválidas" });
        }

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao realizar login" });
    }
});



//== Inicialização ==\\
server.listen(process.env.PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${process.env.PORT}`);
});