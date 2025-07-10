const https = require('https');
const querystring = require('querystring');

exports.handler = async (event, context) => {
    const { code, state, error } = event.queryStringParameters || {};
    
    console.log('[AUTH] Callback recebido:', { 
        hasCode: !!code, 
        hasState: !!state, 
        error: error || 'none' 
    });
    
    if (error) {
        console.log('[AUTH] Erro OAuth:', error);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: generateErrorPage(error)
        };
    }
    
    if (!code || !state) {
        console.log('[AUTH] Parâmetros inválidos');
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: generateErrorPage('Parâmetros inválidos')
        };
    }
    
    try {
        const tokenData = {
            client_id: process.env.DISCORD_CLIENT_ID || '1381003505376039005',
            client_secret: process.env.DISCORD_CLIENT_SECRET || 'NUnnRB6lxBVx8ndrV1tW7yDcikSNS5W8',
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'https://dapper-pithivier-a847dc.netlify.app/auth/callback'
        };
        
        console.log('[AUTH] Trocando código por token...');
        
        const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(tokenData)
        });
        
        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.log('[AUTH] Erro na troca de token:', tokenResponse.status, errorText);
            throw new Error(`Erro na troca de token: ${tokenResponse.status}`);
        }
        
        const tokens = await tokenResponse.json();
        console.log('[AUTH] Token obtido com sucesso');
        
        const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`
            }
        });
        
        if (!userResponse.ok) {
            console.log('[AUTH] Erro ao obter dados do usuário:', userResponse.status);
            throw new Error(`Erro ao obter dados do usuário: ${userResponse.status}`);
        }
        
        const userData = await userResponse.json();
        console.log('[AUTH] Dados do usuário obtidos:', userData.username);
        
        const webhookUrl = process.env.BOT_WEBHOOK_URL;
        if (webhookUrl) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        code: code,
                        state: state,
                        user_data: userData,
                        tokens: tokens
                    })
                });
                console.log('[AUTH] Webhook enviado para o bot');
            } catch (webhookError) {
                console.log('[AUTH] Erro ao enviar webhook:', webhookError);
            }
        }
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: generateSuccessPage(userData)
        };
        
    } catch (error) {
        console.error('[AUTH] Erro no processamento:', error);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: generateErrorPage('Erro no processamento da autenticação')
        };
    }
};

function generateSuccessPage(userData) {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Autenticação Concluída - One Prism</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 90%;
            text-align: center;
            animation: slideUp 0.6s ease-out;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .success-icon {
            font-size: 4rem;
            color: #4CAF50;
            margin-bottom: 20px;
            animation: bounce 1s ease-out;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-10px);
            }
            60% {
                transform: translateY(-5px);
            }
        }
        
        h1 {
            color: #4CAF50;
            margin-bottom: 15px;
            font-size: 2rem;
        }
        
        .welcome-text {
            font-size: 1.2rem;
            margin-bottom: 30px;
            color: #555;
        }
        
        .benefits {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            margin: 25px 0;
            border-left: 5px solid #4CAF50;
        }
        
        .benefits h3 {
            color: #4CAF50;
            margin-bottom: 15px;
            font-size: 1.1rem;
        }
        
        .benefits ul {
            list-style: none;
            padding: 0;
            text-align: left;
        }
        
        .benefits li {
            padding: 8px 0;
            color: #666;
            position: relative;
            padding-left: 25px;
        }
        
        .benefits li:before {
            content: "✨";
            position: absolute;
            left: 0;
        }
        
        .security-note {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #2196F3;
        }
        
        .security-note p {
            color: #1976d2;
            margin: 0;
            font-size: 0.9rem;
        }
        
        .close-button {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 20px;
        }
        
        .close-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #888;
            font-size: 0.9rem;
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 30px 20px;
                margin: 20px;
            }
            
            h1 {
                font-size: 1.5rem;
            }
            
            .welcome-text {
                font-size: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✅</div>
        <h1>Autenticação Concluída!</h1>
        <p class="welcome-text">
            Olá, <strong>${userData.username}</strong>!<br>
            Você foi autenticado com sucesso no sistema premium.
        </p>
        
        <div class="benefits">
            <h3>✨ Benefícios Ativados</h3>
            <ul>
                <li>Acesso a funcionalidades premium</li>
                <li>Suporte prioritário</li>
                <li>Descontos especiais</li>
                <li>Sistema de backup automático</li>
                <li>Logs detalhados de atividades</li>
            </ul>
        </div>
        
        <div class="security-note">
            <p>
                <strong>🔒 Segurança:</strong> Sua autenticação foi processada com protocolo OAuth2 oficial do Discord.
                Todos os dados são criptografados e seguros.
            </p>
        </div>
        
        <button class="close-button" onclick="closeWindow()">
            Fechar Aba
        </button>
        
        <div class="footer">
            <p>&copy; 2024 One Prism™ - Sistema de Autenticação OAuth2</p>
            <p>Você pode fechar esta aba e retornar ao Discord.</p>
        </div>
    </div>
    
    <script>
        function closeWindow() {
            try {
                window.close();
            } catch (e) {
                alert('Por favor, feche esta aba manualmente e retorne ao Discord.');
            }
        }
        
        // Auto-fechar após 15 segundos
        setTimeout(() => {
            closeWindow();
        }, 15000);
        
        // Adicionar efeito de confetes
        function createConfetti() {
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
            
            for (let i = 0; i < 50; i++) {
                const confetti = document.createElement('div');
                confetti.style.position = 'fixed';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = '-10px';
                confetti.style.width = '10px';
                confetti.style.height = '10px';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.borderRadius = '50%';
                confetti.style.pointerEvents = 'none';
                confetti.style.zIndex = '1000';
                confetti.style.animation = \`confettiFall \${Math.random() * 3 + 2}s linear forwards\`;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 5000);
            }
        }
        
        // CSS para animação de confetes
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes confettiFall {
                to {
                    transform: translateY(100vh) rotate(720deg);
                    opacity: 0;
                }
            }
        \`;
        document.head.appendChild(style);
        
        // Criar confetes após 1 segundo
        setTimeout(createConfetti, 1000);
    </script>
</body>
</html>`;
}

function generateErrorPage(errorMessage) {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Erro na Autenticação - One Prism</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 90%;
            text-align: center;
            animation: slideUp 0.6s ease-out;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .error-icon {
            font-size: 4rem;
            color: #e74c3c;
            margin-bottom: 20px;
        }
        
        h1 {
            color: #e74c3c;
            margin-bottom: 15px;
            font-size: 2rem;
        }
        
        .error-text {
            font-size: 1.1rem;
            margin-bottom: 30px;
            color: #555;
            line-height: 1.6;
        }
        
        .retry-button {
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 10px;
            text-decoration: none;
            display: inline-block;
        }
        
        .retry-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(255, 107, 107, 0.4);
        }
        
        .close-button {
            background: #6c757d;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 10px;
        }
        
        .close-button:hover {
            background: #5a6268;
            transform: translateY(-2px);
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #888;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">❌</div>
        <h1>Erro na Autenticação</h1>
        <p class="error-text">
            ${errorMessage}<br><br>
            Por favor, tente novamente ou entre em contato com o suporte se o problema persistir.
        </p>
        
        <button class="close-button" onclick="closeWindow()">
            Fechar Aba
        </button>
        
        <div class="footer">
            <p>&copy; 2024 One Prism™ - Sistema de Autenticação OAuth2</p>
            <p>Se precisar de ajuda, entre em contato com nossa equipe de suporte.</p>
        </div>
    </div>
    
    <script>
        function closeWindow() {
            try {
                window.close();
            } catch (e) {
                alert('Por favor, feche esta aba manualmente e retorne ao Discord.');
            }
        }
        
        // Auto-fechar após 10 segundos
        setTimeout(() => {
            closeWindow();
        }, 10000);
    </script>
</body>
</html>`;
}
