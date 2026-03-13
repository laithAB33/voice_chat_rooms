import {asyncWrapper} from "../middleware/asyncWrapper.js";
import { User } from "../modules/userSchema.js";
import {AppError} from "../utils/appError.js";
import bcryptjs from "bcryptjs";
import { genrateToken } from "../utils/genrateToken.js";
import { authentication } from "../utils/authentication.js";
import  jwt  from "jsonwebtoken";
import { assignUser } from "../utils/assignObject.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { cloudinary } from "../utils/cloudinary.js";
import { transporter, verificationCodes } from "../utils/mail.js";
import crypto from 'crypto';
import { sendVerificationCode } from "../view/sendVerificationCode.js";

// let register = asyncWrapper(async (req,res,next)=>{

    // let {email,password} = req.body;

    // let hashedPassword = bcryptjs.hashSync(password);

    // let newUser = assignUser(req,hashedPassword);

    //     await newUser.save();

    // const verificationCode = crypto.randomInt(100000,999999).toString();

    // verificationCodes.set(email,{
    //     code: verificationCode,
    //     expiresAt: Date.now() + 10*60*1000
    // })

    // await transporter.verify();

    // await transporter.sendMail({
    //     from: process.env.APP_EMAIL,
    //     to:email,
    //     subject: "verification code to your google account",
    //     text:'',
    //     html:sendVerificationCode(verificationCode)
    // })

    // res.status(200).json({success: true ,status:"success",message: "a verificatin code has been sent to your account" ,
    // data:{
    //     email
    // }});

    let register = asyncWrapper(async (req, res, next) => {
        let { email, password } = req.body;
      
        console.log('\n📝 بداية عملية التسجيل');
        console.log('البريد المطلوب:', email);
      
        try {
          // 1. إنشاء المستخدم
          console.log('1. محاولة حفظ المستخدم...');
          let hashedPassword = bcryptjs.hashSync(password);
          let newUser = assignUser(req, hashedPassword);
          await newUser.save();
          console.log('✅ تم حفظ المستخدم');
      
          // 2. إنشاء رمز التحقق
          console.log('2. إنشاء رمز التحقق...');
          const verificationCode = crypto.randomInt(100000, 999999).toString();
          verificationCodes.set(email, {
            code: verificationCode,
            expiresAt: Date.now() + 10 * 60 * 1000
          });
          console.log('✅ تم إنشاء الرمز');
      
          // 3. فحص إعدادات البريد
          console.log('3. فحص إعدادات البريد:');
          console.log('- البريد المرسل:', process.env.APP_EMAIL);
          console.log('- كلمة المرور موجودة:', process.env.APP_PASSWORD ? '✅ نعم' : '❌ لا');
          console.log('- طول كلمة المرور:', process.env.APP_PASSWORD ? process.env.APP_PASSWORD.length : 0);
      
          // 4. محاولة الاتصال بـ Gmail
          console.log('4. محاولة الاتصال بـ Gmail...');
          await transporter.verify();
          console.log('✅ الاتصال بـ Gmail ناجح');
      
          // 5. إرسال البريد
          console.log('5. محاولة إرسال البريد...');
          
          const mailOptions = {
            from: process.env.APP_EMAIL,
            to: email,
            subject: "رمز التحقق",
            html: sendVerificationCode(verificationCode)
          };
      
          console.log('خيارات البريد:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject
          });
      
          const info = await transporter.sendMail(mailOptions);
          
          console.log('✅✅ تم إرسال البريد بنجاح!');
          console.log('Message ID:', info.messageId);
          console.log('Response:', info.response);
      
          res.status(200).json({
            success: true,
            message: "تم إرسال رمز التحقق"
          });
      
        } catch (error) {
          // ❌ هذا سيطبع كل تفاصيل الخطأ
          console.log('\n❌❌❌❌❌ ERROR ❌❌❌❌❌');
          console.log('الوقت:', new Date().toISOString());
          console.log('نوع الخطأ:', error.name);
          console.log('رسالة الخطأ:', error.message);
          console.log('كود الخطأ:', error.code);
          console.log('المنفذ:', error.port);
          console.log('المضيف:', error.host);
          
          if (error.command) {
            console.log('الأمر الفاشل:', error.command);
          }
          
          if (error.response) {
            console.log('رد Gmail:', error.response);
          }
          
          console.log('Stack:', error.stack);
          console.log('❌❌❌❌❌ END ERROR ❌❌❌❌❌\n');
      
          // حذف المستخدم إذا فشل الإرسال
          try {
            await newUser.deleteOne();
            console.log('✅ تم حذف المستخدم بسبب فشل الإرسال');
          } catch (deleteError) {
            console.log('فشل حذف المستخدم:', deleteError.message);
          }
      
          res.status(500).json({
            success: false,
            message: "فشل إرسال رمز التحقق"
          });
        }
      });
// })

let accountConfirmation = asyncWrapper(async(req,res,next)=>{
    
    let {email,verificationCode} = req.body;

    if(verificationCodes.get(email).code != verificationCode) return next(new AppError("verification faild",401,"fail"));
    
    let user = await User.findOneAndUpdate({email,provider:{$in:["email"]}},{isActive:true});
    console.log(user);
    if(!user) return next(new AppError("verification faild",401,"fail"));

    let payload = {email,userID:user._id,userName:user.userName};
    const accessToken = genrateToken(payload,"ACCESS_TOKEN_SECRET");
    const refreshToken = genrateToken(payload,"REFRESH_TOKEN_SECRET");

    user.refreshToken = refreshToken;

        await user.save();

    res.cookie("refreshToken",refreshToken,{
        maxAge:1000 * 60 * 60 *24 * 365 ,
        httpOnly:true,
        secure : process.env.NODE_ENV == 'production',
        samesite: 'strict',
    })

    res.cookie("accessToken",accessToken,{
        maxAge:1000 * 60 * 30,
        httpOnly:true,
        secure : process.env.NODE_ENV == 'production',
        samesite: 'strict',
    })

    res.status(201).json({success: true ,status:"success",message: "user created successflly" ,
    data:{
        id:user._id,
        userName:user.userName,
        accessToken
    }});


})

let login = asyncWrapper(async (req,res,next)=>{

    let {email,password} = req.body;
   
    let oldUser = await User.findOne({email,isActive:true,provider:"email"});

    if(!oldUser){
        return next(new AppError("invalid email or password",400,"fail"));
    }

    await authentication(password,oldUser.password);

    let payload = {email,userID:oldUser._id,userName:oldUser.userName};
    const accessToken = genrateToken(payload,"ACCESS_TOKEN_SECRET");
    const refreshToken = genrateToken(payload,"REFRESH_TOKEN_SECRET");

    oldUser.refreshToken = refreshToken;

    await oldUser.save();

    res.cookie("refreshToken",refreshToken,{
        maxAge:1000 * 60 * 60 *24 * 365 ,
        httpOnly:true,
        secure : process.env.NODE_ENV == 'production',
        samesite: 'strict',
    })

    res.cookie("accessToken",accessToken,{
        maxAge:1000 * 60 * 30,
        httpOnly:true,
        secure : process.env.NODE_ENV == 'production',
        samesite: 'strict',
    })

    res.status(200).json({success: true ,status:"success",message: "user logged in successflly" ,
    data:{
        id:oldUser._id,
        userName:oldUser.userName,
        accessToken
    }})

})

let test = asyncWrapper(async(req,res,next)=>{

    let user = await User.findOne({_id:req.userID});

    res.status(200).json({
        success:true,
        data:{
            name:user.name,
            userName:req.userName,
            email:req.email,
            userID:req.userID,
            profileImage:user.profileImage.url,
            accessToken:req.cookies?.accessToken
        }
    });
})

let logout = asyncWrapper(async(req,res,next)=>{

    if(!req.cookies?.refreshToken){
        return res.status(200).json({success:true, status:"success", message:"you already logout", data:null})
    }

    const refreshToken = req.cookies.refreshToken;

    let foundUser = await User.findOne({refreshToken});

    if(!foundUser){
        res.clearCookie("refreshToken",{httpOnly:true})
        return res.status(200).json({success:true, status:"success", message:"you have already logged out", data:null})
    }

    foundUser.refreshToken = null;

    await foundUser.save();

    res.clearCookie("refreshToken",{httpOnly:true})
    res.clearCookie("accessToken",{httpOnly:true})
    res.status(200).json({success:true, status:"success", message:"you logged out", data:null})

})

let refreshToken = asyncWrapper(async(req,res,next)=>{

    if(!req.cookies?.refreshToken)
        return next(new AppError("Unauthorized. Please login to access this resource",401,"fail"));
    
    let oldRefreshToken = req.cookies.refreshToken;

    let foundUser = await User.findOne({refreshToken:oldRefreshToken});
    
    if(!foundUser)
        return next(new AppError("Unauthorized",401,"fail"));
    
    let decoded = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    if(decoded.userID !=foundUser._id)
         return next(new AppError("Unauthorized",401,"fail"));
    
    req.userID = decoded.id;
    req.email = decoded.email;
    req.userName = decoded.userName;

    let payload = {email:foundUser.email,userID:foundUser._id,userName:foundUser.userName}
    const accessToken = genrateToken(payload,"ACCESS_TOKEN_SECRET");
    const refreshToken = genrateToken(payload,"REFRESH_TOKEN_SECRET");

    foundUser.refreshToken = refreshToken;

    await foundUser.save();

    res.cookie("refreshToken",refreshToken,{
        maxAge:1000 * 60 * 60 *24 * 365 ,
        httpOnly:true,
        secure : process.env.NODE_ENV == 'production',
        samesite: 'strict',
    })

    res.cookie("accessToken",accessToken,{
        maxAge:1000 * 60 * 30,
        httpOnly:true,
        secure : process.env.NODE_ENV == 'production',
        samesite: 'strict',
    })

    res.status(200).json({success:true,status:"success",message:"the session is updated successfully",
    data:{
        accessToken
    }});

})

let deleteUser = asyncWrapper(async(req,res,next)=>{

    let foundUser = await User.findOne({_id:req.userID,isActive:true});

    let userName = foundUser.userName;

    if(!foundUser){

        return res.status(200).json({success:true, status:"success", message:"you have already deleted the user", data:null})
    }

    let profileImage = foundUser.profileImage;

    if(profileImage.public_id)await cloudinary.uploader.destroy(profileImage.public_id);        
    
    await foundUser.deleteOne();
    
    res.clearCookie("refreshToken",{httpOnly:true});
    res.clearCookie("accessToken",{httpOnly:true});


    res.status(200).json({success:true, status:"success", message:"user deleted", data:{userName}})

})

let addAvatar = asyncWrapper(async(req,res,next)=>{

    if(!req.file)
    {
        return next(new AppError("Please provide a picture of the item",400,"fail"));
    }

    let photo

    try{ photo = await uploadToCloudinary(req) }
    catch(err){
        return next(new AppError("error uploading image",500,"error"));
    }

    let user = await User.findOneAndUpdate({_id:req.userID,isActive:true},{
        profileImage: {
            url:photo.url,
            public_id:photo.public_id,  
    }})

    if(!user) return next(new AppError("invalid email",400,"fail"));

    let profileImage = user.profileImage;
    if(profileImage?.public_id)await cloudinary.uploader.destroy(profileImage.public_id);

    res.status(201).json({success:true, status:"success", message:"added a profileImage",
    data:{
        userID:req.userID,
        imageURL:photo.url
    }})

})

let update = asyncWrapper(async(req,res,next)=>{

    let data = req.body,photo;

    let user = await User.findOne({_id:req.userID});

    if(!user)
    {
        let error = new AppError("user not found",400,"fail");
        return next(error);
    } 

    // if(req.file && !Boolean(Number(data.deleteImage)))
    // {
    //     try{ photo = await uploadToCloudinary(req) }
    //     catch(err){
    //         return next(new AppError("error uploading image",500,"error"));
    //     }
    //     if(user.profileImage.public_id)
    //     await cloudinary.uploader.destroy(user.profileImage.public_id);
    //     user.profileImage.url = photo.url;
    //     user.profileImage.public_id = photo.public_id;
    // }

    if(Boolean(Number(data.deleteImage)))
    {
        if(user.profileImage.public_id)
        await cloudinary.uploader.destroy(user.profileImage.public_id);
        user.profileImage.url = null;
        user.profileImage.public_id = null;
    }

    Object.assign(user,data);

    await user.save();

    res.status(200).json({success:true,status:"success",message:"the user was updated",data:{userName:user.userName}});

})


export{register,login,test,logout,refreshToken,deleteUser,addAvatar,update,accountConfirmation};

