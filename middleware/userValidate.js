import { asyncWrapper } from "./asyncWrapper.js";


let userInputValidate = asyncWrapper(async(req,res,next)=>{

    let data = req.body,validData = {};

    if(data.name)validData.name = data.name;
    if(data.userName)validData.userName = data.userName;
    if(data.deleteImage)
    {
        if(data.deleteImage == "1" || data.deleteImage == "0")
        validData.deleteImage = data.deleteImage; 
        else validData.deleteImage = "0";
    }

    req.body = validData;

    next();
})

export {userInputValidate};