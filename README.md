# trae-indie-comments

Lightweight comments system ideal for Neocities, GitHub Pages, portfolios, and indie web creators.

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/trae-indie-comments.git
cd trae-indie-comments
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:
- Get your NoCodeBackend API key from [nocodebackend.com](https://nocodebackend.com)
- Generate a secure JWT secret
- Set your instance name

### 3. Start the Server

```bash
npm start
```

The server will run on `http://localhost:4130`

## 📖 Usage

### For Your Website

Add this script to any HTML page where you want comments:

```html
<div id="indie-comments-container"></div>
<script async src="https://your-domain.com/widget/indie_comments.js" data-api-key="YOUR_API_KEY"></script>
```

### Admin Panel

Access the admin panel at `http://localhost:4130/painel/` to manage comments.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NOCODEBACKEND_API_KEY` | Your NoCodeBackend API key | Yes |
| `NOCODEBACKEND_BASE_URL` | NoCodeBackend API URL | No (has default) |
| `INSTANCE_NAME` | Your project instance name | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `PORT` | Server port | No (defaults to 4130) |

### Getting Your API Key

1. Sign up at [NoCodeBackend](https://nocodebackend.com)
2. Create a new project
3. Copy your API key to the `.env` file

## 🏗️ Architecture

- **Frontend Widget**: Client-side JavaScript for embedding comments
- **Server API**: Express.js server with authentication and comment management
- **Admin Panel**: Web interface for moderating comments
- **NoCodeBackend**: External database service for data persistence

## 📁 Project Structure

```
trae-indie-comments/
├── widget/                 # Client-side widget
├── server/                 # Backend API server
├── painel/                 # Admin panel
├── public/                 # Static demo files
├── index.html             # Landing page
└── .env.example          # Environment template
```

## 🔒 Security

- Never commit your `.env` file to version control
- Use strong, unique secrets for JWT tokens
- Keep your NoCodeBackend API key secure
- The system validates domains to prevent unauthorized use

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
