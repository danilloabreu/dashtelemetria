const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const port = 3000;
const url = 'mongodb://admin:admin@mongodb:27017';
const client = new MongoClient(url);

app.get('/api/ordens', async (req: any, res: any) => {
  try {
    await client.connect();
    const db = client.db('gestao_banheiros');
    const collection = db.collection('ordens_servico');
    const dados = await collection.find({}).toArray();
    res.json(dados);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor API pronto em http://localhost:${port}`);
});