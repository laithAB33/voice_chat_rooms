import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import { asyncWrapper } from "../middleware/asyncWrapper.js";
import { User } from "../modules/userSchema.js";


export default passport.use(new Strategy({

    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_LOCAL,
    scope: ['profile','email'],
    passReqToCallback:true

},async(req,accessToken, refreshToken, profile, done)=>{
  try{

    let user = await User.findOne({ googleId: profile.id });

    if(user)
    {
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();
        return done(null, user);
    }

    // user = await User.findOne({ email: profile.emails[0].value });
    
    // if (user)
    // {
    //   user.googleId = profile.id;
    //   user.accessToken = accessToken;
    //   user.refreshToken = refreshToken;
    //   await user.save();
    //   return done(null, user);
    // }

    const newUser = new User({
        facebookId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        accessToken: accessToken,
        refreshToken:refreshToken,
        userName: String(profile.emails[0].value).slice(0,-10),
        provider:"google",
        googleId:profile.id,
      });
  
      await newUser.save();
      return done(null, newUser);

  }
  catch(err){
    console.log("err",err);
    done(err,null)
  }

}))

