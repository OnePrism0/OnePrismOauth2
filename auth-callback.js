exports.handler = async (event, context) => {
    const { code, state, error } = event.queryStringParameters || {};
    
    console.log('[AUTH] Callback recebido:', { 
        hasCode: !!code, 
        hasState: !!state, 
        error: error || 'none' 
    });
    
    if (error) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: generateErrorPage(error)
        };
    }
    
    if (!code || !state) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: generateErrorPage('Parâmetros inválidos')
        };
    }
    
    try {
        // Trocar código por token
        const tokenData = {
            client_id: '1381003505376039005',
            client_secret: 'NUnnRB6lxBVx8ndrV1tW7yDcikSNS5W8',
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'https://elaborate-cheesecake-080f79.netlify.app/auth/callback'
        };
        
        const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(tokenData)
        });
        
        if (!tokenResponse.ok) {
            throw new Error(`Erro na troca de token: ${tokenResponse.status}`);
        }
        
        const tokens = await tokenResponse.json();
        
        // Obter dados do usuário
        const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`
            }
        });
        
        if (!userResponse.ok) {
            throw new Error(`Erro ao obter dados do usuário: ${userResponse.status}`);
        }
        
        const userData = await userResponse.json();
        
        // Enviar webhook para o bot
        const webhookUrl = 'http://SEU_SERVIDOR:5000/auth/webhook'; // ⚠️ CONFIGURE ESTA URL
        
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
    <title>Autenticação Concluída</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            text-align: center;
        }
        .success-icon {
            font-size: 4rem;
            color: #4CAF50;
            margin-bottom: 20px;
        }
        h1 {
            color: #4CAF50;
            margin-bottom: 15px;
        }
        .close-button {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✅</div>
        <h1>Autenticação Concluída!</h1>
        <p>Olá, <strong>${userData.username}</strong>!</p>
        <p>Você foi autenticado com sucesso no sistema.</p>
        <button class="close-button" onclick="window.close()">Fechar Aba</button>
    </div>
    <script>
        setTimeout(() => window.close(), 10000);
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
    <title>Erro na Autenticação</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            text-align: center;
        }
        .error-icon {
            font-size: 4rem;
            color: #e74c3c;
            margin-bottom: 20px;
        }
        h1 {
            color: #e74c3c;
            margin-bottom: 15px;
        }
        .close-button {
            background: #6c757d;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">❌</div>
        <h1>Erro na Autenticação</h1>
        <p>${errorMessage}</p>
        <p>Por favor, tente novamente.</p>
        <button class="close-button" onclick="window.close()">Fechar Aba</button>
    </div>
    <script>
        setTimeout(() => window.close(), 10000);
    </script>
</body>
</html>`;
}
