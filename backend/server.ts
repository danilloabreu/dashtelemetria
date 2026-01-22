const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const app = express();
app.use(cors());
app.use(express.json());

const port = 3000;
const mongoUrl = process.env.MONGO_URL || 'mongodb://admin:admin@mongodb:27017';
const client = new MongoClient(mongoUrl);

// --- CONFIGURAÇÃO CLOUDFLARE R2 ---
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Rota para gerar URL de upload (R2)
app.post('/get-upload-url', async (req: any, res: any) => {
  try {
    const { fileName, contentType } = req.body;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `evidencias/${fileName}`,
      ContentType: contentType || 'image/jpeg',
    });

    // Link temporário de 60 segundos para o celular fazer o PUT
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    
    console.log(`✅ URL Gerada para: ${fileName}`);
    res.json({ uploadUrl });
  } catch (error: any) {
    console.error("Erro R2:", error);
    res.status(500).json({ error: "Falha ao gerar link de upload" });
  }
});

// --- ROTAS MONGODB ---
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