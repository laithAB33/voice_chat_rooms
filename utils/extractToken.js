

const extractTokenFromSocket = (socket) => {
    // 1. من رأس Authorization (الأولوية)
    const authHeader = socket.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    
    // 2. من الكوكيز
    if (socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split('; ');
        const authCookie = cookies.find(c => c.startsWith('auth_token='));
        if (authCookie) {
            return authCookie.split('=')[1];
        }
    }
    
    // 3. من handshake auth
    if (socket.handshake.auth.token) {
        return socket.handshake.auth.token;
    }
    
    // 4. من query parameters
    if (socket.handshake.query.token) {
        return socket.handshake.query.token;
    }
    
    return null;
};


export {extractTokenFromSocket};