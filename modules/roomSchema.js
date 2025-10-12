import mongoose,{ Schema } from "mongoose";

const roomSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',                         
        required: true
    },
    participants:{ 
        type:[{
        userID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['member', 'admin'], // قيم محددة مسموحة
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    default:[]
    },
    isActive: {
        type: Boolean,
        default: true
    },
    maxParticipants: {
        type: Number,
        default: 50
    }
}, {
    timestamps: true
});


roomSchema.methods.isFull = function(){
    return this.participants.length >= this.maxParticipants
}


roomSchema.methods.addPerson = async function(userID,role){

    if(this.participants.find( user => user.userID == userID ))
            throw (new AppError("the user is allready a member on the group",400,"fail"));

    this.participants.push({userID,role});

    await this.save();
}

// test this
roomSchema.methods.removePerson = async function(userID){

    this.participants = this.participants.filter(user => user.userID != userID);

    return this.save();
} 



let Room = mongoose.model('Room', roomSchema);

export {Room};