const express = require("express");
const { v4 } = require("uuid");
const app = express();

app.use(express.json());

function verifyIfExistAccountCpf(req, res, next) {
    const { cpf } = req.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if (!customer) {
        return res.status(400).json({ error: "Customer not found" });
    }

    req.customer = customer;

    return next();
}

function getBalance(statement) {
    console.log(statement)
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === "credit") {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

const customers = [];

app.post("/account", (req, res) => {
    const { cpf, name } = req.body;

    const customer = customers.some((item) => item.cpf === cpf);

    if (customer) {
        return res.status(400).json({ error: "Customer already exists." });
    }

    customers.push({
        id: v4(),
        cpf,
        name,
        statement: [],
    });

    return res.status(201).json(customers);
});

app.use(verifyIfExistAccountCpf);

app.get("/statement", (req, res) => {
    const { customer } = req;
    return res.status(200).json(customer.statement);
});

app.post("/deposit", (req, res) => {
    // verificar se conta existe ok
    // obter os dados da conta
    const { customer } = req;
    // informar o valor de deposito, descricao
    const { description, amount } = req.body;

    const statementOperation = {
        description,
        amount: parseFloat(amount),
        created_at: new Date(),
        type: "credit",
    };
    // adicionar o deposito ao customer
    customer.statement.push(statementOperation);

    return res.status(201).send();
});

app.post("/withdraw", (req, res) => {
    // verificar se a conta existe
    const { customer } = req;
    const { amount } = req.body;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return res.status(400).json({ erro: "Insufficient funds" });
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit",
    };

    customer.statement.push(statementOperation);

    return res.status(201).send();
});

app.post("/statement/date", (req, res) => {
    const { customer } = req;
    const { date } = req.query;

    const dateFormat = new Date(date + " 00:00");
    console.log(dateFormat);
    const statements = customer.statement.filter(
        (statament) =>
            statament.created_at.toDateString() ===
            new Date(dateFormat).toDateString()
    );

    return res.status(200).json(statements);
});

app.put("/account", (req, res) => {
    const { customer } = req;

    const { name } = req.body;

    if (!name && name.trim()) {
        return res
            .status(400)
            .json({ erro: "Name is invalid. Enter some name." });
    }
    customer.name = name;

    return res.status(201).send();
});

app.get("/account", (req, res) => {
    const { customer } = req;

    return res.status(200).json(customer);
});

app.delete("/account", (req, res) => {
    const { customer } = req;

    customers.splice(customer, 1);

    return res.status(200).json(customers);
});

app.get("/balance", (req, res) => {
    const {customer} = req;

    // console.log(customer.statement)
    const balance = getBalance(customer.statement);

   return res.json({balance: balance});
});

app.listen(3333);
