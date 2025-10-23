const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/painel', express.static('painel'));

// Configuração do NoCodeBackend
const NOCODEBACKEND_API_KEY = process.env.NOCODEBACKEND_API_KEY;
const NOCODEBACKEND_BASE_URL = process.env.NOCODEBACKEND_BASE_URL || 'https://openapi.nocodebackend.com';
const INSTANCE_NAME = process.env.INSTANCE_NAME || '41300_indie_comments_v2';
const JWT_SECRET = process.env.JWT_SECRET || 'indie_comments_secret';

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(403).json({ error: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Função para validar domínio
const validateDomain = async (apiKey, domain) => {
  try {
    const response = await fetch(`${NOCODEBACKEND_BASE_URL}/read/sites?Instance=${INSTANCE_NAME}&filter=api_key:${apiKey}`, {
      headers: {
        'Authorization': `Bearer ${NOCODEBACKEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data && data.items && data.items.length > 0) {
      const site = data.items[0];
      return site.domain === domain;
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao validar domínio:', error);
    return false;
  }
};

// Proxy seguro com validação de domínio
app.use('/api/proxy', async (req, res) => {
  const apiKey = req.headers['authorization'];
  const origin = req.headers['origin'] || '';
  const domain = new URL(origin).hostname;

  // Verificar se a API key é válida para este domínio
  if (apiKey && req.method !== 'OPTIONS') {
    const isValidDomain = await validateDomain(apiKey, domain);

    if (!isValidDomain) {
      return res.status(403).json({ error: 'Domínio não autorizado para esta API key' });
    }
  }

  // Remover cabeçalhos sensíveis
  const headers = { ...req.headers };
  delete headers.host;
  delete headers.referer;
  delete headers.origin;

  // Adicionar cabeçalhos do NoCodeBackend
  headers['Authorization'] = `Bearer ${NOCODEBACKEND_API_KEY}`;
  headers['Content-Type'] = 'application/json';

  try {
    const endpoint = req.url.replace('/api/proxy', '');
    const url = `${NOCODEBACKEND_BASE_URL}${endpoint}?Instance=${INSTANCE_NAME}`;

    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Erro no proxy:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

// Rota para criar usuários (usando o endpoint correto do Swagger)
app.post('/api/signup', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    // Verificar se o usuário já existe
    const checkUserUrl = `${NOCODEBACKEND_BASE_URL}/read/users?Instance=${INSTANCE_NAME}`;
    console.log('Checking user existence:', checkUserUrl);
    const checkUserResponse = await fetch(checkUserUrl, {
      headers: {
        'Authorization': `Bearer ${NOCODEBACKEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Check user response status:', checkUserResponse.status);
    const userData = await checkUserResponse.json();
    console.log('Check user response data:', userData);

    if (userData && userData.data && userData.data.some(user => user.email === email)) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    // Criar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar usuário
    const createUserUrl = `${NOCODEBACKEND_BASE_URL}/create/users?Instance=${INSTANCE_NAME}`;
    console.log('Creating user:', createUserUrl);
    const createUserResponse = await fetch(createUserUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOCODEBACKEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password_hash: hashedPassword,
        name: name || email.split('@')[0],
        plan: 'free',
        created_at: new Date().toISOString()
      })
    });

    console.log('Create user response status:', createUserResponse.status);
    const newUser = await createUserResponse.json();
    console.log('Create user response data:', newUser);

    // Gerar token JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, plan: newUser.plan },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        plan: newUser.plan
      }
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    // Buscar usuário
    const loginUrl = `${NOCODEBACKEND_BASE_URL}/read/users?Instance=${INSTANCE_NAME}`;
    console.log('Login - fetching users:', loginUrl);
    const response = await fetch(loginUrl, {
      headers: {
        'Authorization': `Bearer ${NOCODEBACKEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Login response status:', response.status);
    const data = await response.json();
    console.log('Login response data:', data);

    if (!data || !data.data || data.data.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = data.data.find(user => user.email === email);
    console.log('Found user:', user);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha - alguns usuários podem ter senhas não hasheadas
    let isMatch = false;
    if (user.password_hash.startsWith('$2')) {
      // Senha hasheada com bcrypt
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      // Senha em texto plano (para usuários existentes)
      isMatch = password.trim() === user.password_hash.trim();
    }
    console.log('Password match:', isMatch, 'input:', password, 'stored:', user.password_hash, 'startsWith $2:', user.password_hash.startsWith('$2'));
    console.log('Comparison result:', password === user.password_hash);
    console.log('Password lengths - input:', password.length, 'stored:', user.password_hash.length);
    console.log('Trimmed comparison:', password.trim() === user.password_hash.trim());
    console.log('Input password as JSON:', JSON.stringify(password));
    console.log('Stored password as JSON:', JSON.stringify(user.password_hash));

    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, plan: user.plan },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Rota para validar API key
app.get('/api/validate', async (req, res) => {
  const apiKey = req.query.api_key;
  const origin = req.headers['origin'] || '';
  
  if (!apiKey || !origin) {
    return res.status(400).json({ valid: false, error: 'API key ou origem não fornecidos' });
  }
  
  try {
    const domain = new URL(origin).hostname;
    const isValid = await validateDomain(apiKey, domain);
    res.json({ valid: isValid });
  } catch (error) {
    console.error('Erro ao validar API key:', error);
    res.status(500).json({ valid: false, error: 'Erro ao validar API key' });
  }
});

// Rotas de autenticação seguras
app.post('/api/signup', async (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }
  
  try {
    // Verificar se o usuário já existe
    const checkUserResponse = await fetch(`${NOCODEBACKEND_BASE_URL}/read/users?Instance=${INSTANCE_NAME}&filter=email:${email}`, {
      headers: {
        'Authorization': `Bearer ${NOCODEBACKEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const userData = await checkUserResponse.json();
    
    if (userData && userData.items && userData.items.length > 0) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }
    
    // Criar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Criar usuário
    const createUserResponse = await fetch(`${NOCODEBACKEND_BASE_URL}/create/users?Instance=${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOCODEBACKEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password_hash: hashedPassword,
        name: name || email.split('@')[0],
        plan: 'free',
        created_at: new Date().toISOString()
      })
    });
    
    const newUser = await createUserResponse.json();
    
    // Gerar token JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, plan: newUser.plan },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        plan: newUser.plan
      }
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }
  
  try {
    const response = await fetch(`${NOCODEBACKEND_BASE_URL}/read/users?Instance=${INSTANCE_NAME}&filter=email:${email}`, {
      headers: {
        'Authorization': `Bearer ${NOCODEBACKEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!data || !data.items || data.items.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const user = data.items[0];
    
    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, plan: user.plan },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Rota protegida de exemplo
app.get('/api/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// Iniciar servidor
const PORT = process.env.PORT || 4130;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});