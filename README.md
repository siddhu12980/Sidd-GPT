# 🤖 Sidd-GPT

**Advanced ChatGPT clone with persistent memory, multimodal file support, and sophisticated token management built with Next.js, OpenAI, and Mem0.ai**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-green)](https://openai.com/)
[![Mem0.ai](https://img.shields.io/badge/Mem0.ai-Memory-orange)](https://mem0.ai/)

## ✨ Features

### 🧠 **Advanced AI Capabilities**
- **Real-time streaming** responses with Vercel AI SDK
- **Multi-model support** (GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo)
- **Persistent conversation memory** via Mem0.ai
- **Intelligent context window management** with token limit enforcement
- **Cost optimization** with real-time token counting

### 📁 **Multimodal Support**
- **Image upload & analysis** (JPEG, PNG, GIF, WebP)
- **Document processing** (PDF, DOCX, TXT, CSV)
- **File preview** before sending
- **Cloudinary integration** for secure file storage

### 🎨 **Modern UI/UX**
- **ChatGPT-like interface** with exact styling
- **Responsive design** (mobile-first approach)
- **Dark theme** with custom color scheme
- **Markdown rendering** with syntax highlighting
- **Message editing** and regeneration
- **Smooth animations** and micro-interactions

### 🔐 **Security & Authentication**
- **Clerk.js authentication** with protected routes
- **Rate limiting** on API endpoints
- **User session management**
- **Secure file uploads**

### 💾 **Data Management**
- **MongoDB database** with Mongoose ODM
- **Conversation history** with automatic title generation
- **TanStack Query** for efficient data fetching
- **Real-time updates** and cache management

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15.3.4** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Radix UI** - Accessible components
- **shadcn/ui** - Component library

### **Backend & AI**
- **Vercel AI SDK** - AI integration
- **OpenAI API** - GPT models
- **Mem0.ai** - Conversation memory
- **MongoDB** - Database
- **Mongoose** - ORM

### **Authentication & Storage**
- **Clerk.js** - Authentication
- **Cloudinary** - File storage
- **Tiktoken** - Token counting

### **State Management**
- **TanStack Query** - Server state
- **Zustand** - Client state
- **React Hooks** - Local state

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB database
- OpenAI API key
- Mem0.ai API key
- Clerk.js account
- Cloudinary account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sidd-gpt.git
   cd sidd-gpt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Mem0.ai
   MEM0_API_KEY=your_mem0_api_key
   
   # Clerk.js
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # MongoDB
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DB=your_database_name
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### **Starting a Conversation**
1. Sign in with your account
2. Click "New Chat" to start a fresh conversation
3. Type your message or upload a file
4. Get AI responses with persistent memory

### **File Uploads**
- **Images**: Upload and ask questions about the content
- **Documents**: Upload PDFs, DOCX, TXT, or CSV files for analysis
- **Preview**: See file previews before sending

### **Conversation Management**
- **Edit messages**: Click the edit icon to modify previous messages
- **Regenerate responses**: Use the regenerate button for new AI responses
- **Delete conversations**: Remove entire conversations from history
- **Automatic titles**: Conversations get smart titles based on content

### **Memory Features**
- **Persistent context**: AI remembers your conversation history
- **Cross-session memory**: Memory persists across different sessions
- **Context-aware responses**: AI uses previous conversations for better responses

## 🏗️ Project Structure

```
sidd-gpt/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── chat/          # AI chat endpoint
│   │   ├── conversations/ # Conversation management
│   │   ├── upload-image/  # Image upload
│   │   └── token-count/   # Token counting
│   ├── chat/              # Chat pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── ChatClient.tsx    # Main chat interface
│   ├── ChatConversation.tsx # Message display
│   └── Custom_input_area.tsx # Input with file upload
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── tokenManager.ts   # Token management
│   └── api.ts           # API client
├── models/               # MongoDB schemas
└── middleware.ts         # Authentication middleware
```

## 🔧 Configuration

### **Token Management**
The app includes sophisticated token management:
- Real-time token counting with Tiktoken
- Automatic message trimming to stay within limits
- Cost estimation and usage tracking
- Model-specific configurations

### **Memory System**
Mem0.ai integration provides:
- Persistent conversation memory
- Context-aware responses
- Memory isolation per user
- Automatic memory retrieval

### **File Processing**
Cloudinary integration supports:
- Secure file uploads
- Image optimization
- Multiple file formats
- CDN delivery

## 🚀 Deployment

### **Vercel (Recommended)**
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### **Other Platforms**
The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for GPT models
- [Mem0.ai](https://mem0.ai/) for memory system
- [Vercel](https://vercel.com/) for AI SDK and hosting
- [Clerk](https://clerk.com/) for authentication
- [shadcn/ui](https://ui.shadcn.com/) for components

## 📞 Support

If you have any questions or need help:
- Open an issue on GitHub
- Check the documentation
- Join our community discussions

---

**Built with ❤️ by [Your Name]**
