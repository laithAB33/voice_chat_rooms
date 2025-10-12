
function asyncWrapper(fn){

    return (req,res,next) => {
        fn(req,res,next).catch(err =>{
            
            next(err);
        })
    }
}

// function socketWrapper(fn){

//     return async (socket)=>{
//         try{
//             await fn(socket);
//         }catch(err)
//         {

//             socket.emit("error",{
//                 success: false,
//                 message: err.message,
//                 data: null,
//             })
//         }
//     }

// }

function socketWrapper(fn) {
    return async (...args) => {
        const socket = args[0]; 
        
        try {
            await fn(...args);
        } catch (err) {
            socket.emit("error", {
                success: false,
                message: err.message,
                code: err.code || "INTERNAL_ERROR"
            });
            
            // نسجل الخطأ في السيرفر
            console.error('🚨 Socket Error:', {
                user: socket.username,
                event: fn.name || 'unknown',
                error: err.message
            });
        }
    };
}

export {asyncWrapper,socketWrapper};